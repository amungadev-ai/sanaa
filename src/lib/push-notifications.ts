// Client-side push notification utilities

// Placeholder VAPID key — replace with your own in production
// Generate one with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkOs-GV3W7y3N6jJKFR0X2DCbBYjTXmXxGhL4NHnlc';

/**
 * Check if the browser supports push notifications and service workers
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Convert a base64 VAPID key to a Uint8Array for the push subscription
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Request browser notification permission and register the service worker.
 * Returns the permission state: 'granted', 'denied', or 'default'.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    console.warn('Push notifications are not supported in this browser');
    return 'denied';
  }

  // Register the service worker first
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('[Push] Service worker registered:', registration.scope);
  } catch (error) {
    console.error('[Push] Service worker registration failed:', error);
    return 'denied';
  }

  // Request notification permission
  const permission = await Notification.requestPermission();
  console.log('[Push] Notification permission:', permission);
  return permission;
}

/**
 * Create a push subscription using the VAPID key.
 * Returns the PushSubscription object or null on failure.
 */
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('Push notifications are not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      console.log('[Push] Existing subscription found');
      return subscription;
    }

    // Create a new subscription
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });

    console.log('[Push] New subscription created');
    return subscription;
  } catch (error) {
    console.error('[Push] Failed to subscribe:', error);
    return null;
  }
}

/**
 * Remove the current push subscription.
 * Returns true on success, false on failure.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const result = await subscription.unsubscribe();
      console.log('[Push] Unsubscribed:', result);
      return result;
    }

    console.log('[Push] No active subscription to unsubscribe');
    return true;
  } catch (error) {
    console.error('[Push] Failed to unsubscribe:', error);
    return false;
  }
}

/**
 * Show a local notification via the service worker (no server push needed).
 * This is useful for in-app notifications that don't need to go through a push server.
 */
export async function showLocalNotification(
  title: string,
  body: string,
  link?: string
): Promise<void> {
  if (!isPushSupported()) {
    console.warn('Push notifications are not supported');
    return;
  }

  if (Notification.permission !== 'granted') {
    console.warn('[Push] Notification permission not granted');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(title, {
      body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: {
        link: link || '/',
      },
      vibrate: [100, 50, 100],
    });
  } catch (error) {
    console.error('[Push] Failed to show local notification:', error);
  }
}
