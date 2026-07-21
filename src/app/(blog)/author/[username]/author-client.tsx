'use client';

import Link from 'next/link';
import { ChevronRight, FileText, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PostCard } from '@/components/blog/post-card';

interface AuthorPageClientProps {
  author: {
    id: string;
    name: string;
    username: string;
    image: string | null;
    bio: string | null;
    createdAt: string;
  };
  posts: Parameters<typeof PostCard>[0]['post'][];
}

export function AuthorPageClient({ author, posts }: AuthorPageClientProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{author.name}</span>
      </nav>

      {/* Author Profile */}
      <div className="flex flex-col sm:flex-row gap-6 items-start mb-10">
        <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
          <AvatarImage src={author.image || undefined} />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {author.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold">{author.name}</h1>
          {author.bio && (
            <p className="text-muted-foreground text-lg mt-2 max-w-2xl">{author.bio}</p>
          )}
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {posts.length} {posts.length === 1 ? 'article' : 'articles'}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Joined {new Date(author.createdAt).toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Posts */}
      {posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No articles by this author yet</p>
          <Link href="/">
            <Badge variant="outline" className="mt-4 cursor-pointer">Browse All Stories</Badge>
          </Link>
        </div>
      )}
    </div>
  );
}
