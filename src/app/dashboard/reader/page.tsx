import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { ReaderDashboardClient } from './dashboard-client';

export const metadata = {
  title: 'Reader Dashboard — Sanaa Through My Lens',
};

export default async function ReaderDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/api/auth/signin');
  }

  // Fetch user's bookmarks
  const bookmarks = await db.bookmark.findMany({
    where: { userId: session.user.id },
    include: {
      post: {
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
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
    take: 20,
  });

  // Fetch user's reading lists
  const readingLists = await db.readingList.findMany({
    where: { userId: session.user.id },
    include: {
      items: {
        take: 3,
        include: {
          post: { select: { id: true, title: true, slug: true, featuredImage: true, readingTime: true, author: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { items: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Fetch user's comments
  const comments = await db.comment.findMany({
    where: { authorId: session.user.id },
    include: {
      post: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  return (
    <ReaderDashboardClient
      user={{
        name: session.user.name || '',
        email: session.user.email || '',
        image: session.user.image || null,
      }}
      bookmarks={JSON.parse(JSON.stringify(bookmarks))}
      comments={JSON.parse(JSON.stringify(comments))}
      readingLists={JSON.parse(JSON.stringify(readingLists))}
    />
  );
}
