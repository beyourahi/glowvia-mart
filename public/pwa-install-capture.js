/**
 * PWA Install Prompt Early Capture
 *
 * This script captures the beforeinstallprompt event BEFORE React hydration.
 * It must be loaded synchronously (no async/defer) in the <head> to catch
 * the event on mobile browsers where it fires early.
 *
 * The captured event is stored on window.__pwaInstallPromptEvent for the
 * usePwaInstall React hook to consume.
 */
(function () {
    window.addEventListener("beforeinstallprompt", function (e) {
        // Prevent the default mini-infobar from appearing
        e.preventDefault();
        // Store the event for later use by React
        window.__pwaInstallPromptEvent = e;
        // Log for debugging (intentional console use for PWA debugging)
        if (typeof console !== "undefined") {
            // eslint-disable-next-line no-console
            console.log("[PWA] beforeinstallprompt captured (early)");
        }
    });
})();
