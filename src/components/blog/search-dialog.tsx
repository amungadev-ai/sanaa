'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, FileText, Calendar, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

interface SearchResult {
  posts: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    categories: { category: { name: string; slug: string; color: string | null } }[];
  }[];
  events: {
    id: string;
    title: string;
    slug: string;
    startDate: string;
    city: string | null;
    categories: { category: { name: string; slug: string; color: string | null } }[];
  }[];
}

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'events'>('all');

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setResults(null);
      return;
    }

    setLoading(true);
    try {
      const [postsRes, eventsRes] = await Promise.all([
        fetch(`/api/posts?search=${encodeURIComponent(q)}&limit=5`),
        fetch(`/api/events?search=${encodeURIComponent(q)}&limit=5`),
      ]);

      const postsData = postsRes.ok ? await postsRes.json() : { posts: [] };
      const eventsData = eventsRes.ok ? await eventsRes.json() : { events: [] };

      setResults({
        posts: postsData.posts || [],
        events: eventsData.events || [],
      });
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  const filteredPosts = results?.posts || [];
  const filteredEvents = results?.events || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 gap-0">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <div className="flex items-center border-b px-4">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            placeholder="Search posts, events..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 h-11"
            autoFocus
          />
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>

        {/* Tabs */}
        <div className="flex border-b px-4 gap-1">
          {(['all', 'posts', 'events'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'text-primary border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto custom-scrollbar">
          {query.length >= 2 && !loading && results && (
            <>
              {(activeTab === 'all' || activeTab === 'posts') && filteredPosts.length > 0 && (
                <div className="p-2">
                  {activeTab === 'all' && (
                    <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">Posts</p>
                  )}
                  {filteredPosts.map((post) => {
                    const cat = post.categories[0]?.category;
                    return (
                      <Link
                        key={post.id}
                        href={`/post/${post.slug}`}
                        onClick={() => onOpenChange(false)}
                        className="flex items-start gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{post.title}</p>
                          {post.excerpt && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {post.excerpt}
                            </p>
                          )}
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
                      </Link>
                    );
                  })}
                </div>
              )}

              {(activeTab === 'all' || activeTab === 'events') && filteredEvents.length > 0 && (
                <div className="p-2">
                  {activeTab === 'all' && (
                    <p className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase">Events</p>
                  )}
                  {filteredEvents.map((event) => {
                    const cat = event.categories[0]?.category;
                    return (
                      <Link
                        key={event.id}
                        href={`/events/${event.slug}`}
                        onClick={() => onOpenChange(false)}
                        className="flex items-start gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors"
                      >
                        <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium line-clamp-1">{event.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(event.startDate).toLocaleDateString('en-KE', {
                              month: 'short',
                              day: 'numeric',
                            })}
                            {event.city && ` · ${event.city}`}
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
                      </Link>
                    );
                  })}
                </div>
              )}

              {filteredPosts.length === 0 && filteredEvents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No results found for &ldquo;{query}&rdquo;</p>
                </div>
              )}
            </>
          )}

          {query.length < 2 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Type at least 2 characters to search</p>
              <p className="text-xs mt-1">
                Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">⌘K</kbd> anytime to search
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
