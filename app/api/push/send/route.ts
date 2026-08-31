import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { collection, getDocs, deleteDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } from '@/lib/pushConfig';

// Initialize web-push with VAPID credentials
webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { title, body, targetUrl, imageUrl, titleArabic, bodyArabic, badgeTag } = payload;

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    // 1. Record broadcast event in Firestore
    const broadcastId = `bcast_${Date.now()}`;
    const broadcastRef = doc(db, 'broadcast_notifications', broadcastId);
    await setDoc(broadcastRef, {
      id: broadcastId,
      title,
      titleArabic: titleArabic || '',
      body,
      bodyArabic: bodyArabic || '',
      targetUrl: targetUrl || '/',
      imageUrl: imageUrl || '',
      badgeTag: badgeTag || 'VIP_DROP',
      sentAt: serverTimestamp(),
      timestampMs: Date.now(),
    });

    // 2. Fetch all registered subscribers
    const snap = await getDocs(collection(db, 'push_subscribers'));
    const subscribers: Array<{
      id: string;
      endpoint: string;
      keys?: { p256dh: string; auth: string };
    }> = [];

    snap.forEach((d) => {
      const data = d.data();
      if (data.endpoint && data.endpoint.startsWith('http')) {
        subscribers.push({
          id: d.id,
          endpoint: data.endpoint,
          keys: data.keys,
        });
      }
    });

    const pushPayload = JSON.stringify({
      title,
      body,
      targetUrl: targetUrl || '/',
      imageUrl: imageUrl || undefined,
      badgeTag: badgeTag || 'VIP_DROP',
    });

    let sentCount = 0;
    const cleanupPromises: Promise<void>[] = [];

    // 3. Send Web Push to every subscriber's native OS endpoint (FCM / APNs / Mozilla)
    const sendPromises = subscribers.map(async (sub) => {
      // Must have valid keys to send real VAPID payload
      if (!sub.keys?.p256dh || !sub.keys?.auth) {
        return;
      }

      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, pushPayload, {
          TTL: 60 * 60 * 24, // 24 hours TTL
          urgency: 'high',
        });
        sentCount++;
      } catch (err: unknown) {
        const pushError = err as { statusCode?: number };
        // If expired or unregistered (404 or 410), clean up from Firestore
        if (pushError.statusCode === 404 || pushError.statusCode === 410) {
          cleanupPromises.push(deleteDoc(doc(db, 'push_subscribers', sub.id)));
        }
      }
    });

    await Promise.allSettled(sendPromises);
    if (cleanupPromises.length > 0) {
      await Promise.allSettled(cleanupPromises);
    }

    return NextResponse.json({
      success: true,
      broadcastId,
      sentCount,
      totalSubscribers: subscribers.length,
    });
  } catch (error: unknown) {
    console.error('Error sending background push notifications:', error);
    const err = error as { message?: string };
    return NextResponse.json({ error: err.message || 'Failed to dispatch push' }, { status: 500 });
  }
}
