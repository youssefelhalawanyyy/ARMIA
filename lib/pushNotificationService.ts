import {
  collection,
  doc,
  setDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { BroadcastNotification, PushSubscriber } from '@/types';

const SUBSCRIBERS_COLLECTION = 'push_subscribers';
const BROADCASTS_COLLECTION = 'broadcast_notifications';

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
  } catch (err) {
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
 */
export function listenToLiveBroadcasts(
  onBroadcastReceived: (broadcast: BroadcastNotification) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const q = query(collection(db, BROADCASTS_COLLECTION));
  let isInitialLoad = true;

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      if (isInitialLoad) {
        // Record existing broadcasts so we only alert on newly incoming broadcasts
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const id = change.doc.id;
            const lastSeen = localStorage.getItem('armia_last_seen_bcast');
            if (!lastSeen) {
              localStorage.setItem('armia_last_seen_bcast', id);
            }
          }
        });
        isInitialLoad = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const broadcast: BroadcastNotification = {
            id: change.doc.id,
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

          const lastSeen = localStorage.getItem('armia_last_seen_bcast');
          if (lastSeen !== broadcast.id) {
            localStorage.setItem('armia_last_seen_bcast', broadcast.id);

            // 1. Trigger Native System / Mobile Lock Screen Notification
            displaySystemNotification(broadcast.title, broadcast.body, broadcast.targetUrl);

            // 2. Trigger In-App Luxury Banner
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
