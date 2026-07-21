import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { NotificationsClient } from './notifications-client';

export const metadata = {
  title: 'Push Notifications — Sanaa Through My Lens',
};

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  if (!hasPermission(session.user.role, 'ADMIN')) {
    redirect('/dashboard');
  }

  // Get push subscription stats
  const [totalSubscriptions, subscriptionsByRole] = await Promise.all([
    db.pushSubscription.count(),
    db.pushSubscription.groupBy({
      by: ['userId'],
      _count: { id: true },
    }),
  ]);

  // Get unique subscriber count
  const uniqueSubscribers = subscriptionsByRole.length;

  // Get recent notifications sent (from Notification table, last 50)
  const recentNotifications = await db.notification.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
    },
  });

  return (
    <NotificationsClient
      stats={{
        totalSubscriptions,
        uniqueSubscribers,
      }}
      recentNotifications={JSON.parse(JSON.stringify(recentNotifications))}
    />
  );
}
