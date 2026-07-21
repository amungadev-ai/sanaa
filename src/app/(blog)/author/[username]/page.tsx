// Revalidate every 60 seconds for ISR
export const revalidate = 60;

import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { AuthorPageClient } from './author-client';

interface AuthorPageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: AuthorPageProps) {
  const { username } = await params;
  const user = await db.user.findUnique({
    where: { username },
    select: { name: true, bio: true, image: true },
  });

  if (!user) return { title: 'Author Not Found' };

  const title = `${user.name} — Sanaa Through My Lens`;
  const description = user.bio || `Articles by ${user.name} on Sanaa Through My Lens`;

  return {
    title,
    description,
    alternates: {
      canonical: `/author/${username}`,
    },
    openGraph: {
      title,
      description: user.bio || undefined,
      images: user.image ? [user.image] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: user.bio || undefined,
      images: user.image ? [user.image] : undefined,
    },
  };
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const { username } = await params;

  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
      createdAt: true,
    },
  });

  if (!user) {
    notFound();
  }

  const posts = await db.post.findMany({
    where: { authorId: user.id, status: 'PUBLISHED' },
    include: {
      author: { select: { id: true, name: true, username: true, image: true } },
      categories: {
        include: { category: { select: { id: true, name: true, slug: true, color: true } } },
      },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { comments: true, bookmarks: true } },
    },
    orderBy: { publishedAt: 'desc' },
    take: 20,
  });

  return (
    <AuthorPageClient
      author={JSON.parse(JSON.stringify(user))}
      posts={JSON.parse(JSON.stringify(posts))}
    />
  );
}
