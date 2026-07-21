export const dynamic = "force-dynamic";
import { db } from '@/lib/db';
import { ArtistsDirectoryClient } from './artists-client';

export const metadata = {
  title: 'Discover East African Artists — Sanaa Through My Lens',
  description: 'Explore musicians, writers, painters, filmmakers, and other creative voices from Kenya and East Africa.',
  alternates: {
    canonical: '/artists',
  },
  openGraph: {
    title: 'Discover East African Artists — Sanaa Through My Lens',
    description: 'Explore musicians, writers, painters, filmmakers, and other creative voices from Kenya and East Africa.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discover East African Artists — Sanaa Through My Lens',
    description: 'Explore musicians, writers, painters, filmmakers, and other creative voices from Kenya and East Africa.',
  },
};

export default async function ArtistsDirectoryPage() {
  // Fetch featured artists + all artists for SSR
  const [featuredArtists, allArtists] = await Promise.all([
    db.artist.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        categories: {
          include: { category: { select: { id: true, name: true, slug: true, color: true } } },
        },
      },
      orderBy: { name: 'asc' },
    }),
    db.artist.findMany({
      where: { isActive: true },
      include: {
        categories: {
          include: { category: { select: { id: true, name: true, slug: true, color: true } } },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { name: 'asc' },
      ],
    }),
  ]);

  return (
    <ArtistsDirectoryClient
      featuredArtists={JSON.parse(JSON.stringify(featuredArtists))}
      allArtists={JSON.parse(JSON.stringify(allArtists))}
    />
  );
}
