'use client';

import { extractDisplayName } from './avatar-utils';

export const STORAGE_USER_KEY = 'mailmind_user';
export const STORAGE_ACCOUNTS_KEY = 'mailmind_accounts';

export const DEMO_EMAILS = [
  'alex.morgan@mailmind.ai',
  'alex.personal@gmail.com',
  'sarah.lin@apexcloud.io'
];

/**
 * Checks if an email or account object is a demo account that must be removed.
 */
export function isDemoAccount(accountOrEmail) {
  if (!accountOrEmail) return false;
  if (typeof accountOrEmail === 'string') {
    const clean = accountOrEmail.toLowerCase().trim();
    return DEMO_EMAILS.includes(clean) || clean.endsWith('@mailmind.ai');
  }
  if (accountOrEmail.isDemo) return true;
  if (accountOrEmail.email) {
    const clean = accountOrEmail.email.toLowerCase().trim();
    return DEMO_EMAILS.includes(clean) || clean.endsWith('@mailmind.ai');
  }
  return false;
}

/**
 * Retrieve the currently active user from localStorage.
 * Returns null if no real user is signed in.
 */
export function getActiveUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email && !isDemoAccount(parsed)) {
        return parsed;
      }
      // If demo account found in localStorage, purge it
      if (parsed && (isDemoAccount(parsed) || !parsed.email)) {
        localStorage.removeItem(STORAGE_USER_KEY);
      }
    }
  } catch (err) {
    console.warn('[AccountManager] Failed to read active user:', err);
  }
  return null;
}

/**
 * Retrieve the list of all saved accounts from localStorage.
 * Ensures the active user is present in the list and only includes real user-added accounts.
 */
export function getStoredAccounts() {
  if (typeof window === 'undefined') return [];

  let accounts = [];
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    if (raw) {
      accounts = JSON.parse(raw) || [];
    }
  } catch (err) {
    accounts = [];
  }

  // Filter out any legacy preset demo accounts
  accounts = (accounts || []).filter(a => {
    if (!a || !a.email) return false;
    if (isDemoAccount(a)) return false;
    return true;
  });

  // Ensure current active user is in the list
  const activeUser = getActiveUser();
  if (activeUser && activeUser.email && !isDemoAccount(activeUser)) {
    const exists = accounts.some(a => a.email.toLowerCase() === activeUser.email.toLowerCase());
    if (!exists) {
      accounts.unshift(activeUser);
    } else {
      // Update existing item with active user details
      accounts = accounts.map(a =>
        a.email.toLowerCase() === activeUser.email.toLowerCase() ? { ...a, ...activeUser } : a
      );
    }
  }

  try {
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {}

  return accounts;
}

/**
 * Save updated list of accounts to localStorage.
 */
export function saveStoredAccounts(accounts) {
  if (typeof window === 'undefined') return;
  try {
    const cleanAccounts = (accounts || []).filter(a => a && a.email && !isDemoAccount(a));
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(cleanAccounts));
  } catch (err) {
    console.error('[AccountManager] Failed to save accounts:', err);
  }
}

/**
 * Add or update an account in the stored accounts list.
 */
export function addOrUpdateAccount(account) {
  if (!account || !account.email || isDemoAccount(account)) return null;
  const accounts = getStoredAccounts();
  const cleanEmail = account.email.trim().toLowerCase();
  
  const existingIdx = accounts.findIndex(a => a.email.toLowerCase() === cleanEmail);
  const updatedAccount = {
    ...account,
    email: cleanEmail,
    name: account.name || extractDisplayName(account.name, cleanEmail),
    monitoringMode: account.monitoringMode || 'ask_permission',
    isDemo: false,
    connected: true,
    savedAt: account.savedAt || new Date().toISOString()
  };

  if (existingIdx !== -1) {
    accounts[existingIdx] = { ...accounts[existingIdx], ...updatedAccount };
  } else {
    accounts.unshift(updatedAccount);
  }

  saveStoredAccounts(accounts);
  return updatedAccount;
}

/**
 * Remove an account from the stored accounts list.
 * If the account being removed is active, switch to another account if available, or clear active user.
 */
export function removeStoredAccount(emailToRemove) {
  if (!emailToRemove || typeof window === 'undefined') return false;
  const clean = emailToRemove.trim().toLowerCase();
  
  const activeUser = getActiveUser();
  const isActive = activeUser && activeUser.email.toLowerCase() === clean;

  const accounts = getStoredAccounts().filter(a => a.email.toLowerCase() !== clean);
  saveStoredAccounts(accounts);

  if (isActive) {
    if (accounts.length > 0) {
      switchActiveAccount(accounts[0]);
    } else {
      localStorage.removeItem(STORAGE_USER_KEY);
      try {
        fetch('/api/auth/disconnect', { method: 'POST' }).catch(() => {});
      } catch {}
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mailmind:account-switched', { detail: null }));
      }
    }
  }

  return true;
}

/**
 * Switch active account: updates active user, stored accounts, backend config, and dispatches event.
 */
export async function switchActiveAccount(targetAccount) {
  if (!targetAccount || !targetAccount.email || isDemoAccount(targetAccount)) return null;

  const cleanEmail = targetAccount.email.trim().toLowerCase();
  const accounts = getStoredAccounts();
  const existing = accounts.find(a => a.email.toLowerCase() === cleanEmail);

  const fullAccount = {
    ...(existing || {}),
    ...targetAccount,
    email: cleanEmail,
    name: targetAccount.name || (existing && existing.name) || extractDisplayName(targetAccount.name, cleanEmail),
    monitoringMode: targetAccount.monitoringMode || (existing && existing.monitoringMode) || 'ask_permission',
    connected: true,
    isDemo: false,
    savedAt: new Date().toISOString()
  };

  // 1. Update localStorage
  try {
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(fullAccount));
  } catch (err) {
    console.error('[AccountManager] Failed to set active user:', err);
  }

  // 2. Ensure account is in accounts list
  addOrUpdateAccount(fullAccount);

  // 3. Inform backend via /api/auth/switch or /api/auth/connect
  try {
    await fetch('/api/auth/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: fullAccount.email,
        name: fullAccount.name,
        avatar: fullAccount.avatar || fullAccount.picture,
        picture: fullAccount.picture || fullAccount.avatar,
        avatarColor: fullAccount.avatarColor || fullAccount.color,
        color: fullAccount.color || fullAccount.avatarColor,
        provider: fullAccount.provider || 'google',
        password: fullAccount.password,
        host: fullAccount.host,
        port: fullAccount.port,
        tone: fullAccount.tone || 'professional',
        monitoringMode: fullAccount.monitoringMode || 'ask_permission',
        isDemo: false
      })
    });
  } catch (err) {
    try {
      await fetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullAccount.name,
          avatar: fullAccount.avatar,
          picture: fullAccount.picture,
          avatarColor: fullAccount.avatarColor,
          color: fullAccount.color,
          tone: fullAccount.tone,
          monitoringMode: fullAccount.monitoringMode || 'ask_permission'
        })
      });
    } catch (_) {}
  }

  // 4. Dispatch global window event for cross-component reactive updates
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mailmind:account-switched', {
      detail: fullAccount
    }));
  }

  return fullAccount;
}

/**
 * Disconnect current account and clear session.
 */
export async function disconnectActiveAccount() {
  if (typeof window === 'undefined') return;
  try {
    await fetch('/api/auth/disconnect', { method: 'POST' }).catch(() => {});
  } catch {}
  localStorage.removeItem(STORAGE_USER_KEY);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('mailmind:account-switched', { detail: null }));
  }
}
