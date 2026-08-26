'use client';

/**
 * Browser-side device notification and sound chime utility for MailMind.
 * Provides HTML5 Notification API support, Web Audio API sound alerts,
 * and unified device notification dispatch (combining browser push + local OS notification API).
 */

export const NOTIFICATION_SETTINGS_KEY = 'mailmind_notification_settings';

/**
 * Checks if the HTML5 Web Notification API is supported in current environment
 */
export function isDeviceNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission state
 * @returns {'granted' | 'denied' | 'default' | 'unsupported'}
 */
export function getDeviceNotificationPermission() {
  if (!isDeviceNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request notification permission from the user
 * @returns {Promise<'granted' | 'denied' | 'default' | 'unsupported'>}
 */
export async function requestDeviceNotificationPermission() {
  if (!isDeviceNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    saveNotificationSettings({ permissionGranted: permission === 'granted' });
    return permission;
  } catch (err) {
    console.warn('[Notifications] Error requesting permission:', err);
    return Notification.permission;
  }
}

/**
 * Load notification settings from localStorage
 */
export function loadNotificationSettings() {
  if (typeof window === 'undefined') return { enabled: true, sound: true, highUrgencyOnly: false, webhookUrl: '' };
  try {
    const raw = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (_) {}
  return {
    enabled: true,
    sound: true,
    highUrgencyOnly: false,
    webhookUrl: ''
  };
}

/**
 * Save notification settings to localStorage
 */
export function saveNotificationSettings(settings = {}) {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadNotificationSettings();
    const updated = { ...existing, ...settings };
    localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  } catch (_) {}
}

/**
 * Play a synthesized notification sound chime using Web Audio API
 * (no external audio assets required, guaranteed to work across modern browsers)
 *
 * @param {'normal' | 'urgent' | 'success'} [type='normal']
 */
export function playNotificationChime(type = 'normal') {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    if (type === 'urgent' || type === 'critical') {
      // 3-tone energetic alert (A5 -> C#6 -> E6)
      const freqs = [880, 1108.73, 1318.51];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0, now + idx * 0.1);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.1 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.3);
      });
    } else if (type === 'success') {
      // Pleasant rising major two-tone chime (F#5 -> B5)
      const freqs = [739.99, 987.77];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.38);
      });
    } else {
      // Default subtle two-tone bubble chime (D5 -> A5)
      const freqs = [587.33, 880];
      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0, now + idx * 0.09);
        gain.gain.linearRampToValueAtTime(0.15, now + idx * 0.09 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.32);
      });
    }
  } catch (err) {
    // Non-blocking
    console.debug('[Notifications] Web Audio chime note:', err);
  }
}

/**
 * Display a browser Notification via HTML5 Notification API
 */
export function sendBrowserNotification(title, options = {}) {
  if (typeof window === 'undefined' || !isDeviceNotificationSupported()) {
    return null;
  }

  if (Notification.permission !== 'granted') {
    return null;
  }

  try {
    const settings = loadNotificationSettings();
    if (settings.enabled === false) return null;

    if (settings.highUrgencyOnly && options.urgency !== 'high' && options.urgency !== 'critical') {
      return null;
    }

    const notifOptions = {
      body: options.message || options.body || '',
      icon: options.icon || '/favicon.ico',
      badge: options.badge || '/favicon.ico',
      tag: options.tag || `mailmind_${Date.now()}`,
      renotify: true,
      silent: true, // We handle sound explicitly via playNotificationChime for consistent experience
      data: options.data || {}
    };

    const notif = new Notification(title || 'MailMind Alert', notifOptions);

    if (settings.sound !== false && options.sound !== false) {
      playNotificationChime(options.urgency || 'normal');
    }

    notif.onclick = function (e) {
      e.preventDefault();
      window.focus();
      if (typeof options.onClick === 'function') {
        options.onClick(e);
      }
      notif.close();
    };

    // Auto close after 6 seconds
    setTimeout(() => {
      try { notif.close(); } catch (_) {}
    }, 6000);

    return notif;
  } catch (err) {
    console.warn('[Notifications] Failed to create browser notification:', err);
    return null;
  }
}

/**
 * Send a unified notification to the user's device.
 * Triggers browser notification if permission is granted, AND calls the server notification
 * endpoint to trigger native OS desktop notifications (Linux/macOS/Windows) for guaranteed delivery!
 *
 * @param {Object} payload
 * @param {string} payload.title
 * @param {string} [payload.message]
 * @param {string} [payload.body]
 * @param {string} [payload.urgency] - 'normal' | 'high' | 'low'
 * @param {string} [payload.category]
 * @param {boolean} [payload.sound]
 * @param {Function} [payload.onClick]
 */
export async function sendUnifiedDeviceNotification(payload = {}) {
  const title = payload.title || '📧 MailMind Alert';
  const message = payload.message || payload.body || '';
  const urgency = payload.urgency || 'normal';
  const sound = payload.sound !== false;

  // 1. Browser HTML5 Notification
  if (isDeviceNotificationSupported() && Notification.permission === 'granted') {
    sendBrowserNotification(title, {
      message,
      urgency,
      sound,
      onClick: payload.onClick
    });
  } else if (sound) {
    playNotificationChime(urgency);
  }

  // 2. Also call backend API to dispatch native OS desktop notification
  try {
    const reqBody = JSON.stringify({
      title,
      message,
      urgency,
      category: payload.category || 'email',
      sound,
      webhookUrl: payload.webhookUrl || loadNotificationSettings()?.webhookUrl || undefined
    });

    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: reqBody
      });
    } catch {
      await fetch('http://localhost:3002/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: reqBody
      });
    }
  } catch (apiErr) {
    // Non-blocking fallback
    console.debug('[Notifications] API dispatch note:', apiErr);
  }

  return { success: true, title, message };
}
