'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

interface TrendingTickerProps {
  posts: {
    id: string;
    title: string;
    slug: string;
  }[];
}

export function TrendingTicker({ posts }: TrendingTickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Pause animation on hover
    const container = containerRef.current;
    if (!container) return;

    const handleMouseEnter = () => {
      container.style.animationPlayState = 'paused';
    };
    const handleMouseLeave = () => {
      container.style.animationPlayState = 'running';
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  if (posts.length === 0) return null;

  // Duplicate posts for seamless scrolling
  const tickerItems = [...posts, ...posts];

  return (
    <div className="bg-primary/5 border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-9">
          <div className="flex items-center gap-2 shrink-0 pr-4 border-r border-border">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Trending
            </span>
          </div>
          <div className="overflow-hidden flex-1 ml-4">
            <div
              ref={containerRef}
              className="animate-ticker flex whitespace-nowrap"
            >
              {tickerItems.map((post, index) => (
                <Link
                  key={`${post.id}-${index}`}
                  href={`/post/${post.slug}`}
                  className="inline-flex items-center text-sm text-foreground/80 hover:text-primary transition-colors mx-4"
                >
                  <span className="truncate max-w-xs">{post.title}</span>
                  {index < tickerItems.length - 1 && (
                    <span className="ml-8 text-muted-foreground">•</span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
