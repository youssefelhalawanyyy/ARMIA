import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { AbandonedCheckout, AbandonedRecoveryStatus, CartItem, CustomerDetails, Discount } from '@/types';

const ABANDONED_COLLECTION = 'abandoned_checkouts';

/**
 * Auto-save a draft checkout session when customer types contact details
 */
export async function saveAbandonedCheckout(
  sessionId: string,
  items: CartItem[],
  customerDetails: Partial<CustomerDetails>,
  subtotal: number,
  appliedDiscount?: Discount,
  customerUid?: string
): Promise<string> {
  // Only save if at least a phone number or email is provided and cart has items
  if (!items || items.length === 0) return sessionId;
  if (!customerDetails.phone && !customerDetails.email) return sessionId;

  try {
    const docRef = doc(db, ABANDONED_COLLECTION, sessionId);
    const payload = {
      id: sessionId,
      items: items.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        imageUrl: item.imageUrl,
        category: item.category,
      })),
      customerDetails: {
        fullName: customerDetails.fullName || '',
        email: customerDetails.email || '',
        phone: customerDetails.phone || '',
        alternatePhone: customerDetails.alternatePhone || '',
        governorate: customerDetails.governorate || '',
        city: customerDetails.city || '',
        address: customerDetails.address || '',
        notes: customerDetails.notes || '',
      },
      customerUid: customerUid || null,
      subtotal: subtotal || 0,
      discountCode: appliedDiscount?.code || null,
      status: 'dropped',
      updatedAt: serverTimestamp(),
    };

    await setDoc(docRef, payload, { merge: true });
    return sessionId;
  } catch (error) {
    console.warn('Abandoned checkout auto-save notice:', error);
    return sessionId;
  }
}

/**
 * Mark abandoned checkout as recovered when order is completed
 */
export async function markAbandonedCheckoutRecovered(sessionId: string): Promise<void> {
  if (!sessionId) return;
  try {
    const docRef = doc(db, ABANDONED_COLLECTION, sessionId);
    await updateDoc(docRef, {
      status: 'recovered',
      recoveredAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('Could not mark abandoned checkout as recovered:', error);
  }
}

/**
 * Fetch all abandoned checkouts for Admin
 */
export async function getAllAbandonedCheckouts(): Promise<AbandonedCheckout[]> {
  try {
    const q = query(collection(db, ABANDONED_COLLECTION));
    const snapshot = await getDocs(q);
    const list: AbandonedCheckout[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      list.push({
        id: docSnap.id,
        customerDetails: data.customerDetails || {},
        customerUid: data.customerUid,
        items: data.items || [],
        subtotal: data.subtotal || 0,
        discountCode: data.discountCode,
        appliedDiscount: data.appliedDiscount,
        status: (data.status as AbandonedRecoveryStatus) || 'dropped',
        recoveryNotes: data.recoveryNotes,
        lastContactedAt: data.lastContactedAt,
        createdAt: data.createdAt || data.updatedAt,
        updatedAt: data.updatedAt,
      });
    });

    // Sort by latest updated
    return list.sort((a, b) => {
      const timeA = typeof a.updatedAt === 'string' ? new Date(a.updatedAt).getTime() : 0;
      const timeB = typeof b.updatedAt === 'string' ? new Date(b.updatedAt).getTime() : 0;
      return timeB - timeA;
    });
  } catch (error) {
    console.error('Error fetching abandoned checkouts:', error);
    return [];
  }
}

/**
 * Update recovery status of an abandoned checkout
 */
export async function updateAbandonedStatus(
  id: string,
  status: AbandonedRecoveryStatus,
  notes?: string
): Promise<void> {
  const docRef = doc(db, ABANDONED_COLLECTION, id);
  const updateData: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };

  if (status === 'contacted') {
    updateData.lastContactedAt = serverTimestamp();
  }
  if (notes !== undefined) {
    updateData.recoveryNotes = notes;
  }

  await updateDoc(docRef, updateData);
}

/**
 * Generate 1-Click WhatsApp Recovery Direct Message Link
 */
export function generateWhatsAppRecoveryLink(
  checkout: AbandonedCheckout,
  promoCode: string = 'VIP5'
): string {
  const phone = (checkout.customerDetails?.phone || '').replace(/\D/g, '');
  if (!phone) return '#';

  const cleanPhone = phone.startsWith('0') ? `20${phone.slice(1)}` : phone.startsWith('20') ? phone : `20${phone}`;
  const name = checkout.customerDetails?.fullName || 'عزيزتي';
  const itemNames = (checkout.items || []).map((i) => i.name).join(' و ');

  const message = `أهلاً بحضرتك أستاذة ${name} 🌸
نتواصل مع حضرتك من أتليه *ARMIA Boutique (آرميا)*.

لاحظنا اهتمامك بقطعة *${itemNames || 'المميزة'}* ولم يتم استكمال الطلب 👗✨

هل واجهتك أي مشكلة أثناء الدفع أو في اختيار المقاس المناسب؟ يسعدنا جداً مساعدتك وتجهيز طلبك على الفور، ويسرنا تقديم كود خصم خاص لحضرتك: *${promoCode}* للاستفادة بخصم إضافي عند التأكيد!`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
