'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EventCard } from '@/components/blog/event-card';

interface EventsPageClientProps {
  events: Parameters<typeof EventCard>[0]['event'][];
  featuredEvents: Parameters<typeof EventCard>[0]['event'][];
  categories: { id: string; name: string; slug: string; color: string | null }[];
}

export function EventsPageClient({ events, featuredEvents, categories }: EventsPageClientProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const cities = [...new Set(events.map((e) => e.city).filter(Boolean))] as string[];

  // Only show categories that have events assigned to them
  const eventCategories = categories.filter((cat) =>
    events.some((e) => e.categories.some((c) => c.category.id === cat.id))
  );

  // Remove featured events from the main grid to avoid duplicates
  const featuredIds = new Set(featuredEvents.map((e) => e.id));
  const gridEvents = events.filter((e) => !featuredIds.has(e.id));

  const filteredEvents = gridEvents.filter((event) => {
    if (selectedCategory && !event.categories.some((c) => c.category.slug === selectedCategory)) return false;
    if (selectedCity && event.city !== selectedCity) return false;
    return true;
  });

  // Also filter featured events when a filter is active
  const filteredFeatured = (selectedCategory || selectedCity)
    ? featuredEvents.filter((event) => {
        if (selectedCategory && !event.categories.some((c) => c.category.slug === selectedCategory)) return false;
        if (selectedCity && event.city !== selectedCity) return false;
        return true;
      })
    : featuredEvents;

  // Split filtered events into upcoming and past
  const now = new Date();
  const upcomingFiltered = filteredEvents.filter((e) => new Date(e.startDate) >= now);
  const pastFiltered = filteredEvents.filter((e) => new Date(e.startDate) < now);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">Events</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl sm:text-4xl font-bold">Events</h1>
        <p className="text-muted-foreground text-lg mt-2">
          Art exhibitions, festivals, concerts, launches and cultural happenings in Kenya and East Africa
        </p>
      </div>

      {/* Featured Events */}
      {filteredFeatured.length > 0 && (
        <section className="mb-10">
          <h2 className="font-serif text-xl font-bold mb-4">Featured Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFeatured.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-1 overflow-x-auto pb-2 custom-scrollbar flex-1">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
              !selectedCategory
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            All Categories
          </button>
          {eventCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug === selectedCategory ? null : cat.slug)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-all ${
                selectedCategory === cat.slug
                  ? 'text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
              style={selectedCategory === cat.slug ? { backgroundColor: cat.color || undefined } : undefined}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2 items-center shrink-0">
          {cities.length > 0 && (
            <select
              value={selectedCity || ''}
              onChange={(e) => setSelectedCity(e.target.value || null)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          )}
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-9 w-9 rounded-none"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Events Grid/List */}
      {filteredEvents.length > 0 ? (
        <>
          {/* Upcoming Events */}
          {upcomingFiltered.length > 0 && (
            <section className="mb-8">
              {pastFiltered.length > 0 && (
                <h2 className="font-serif text-xl font-bold mb-4">Upcoming Events</h2>
              )}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingFiltered.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingFiltered.map((event) => (
                    <EventListRow key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Past Events */}
          {pastFiltered.length > 0 && (
            <section>
              <h2 className="font-serif text-xl font-bold mb-4 text-muted-foreground">Past Events</h2>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {pastFiltered.map((event) => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {pastFiltered.map((event) => (
                    <EventListRow key={event.id} event={event} />
                  ))}
                </div>
              )}
            </section>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No events found</p>
          {(selectedCategory || selectedCity) && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSelectedCategory(null);
                setSelectedCity(null);
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Extracted list row component
function EventListRow({ event }: { event: Parameters<typeof EventCard>[0]['event'] }) {
  return (
    <Link href={`/events/${event.slug}`} className="group">
      <div className="flex gap-4 p-4 border rounded-lg hover:bg-accent/30 transition-all">
        <div className="flex flex-col items-center justify-center bg-primary/10 rounded-md p-3 min-w-[60px]">
          <span className="text-xs font-bold text-primary uppercase">
            {new Date(event.startDate).toLocaleDateString('en-KE', { month: 'short' })}
          </span>
          <span className="text-xl font-bold text-primary leading-none">
            {new Date(event.startDate).getDate()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-serif text-lg font-bold group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          <p className="text-sm text-muted-foreground">
            {[event.venue, event.city].filter((v, i, arr) => v && (i === 0 || !arr[0]?.toLowerCase().includes(v.toLowerCase()))).join(', ')}
          </p>
          <div className="flex gap-2 mt-1">
            {event.isFree && <Badge className="bg-emerald-600 text-white border-none text-xs">Free</Badge>}
            {event.categories[0]?.category && (
              <Badge variant="outline" className="text-xs">{event.categories[0].category.name}</Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
