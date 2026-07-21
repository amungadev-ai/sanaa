import type { Metadata } from 'next';
import AdvertiseClient from './advertise-client';

export const metadata: Metadata = {
  title: 'Advertise — Sanaa Through My Lens',
  description: 'Partner with Sanaa Through My Lens to reach a passionate audience of art enthusiasts and culture lovers across Kenya and East Africa.',
  alternates: {
    canonical: '/advertise',
  },
  openGraph: {
    title: 'Advertise — Sanaa Through My Lens',
    description: 'Partner with Sanaa Through My Lens to reach a passionate audience of art enthusiasts and culture lovers across Kenya and East Africa.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Advertise — Sanaa Through My Lens',
    description: 'Partner with Sanaa Through My Lens to reach a passionate audience of art enthusiasts and culture lovers across Kenya and East Africa.',
  },
};

export default function AdvertisePage() {
  return <AdvertiseClient />;
}
