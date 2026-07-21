'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowRight, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/blog/post-card';

interface TagPageClientProps {
  tag: {
    id: string;
    name: string;
    slug: string;
    _count: { posts: number };
  };
  posts: Parameters<typeof PostCard>[0]['post'][];
}

export function TagPageClient({ tag, posts }: TagPageClientProps) {
  const [visibleCount, setVisibleCount] = useState(8);
  const visiblePosts = posts.slice(0, visibleCount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Tag: {tag.name}</span>
      </nav>

      {/* Tag Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Hash className="h-8 w-8 text-primary" />
          <h1 className="font-serif text-3xl sm:text-4xl font-bold">{tag.name}</h1>
        </div>
        <p className="text-muted-foreground text-lg">
          {tag._count.posts} {tag._count.posts === 1 ? 'story' : 'stories'} tagged with &ldquo;{tag.name}&rdquo;
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
          <p className="text-muted-foreground text-lg">No stories with this tag yet</p>
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
    </div>
  );
}
