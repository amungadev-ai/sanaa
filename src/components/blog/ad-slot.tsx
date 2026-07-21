'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type AdPlacement = 'HEADER_BANNER' | 'SIDEBAR' | 'IN_ARTICLE' | 'FOOTER' | 'BETWEEN_POSTS';

interface AdSlotProps {
  placement: AdPlacement;
}

interface AdData {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string;
  placement: string;
}

export function AdSlot({ placement }: AdSlotProps) {
  const [ad, setAd] = useState<AdData | null>(null);
  const [loading, setLoading] = useState(true);
  const impressionTracked = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchAd() {
      try {
        const res = await fetch(
          `/api/ads?placement=${placement}&status=ACTIVE&limit=1`
        );
        if (!res.ok) return;
        const data: AdData[] = await res.json();
        if (data.length > 0) {
          setAd(data[0]);
        }
      } catch {
        // Silently fail — ads should not break the page
      } finally {
        setLoading(false);
      }
    }
    fetchAd();
  }, [placement]);

  const trackEvent = useCallback(async (adId: string, type: 'impression' | 'click') => {
    try {
      await fetch('/api/ads/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId, type }),
      });
    } catch {
      // Silently fail
    }
  }, []);

  // IntersectionObserver for impression tracking
  useEffect(() => {
    if (!ad || impressionTracked.current) return;
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !impressionTracked.current) {
            impressionTracked.current = true;
            trackEvent(ad.id, 'impression');
            observer.unobserve(element);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ad, trackEvent]);

  const handleClick = useCallback(() => {
    if (ad) {
      trackEvent(ad.id, 'click');
    }
  }, [ad, trackEvent]);

  if (loading) {
    return <AdSlotSkeleton placement={placement} />;
  }

  if (!ad) return null;

  return (
    <div ref={ref}>
      <AdSlotContent ad={ad} placement={placement} onClick={handleClick} />
    </div>
  );
}

function AdSlotContent({
  ad,
  placement,
  onClick,
}: {
  ad: AdData;
  placement: AdPlacement;
  onClick: () => void;
}) {
  switch (placement) {
    case 'HEADER_BANNER':
      return (
        <a
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClick}
          className="block w-full"
        >
          <div className="relative w-full rounded-lg overflow-hidden">
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-full h-[90px] sm:h-[120px] object-cover"
            />
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 text-[10px] bg-black/60 text-white border-none hover:bg-black/60"
            >
              Sponsored
            </Badge>
          </div>
        </a>
      );

    case 'SIDEBAR':
      return (
        <Card className="overflow-hidden">
          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClick}
            className="block"
          >
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-full aspect-[2/1] object-cover"
            />
            <CardContent className="p-3">
              <Badge variant="secondary" className="text-[10px] mb-1.5">
                Sponsored
              </Badge>
              <p className="text-sm font-medium line-clamp-2">{ad.title}</p>
              {ad.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {ad.description}
                </p>
              )}
            </CardContent>
          </a>
        </Card>
      );

    case 'IN_ARTICLE':
      return (
        <div className="my-6">
          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClick}
            className="block"
          >
            <Card className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="w-full sm:w-[300px] aspect-[16/9] sm:aspect-auto sm:h-auto object-cover"
                />
                <CardContent className="p-4 flex flex-col justify-center">
                  <Badge variant="secondary" className="text-[10px] mb-2 w-fit">
                    Sponsored
                  </Badge>
                  <p className="text-sm font-semibold line-clamp-2">{ad.title}</p>
                  {ad.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {ad.description}
                    </p>
                  )}
                </CardContent>
              </div>
            </Card>
          </a>
        </div>
      );

    case 'FOOTER':
      return (
        <div className="my-6">
          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClick}
            className="block"
          >
            <div className="relative w-full rounded-lg overflow-hidden">
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-full h-[100px] sm:h-[140px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                <div>
                  <p className="text-white text-sm sm:text-base font-semibold line-clamp-1">
                    {ad.title}
                  </p>
                  {ad.description && (
                    <p className="text-white/70 text-xs line-clamp-1 mt-0.5">
                      {ad.description}
                    </p>
                  )}
                </div>
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-white/20 text-white border-none hover:bg-white/20 shrink-0"
                >
                  Sponsored
                </Badge>
              </div>
            </div>
          </a>
        </div>
      );

    case 'BETWEEN_POSTS':
      return (
        <Card className="overflow-hidden">
          <a
            href={ad.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClick}
            className="block"
          >
            <img
              src={ad.imageUrl}
              alt={ad.title}
              className="w-full aspect-[16/9] object-cover"
            />
            <CardContent className="p-4">
              <Badge variant="secondary" className="text-[10px] mb-2">
                Sponsored
              </Badge>
              <p className="text-sm font-semibold line-clamp-2">{ad.title}</p>
              {ad.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {ad.description}
                </p>
              )}
            </CardContent>
          </a>
        </Card>
      );

    default:
      return null;
  }
}

function AdSlotSkeleton({ placement }: { placement: AdPlacement }) {
  switch (placement) {
    case 'HEADER_BANNER':
      return (
        <div className="w-full h-[90px] sm:h-[120px] bg-muted animate-pulse rounded-lg" />
      );
    case 'SIDEBAR':
      return (
        <Card className="overflow-hidden">
          <div className="w-full aspect-[2/1] bg-muted animate-pulse" />
          <div className="p-3 space-y-2">
            <div className="h-3 w-16 bg-muted animate-pulse rounded" />
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          </div>
        </Card>
      );
    case 'IN_ARTICLE':
      return (
        <Card className="overflow-hidden my-6">
          <div className="flex flex-col sm:flex-row">
            <div className="w-full sm:w-[300px] aspect-[16/9] sm:aspect-auto sm:h-[120px] bg-muted animate-pulse" />
            <div className="p-4 space-y-2 flex-1">
              <div className="h-3 w-16 bg-muted animate-pulse rounded" />
              <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </Card>
      );
    case 'FOOTER':
      return (
        <div className="w-full h-[100px] sm:h-[140px] bg-muted animate-pulse rounded-lg my-6" />
      );
    case 'BETWEEN_POSTS':
      return (
        <Card className="overflow-hidden">
          <div className="w-full aspect-[16/9] bg-muted animate-pulse" />
          <div className="p-4 space-y-2">
            <div className="h-3 w-16 bg-muted animate-pulse rounded" />
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
          </div>
        </Card>
      );
    default:
      return null;
  }
}
