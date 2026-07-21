import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EventCardProps {
  event: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    coverImage: string | null;
    venue: string | null;
    city: string | null;
    country: string | null;
    startDate: string | Date;
    endDate: string | Date | null;
    isFree: boolean;
    price: string | null;
    eventType: string;
    isFeatured?: boolean;
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

export function EventCard({ event }: EventCardProps) {
  const primaryCategory = event.categories[0]?.category;
  const startDate = new Date(event.startDate);
  const formattedDate = startDate.toLocaleDateString('en-KE', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = startDate.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const imageSrc = event.coverImage || '/placeholder-event.svg';
  const isPast = startDate < new Date();

  return (
    <Link href={`/events/${event.slug}`} className="group">
      <article className="relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={imageSrc}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
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
          {event.isFree ? (
            <Badge className="absolute top-3 right-3 bg-emerald-600 text-white z-10 border-none">
              Free
            </Badge>
          ) : event.price ? (
            <Badge className="absolute top-3 right-3 bg-amber text-amber-foreground z-10 border-none">
              {event.price}
            </Badge>
          ) : null}
          {isPast && (
            <div className="absolute inset-0 bg-black/30 flex items-end justify-start p-3 z-[5]">
              <Badge variant="secondary" className="bg-black/60 text-white border-none text-xs">
                Past Event
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-serif text-lg font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {event.title}
          </h3>

          {event.excerpt && (
            <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">
              {event.excerpt}
            </p>
          )}

          <div className="mt-auto flex flex-col gap-1 pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {formattedDate} · {formattedTime}
            </span>
            {(event.venue || event.city) && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {[event.venue, event.city].filter((v, i, arr) => v && (i === 0 || !arr[0]?.toLowerCase().includes(v.toLowerCase()))).join(', ')}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
