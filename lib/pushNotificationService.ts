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

const SUBSCRIBERS_COLLECTION = 'push_subscribers';
const BROADCASTS_COLLECTION = 'broadcast_notifications';
const SEEN_BROADCASTS_KEY = 'armia_seen_broadcast_ids_v1';

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
      // Keep only last 50 IDs
      const trimmed = seenList.slice(-50);
      localStorage.setItem(SEEN_BROADCASTS_KEY, JSON.stringify(trimmed));
    }
  } catch {
    // ignore
  }
}

/**
 * Play a subtle luxury bell chime using Web Audio API (zero external asset dependencies)
 */
export function playNotificationChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc1.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.15);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note

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
    // Web audio might be suspended until first user interaction
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
    const subscriberId = btoa(endpoint).slice(-30).replace(/[^a-zA-Z0-9]/g, '_');
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
 * Request Web Notification permission from the browser and register subscriber
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
      const deviceId =
        localStorage.getItem('armia_device_sub_id') ||
        `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem('armia_device_sub_id', deviceId);

      const endpoint = `https://fcm.googleapis.com/fcm/send/${deviceId}`;
      await registerPushSubscriber(endpoint, undefined, customerUid, customerName);

      // Trigger a welcoming confirmation notification
      displaySystemNotification(
        '✨ Welcome to ARMIA VIP Concierge',
        'You are now subscribed to exclusive haute couture drops and flash sales!',
        '/collections/new-in'
      );

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
 */
export async function dispatchBroadcastNotification(
  notification: Omit<BroadcastNotification, 'id' | 'sentAt' | 'recipientCount'>
): Promise<BroadcastNotification> {
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

  // Trigger immediate local notification on current sender machine as well
  displaySystemNotification(notification.title, notification.body, notification.targetUrl);

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
 * Real-time Broadcast Listener for all active client and mobile devices
 * Guarantees that any broadcast dispatched in the last 48 hours is delivered to the client device
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
          const timestampMs = data.timestampMs || (data.sentAt ? new Date(data.sentAt).getTime() : Date.now());

          // Only consider broadcasts from the last 48 hours
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

            // 1. Native System / Mobile Lock Screen Notification
            displaySystemNotification(broadcast.title, broadcast.body, broadcast.targetUrl);

            // 2. In-App Luxury Banner with Audio Chime
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
