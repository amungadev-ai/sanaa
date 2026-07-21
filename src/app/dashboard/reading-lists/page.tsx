import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ReadingListsClient } from './reading-lists-client';

export const metadata = {
  title: 'Reading Lists — Sanaa Through My Lens',
};

export default async function ReadingListsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  // Fetch user's reading lists with item count and first few covers
  const readingLists = await db.readingList.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        take: 3,
        include: {
          post: { select: { id: true, featuredImage: true } },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Fetch user's bookmarks for the "add to list" flow
  const bookmarks = await db.bookmark.findMany({
    where: { userId: session.user.id },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          slug: true,
          featuredImage: true,
          publishedAt: true,
          readingTime: true,
          author: { select: { id: true, name: true, username: true, image: true } },
          categories: {
            include: { category: { select: { id: true, name: true, slug: true, color: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <ReadingListsClient
      initialLists={JSON.parse(JSON.stringify(readingLists))}
      bookmarks={JSON.parse(JSON.stringify(bookmarks))}
    />
  );
}
