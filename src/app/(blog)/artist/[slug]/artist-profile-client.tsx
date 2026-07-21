"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  MapPin,
  Globe,
  Star,
  Calendar,
  Clock,
  ArrowLeft,
  Share2,
  Music,
  BookOpen,
  Camera,
  Film,
  Palette,
  ExternalLink,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PostCard } from "@/components/blog/post-card"

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
}

interface ArtistProfileClientProps {
  artist: {
    id: string
    name: string
    slug: string
    stageName: string | null
    bio: string
    shortBio: string | null
    image: string | null
    coverImage: string | null
    websiteUrl: string | null
    socialLinks: string | null
    artistType: string
    location: string | null
    country: string | null
    isFeatured: boolean
    categories: { category: { id: string; name: string; slug: string; color: string | null } }[]
    posts: {
      post: {
        id: string; title: string; slug: string; featuredImage: string | null;
        excerpt: string | null; publishedAt: string | null; status: string; readingTime: number;
        author: { id: string; name: string; username: string; image: string | null }
        categories: { category: { id: string; name: string; slug: string; color: string | null } }[]
      }
    }[]
    events: {
      event: {
        id: string; title: string; slug: string; startDate: string; endDate: string | null;
        coverImage: string | null; city: string | null; country: string | null; venue: string | null;
        isFree: boolean; price: string | null; eventType: string
      }
    }[]
  }
}

export function ArtistProfileClient({ artist }: ArtistProfileClientProps) {
  const [shareSuccess, setShareSuccess] = useState(false)
  const typeConfig = ARTIST_TYPE_CONFIG[artist.artistType] || ARTIST_TYPE_CONFIG.OTHER

  const socialLinks: Record<string, string> = artist.socialLinks
    ? (() => { try { return JSON.parse(artist.socialLinks) as Record<string, string>; } catch { return {}; } })()
    : {}

  const publishedPosts = artist.posts
    .filter((p) => p.post.status === "PUBLISHED")
    .map((p) => p.post)

  const upcomingEvents = artist.events
    .filter((e) => new Date(e.event.startDate) >= new Date())
    .sort((a, b) => new Date(a.event.startDate).getTime() - new Date(b.event.startDate).getTime())

  const pastEvents = artist.events
    .filter((e) => new Date(e.event.startDate) < new Date())
    .sort((a, b) => new Date(b.event.startDate).getTime() - new Date(a.event.startDate).getTime())

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({
          title: artist.stageName || artist.name,
          text: artist.shortBio || `Check out ${artist.stageName || artist.name} on Sanaa Through My Lens`,
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        setShareSuccess(true)
        setTimeout(() => setShareSuccess(false), 2000)
      }
    } catch {
      // user cancelled share
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen">
      {/* Cover Image Banner */}
      <div className="relative h-48 sm:h-64 md:h-80 overflow-hidden">
        {artist.coverImage ? (
          <Image
            src={artist.coverImage}
            alt={`${artist.name} cover`}
            fill
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5" />
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

        {/* Back button */}
        <div className="absolute top-4 left-4 z-10">
          <Link href="/artists">
            <Button variant="secondary" size="sm" className="gap-1.5 bg-background/80 backdrop-blur-sm">
              <ArrowLeft className="size-3.5" />
              Artists
            </Button>
          </Link>
        </div>
      </div>

      {/* Profile section */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-20 relative z-10">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Profile photo */}
          <div className="shrink-0">
            <div className="relative size-32 sm:size-40 rounded-full border-4 border-background overflow-hidden bg-muted shadow-xl">
              {artist.image ? (
                <Image
                  src={artist.image}
                  alt={artist.name}
                  fill
                  className="object-cover"
                  sizes="160px"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary font-serif font-bold text-4xl">
                  {artist.name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* Name & info */}
          <div className="flex-1 pt-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
                  {artist.name}
                </h1>
                {artist.stageName && (
                  <p className="text-lg text-muted-foreground italic mt-0.5">
                    &ldquo;{artist.stageName}&rdquo;
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <Badge className={typeConfig.color} variant="outline">
                    {typeConfig.label}
                  </Badge>
                  {artist.isFeatured && (
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      <Star className="size-3 mr-0.5 fill-current" /> Featured
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={handleShare}
              >
                <Share2 className="size-3.5" />
                {shareSuccess ? "Copied!" : "Share"}
              </Button>
            </div>

            {artist.shortBio && (
              <p className="text-muted-foreground mt-3 text-base leading-relaxed">
                {artist.shortBio}
              </p>
            )}

            {/* Location & website */}
            <div className="flex items-center gap-4 mt-3 flex-wrap">
              {artist.location && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  {artist.location}
                </div>
              )}
              {artist.websiteUrl && (
                <a
                  href={artist.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <Globe className="size-4" />
                  Website
                  <ExternalLink className="size-3" />
                </a>
              )}
            </div>

            {/* Social links */}
            {Object.keys(socialLinks).length > 0 && (
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {socialLinks.twitter && (
                  <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter/X">
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                )}
                {socialLinks.instagram && (
                  <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Instagram">
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                )}
                {socialLinks.youtube && (
                  <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="YouTube">
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                )}
                {socialLinks.spotify && (
                  <a href={socialLinks.spotify} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Spotify">
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                  </a>
                )}
                {socialLinks.soundcloud && (
                  <a href={socialLinks.soundcloud} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="SoundCloud">
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.05-.1-.1-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.172 1.308c.013.06.045.094.104.094.057 0 .09-.037.104-.094l.199-1.308-.2-1.332c-.014-.057-.047-.094-.104-.094m1.8-.9c-.065 0-.105.042-.112.105l-.217 2.22.217 2.127c.007.065.047.105.112.105.065 0 .105-.04.116-.105l.246-2.127-.246-2.22c-.011-.063-.051-.105-.116-.105m.899-.362c-.075 0-.12.047-.127.12l-.2 2.582.2 2.1c.007.075.052.12.127.12.075 0 .12-.045.127-.12l.227-2.1-.227-2.582c-.007-.073-.052-.12-.127-.12m.898-.173c-.082 0-.131.052-.136.135l-.182 2.755.182 2.086c.005.083.054.135.136.135.082 0 .131-.052.138-.135l.205-2.086-.205-2.755c-.007-.083-.056-.135-.138-.135m.899-.132c-.09 0-.141.058-.145.15l-.166 2.887.166 2.073c.004.09.055.15.145.15.09 0 .141-.06.146-.15l.188-2.073-.188-2.887c-.005-.092-.056-.15-.146-.15m.899-.044c-.098 0-.15.064-.154.164l-.15 2.931.15 2.058c.004.1.056.164.154.164.098 0 .15-.064.156-.164l.169-2.058-.169-2.931c-.006-.1-.058-.164-.156-.164m.898.044c-.107 0-.16.07-.164.175l-.134 2.887.134 2.044c.004.105.057.175.164.175.107 0 .16-.07.166-.175l.151-2.044-.151-2.887c-.006-.105-.059-.175-.166-.175m.899-.226c-.116 0-.17.078-.174.189l-.118 3.113.118 2.029c.004.111.058.189.174.189.116 0 .17-.078.176-.189l.134-2.029-.134-3.113c-.006-.111-.06-.189-.176-.189m.898-.074c-.124 0-.18.082-.184.199l-.102 3.187.102 2.014c.004.117.06.199.184.199.124 0 .18-.082.186-.199l.116-2.014-.116-3.187c-.006-.117-.062-.199-.186-.199m.899-.15c-.132 0-.19.088-.193.21l-.087 3.337.087 1.998c.003.122.061.21.193.21.132 0 .19-.088.195-.21l.099-1.998-.099-3.337c-.005-.122-.063-.21-.195-.21m.898.075c-.14 0-.199.092-.202.218l-.072 3.262.072 1.984c.003.126.062.218.202.218.14 0 .199-.092.204-.218l.084-1.984-.084-3.262c-.005-.126-.064-.218-.204-.218m.899-.451c-.15 0-.21.099-.213.23l-.056 3.713.056 1.966c.003.132.063.23.213.23.15 0 .21-.098.215-.23l.068-1.966-.068-3.713c-.005-.131-.065-.23-.215-.23m.898.113c-.158 0-.22.105-.223.243l-.041 3.6.041 1.95c.003.139.065.243.223.243.158 0 .22-.104.225-.243l.054-1.95-.054-3.6c-.005-.138-.067-.243-.225-.243m6.594 1.678c-.293 0-.573.047-.84.134C22.037 9.473 20.283 8 18.18 8c-.53 0-1.038.113-1.503.31-.176.073-.223.147-.225.294v7.938c.002.15.117.276.265.29h7.736c1.644 0 2.978-1.298 2.978-2.9s-1.334-2.9-2.978-2.9"/></svg>
                  </a>
                )}
                {socialLinks.facebook && (
                  <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Facebook">
                    <svg className="size-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073"/></svg>
                  </a>
                )}
              </div>
            )}

            {/* Category badges */}
            {artist.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {artist.categories.map((c) => (
                  <Link key={c.category.id} href={`/category/${c.category.slug}`}>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-accent transition-colors"
                      style={c.category.color ? { borderColor: c.category.color, color: c.category.color } : undefined}
                    >
                      {c.category.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator className="my-8" />

        {/* Full Bio */}
        <section className="mb-10">
          <h2 className="font-serif text-xl font-bold mb-4">About</h2>
          <div
            className="prose prose-neutral dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: artist.bio }}
          />
        </section>

        {/* Featured Posts */}
        {publishedPosts.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
              <BookOpen className="size-5" />
              Featured Articles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={{
                    ...post,
                    isFeatured: false,
                    isSponsored: false,
                    categories: post.categories,
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Events */}
        {upcomingEvents.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="size-5" />
              Upcoming Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingEvents.map((e) => (
                <Link key={e.event.id} href={`/events/${e.event.slug}`} className="group">
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex">
                      {e.event.coverImage ? (
                        <Image src={e.event.coverImage} alt={`${e.event.title} event thumbnail`} width={128} height={128} className="w-24 sm:w-32 object-cover" />
                      ) : (
                        <div className="w-24 sm:w-32 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center shrink-0">
                          <Calendar className="size-8 text-primary/30" />
                        </div>
                      )}
                      <CardContent className="p-3 sm:p-4 flex-1">
                        <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                          {e.event.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Calendar className="size-3" />
                          {formatDate(e.event.startDate)}
                        </div>
                        {e.event.venue && (
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <MapPin className="size-3" />
                            {e.event.venue}
                          </div>
                        )}
                        {e.event.isFree && (
                          <Badge variant="outline" className="mt-2 text-xs">Free</Badge>
                        )}
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <section className="mb-10">
            <h2 className="font-serif text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="size-5" />
              Past Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastEvents.slice(0, 4).map((e) => (
                <Link key={e.event.id} href={`/events/${e.event.slug}`} className="group">
                  <Card className="overflow-hidden hover:shadow-md transition-shadow opacity-75">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                        {e.event.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="size-3" />
                        {formatDate(e.event.startDate)}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Back to artists */}
        <div className="pb-10 pt-4 text-center">
          <Link href="/artists">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="size-4" />
              Browse All Artists
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
