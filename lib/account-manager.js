'use client';

import { mockUser } from './mockData';
import { extractDisplayName } from './avatar-utils';

export const STORAGE_USER_KEY = 'mailmind_user';
export const STORAGE_ACCOUNTS_KEY = 'mailmind_accounts';

export const PRESET_DEMO_ACCOUNTS = [
  {
    email: 'alex.morgan@mailmind.ai',
    name: 'Alex Morgan',
    provider: 'google',
    tone: 'professional',
    connected: true,
    isDemo: true,
    avatarColor: '#1a73e8',
    avatar: null,
    inApp: true,
    digest: false,
    savedAt: '2026-08-23T12:00:00.000Z'
  },
  {
    email: 'alex.personal@gmail.com',
    name: 'Alex Morgan (Personal)',
    provider: 'google',
    tone: 'casual',
    connected: true,
    isDemo: true,
    avatarColor: '#ea8600',
    avatar: null,
    inApp: true,
    digest: true,
    savedAt: '2026-08-23T12:00:00.000Z'
  },
  {
    email: 'sarah.lin@apexcloud.io',
    name: 'Sarah Lin (Work)',
    provider: 'microsoft',
    tone: 'brief',
    connected: true,
    isDemo: true,
    avatarColor: '#9334e6',
    avatar: null,
    inApp: true,
    digest: false,
    savedAt: '2026-08-23T12:00:00.000Z'
  }
];

/**
 * Retrieve the currently active user from localStorage.
 */
export function getActiveUser() {
  if (typeof window === 'undefined') return mockUser;
  try {
    const raw = localStorage.getItem(STORAGE_USER_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email) return parsed;
    }
  } catch (err) {
    console.warn('[AccountManager] Failed to read active user:', err);
  }
  return mockUser;
}

/**
 * Retrieve the list of all saved accounts from localStorage.
 * Ensures the active user is present in the list and provides demo presets if none.
 */
export function getStoredAccounts() {
  if (typeof window === 'undefined') return PRESET_DEMO_ACCOUNTS;

  let accounts = [];
  try {
    const raw = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
    if (raw) {
      accounts = JSON.parse(raw) || [];
    }
  } catch (err) {
    accounts = [];
  }

  // Ensure current active user is in the list
  const activeUser = getActiveUser();
  if (activeUser && activeUser.email) {
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

  // If list has only 1 or 0 accounts, merge preset demo accounts for easy switching
  if (accounts.length < 2) {
    for (const preset of PRESET_DEMO_ACCOUNTS) {
      if (!accounts.some(a => a.email.toLowerCase() === preset.email.toLowerCase())) {
        accounts.push(preset);
      }
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
    localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('[AccountManager] Failed to save accounts:', err);
  }
}

/**
 * Add or update an account in the stored accounts list.
 */
export function addOrUpdateAccount(account) {
  if (!account || !account.email) return;
  const accounts = getStoredAccounts();
  const cleanEmail = account.email.trim().toLowerCase();
  
  const existingIdx = accounts.findIndex(a => a.email.toLowerCase() === cleanEmail);
  const updatedAccount = {
    ...account,
    email: cleanEmail,
    name: account.name || extractDisplayName(account.name, cleanEmail),
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
 * Remove an account from the stored accounts list (cannot remove currently active account).
 */
export function removeStoredAccount(emailToRemove) {
  if (!emailToRemove) return false;
  const clean = emailToRemove.trim().toLowerCase();
  const activeUser = getActiveUser();
  if (activeUser && activeUser.email.toLowerCase() === clean) {
    return false;
  }

  const accounts = getStoredAccounts().filter(a => a.email.toLowerCase() !== clean);
  saveStoredAccounts(accounts);
  return true;
}

/**
 * Switch active account: updates active user, stored accounts, backend config, and dispatches event.
 */
export async function switchActiveAccount(targetAccount) {
  if (!targetAccount || !targetAccount.email) return null;

  const cleanEmail = targetAccount.email.trim().toLowerCase();
  const accounts = getStoredAccounts();
  const existing = accounts.find(a => a.email.toLowerCase() === cleanEmail);

  const fullAccount = {
    ...(existing || {}),
    ...targetAccount,
    email: cleanEmail,
    name: targetAccount.name || (existing && existing.name) || extractDisplayName(targetAccount.name, cleanEmail),
    connected: true,
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
        isDemo: fullAccount.isDemo
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
          tone: fullAccount.tone
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
