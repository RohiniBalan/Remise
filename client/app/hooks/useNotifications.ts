'use client';
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// function urlBase64ToUint8Array(base64String: string): Uint8Array {
//   const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
//   const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
//   const rawData  = window.atob(base64);
//   return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
// }

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);

  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

export function useNotifications(token: string | null) {
  const [permission, setPermission]   = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed]   = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count
  const fetchUnread = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(res.data.unreadCount || 0);
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
    fetchUnread();
    const interval = setInterval(fetchUnread, 60_000); // poll every minute
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const subscribe = useCallback(async (latitude: number, longitude: number) => {
    if (!token) return { success: false, message: 'Not logged in.' };
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { success: false, message: 'Push notifications are not supported in this browser.' };
    }

    try {
      // 1. Ask permission first (before SW work)
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        return { success: false, message: 'Notification permission denied. Please enable it in browser settings.' };
      }

      // 2. Get VAPID public key
      const { data: vapidData } = await axios.get(`${API}/api/notifications/vapid-public-key`);
      const vapidKey = vapidData.publicKey;

      // 3. Register service worker
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      // 4. Clear any stale subscription (different VAPID key causes "push service error")
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();

      // 5. Fresh subscribe with current VAPID key
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);
      const pushSub = await reg.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey).buffer as ArrayBuffer,
      });

      // 6. Send subscription + location to server
      await axios.post(
        `${API}/api/notifications/subscribe`,
        { subscription: pushSub.toJSON(), latitude, longitude },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSubscribed(true);
      return { success: true };
    } catch (err: any) {
      console.error('Subscribe error:', err);
      // Give a readable message for the common push-service DOMException
      const msg = err?.message?.includes('push service')
        ? 'Could not reach the push service. Try again or check your network.'
        : err?.message?.includes('applicationServerKey')
        ? 'Invalid notification key. Please refresh the page and try again.'
        : err?.message || 'Failed to enable notifications.';
      return { success: false, message: msg };
    }
  }, [token]);

  const updateLocation = useCallback(async (latitude: number, longitude: number) => {
    if (!token) return;
    try {
      await axios.put(
        `${API}/api/notifications/location`,
        { latitude, longitude },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch { /* silent */ }
  }, [token]);

  return { permission, subscribed, unreadCount, subscribe, updateLocation, fetchUnread };
}
