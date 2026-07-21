'use client';

import { useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, User, ArrowRight, ChevronRight, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from '@/components/ui/carousel';
import { TrendingTicker } from '@/components/blog/trending-ticker';
import { PostCard } from '@/components/blog/post-card';
import { EventCard } from '@/components/blog/event-card';
import { NewsletterForm } from '@/components/blog/newsletter-form';
import { SidebarAd, InArticleAd } from '@/components/blog/google-ad';

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  _count: { posts: number };
}

interface HeroPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featuredImage: string | null;
  readingTime: number;
  views: number;
  publishedAt: string | null;
  author: { id: string; name: string; username: string; image: string | null };
  categories: { category: { id: string; name: string; slug: string; color: string | null } }[];
  _count: { comments: number; bookmarks: number };
}

interface HomePageProps {
  heroPosts: HeroPost[];
  gridPosts: Parameters<typeof PostCard>[0]['post'][];
  categories: CategoryWithCount[];
  events: Parameters<typeof EventCard>[0]['event'][];
  ads: { id: string; title: string; imageUrl: string; linkUrl: string }[];
  trendingPosts: { id: string; title: string; slug: string }[];
}

export function HomepageClient({
  heroPosts,
  gridPosts,
  categories,
  events,
  ads,
  trendingPosts,
}: HomePageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(8);

  const filteredPosts = selectedCategory
    ? gridPosts.filter((p) =>
        p.categories.some((c) => c.category.slug === selectedCategory)
      )
    : gridPosts;

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = filteredPosts.length > visibleCount;

  const navCategories = categories.filter((c) =>
    ['music', 'film-video', 'books-literature', 'visual-arts', 'theatre-performance', 'opinion-commentary', 'interviews-features'].includes(c.slug)
  );

  return (
    <div>
      {/* Trending Ticker */}
      <TrendingTicker posts={trendingPosts} />

      {/* ===== SECTION 1: Full-Width Hero Carousel ===== */}
      <HeroCarousel heroPosts={heroPosts} />

      {/* ===== SECTION 2: Latest Stories + Sidebar ===== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2/3): Latest Stories */}
          <div className="lg:col-span-2">
            {/* Section Header */}
            <div className="mb-6">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-4">Latest Stories</h2>
              <div className="flex gap-1 overflow-x-auto pb-2 custom-scrollbar -mx-1 px-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                    !selectedCategory
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  All
                </button>
                {navCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug === selectedCategory ? null : cat.slug)}
                    className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                      selectedCategory === cat.slug
                        ? 'text-white shadow-sm'
                        : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-accent'
                    }`}
                    style={
                      selectedCategory === cat.slug
                        ? { backgroundColor: cat.color || undefined }
                        : undefined
                    }
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Post Grid — 2 columns within this 2/3 section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {visiblePosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {visiblePosts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No posts found in this category</p>
              </div>
            )}

            {/* Load More */}
            {hasMore && (
              <div className="text-center mt-8">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setVisibleCount((prev) => prev + 8)}
                  className="gap-2"
                >
                  Load More Stories
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Between Posts Ad (Google AdSense) */}
            <div className="mt-8">
              <InArticleAd />
            </div>
          </div>

          {/* Right Column (1/3): Sidebar */}
          <aside className="space-y-6">
            {/* Google AdSense */}
            <Card className="overflow-hidden">
              <CardContent className="p-3">
                <SidebarAd />
              </CardContent>
            </Card>

            {/* Trending Now */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Trending Now
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {gridPosts.slice(0, 5).map((post, index) => (
                  <div key={post.id}>
                    <Link
                      href={`/post/${post.slug}`}
                      className="group flex gap-3 py-1"
                    >
                      <span className="text-2xl font-serif font-bold text-primary/30 group-hover:text-primary transition-colors shrink-0 w-8">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                          {post.title}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {post.readingTime} min read
                        </span>
                      </div>
                    </Link>
                    {index < Math.min(gridPosts.length, 5) - 1 && (
                      <Separator className="mt-3" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Sponsored Ad from DB */}
            {ads.length > 0 && (
              <Card className="overflow-hidden">
                <a href={ads[0].linkUrl} target="_blank" rel="noopener noreferrer">
                  <Image
                    src={ads[0].imageUrl}
                    alt={ads[0].title}
                    width={400}
                    height={200}
                    className="w-full aspect-[2/1] object-cover"
                  />
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">Sponsored</p>
                    <p className="text-sm font-medium">{ads[0].title}</p>
                  </CardContent>
                </a>
              </Card>
            )}

            {/* Upcoming Events */}
            {events.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {events.slice(0, 3).map((event) => {
                    const cat = event.categories[0]?.category;
                    return (
                      <Link
                        key={event.id}
                        href={`/events/${event.slug}`}
                        className="group block"
                      >
                        <div className="flex gap-3 items-start">
                          <div className="flex flex-col items-center justify-center bg-primary/10 rounded-md p-2 min-w-[44px]">
                            <span className="text-xs font-bold text-primary uppercase">
                              {new Date(event.startDate).toLocaleDateString('en-KE', { month: 'short' })}
                            </span>
                            <span className="text-lg font-bold text-primary leading-none">
                              {new Date(event.startDate).getDate()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
                              {event.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {[event.venue, event.city].filter((v, i, arr) => v && (i === 0 || !arr[0]?.toLowerCase().includes(v.toLowerCase()))).join(', ')}
                            </p>
                            {cat && (
                              <Badge
                                className="mt-1 text-[10px] h-4"
                                style={{
                                  backgroundColor: cat.color || undefined,
                                  color: '#fff',
                                  border: 'none',
                                }}
                              >
                                {cat.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                  <Link href="/events">
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      View All Events <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </aside>
        </div>
      </section>

      {/* Events Section */}
      {events.length > 0 && (
        <section className="bg-muted/50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold">Events This Week</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Art exhibitions, festivals, concerts, and cultural happenings
                </p>
              </div>
              <Link href="/events">
                <Button variant="outline" className="gap-1">
                  All Events <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.slice(0, 3).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Opinion + Newsletter Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Opinion Section */}
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-2">
              <span className="text-crimson">Opinion</span> &amp; Commentary
            </h2>
            {(() => {
              const opinionPosts = gridPosts.filter((p) =>
                p.categories.some((c) => c.category.slug === 'opinion-commentary')
              );
              if (opinionPosts.length === 0) {
                return (
                  <p className="text-muted-foreground">No opinion pieces yet. Check back soon!</p>
                );
              }
              return (
                <div className="space-y-4">
                  {opinionPosts.slice(0, 3).map((post) => (
                    <Link
                      key={post.id}
                      href={`/post/${post.slug}`}
                      className="group flex gap-4 items-start p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-accent/30 transition-all"
                    >
                      {post.categories[0]?.category && (
                        <Badge
                          className="shrink-0 mt-1 text-xs"
                          style={{
                            backgroundColor: post.categories[0].category.color || undefined,
                            color: '#fff',
                            border: 'none',
                          }}
                        >
                          {post.categories[0].category.name}
                        </Badge>
                      )}
                      <div className="min-w-0">
                        <h3 className="font-serif text-lg font-bold line-clamp-2 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                        {post.excerpt && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {post.excerpt}
                          </p>
                        )}
                        <span className="text-xs text-muted-foreground mt-2 block">
                          By {post.author.name} · {post.readingTime} min read
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Newsletter */}
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-6 sm:p-8 flex flex-col justify-center">
            <div className="text-center mb-6">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold mb-2">
                This Week in <span className="text-primary">East African Arts</span>
              </h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Get our weekly newsletter with curated event picks, new reviews, and exclusive content from the East African art scene.
              </p>
            </div>
            <NewsletterForm variant="full" className="max-w-sm mx-auto w-full" />
            <div className="mt-6 flex flex-wrap gap-3 justify-center text-xs text-muted-foreground">
              <span className="flex items-center gap-1">✦ Event Picks</span>
              <span className="flex items-center gap-1">✦ New Reviews</span>
              <span className="flex items-center gap-1">✦ Exclusive Content</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================
// Full-Width Hero Carousel Component
// ============================================
function HeroCarousel({ heroPosts }: { heroPosts: HeroPost[] }) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    onSelect();
    api.on('select', onSelect);
    api.on('reInit', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api, onSelect]);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollNext();
    }, 6000);
    return () => clearInterval(interval);
  }, [api]);

  if (heroPosts.length === 0) {
    return (
      <section className="w-full">
        <div className="aspect-[21/9] sm:aspect-[21/8] bg-muted flex items-center justify-center">
          <p className="text-muted-foreground">No featured posts yet</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      <div className="relative">
        <Carousel
          setApi={setApi}
          opts={{
            loop: true,
            align: 'start',
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-0">
            {heroPosts.map((post) => (
              <CarouselItem key={post.id} className="pl-0">
                <Link href={`/post/${post.slug}`} className="group block relative">
                  <div className="relative aspect-[16/9] sm:aspect-[21/9]">
                    <Image
                      src={post.featuredImage || '/placeholder-hero.svg'}
                      alt={post.title}
                      fill
                      priority
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="100vw"
                    />
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                    {/* Content overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 lg:p-12 max-w-4xl">
                      {post.categories[0]?.category && (
                        <Badge
                          className="mb-3 text-xs font-medium"
                          style={{
                            backgroundColor: post.categories[0].category.color || undefined,
                            color: '#fff',
                            border: 'none',
                          }}
                        >
                          {post.categories[0].category.name}
                        </Badge>
                      )}
                      <h2 className="font-serif text-xl sm:text-3xl lg:text-5xl font-bold text-white leading-tight mb-2 sm:mb-3">
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-white/80 text-sm sm:text-base line-clamp-2 mb-3 max-w-2xl hidden sm:block">
                          {post.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-white/70 text-xs sm:text-sm">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          {post.author.name}
                        </span>
                        {post.publishedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                            {new Date(post.publishedAt).toLocaleDateString('en-KE', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                          {post.readingTime} min read
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Navigation arrows — positioned inside the carousel */}
          <div className="absolute right-4 sm:right-8 lg:right-12 bottom-4 sm:bottom-8 lg:bottom-12 flex items-center gap-2 z-10">
            <button
              onClick={() => api?.scrollPrev()}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white flex items-center justify-center transition-colors"
              aria-label="Previous slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <button
              onClick={() => api?.scrollNext()}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 text-white flex items-center justify-center transition-colors"
              aria-label="Next slide"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          </div>
        </Carousel>

        {/* Slide indicators */}
        <div className="absolute bottom-4 sm:bottom-8 lg:bottom-12 left-1/2 -translate-x-1/2 sm:left-4 sm:translate-x-0 lg:left-12 flex items-center gap-2 z-10">
          {heroPosts.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`transition-all duration-300 rounded-full ${
                index === current
                  ? 'w-8 h-2 bg-white'
                  : 'w-2 h-2 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
