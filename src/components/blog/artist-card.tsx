import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ARTIST_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  MUSICIAN: { label: "Musician", color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
  WRITER: { label: "Writer", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" },
  PAINTER: { label: "Painter", color: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400" },
  PHOTOGRAPHER: { label: "Photographer", color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400" },
  FILMMAKER: { label: "Filmmaker", color: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400" },
  DANCER: { label: "Dancer", color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400" },
  ACTOR: { label: "Actor", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  SCULPTOR: { label: "Sculptor", color: "bg-stone-100 text-stone-800 dark:bg-stone-900/30 dark:text-stone-400" },
  CURATOR: { label: "Curator", color: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400" },
  DJ: { label: "DJ", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  PRODUCER: { label: "Producer", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400" },
  OTHER: { label: "Other", color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" },
};

interface ArtistCardProps {
  artist: {
    id: string;
    name: string;
    slug: string;
    stageName?: string | null;
    image?: string | null;
    coverImage?: string | null;
    artistType: string;
    location?: string | null;
    shortBio?: string | null;
    isFeatured?: boolean;
    categories?: { category: { id: string; name: string; slug: string; color?: string | null } }[];
  };
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const typeConfig = ARTIST_TYPE_CONFIG[artist.artistType] || ARTIST_TYPE_CONFIG.OTHER;

  return (
    <Link href={`/artist/${artist.slug}`} className="group block">
      <article className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        {/* Cover image */}
        <div className="relative h-28 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent overflow-hidden">
          {artist.coverImage ? (
            <Image
              src={artist.coverImage}
              alt={`${artist.name} cover`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary/30 font-serif text-2xl font-bold">
                  {artist.name.charAt(0)}
                </span>
              </div>
            </div>
          )}
          {/* Featured badge */}
          {artist.isFeatured && (
            <Badge className="absolute top-2 right-2 bg-amber-500 text-white text-[10px] px-1.5 py-0.5">
              <Star className="size-2.5 mr-0.5 fill-current" /> Featured
            </Badge>
          )}
        </div>

        {/* Profile photo overlapping */}
        <div className="relative px-4 -mt-8">
          <div className="relative size-16 rounded-full border-4 border-card overflow-hidden bg-muted shadow-sm">
            {artist.image ? (
              <Image
                src={artist.image}
                alt={artist.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-serif font-bold text-xl">
                {artist.name.charAt(0)}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-4 pt-2 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-serif font-bold text-base leading-tight truncate group-hover:text-primary transition-colors">
                {artist.name}
              </h3>
              {artist.stageName && (
                <p className="text-xs text-muted-foreground italic truncate">
                  &ldquo;{artist.stageName}&rdquo;
                </p>
              )}
            </div>
          </div>

          <Badge className={`${typeConfig.color} text-[10px] mt-1.5 w-fit`} variant="outline">
            {typeConfig.label}
          </Badge>

          {artist.shortBio && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
              {artist.shortBio}
            </p>
          )}

          {artist.location && (
            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
              <MapPin className="size-3 shrink-0" />
              <span className="truncate">{artist.location}</span>
            </div>
          )}

          {artist.categories && artist.categories.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {artist.categories.slice(0, 3).map((c) => (
                <Badge key={c.category.id} variant="outline" className="text-[10px] px-1.5 py-0">
                  {c.category.name}
                </Badge>
              ))}
              {artist.categories.length > 3 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  +{artist.categories.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
