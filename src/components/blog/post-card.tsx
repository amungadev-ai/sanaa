import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BookmarkButton } from '@/components/blog/bookmark-button';

interface PostCardProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    featuredImage: string | null;
    readingTime: number;
    publishedAt: string | Date | null;
    isFeatured?: boolean;
    isSponsored?: boolean;
    isBookmarked?: boolean;
    author: {
      id: string;
      name: string;
      username: string;
      image: string | null;
    };
    categories: {
      category: {
        id: string;
        name: string;
        slug: string;
        color: string | null;
      };
    }[];
  };
}

export function PostCard({ post }: PostCardProps) {
  const primaryCategory = post.categories[0]?.category;
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-KE', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const imageSrc = post.featuredImage || '/placeholder-article.svg';

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
      {/* Image */}
      <Link href={`/post/${post.slug}`} className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={imageSrc}
          alt={post.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {/* Category badge */}
        {primaryCategory && (
          <Badge
            className="absolute top-3 left-3 text-xs font-medium z-10"
            style={{
              backgroundColor: primaryCategory.color || undefined,
              color: '#fff',
              border: 'none',
            }}
          >
            {primaryCategory.name}
          </Badge>
        )}
        {post.isSponsored && (
          <Badge variant="outline" className="absolute top-3 right-3 text-xs bg-background/80 z-10">
            Sponsored
          </Badge>
        )}
        {/* Bookmark button on image */}
        <div className="absolute bottom-2 right-2 z-10">
          <BookmarkButton
            postId={post.id}
            initialBookmarked={post.isBookmarked}
            variant="ghost"
            size="icon"
            className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background/95 rounded-full"
          />
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/post/${post.slug}`}>
          <h3 className="font-serif text-lg font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {post.title}
          </h3>
        </Link>

        {post.excerpt && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {post.excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center gap-3 pt-3 text-xs text-muted-foreground">
          <Link
            href={`/author/${post.author.username}`}
            className="flex items-center gap-1 hover:text-primary transition-colors"
          >
            <User className="h-3 w-3" />
            <span>{post.author.name}</span>
          </Link>
          {formattedDate && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formattedDate}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.readingTime} min
          </span>
        </div>
      </div>
    </article>
  );
}
