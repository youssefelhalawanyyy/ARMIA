import {
  collection,
  doc,
  setDoc,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  limit,
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
 * Request Web Notification permission from the browser
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
      const pseudoEndpoint = `https://fcm.googleapis.com/fcm/send/armia_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await registerPushSubscriber(pseudoEndpoint, undefined, customerUid, customerName);

      // Trigger a welcoming confirmation notification
      try {
        new Notification('✨ Welcome to ARMIA VIP Concierge', {
          body: 'You are now subscribed to exclusive haute couture drops and flash sales!',
          icon: '/icons/icon-192x192.png',
        });
      } catch {
        // Notification constructor may require service worker on some mobile browsers
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
  };

  await setDoc(docRef, payload);

  // Trigger local notification if permission is granted on active browser
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(notification.title, {
        body: notification.body,
        icon: '/icons/icon-192x192.png',
      });
    } catch {
      // ignore
    }
  }

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
