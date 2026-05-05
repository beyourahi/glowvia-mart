/**
 * @fileoverview Agent Bearer Token Verification
 *
 * Verifies JWT bearer tokens presented by AI agents at the authenticated MCP endpoint.
 * Implements a staged validation pipeline:
 * 1. Structure check — must be a 3-part JWT
 * 2. Expiry — rejects tokens past their `exp` claim
 * 3. Audience — validates the `aud` claim when `expectedAudience` is configured
 * 4. JWKS — fetches the issuer's public keys (cached in-memory via jwks-cache)
 * 5. Signature — verifies via `crypto.subtle.verify` (Web Crypto API)
 *
 * Permissive mode: when `permissive: true`, tokens are accepted without JWKS
 * signature verification (useful during early integration / local dev). A console
 * warning is emitted so permissive mode is never silent.
 */

import type {AgentJwtClaims} from "./types";
import {getJwks} from "./jwks-cache";

/**
 * Result of bearer token verification.
 * On failure, `reason` is a short enum-style string (never free-text input)
 * suitable for observability logging and debugging.
 */
export type AgentBearerResult =
    | {ok: true; claims: AgentJwtClaims}
    | {ok: false; reason: string};

/** Decode a base64url-encoded segment into a raw byte array. */
function base64urlDecode(input: string): Uint8Array {
    const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, "=");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/** Decode a base64url segment and parse it as JSON. */
function decodeJson(base64url: string): Record<string, unknown> {
    const bytes = base64urlDecode(base64url);
    const text = new TextDecoder().decode(bytes);
    return JSON.parse(text) as Record<string, unknown>;
}

/** Map a JWK key type (and curve) to the Web Crypto import algorithm descriptor. */
function resolveAlgorithm(kty: string, crv?: string): RsaHashedImportParams | EcKeyImportParams {
    if (kty === "RSA") {
        return {name: "RSASSA-PKCS1-v1_5", hash: "SHA-256"};
    }
    if (kty === "EC" && crv === "P-256") {
        return {name: "ECDSA", namedCurve: "P-256"};
    }
    throw new Error(`Unsupported key type: kty=${kty} crv=${crv ?? "none"}`);
}

/**
 * Verify a JWT bearer token presented by an AI agent.
 *
 * @param token - Raw bearer token string (without "Bearer " prefix)
 * @param opts.jwksUrl - JWKS endpoint URL for signature verification; omit to skip crypto check
 * @param opts.expectedAudience - Required `aud` claim value; set `""` to skip audience check
 * @param opts.permissive - When true, accepts tokens without JWKS verification (dev/integration mode)
 * @returns Verification result with decoded claims on success, or a reason string on failure
 */
export async function verifyAgentBearer(
    token: string,
    opts: {jwksUrl?: string; expectedAudience: string; permissive: boolean}
): Promise<AgentBearerResult> {
    const parts = token.split(".");
    if (parts.length !== 3) {
        return {ok: false, reason: "malformed_jwt"};
    }

    let header: Record<string, unknown>;
    let payload: Record<string, unknown>;
    try {
        header = decodeJson(parts[0] ?? "");
        payload = decodeJson(parts[1] ?? "");
    } catch {
        return {ok: false, reason: "decode_error"};
    }

    const now = Math.floor(Date.now() / 1000);
    const exp = typeof payload.exp === "number" ? payload.exp : undefined;
    if (exp !== undefined && now > exp) {
        return {ok: false, reason: "expired"};
    }

    if (!opts.permissive && opts.expectedAudience === "") {
        return {ok: false, reason: "audience_unconfigured"};
    }

    if (opts.expectedAudience !== "") {
        const aud = payload.aud;
        const audMatch =
            aud === opts.expectedAudience ||
            (Array.isArray(aud) && (aud as unknown[]).includes(opts.expectedAudience));
        if (!audMatch) {
            return {ok: false, reason: "audience_mismatch"};
        }
    }

    const claims = payload as AgentJwtClaims;

    if (!opts.jwksUrl) {
        if (opts.permissive) {
            console.warn("[agentic] JWKS unset — accepting unsigned bearer token");
            return {ok: true, claims};
        }
        return {ok: false, reason: "jwks_unconfigured"};
    }

    let jwks: Awaited<ReturnType<typeof getJwks>>;
    try {
        jwks = await getJwks(opts.jwksUrl);
    } catch (err) {
        return {ok: false, reason: `jwks_fetch_error: ${String(err)}`};
    }

    const kid = typeof header.kid === "string" ? header.kid : undefined;
    const matchedKey = kid
        ? jwks.keys.find(k => k.kid === kid)
        : jwks.keys[0];

    if (!matchedKey) {
        return {ok: false, reason: "key_not_found"};
    }

    let algorithm: RsaHashedImportParams | EcKeyImportParams;
    try {
        algorithm = resolveAlgorithm(matchedKey.kty, matchedKey.crv);
    } catch (err) {
        return {ok: false, reason: `unsupported_algorithm: ${String(err)}`};
    }

    let cryptoKey: CryptoKey;
    try {
        cryptoKey = await crypto.subtle.importKey(
            "jwk",
            matchedKey as JsonWebKey,
            algorithm,
            false,
            ["verify"]
        );
    } catch (err) {
        return {ok: false, reason: `key_import_error: ${String(err)}`};
    }

    const signedInput = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signatureBytes = base64urlDecode(parts[2] ?? "");
    const signatureBuffer = signatureBytes.buffer as ArrayBuffer;

    let valid: boolean;
    try {
        valid = await crypto.subtle.verify(algorithm, cryptoKey, signatureBuffer, signedInput);
    } catch (err) {
        return {ok: false, reason: `verify_error: ${String(err)}`};
    }

    if (!valid) {
        return {ok: false, reason: "signature"};
    }

    return {ok: true, claims};
}
