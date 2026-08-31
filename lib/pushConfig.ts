/**
 * Web Push VAPID Configuration for ARMIA Boutique
 */
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BJZp2QVjph8i0IdcneHFiX6td5CCcdHV3d7EMHzXtOMwUsaaoP7pEwdiPqG_jMsuIB-EVmwkl4VYxxxf35eRjrQ';

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  'gQvr-G0H4fz1Moo0pRvNxAnfWWHLUZm4IPch762NIf8';

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT ||
  'mailto:armiaboutique1@gmail.com';

/**
 * Convert standard base64 URL string to Uint8Array for PushManager subscribe
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
