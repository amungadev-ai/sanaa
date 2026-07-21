import { Suspense } from 'react';
import { SearchPageClient } from './search-client';

export const metadata = {
  title: 'Search — Sanaa Through My Lens',
  description: 'Search for stories, events, and more on Sanaa Through My Lens',
  alternates: {
    canonical: '/search',
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageClient />
    </Suspense>
  );
}
