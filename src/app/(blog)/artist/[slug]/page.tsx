export const dynamic = "force-dynamic";

import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { ArtistProfileClient } from './artist-profile-client';

interface ArtistProfilePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ArtistProfilePageProps) {
  const { slug } = await params;
  const artist = await db.artist.findUnique({
    where: { slug },
    select: { name: true, stageName: true, shortBio: true, image: true, artistType: true },
  });

  if (!artist) return { title: 'Artist Not Found' };

  const displayName = artist.stageName || artist.name;
  const description = artist.shortBio || `Profile of ${displayName} on Sanaa Through My Lens`;

  return {
    title: `${displayName} — Sanaa Through My Lens`,
    description,
    alternates: {
      canonical: `/artist/${slug}`,
    },
    openGraph: {
      title: `${displayName} — Sanaa Through My Lens`,
      description: artist.shortBio || undefined,
      images: artist.image ? [artist.image] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} — Sanaa Through My Lens`,
      description: artist.shortBio || undefined,
      images: artist.image ? [artist.image] : undefined,
    },
  };
}

export default async function ArtistProfilePage({ params }: ArtistProfilePageProps) {
  const { slug } = await params;

  const artist = await db.artist.findUnique({
    where: { slug },
    include: {
      categories: {
        include: { category: { select: { id: true, name: true, slug: true, color: true } } },
      },
      posts: {
        include: {
          post: {
            select: {
              id: true, title: true, slug: true, featuredImage: true,
              excerpt: true, publishedAt: true, status: true, readingTime: true,
              author: { select: { id: true, name: true, username: true, image: true } },
              categories: {
                include: { category: { select: { id: true, name: true, slug: true, color: true } } },
              },
            },
          },
        },
      },
      events: {
        include: {
          event: {
            select: {
              id: true, title: true, slug: true, startDate: true, endDate: true,
              coverImage: true, city: true, country: true, venue: true,
              isFree: true, price: true, eventType: true,
            },
          },
        },
      },
    },
  });

  if (!artist || !artist.isActive) {
    notFound();
  }

  // JSON-LD structured data for the artist
  const socialLinks: Record<string, string> = artist.socialLinks
    ? (() => { try { return JSON.parse(artist.socialLinks) as Record<string, string>; } catch { return {}; } })()
    : {};

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: artist.stageName || artist.name,
    alternateName: artist.stageName ? artist.name : undefined,
    description: artist.shortBio || undefined,
    image: artist.image || undefined,
    url: artist.websiteUrl || undefined,
    jobTitle: artist.artistType,
    address: artist.location ? {
      '@type': 'PostalAddress',
      addressLocality: artist.location,
      addressCountry: artist.country || undefined,
    } : undefined,
    sameAs: [
      socialLinks.twitter,
      socialLinks.instagram,
      socialLinks.youtube,
      socialLinks.spotify,
      socialLinks.soundcloud,
      socialLinks.facebook,
    ].filter(Boolean),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://sanaathrumylens.co.ke' },
            { '@type': 'ListItem', position: 2, name: 'Artists', item: 'https://sanaathrumylens.co.ke/artists' },
            { '@type': 'ListItem', position: 3, name: artist.stageName || artist.name, item: `https://sanaathrumylens.co.ke/artist/${artist.slug}` },
          ],
        }) }}
      />
      <ArtistProfileClient
        artist={JSON.parse(JSON.stringify(artist))}
      />
    </>
  );
}
