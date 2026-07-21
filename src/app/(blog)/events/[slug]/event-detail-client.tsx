'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Clock, Globe, Ticket, ChevronRight, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { EventCard } from '@/components/blog/event-card';

interface EventDetailClientProps {
  event: {
    id: string;
    title: string;
    slug: string;
    description: string;
    excerpt: string | null;
    coverImage: string | null;
    eventType: string;
    venue: string | null;
    location: string | null;
    city: string | null;
    country: string | null;
    startDate: string;
    endDate: string | null;
    timezone: string;
    websiteUrl: string | null;
    ticketUrl: string | null;
    isFree: boolean;
    price: string | null;
    isFeatured: boolean;
    categories: { category: { id: string; name: string; slug: string; color: string | null } }[];
  };
  relatedEvents: Parameters<typeof EventCard>[0]['event'][];
}

export function EventDetailClient({ event, relatedEvents }: EventDetailClientProps) {
  const startDate = new Date(event.startDate);
  const endDate = event.endDate ? new Date(event.endDate) : null;

  const formattedStartDate = startDate.toLocaleDateString('en-KE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedStartTime = startDate.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6 flex-wrap">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link href="/events" className="hover:text-primary transition-colors">Events</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground line-clamp-1">{event.title}</span>
      </nav>

      {/* Cover Image */}
      {event.coverImage && (
        <div className="rounded-xl overflow-hidden mb-8">
          <Image
            src={event.coverImage}
            alt={event.title}
            width={1200}
            height={675}
            priority
            className="w-full aspect-[16/9] object-cover"
            sizes="(max-width: 768px) 100vw, 896px"
          />
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 mb-3">
          {event.categories.map((c) => (
            <Badge
              key={c.category.id}
              style={{
                backgroundColor: c.category.color || undefined,
                color: '#fff',
                border: 'none',
              }}
            >
              {c.category.name}
            </Badge>
          ))}
          {event.isFree ? (
            <Badge className="bg-emerald-600 text-white border-none">Free Entry</Badge>
          ) : null}
          <Badge variant="outline">{event.eventType.replace('_', ' ')}</Badge>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight mb-4">
          {event.title}
        </h1>
        {event.excerpt && (
          <p className="text-lg text-muted-foreground">{event.excerpt}</p>
        )}
      </div>

      {/* Event Details Card */}
      <div className="bg-muted/50 border rounded-xl p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{formattedStartDate}</p>
              <p className="text-sm text-muted-foreground">Starts at {formattedStartTime}</p>
              {endDate && (
                <p className="text-sm text-muted-foreground">
                  Until {endDate.toLocaleDateString('en-KE', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>

          {event.venue && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{event.venue}</p>
                <p className="text-sm text-muted-foreground">
                  {[event.location, event.city, event.country].filter((v, i, arr) => v && (i === 0 || !arr.slice(0, i).some(prev => prev?.toLowerCase().includes(v.toLowerCase())))).join(', ')}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{event.timezone}</p>
              <p className="text-sm text-muted-foreground">Timezone</p>
            </div>
          </div>

          {!event.isFree && event.price && (
            <div className="flex items-start gap-3">
              <Ticket className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{event.price}</p>
                <p className="text-sm text-muted-foreground">Ticket Price</p>
              </div>
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <div className="flex flex-wrap gap-3">
          {event.ticketUrl && (
            <Button asChild>
              <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer">
                Get Tickets <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </Button>
          )}
          {event.websiteUrl && (
            <Button variant="outline" asChild>
              <a href={event.websiteUrl} target="_blank" rel="noopener noreferrer">
                Visit Website <ExternalLink className="h-4 w-4 ml-1" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="prose prose-lg max-w-none mb-8">
        <div dangerouslySetInnerHTML={{ __html: event.description }} />
      </div>

      {/* Map placeholder */}
      {(event.venue || event.city) && (
        <div className="bg-muted/50 border rounded-xl p-8 mb-8 text-center">
          <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="font-medium">{event.venue}</p>
          <p className="text-sm text-muted-foreground">
            {[event.location, event.city, event.country].filter((v, i, arr) => v && (i === 0 || !arr.slice(0, i).some(prev => prev?.toLowerCase().includes(v.toLowerCase())))).join(', ')}
          </p>
          <p className="text-xs text-muted-foreground mt-2">Map view coming soon</p>
        </div>
      )}

      {/* Related Events */}
      {relatedEvents.length > 0 && (
        <section className="mt-12">
          <h2 className="font-serif text-2xl font-bold mb-6">Related Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {relatedEvents.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
