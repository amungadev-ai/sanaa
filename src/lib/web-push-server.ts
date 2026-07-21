import webpush from 'web-push';

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

let vapidConfigured = false;

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(
      'mailto:hello@sanaathrumylens.co.ke',
      vapidPublicKey,
      vapidPrivateKey
    );
    vapidConfigured = true;
  } catch (err) {
    console.warn('[Push] Invalid VAPID keys, push notifications will be disabled:', err);
  }
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  type?: string; // 'new_post', 'comment_reply', 'post_approved', 'post_rejected', etc.
}

/**
 * Send a push notification to a specific user
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
  if (!vapidConfigured) {
    console.log('[Push] VAPID keys not configured, skipping push');
    return { sent: 0, failed: 0 };
  }

  const { db } = await import('@/lib/db');
  const subscriptions = await db.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  let sent = 0;
  let failed = 0;

  const pushData = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icon-192x192.png',
    badge: payload.badge || '/icon-192x192.png',
    url: payload.url || '/',
    type: payload.type || 'info',
  });

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      }, pushData);
      sent++;
    } catch (error: unknown) {
      const pushError = error as { statusCode?: number };
      // If subscription is expired/gone, remove it from DB
      if (pushError.statusCode === 410 || pushError.statusCode === 404) {
        try {
          await db.pushSubscription.delete({ where: { id: sub.id } });
          console.log(`[Push] Removed expired subscription ${sub.id}`);
        } catch (deleteError) {
          console.error(`[Push] Failed to delete expired subscription ${sub.id}:`, deleteError);
        }
      }
      failed++;
    }
  }

  return { sent, failed };
}

/**
 * Send push notification to all users with a minimum role
 */
export async function sendPushToRole(minRole: string, payload: PushPayload): Promise<{ sent: number; failed: number }> {
  if (!vapidConfigured) {
    console.log('[Push] VAPID keys not configured, skipping push');
    return { sent: 0, failed: 0 };
  }

  const ROLE_HIERARCHY: Record<string, number> = {
    ADMIN: 3, EDITOR: 2, READER: 1,
  };
  const minLevel = ROLE_HIERARCHY[minRole] ?? 0;

  const { db } = await import('@/lib/db');
  const users = await db.user.findMany({
    where: { isActive: true },
    select: { id: true, role: true },
  });

  const eligibleUserIds = users
    .filter(u => (ROLE_HIERARCHY[u.role] ?? 0) >= minLevel)
    .map(u => u.id);

  let totalSent = 0;
  let totalFailed = 0;

  for (const userId of eligibleUserIds) {
    const result = await sendPushToUser(userId, payload);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { sent: totalSent, failed: totalFailed };
}

export { webpush };
