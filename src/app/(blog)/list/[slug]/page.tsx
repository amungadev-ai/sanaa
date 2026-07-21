// Revalidate every 60 seconds for ISR
export const revalidate = 60;

import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ListDetailClient } from './list-detail-client';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const list = await db.readingList.findUnique({
    where: { slug },
    select: { name: true, description: true, isPublic: true, user: { select: { name: true } } },
  });

  if (!list || !list.isPublic) {
    return { title: 'List Not Found — Sanaa Through My Lens' };
  }

  return {
    title: `${list.name} — Sanaa Through My Lens`,
    description: list.description || `A reading list by ${list.user.name}`,
  };
}

export default async function PublicListPage({ params }: Props) {
  const { slug } = await params;

  const list = await db.readingList.findUnique({
    where: { slug },
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
      items: {
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
      },
    },
  });

  if (!list || !list.isPublic) {
    notFound();
  }

  return (
    <ListDetailClient
      list={JSON.parse(JSON.stringify(list))}
    />
  );
}
