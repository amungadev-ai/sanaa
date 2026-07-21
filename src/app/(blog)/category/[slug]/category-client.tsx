'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/blog/post-card';
import { EventCard } from '@/components/blog/event-card';

interface CategoryPageClientProps {
  category: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
    _count: { posts: number };
  };
  posts: Parameters<typeof PostCard>[0]['post'][];
  events: Parameters<typeof EventCard>[0]['event'][];
}

export function CategoryPageClient({ category, posts, events }: CategoryPageClientProps) {
  const [visibleCount, setVisibleCount] = useState(8);
  const visiblePosts = posts.slice(0, visibleCount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{category.name}</span>
      </nav>

      {/* Category Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-2 h-8 rounded-full"
            style={{ backgroundColor: category.color || undefined }}
          />
          <h1 className="font-serif text-3xl sm:text-4xl font-bold">{category.name}</h1>
        </div>
        {category.description && (
          <p className="text-muted-foreground text-lg max-w-2xl ml-5">
            {category.description}
          </p>
        )}
        <p className="text-sm text-muted-foreground mt-2 ml-5">
          {category._count.posts} {category._count.posts === 1 ? 'story' : 'stories'}
        </p>
      </div>

      {/* Posts Grid */}
      {visiblePosts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visiblePosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No stories in this category yet</p>
          <Link href="/">
            <Button variant="outline" className="mt-4">
              Browse All Stories
            </Button>
          </Link>
        </div>
      )}

      {/* Load More */}
      {visiblePosts.length < posts.length && (
        <div className="text-center mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setVisibleCount((prev) => prev + 8)}
            className="gap-2"
          >
            Load More <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Related Events */}
      {events.length > 0 && (
        <section className="mt-12 pt-8 border-t">
          <h2 className="font-serif text-2xl font-bold mb-6">Upcoming {category.name} Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
