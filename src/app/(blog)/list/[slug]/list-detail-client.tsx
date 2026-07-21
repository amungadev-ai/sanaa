'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, User, BookOpen, Globe, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { PostCard } from '@/components/blog/post-card';

interface ListDetailClientProps {
  list: {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    slug: string;
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      name: string;
      username: string;
      image: string | null;
    };
    items: {
      id: string;
      note: string | null;
      createdAt: string;
      post: {
        id: string;
        title: string;
        slug: string;
        excerpt: string | null;
        featuredImage: string | null;
        publishedAt: string | null;
        readingTime: number;
        author: { id: string; name: string; username: string; image: string | null };
        categories: { category: { id: string; name: string; slug: string; color: string | null } }[];
      };
    }[];
  };
}

export function ListDetailClient({ list }: ListDetailClientProps) {
  const formattedDate = new Date(list.createdAt).toLocaleDateString('en-KE', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <span>/</span>
        <span className="text-foreground line-clamp-1">{list.name}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            {list.isPublic ? (
              <><Globe className="h-3 w-3" /> Public List</>
            ) : (
              <><Lock className="h-3 w-3" /> Private List</>
            )}
          </Badge>
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> {list.items.length} {list.items.length === 1 ? 'story' : 'stories'}
          </Badge>
        </div>

        <h1 className="font-serif text-3xl sm:text-4xl font-bold leading-tight mb-3">
          {list.name}
        </h1>

        {list.description && (
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
            {list.description}
          </p>
        )}

        {/* Author info */}
        <div className="flex items-center gap-3 mt-4">
          <Avatar className="h-9 w-9">
            <AvatarImage src={list.user.image || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-sm">
              {list.user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <Link
              href={`/author/${list.user.username}`}
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              {list.user.name}
            </Link>
            <p className="text-xs text-muted-foreground">
              Created {formattedDate}
            </p>
          </div>
        </div>
      </header>

      <Separator className="mb-8" />

      {/* Posts Grid */}
      {list.items.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground text-lg">This list is empty</p>
          <p className="text-sm text-muted-foreground mt-1">
            No stories have been added to this collection yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {list.items.map((item) => (
            <div key={item.id} className="relative">
              <PostCard post={item.post} />
              {item.note && (
                <div className="mt-2 px-1">
                  <p className="text-xs text-muted-foreground italic line-clamp-2">
                    💬 {item.note}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Back to site */}
      <div className="mt-12 text-center">
        <Link href="/">
          <Button variant="outline">Back to Sanaa Through My Lens</Button>
        </Link>
      </div>
    </div>
  );
}
