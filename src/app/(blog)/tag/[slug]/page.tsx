// Revalidate every 60 seconds for ISR
export const revalidate = 60;

import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { TagPageClient } from './tag-client';

interface TagPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TagPageProps) {
  const { slug } = await params;
  const tag = await db.tag.findUnique({
    where: { slug },
    select: { name: true },
  });

  if (!tag) return { title: 'Tag Not Found' };

  const title = `${tag.name} — Sanaa Through My Lens`;
  const description = `Stories tagged with "${tag.name}" on Sanaa Through My Lens`;

  return {
    title,
    description,
    alternates: {
      canonical: `/tag/${slug}`,
    },
    openGraph: {
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export async function generateStaticParams() {
  const tags = await db.tag.findMany({
    select: { slug: true },
  });
  return tags.map((t) => ({ slug: t.slug }));
}

export default async function TagPage({ params }: TagPageProps) {
  const { slug } = await params;

  const tag = await db.tag.findUnique({
    where: { slug },
    include: { _count: { select: { posts: true } } },
  });

  if (!tag) {
    notFound();
  }

  const posts = await db.post.findMany({
    where: {
      status: 'PUBLISHED',
      tags: { some: { tagId: tag.id } },
    },
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
    <TagPageClient
      tag={JSON.parse(JSON.stringify(tag))}
      posts={JSON.parse(JSON.stringify(posts))}
    />
  );
}
