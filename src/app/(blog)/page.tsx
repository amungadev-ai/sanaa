export const dynamic = "force-dynamic";
import { db } from '@/lib/db';
import { HomepageClient } from './homepage-client';

// Revalidate every 60 seconds so new posts/images show up without a full redeploy
export const revalidate = 60;

export default async function HomePage() {
  // Fetch all data server-side
  const [
    featuredPosts,
    recentPosts,
    categories,
    events,
    ads,
  ] = await Promise.all([
    // 3 featured posts for hero carousel (fallback to recent if < 3 featured)
    db.post.findMany({
      where: { status: 'PUBLISHED', isFeatured: true },
      include: {
        author: { select: { id: true, name: true, username: true, image: true } },
        categories: {
          include: { category: { select: { id: true, name: true, slug: true, color: true } } },
        },
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
        _count: { select: { comments: true, bookmarks: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 3,
    }),
    // Recent published posts
    db.post.findMany({
      where: { status: 'PUBLISHED' },
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
    }),
    // Categories
    db.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { posts: true } } },
      orderBy: { sortOrder: 'asc' },
    }),
    // Upcoming events
    db.event.findMany({
      where: { isActive: true, startDate: { gte: new Date().toISOString() } },
      include: {
        categories: {
          include: { category: { select: { id: true, name: true, slug: true, color: true } } },
        },
      },
      orderBy: { startDate: 'asc' },
      take: 6,
    }),
    // Sidebar ads
    db.ad.findMany({
      where: { placement: 'SIDEBAR', status: 'ACTIVE' },
      take: 1,
    }),
  ]);

  // Build carousel slides: featured posts first, pad with recent if needed
  const heroPosts = [...featuredPosts];
  if (heroPosts.length < 3) {
    const needed = 3 - heroPosts.length;
    const fallback = recentPosts
      .filter((p) => !heroPosts.some((h) => h.id === p.id))
      .slice(0, needed);
    heroPosts.push(...fallback);
  }

  // Grid posts = all recent posts (carousel posts may also appear in grid — this is standard for news sites)
  const gridPosts = recentPosts;
  // Trending posts for ticker (just title + slug)
  const trendingPosts = recentPosts.slice(0, 5).map((p) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
  }));

  // Organization + WebSite structured data
  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Sanaa Through My Lens',
    url: 'https://sanaathrumylens.co.ke',
    description: 'An arts & culture opinion blog highlighting stories around the art scene in Kenya and East Africa.',
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }}
      />
      <HomepageClient
        heroPosts={heroPosts.map((p) => JSON.parse(JSON.stringify(p)))}
        gridPosts={JSON.parse(JSON.stringify(gridPosts))}
        categories={JSON.parse(JSON.stringify(categories))}
        events={JSON.parse(JSON.stringify(events))}
        ads={JSON.parse(JSON.stringify(ads))}
        trendingPosts={trendingPosts}
      />
    </>
  );
}
