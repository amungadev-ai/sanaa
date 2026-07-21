'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ChevronRight, Eye, MoreHorizontal, Bookmark, ListPlus, Flag, Share2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { ShareButtons } from '@/components/blog/share-buttons';
import { BookmarkButton } from '@/components/blog/bookmark-button';
import { SaveToListButton } from '@/components/blog/save-to-list-button';
import { FlagCommentButton } from '@/components/blog/flag-comment-button';
import { CommentSection } from '@/components/blog/comment-section';
import { PostCard } from '@/components/blog/post-card';
import { NewsletterForm } from '@/components/blog/newsletter-form';
import { AdSlot } from '@/components/blog/ad-slot';

interface PostDetailClientProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    featuredImage: string | null;
    readingTime: number;
    views: number;
    publishedAt: string | null;
    updatedAt: string;
    allowComments: boolean;
    isBookmarked?: boolean;
    isSponsored: boolean;
    isCommunityVoice: boolean;
    author: { id: string; name: string; username: string; image: string | null; bio: string | null };
    categories: { category: { id: string; name: string; slug: string; color: string | null } }[];
    tags: { tag: { id: string; name: string; slug: string } }[];
    _count: { comments: number; bookmarks: number };
  };
  relatedPosts: Parameters<typeof PostCard>[0]['post'][];
  authorPosts: Parameters<typeof PostCard>[0]['post'][];
}

export function PostDetailClient({ post, relatedPosts, authorPosts }: PostDetailClientProps) {
  const primaryCategory = post.categories[0]?.category;
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-KE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        {primaryCategory ? (
          <>
            <Link
              href={`/category/${primaryCategory.slug}`}
              className="hover:text-primary transition-colors"
            >
              {primaryCategory.name}
            </Link>
            <ChevronRight className="h-3 w-3" />
          </>
        ) : null}
        <span className="text-foreground line-clamp-1">{post.title}</span>
      </nav>

      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {primaryCategory && (
            <Badge
              className="text-xs sm:text-sm"
              style={{
                backgroundColor: primaryCategory.color || undefined,
                color: '#fff',
                border: 'none',
              }}
            >
              {primaryCategory.name}
            </Badge>
          )}
          {post.isCommunityVoice && (
            <Badge
              className="text-xs sm:text-sm bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/25"
            >
              Community Voice
            </Badge>
          )}
          {post.isSponsored && (
            <Badge
              className="text-xs sm:text-sm bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/25"
            >
              Sponsored
            </Badge>
          )}
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
          {post.title}
        </h1>
        {post.excerpt && (
          <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
            {post.excerpt}
          </p>
        )}

        {/* Author + Meta + Actions */}
        <div className="flex flex-col gap-4 mt-6">
          {/* Author row */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author.image || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {post.author.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <Link
                href={`/author/${post.author.username}`}
                className="text-sm font-medium hover:text-primary transition-colors"
              >
                {post.author.name}
              </Link>
              <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                {formattedDate && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formattedDate}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.readingTime} min read
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {post.views} views
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons — mobile-first, no overflow */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Primary actions: always visible */}
            <BookmarkButton
              postId={post.id}
              initialBookmarked={post.isBookmarked}
              variant="outline"
              size="sm"
              showLabel={false}
            />
            <ShareButtons title={post.title} slug={post.slug} compact />

            {/* Secondary actions: dropdown on mobile, inline on desktop */}
            <div className="sm:hidden">
              <MobileMoreActions postId={post.id} />
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <SaveToListButton
                postId={post.id}
                variant="outline"
                size="sm"
                showLabel
              />
              <FlagCommentButton
                commentId={post.id}
                contentType="POST"
                variant="outline"
                size="sm"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {post.featuredImage && (
        <div className="rounded-xl overflow-hidden mb-8">
          <Image
            src={post.featuredImage}
            alt={post.title}
            width={1200}
            height={675}
            priority
            className="w-full aspect-[16/9] object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
          />
        </div>
      )}

      {/* In-Article Ad */}
      <AdSlot placement="IN_ARTICLE" />

      {/* Article Content */}
      <div
        className="article-content font-serif text-base sm:text-lg leading-relaxed text-foreground/90 max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      {/* Sponsored Disclosure */}
      {post.isSponsored && (
        <p className="mt-6 text-xs text-muted-foreground italic bg-muted/50 rounded-md px-4 py-3">
          This article is sponsored content. Learn more about our advertising policy.
        </p>
      )}

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t">
          <span className="text-sm font-medium text-muted-foreground mr-1">Tags:</span>
          {post.tags.map((t) => (
            <Link key={t.tag.id} href={`/tag/${t.tag.slug}`}>
              <Badge variant="outline" className="text-xs hover:bg-accent cursor-pointer">
                {t.tag.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {/* Bottom action bar — mobile-friendly */}
      <div className="mt-8 pt-6 border-t">
        {/* Mobile layout: stacked */}
        <div className="flex flex-col gap-3 sm:hidden">
          <ShareButtons title={post.title} slug={post.slug} />
          <div className="flex items-center gap-2">
            <BookmarkButton
              postId={post.id}
              initialBookmarked={post.isBookmarked}
              variant="outline"
              size="sm"
              showLabel={false}
            />
            <SaveToListButton
              postId={post.id}
              variant="outline"
              size="sm"
              showLabel={false}
            />
            <FlagCommentButton
              commentId={post.id}
              contentType="POST"
              variant="outline"
              size="sm"
              showLabel={false}
            />
          </div>
        </div>
        {/* Desktop layout: side by side */}
        <div className="hidden sm:flex items-center justify-between">
          <ShareButtons title={post.title} slug={post.slug} />
          <div className="flex items-center gap-2">
            <BookmarkButton
              postId={post.id}
              initialBookmarked={post.isBookmarked}
              variant="outline"
              size="sm"
              showLabel
            />
            <SaveToListButton
              postId={post.id}
              variant="outline"
              size="sm"
              showLabel
            />
            <FlagCommentButton
              commentId={post.id}
              contentType="POST"
              variant="outline"
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Newsletter CTA */}
      <div className="my-12 bg-primary/5 border border-primary/10 rounded-xl p-6 sm:p-8">
        <div className="text-center mb-4">
          <h3 className="font-serif text-xl font-bold mb-1">Enjoyed this story?</h3>
          <p className="text-sm text-muted-foreground">
            Get more like this delivered to your inbox every week.
          </p>
        </div>
        <NewsletterForm variant="full" className="max-w-sm mx-auto" />
      </div>

      {/* Other Posts by Author */}
      {authorPosts.length > 0 && (
        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold mb-6 flex items-center gap-2">
            More by
            <Link
              href={`/author/${post.author.username}`}
              className="text-primary hover:underline"
            >
              {post.author.name}
            </Link>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {authorPosts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mb-12">
          <h2 className="font-serif text-2xl font-bold mb-6">Related Stories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedPosts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {/* Comments */}
      <Separator className="my-8" />
      <CommentSection postId={post.id} allowComments={post.allowComments} />

      {/* Footer Ad */}
      <AdSlot placement="FOOTER" />
    </article>
  );
}

/**
 * Mobile-only "More actions" dropdown for secondary post actions
 * (Save to List, Report Post). Keeps the header action bar compact.
 */
function MobileMoreActions({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">More actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <span className="w-full">
            <SaveToListButton
              postId={postId}
              variant="ghost"
              size="sm"
              showLabel
            />
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <span className="w-full">
            <FlagCommentButton
              commentId={postId}
              contentType="POST"
              variant="ghost"
              size="sm"
            />
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
