import { NewsletterPageClient } from './newsletter-client';

export const metadata = {
  title: 'Newsletter — Sanaa Through My Lens',
  description: 'Subscribe to "This Week in East African Arts" — get curated event picks, new reviews, and exclusive content.',
  alternates: {
    canonical: '/newsletter',
  },
  openGraph: {
    title: 'Newsletter — Sanaa Through My Lens',
    description: 'Subscribe to "This Week in East African Arts" — get curated event picks, new reviews, and exclusive content.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Newsletter — Sanaa Through My Lens',
    description: 'Subscribe to "This Week in East African Arts" — get curated event picks, new reviews, and exclusive content.',
  },
};

export default async function NewsletterPage() {
  return <NewsletterPageClient />;
}
