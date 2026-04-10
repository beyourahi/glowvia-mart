/**
 * @fileoverview Store Credit Queries
 *
 * @description
 * GraphQL queries, fragments, and utility functions for managing customer store credit.
 * Provides comprehensive store credit account information including balance, transaction
 * history, and helper functions for displaying credit/debit transactions and calculating
 * total balances across multiple accounts.
 *
 * @api
 * Customer Account API - Authenticated GraphQL operations
 *
 * @queries
 * - CUSTOMER_STORE_CREDIT_QUERY - Fetches store credit accounts with transaction history
 * - STORE_CREDIT_BALANCE_QUERY - Lightweight query for balance only (dashboard widget)
 *
 * @fragments
 * - STORE_CREDIT_ACCOUNT_FRAGMENT - Account balance information
 * - STORE_CREDIT_TRANSACTION_FRAGMENT - Transaction details (credit or debit)
 *
 * @utilities
 * - isCredit() - Determines if transaction is credit (positive) or debit (negative)
 * - formatTransactionType() - Returns "Credit" or "Debit" for display
 * - getTotalBalance() - Calculates total balance across multiple accounts
 * - StoreCreditAccount type - Full account with transactions
 * - StoreCreditAccountBalance type - Balance-only type for dashboard
 * - StoreCreditTransaction type - Transaction data structure
 *
 * @related
 * - app/routes/account.tsx - Uses STORE_CREDIT_BALANCE_QUERY for dashboard widget
 * - app/components/StoreCreditSection.tsx - Displays full transaction history
 *
 * @notes
 * Store credit transactions come in two types: StoreCreditAccountCreditTransaction
 * (positive, includes expiresAt and remainingAmount) and StoreCreditAccountDebitTransaction
 * (negative, no expiration). The isCredit() utility distinguishes between them by
 * checking for the presence of credit-specific fields.
 */

// NOTE: https://shopify.dev/docs/api/customer/latest/objects/StoreCreditAccount

// Fragment for store credit account
export const STORE_CREDIT_ACCOUNT_FRAGMENT = `#graphql
  fragment StoreCreditAccount on StoreCreditAccount {
    id
    balance {
      amount
      currencyCode
    }
  }
` as const;

// Fragment for store credit transaction
export const STORE_CREDIT_TRANSACTION_FRAGMENT = `#graphql
  fragment StoreCreditTransaction on StoreCreditAccountTransaction {
    ... on StoreCreditAccountCreditTransaction {
      id
      amount {
        amount
        currencyCode
      }
      balanceAfterTransaction {
        amount
        currencyCode
      }
      createdAt
      expiresAt
      remainingAmount {
        amount
        currencyCode
      }
    }
    ... on StoreCreditAccountDebitTransaction {
      id
      amount {
        amount
        currencyCode
      }
      balanceAfterTransaction {
        amount
        currencyCode
      }
      createdAt
    }
  }
` as const;

// Query for customer's store credit accounts with transactions
export const CUSTOMER_STORE_CREDIT_QUERY = `#graphql
  query CustomerStoreCredit(
    $first: Int = 10
    $transactionsFirst: Int = 20
    $language: LanguageCode
  ) @inContext(language: $language) {
    customer {
      storeCreditAccounts(first: $first) {
        nodes {
          ...StoreCreditAccount
          transactions(first: $transactionsFirst, reverse: true) {
            nodes {
              ...StoreCreditTransaction
            }
            pageInfo {
              hasNextPage
              hasPreviousPage
              startCursor
              endCursor
            }
          }
        }
      }
    }
  }
  ${STORE_CREDIT_ACCOUNT_FRAGMENT}
  ${STORE_CREDIT_TRANSACTION_FRAGMENT}
` as const;

// Simple type for balance-only queries (dashboard widget)
export type StoreCreditAccountBalance = {
    id: string;
    balance: {
        amount: string;
        currencyCode: string;
    };
};

// Type definitions for store credit data (full account with transactions)
export type StoreCreditAccount = {
    id: string;
    balance: {
        amount: string;
        currencyCode: string;
    };
    transactions: {
        nodes: StoreCreditTransaction[];
        pageInfo: {
            hasNextPage: boolean;
            hasPreviousPage: boolean;
            startCursor?: string | null;
            endCursor?: string | null;
        };
    };
};

export type StoreCreditTransaction = {
    id: string;
    amount: {
        amount: string;
        currencyCode: string;
    };
    balanceAfterTransaction: {
        amount: string;
        currencyCode: string;
    };
    createdAt: string;
    expiresAt?: string | null;
    remainingAmount?: {
        amount: string;
        currencyCode: string;
    };
};

/**
 * Determine if a transaction is a credit (positive) or debit (negative)
 * Credits have expiresAt and remainingAmount fields
 */
export function isCredit(transaction: StoreCreditTransaction): boolean {
    return "expiresAt" in transaction || "remainingAmount" in transaction;
}

/**
 * Format transaction type for display
 */
export function formatTransactionType(transaction: StoreCreditTransaction): string {
    return isCredit(transaction) ? "Credit" : "Debit";
}

/**
 * Get total balance across all store credit accounts
 * Works with both full StoreCreditAccount and simpler StoreCreditAccountBalance types
 */
export function getTotalBalance(accounts: StoreCreditAccountBalance[]): {amount: string; currencyCode: string} | null {
    if (accounts.length === 0) return null;

    const currencyCode = accounts[0].balance.currencyCode;
    const total = accounts.reduce((sum, account) => {
        return sum + parseFloat(account.balance.amount);
    }, 0);

    return {
        amount: total.toFixed(2),
        currencyCode
    };
}

// Simple query to get just the store credit balance (for dashboard widget)
export const STORE_CREDIT_BALANCE_QUERY = `#graphql
  query CustomerStoreCreditBalance($language: LanguageCode) @inContext(language: $language) {
    customer {
      storeCreditAccounts(first: 10) {
        nodes {
          id
          balance {
            amount
            currencyCode
          }
        }
      }
    }
  }
` as const;
