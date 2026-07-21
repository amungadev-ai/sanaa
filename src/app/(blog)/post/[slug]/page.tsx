export const dynamic = "force-dynamic";
import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { PostDetailClient } from './post-detail-client';


interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await db.post.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, seoTitle: true, seoDescription: true, ogImage: true, publishedAt: true, updatedAt: true },
  });

  if (!post) return { title: 'Post Not Found' };

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `/post/${slug}`,
    },
    openGraph: {
      title,
      description,
      images: post.ogImage ? [post.ogImage] : undefined,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt?.toISOString(),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.ogImage ? [post.ogImage] : undefined,
    },
  };
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  const post = await db.post.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      featuredImage: true,
      coverImageAlt: true,
      readingTime: true,
      views: true,
      publishedAt: true,
      updatedAt: true,
      allowComments: true,
      isSponsored: true,
      isCommunityVoice: true,
      isFeatured: true,
      status: true,
      authorId: true,
      author: {
        select: { id: true, name: true, username: true, image: true, bio: true },
      },
      categories: {
        include: { category: { select: { id: true, name: true, slug: true, color: true } } },
      },
      tags: {
        include: { tag: { select: { id: true, name: true, slug: true } } },
      },
      _count: { select: { comments: true, bookmarks: true } },
    },
  });

  if (!post || post.status !== 'PUBLISHED') {
    notFound();
  }

  // Fetch related posts using tag matching + recency weighting
  const categoryIds = post.categories.map((c) => c.categoryId);
  const tagIds = post.tags.map((t) => t.tagId);

  const candidates = await db.post.findMany({
    where: {
      status: 'PUBLISHED',
      id: { not: post.id },
      OR: [
        { categories: { some: { categoryId: { in: categoryIds } } } },
        { tags: { some: { tagId: { in: tagIds } } } },
      ],
    },
    include: {
      author: { select: { id: true, name: true, username: true, image: true } },
      categories: {
        include: { category: { select: { id: true, name: true, slug: true, color: true } } },
      },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { comments: true, bookmarks: true } },
    },
    take: 50, // Larger candidate pool for better diversity selection
  });

  // Score candidates: +3 per shared category, +2 per shared tag, +1 recency, +1 featured, +popularity
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const postCatIdSet = new Set(categoryIds);
  const postTagIdSet = new Set(tagIds);

  const scored = candidates.map((p) => {
    let score = 0;
    // Category overlap
    score += p.categories.filter((c) => postCatIdSet.has(c.categoryId)).length * 3;
    // Tag overlap
    score += p.tags.filter((t) => postTagIdSet.has(t.tagId)).length * 2;
    // Recency bonus
    if (p.publishedAt && new Date(p.publishedAt) > thirtyDaysAgo) score += 1;
    // Featured bonus
    if (p.isFeatured) score += 1;
    // Popularity weighting
    if (p.views > 500) score += 2;
    else if (p.views > 100) score += 1;
    return { ...p, _score: score };
  });

  // Sort by score descending, then by publishedAt descending for ties
  scored.sort(
    (a, b) => b._score - a._score || (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0),
  );

  // Author diversity: no more than 2 posts from the same author in top 6
  const selected: typeof scored = [];
  const authorCount = new Map<string, number>();
  const MAX_PER_AUTHOR = 2;

  for (const p of scored) {
    if (selected.length >= 6) break;
    const count = authorCount.get(p.authorId) || 0;
    if (count < MAX_PER_AUTHOR) {
      selected.push(p);
      authorCount.set(p.authorId, count + 1);
    }
  }

  const relatedPosts = selected;

  // Fetch other posts by same author
  const authorPosts = await db.post.findMany({
    where: {
      status: 'PUBLISHED',
      id: { not: post.id },
      authorId: post.authorId,
    },
    include: {
      author: { select: { id: true, name: true, username: true, image: true } },
      categories: {
        include: { category: { select: { id: true, name: true, slug: true, color: true } } },
      },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      _count: { select: { comments: true, bookmarks: true } },
    },
    take: 3,
    orderBy: { publishedAt: 'desc' },
  });

  const primaryCategory = post.categories[0]?.category;

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt || undefined,
    image: post.featuredImage || undefined,
    url: `https://sanaathrumylens.co.ke/post/${post.slug}`,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://sanaathrumylens.co.ke/post/${post.slug}`,
    },
    author: {
      '@type': 'Person',
      name: post.author.name,
    },
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    publisher: {
      '@type': 'Organization',
      name: 'Sanaa Through My Lens',
      url: 'https://sanaathrumylens.co.ke',
      logo: {
        '@type': 'ImageObject',
        url: 'https://sanaathrumylens.co.ke/logo.svg',
      },
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sanaathrumylens.co.ke' },
      ...(primaryCategory ? [{ '@type': 'ListItem', position: 2, name: primaryCategory.name, item: `https://sanaathrumylens.co.ke/category/${primaryCategory.slug}` }] : []),
      { '@type': 'ListItem', position: primaryCategory ? 3 : 2, name: post.title, item: `https://sanaathrumylens.co.ke/post/${post.slug}` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <PostDetailClient
        post={JSON.parse(JSON.stringify(post))}
        relatedPosts={JSON.parse(JSON.stringify(relatedPosts))}
        authorPosts={JSON.parse(JSON.stringify(authorPosts))}
      />
    </>
  );
}
