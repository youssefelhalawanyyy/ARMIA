import {
  collection,
  doc,
  setDoc,
  getDocs,
  serverTimestamp,
  query,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { BroadcastNotification, PushSubscriber } from '@/types';
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from './pushConfig';

const SUBSCRIBERS_COLLECTION = 'push_subscribers';
const BROADCASTS_COLLECTION = 'broadcast_notifications';
const SEEN_BROADCASTS_KEY = 'armia_seen_broadcast_ids_v2';

/**
 * Generate a safe unique Firestore document ID from push endpoint URL
 */
function safeSubscriberDocId(endpoint: string): string {
  let hash = 0;
  for (let i = 0; i < endpoint.length; i++) {
    const char = endpoint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const cleanSuffix = endpoint.slice(-20).replace(/[^a-zA-Z0-9]/g, '');
  return `sub_${Math.abs(hash).toString(36)}_${cleanSuffix || 'dev'}`;
}

/**
 * Convert ArrayBuffer to base64 URL safe string
 */
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Check if the current device has already seen a broadcast notification
 */
export function hasSeenBroadcast(id: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(SEEN_BROADCASTS_KEY);
    const seenList: string[] = raw ? JSON.parse(raw) : [];
    return seenList.includes(id);
  } catch {
    return false;
  }
}

/**
 * Mark a broadcast notification as seen on this device
 */
export function markBroadcastAsSeen(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(SEEN_BROADCASTS_KEY);
    const seenList: string[] = raw ? JSON.parse(raw) : [];
    if (!seenList.includes(id)) {
      seenList.push(id);
      const trimmed = seenList.slice(-50);
      localStorage.setItem(SEEN_BROADCASTS_KEY, JSON.stringify(trimmed));
    }
  } catch {
    // ignore
  }
}

/**
 * Play a subtle luxury bell chime using Web Audio API
 */
export function playNotificationChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(587.33, ctx.currentTime);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime);

    osc1.stop(ctx.currentTime + 0.6);
    osc2.stop(ctx.currentTime + 0.6);
  } catch {
    // ignore
  }
}

/**
 * Register or update browser push notification subscription in Firestore
 */
export async function registerPushSubscriber(
  endpoint: string,
  keys?: { p256dh: string; auth: string },
  customerUid?: string,
  customerName?: string
): Promise<boolean> {
  if (!endpoint) return false;

  try {
    const subscriberId = safeSubscriberDocId(endpoint);
    const docRef = doc(db, SUBSCRIBERS_COLLECTION, subscriberId);

    const payload: Partial<PushSubscriber> = {
      id: subscriberId,
      endpoint,
      keys: keys || undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      customerUid: customerUid || undefined,
      customerName: customerName || undefined,
      createdAt: serverTimestamp(),
    };

    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (err) {
    console.warn('Push registration notice:', err);
    return false;
  }
}

/**
 * Automatically sync and upgrade browser VAPID push subscription on mount if permission is granted
 */
export async function autoSyncPushSubscription(customerUid?: string, customerName?: string) {
  if (
    typeof window === 'undefined' ||
    !('Notification' in window) ||
    !('serviceWorker' in navigator)
  ) {
    return;
  }
  if (Notification.permission !== 'granted') return;

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();

    if (!sub) {
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });
    }

    if (sub) {
      const endpoint = sub.endpoint || '';
      let p256dh = '';
      let auth = '';

      if (typeof sub.getKey === 'function') {
        p256dh = arrayBufferToBase64(sub.getKey('p256dh'));
        auth = arrayBufferToBase64(sub.getKey('auth'));
      }

      if (!p256dh) {
        const jsonSub = sub.toJSON();
        p256dh = jsonSub.keys?.p256dh || '';
        auth = jsonSub.keys?.auth || '';
      }

      if (endpoint && p256dh && auth) {
        await registerPushSubscriber(endpoint, { p256dh, auth }, customerUid, customerName);
      }
    }
  } catch (err) {
    console.warn('Auto sync VAPID subscription notice:', err);
  }
}

/**
 * Request Web Notification permission from the browser and subscribe to real VAPID Push Manager
 */
export async function requestNotificationPermission(
  customerUid?: string,
  customerName?: string
): Promise<{ granted: boolean; message: string }> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { granted: false, message: 'Push Notifications not supported on this browser' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      let endpoint = '';
      let keys: { p256dh: string; auth: string } | undefined;

      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const reg = await navigator.serviceWorker.ready;
          let sub = await reg.pushManager.getSubscription();

          if (!sub) {
            const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: applicationServerKey as BufferSource,
            });
          }

          if (sub) {
            endpoint = sub.endpoint || '';
            let p256dh = '';
            let auth = '';

            if (typeof sub.getKey === 'function') {
              p256dh = arrayBufferToBase64(sub.getKey('p256dh'));
              auth = arrayBufferToBase64(sub.getKey('auth'));
            }

            if (!p256dh) {
              const jsonSub = sub.toJSON();
              p256dh = jsonSub.keys?.p256dh || '';
              auth = jsonSub.keys?.auth || '';
            }

            if (p256dh && auth) {
              keys = { p256dh, auth };
            }
          }
        } catch (subErr) {
          console.warn('VAPID PushManager subscription fallback:', subErr);
        }
      }

      if (endpoint) {
        await registerPushSubscriber(endpoint, keys, customerUid, customerName);
      }

      return { granted: true, message: 'VIP Notifications successfully enabled!' };
    } else {
      return { granted: false, message: 'Notification permission was dismissed or blocked' };
    }
  } catch (err) {
    console.error('Permission error:', err);
    return { granted: false, message: 'Could not enable notifications' };
  }
}

/**
 * Safely display a Native OS Notification using ServiceWorker if available, falling back to Notification API
 */
export async function displaySystemNotification(
  title: string,
  body: string,
  targetUrl: string = '/'
) {
  playNotificationChime();

  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const options = {
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: { url: targetUrl },
    vibrate: [200, 100, 200],
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, options);
        return;
      }
    }
    new Notification(title, {
      body,
      icon: '/icons/icon-192x192.png',
    });
  } catch {
    try {
      new Notification(title, {
        body,
        icon: '/icons/icon-192x192.png',
      });
    } catch {
      // ignore
    }
  }
}

/**
 * Get total count of push subscribers
 */
export async function getPushSubscribersCount(): Promise<number> {
  try {
    const snap = await getDocs(collection(db, SUBSCRIBERS_COLLECTION));
    return snap.size || 0;
  } catch {
    return 0;
  }
}

/**
 * Dispatch a broadcast notification from Admin
 * Calls the server-side Web Push API route to wake up closed devices, and records the event in Firestore
 */
export async function dispatchBroadcastNotification(
  notification: Omit<BroadcastNotification, 'id' | 'sentAt' | 'recipientCount'>
): Promise<BroadcastNotification> {
  // 1. Dispatch background Web Push through server route
  try {
    await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification),
    });
  } catch (apiErr) {
    console.warn('API push dispatch warning:', apiErr);
  }

  // 2. Record in Firestore for active in-app banner listeners
  const subscribersCount = await getPushSubscribersCount();
  const broadcastId = `bcast_${Date.now()}`;
  const docRef = doc(db, BROADCASTS_COLLECTION, broadcastId);

  const payload = {
    id: broadcastId,
    title: notification.title,
    titleArabic: notification.titleArabic || '',
    body: notification.body,
    bodyArabic: notification.bodyArabic || '',
    targetUrl: notification.targetUrl || '/',
    imageUrl: notification.imageUrl || '',
    badgeTag: notification.badgeTag || 'VIP_DROP',
    recipientCount: Math.max(1, subscribersCount),
    sentAt: serverTimestamp(),
    timestampMs: Date.now(),
  };

  await setDoc(docRef, payload);

  return {
    ...payload,
    sentAt: new Date().toISOString(),
  };
}

/**
 * Fetch broadcast notification history
 */
export async function getBroadcastHistory(): Promise<BroadcastNotification[]> {
  try {
    const snap = await getDocs(collection(db, BROADCASTS_COLLECTION));
    const list: BroadcastNotification[] = [];

    snap.forEach((d) => {
      const data = d.data();
      list.push({
        id: d.id,
        title: data.title || 'Notification',
        titleArabic: data.titleArabic,
        body: data.body || '',
        bodyArabic: data.bodyArabic,
        targetUrl: data.targetUrl || '/',
        imageUrl: data.imageUrl,
        badgeTag: data.badgeTag,
        sentAt: data.sentAt,
        recipientCount: data.recipientCount || 0,
      });
    });

    return list.sort((a, b) => {
      const timeA = typeof a.sentAt === 'string' ? new Date(a.sentAt).getTime() : 0;
      const timeB = typeof b.sentAt === 'string' ? new Date(b.sentAt).getTime() : 0;
      return timeB - timeA;
    });
  } catch {
    return [];
  }
}

/**
 * Real-time Broadcast Listener for active in-app luxury banners
 * NOTE: Does NOT trigger redundant native OS notification to prevent duplicates with Service Worker
 */
export function listenToLiveBroadcasts(
  onBroadcastReceived: (broadcast: BroadcastNotification) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const q = query(collection(db, BROADCASTS_COLLECTION));

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const broadcastId = change.doc.id;
          const timestampMs =
            data.timestampMs || (data.sentAt ? new Date(data.sentAt).getTime() : Date.now());

          const isRecent = Date.now() - timestampMs < 48 * 60 * 60 * 1000;

          if (isRecent && !hasSeenBroadcast(broadcastId)) {
            markBroadcastAsSeen(broadcastId);

            const broadcast: BroadcastNotification = {
              id: broadcastId,
              title: data.title || 'ARMIA BOUTIQUE',
              titleArabic: data.titleArabic,
              body: data.body || '',
              bodyArabic: data.bodyArabic,
              targetUrl: data.targetUrl || '/',
              imageUrl: data.imageUrl,
              badgeTag: data.badgeTag,
              sentAt: new Date().toISOString(),
              recipientCount: data.recipientCount || 1,
            };

            // Trigger In-App Luxury VIP Banner with Audio Chime (no duplicate OS popup)
            playNotificationChime();
            onBroadcastReceived(broadcast);
          }
        }
      });
    },
    (err) => {
      console.warn('Realtime broadcast listener notice:', err);
    }
  );

  return unsubscribe;
}
