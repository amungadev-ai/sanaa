export const dynamic = "force-dynamic";

import { db } from '@/lib/db';
import { notFound } from 'next/navigation';
import { EventDetailClient } from './event-detail-client';

interface EventDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await db.event.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, coverImage: true },
  });

  if (!event) return { title: 'Event Not Found' };

  return {
    title: `${event.title} — Sanaa Through My Lens`,
    description: event.excerpt || undefined,
    alternates: {
      canonical: `/events/${slug}`,
    openGraph: {
      title: event.title,
      description: event.excerpt || undefined,
      images: event.coverImage ? [event.coverImage] : undefined,
      type: 'article',
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: event.excerpt || undefined,
      images: event.coverImage ? [event.coverImage] : undefined,
  };
}

  });
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;

  const event = await db.event.findUnique({
    where: { slug },
    include: {
      categories: {
        include: { category: { select: { id: true, name: true, slug: true, color: true } } },
  });

  if (!event || !event.isActive) {
    notFound();
  }

  // Related events (same category)
  const categoryIds = event.categories.map((c) => c.categoryId);
  const relatedEvents = await db.event.findMany({
    where: {
      isActive: true,
      id: { not: event.id },
      categories: { some: { categoryId: { in: categoryIds } } },
    include: {
      categories: {
        include: { category: { select: { id: true, name: true, slug: true, color: true } } },
    orderBy: { startDate: 'asc' },
    take: 3,
  });

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.excerpt || event.description,
    startDate: event.startDate,
    endDate: event.endDate || undefined,
    location: {
      '@type': 'Place',
      name: event.venue || undefined,
      address: {
        '@type': 'PostalAddress',
        addressLocality: event.city || undefined,
        addressCountry: event.country || undefined,
    isAccessibleForFree: event.isFree,
    offers: event.price ? {
      '@type': 'Offer',
      price: event.price,
    } : undefined,
    organizer: {
      '@type': 'Organization',
      name: 'Sanaa Through My Lens',
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
            { '@type': 'ListItem', position: 2, name: 'Events', item: 'https://sanaathrumylens.co.ke/events' },
            { '@type': 'ListItem', position: 3, name: event.title, item: `https://sanaathrumylens.co.ke/events/${event.slug}` },
          ],
        }) }}
      />
      <EventDetailClient
        event={JSON.parse(JSON.stringify(event))}
        relatedEvents={JSON.parse(JSON.stringify(relatedEvents))}
      />
    </>
  );
}
