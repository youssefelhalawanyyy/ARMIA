import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { getAllOrders } from './productService';
import { ClientProfile, Order, AppUser, CustomerDetails } from '@/types';

const USERS_COLLECTION = 'users';

/**
 * Fetch and aggregate complete database of all clients (registered users + order histories)
 */
export async function getAllClients(): Promise<ClientProfile[]> {
  try {
    // 1. Fetch registered users and all orders in parallel
    const [usersSnapshot, allOrders] = await Promise.all([
      getDocs(collection(db, USERS_COLLECTION)).catch(() => null),
      getAllOrders().catch(() => [] as Order[]),
    ]);

    const registeredUsers: AppUser[] = [];
    if (usersSnapshot) {
      usersSnapshot.forEach((doc) => {
        const d = doc.data() as AppUser;
        registeredUsers.push({
          uid: doc.id,
          email: d.email || null,
          displayName: d.displayName || null,
          photoURL: d.photoURL || null,
          role: d.role || 'customer',
          phone: d.phone,
          createdAt: d.createdAt,
        });
      });
    }

    // 2. Map of clients by unique key (UID or Phone or Email)
    const clientMap = new Map<string, ClientProfile>();

    // Seed from registered users (excluding admin accounts)
    for (const u of registeredUsers) {
      if (u.role === 'admin') continue;

      const key = u.uid || u.email?.toLowerCase() || `user-${Date.now()}`;
      clientMap.set(key, {
        id: key,
        uid: u.uid,
        name: u.displayName || u.email?.split('@')[0] || 'Customer',
        email: u.email || '',
        phone: u.phone || '',
        totalOrders: 0,
        totalSpent: 0,
        deliveredOrders: 0,
        returnedOrders: 0,
        returnRate: 0,
        hasPreviousReturns: false,
        createdAt: u.createdAt,
        orders: [],
      });
    }

    // 3. Aggregate order history into client profiles
    for (const ord of allOrders) {
      const cust = ord.customerDetails;
      if (!cust) continue;

      // Find matching client by UID, Phone, or Email
      let matchedKey: string | null = null;

      if (ord.customerUid && clientMap.has(ord.customerUid)) {
        matchedKey = ord.customerUid;
      } else {
        // Find by phone or email
        for (const [k, profile] of clientMap.entries()) {
          const matchPhone = cust.phone && profile.phone && cust.phone.replace(/\D/g, '') === profile.phone.replace(/\D/g, '');
          const matchEmail = cust.email && profile.email && cust.email.toLowerCase() === profile.email.toLowerCase();
          if (matchPhone || matchEmail) {
            matchedKey = k;
            break;
          }
        }
      }

      // If client profile does not exist yet (guest/first-time order), create one
      if (!matchedKey) {
        matchedKey = ord.customerUid || cust.phone || cust.email || `client-${Date.now()}`;
        clientMap.set(matchedKey, {
          id: matchedKey,
          uid: ord.customerUid,
          name: cust.fullName || 'Valued Client',
          email: cust.email || '',
          phone: cust.phone || '',
          alternatePhone: cust.alternatePhone,
          governorate: cust.governorate,
          city: cust.city,
          address: cust.address,
          totalOrders: 0,
          totalSpent: 0,
          deliveredOrders: 0,
          returnedOrders: 0,
          returnRate: 0,
          hasPreviousReturns: false,
          orders: [],
        });
      }

      const client = clientMap.get(matchedKey)!;

      // Add order
      client.orders.push(ord);
      client.totalOrders += 1;

      // Update location and contact details to latest
      if (cust.fullName && !client.name) client.name = cust.fullName;
      if (cust.phone && !client.phone) client.phone = cust.phone;
      if (cust.alternatePhone) client.alternatePhone = cust.alternatePhone;
      if (cust.governorate) client.governorate = cust.governorate;
      if (cust.city) client.city = cust.city;
      if (cust.address) client.address = cust.address;

      // Calculate financials
      if (ord.status !== 'cancelled') {
        client.totalSpent += ord.totalAmount || 0;
      }

      if (ord.status === 'delivered') {
        client.deliveredOrders += 1;
      } else if (ord.status === 'returned') {
        client.returnedOrders += 1;
      }
    }

    // 4. Finalize return rates and sorting
    const result: ClientProfile[] = [];

    for (const client of clientMap.values()) {
      // Sort client's orders descending by date
      client.orders.sort((a, b) => {
        const timeA = typeof a.createdAt === 'string' ? new Date(a.createdAt).getTime() : 0;
        const timeB = typeof b.createdAt === 'string' ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });

      if (client.orders.length > 0) {
        const latest = client.orders[0];
        client.lastOrderDate =
          typeof latest.createdAt === 'string'
            ? latest.createdAt
            : undefined;
      }

      client.hasPreviousReturns = client.returnedOrders > 0;
      client.returnRate =
        client.totalOrders > 0
          ? Math.round((client.returnedOrders / client.totalOrders) * 100)
          : 0;

      result.push(client);
    }

    // Sort clients: High returners / most orders first
    return result.sort((a, b) => b.totalOrders - a.totalOrders || b.totalSpent - a.totalSpent);
  } catch (error) {
    console.error('Error in getAllClients:', error);
    return [];
  }
}

/**
 * Check if a customer placing an order has previous returned orders
 */
export function checkCustomerReturnHistory(
  customerDetails: CustomerDetails,
  customerUid: string | undefined,
  currentOrderId: string,
  allOrders: Order[]
): {
  hasReturns: boolean;
  returnCount: number;
  totalOrders: number;
  returnedOrderIds: string[];
} {
  const cleanPhone = (customerDetails.phone || '').replace(/\D/g, '');
  const cleanEmail = (customerDetails.email || '').toLowerCase().trim();

  const matchingPastOrders = allOrders.filter((ord) => {
    // Don't compare against current order
    if (ord.id === currentOrderId || ord.orderId === currentOrderId) return false;

    const ordPhone = (ord.customerDetails?.phone || '').replace(/\D/g, '');
    const ordEmail = (ord.customerDetails?.email || '').toLowerCase().trim();
    const ordUid = ord.customerUid;

    const matchesUid = customerUid && ordUid && customerUid === ordUid;
    const matchesPhone = cleanPhone && ordPhone && (cleanPhone === ordPhone || cleanPhone.endsWith(ordPhone) || ordPhone.endsWith(cleanPhone));
    const matchesEmail = cleanEmail && ordEmail && cleanEmail === ordEmail && !cleanEmail.includes('client@');

    return matchesUid || matchesPhone || matchesEmail;
  });

  const returnedOrders = matchingPastOrders.filter((o) => o.status === 'returned');

  return {
    hasReturns: returnedOrders.length > 0,
    returnCount: returnedOrders.length,
    totalOrders: matchingPastOrders.length,
    returnedOrderIds: returnedOrders.map((o) => o.orderId || o.id || ''),
  };
}
