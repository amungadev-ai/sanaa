"use client"

import { useState, useMemo } from "react"
import { Search, Palette, Star, SlidersHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArtistCard } from "@/components/blog/artist-card"

const ARTIST_TYPES = [
  { value: "ALL", label: "All" },
  { value: "MUSICIAN", label: "Musicians" },
  { value: "WRITER", label: "Writers" },
  { value: "PAINTER", label: "Painters" },
  { value: "PHOTOGRAPHER", label: "Photographers" },
  { value: "FILMMAKER", label: "Filmmakers" },
  { value: "DANCER", label: "Dancers" },
  { value: "ACTOR", label: "Actors" },
  { value: "SCULPTOR", label: "Sculptors" },
  { value: "CURATOR", label: "Curators" },
  { value: "DJ", label: "DJs" },
  { value: "PRODUCER", label: "Producers" },
  { value: "OTHER", label: "Other" },
]

interface ArtistItem {
  id: string
  name: string
  slug: string
  stageName: string | null
  image: string | null
  coverImage: string | null
  artistType: string
  location: string | null
  country: string | null
  shortBio: string | null
  isFeatured: boolean
  categories: { category: { id: string; name: string; slug: string; color: string | null } }[]
}

interface ArtistsDirectoryClientProps {
  featuredArtists: ArtistItem[]
  allArtists: ArtistItem[]
}

const PAGE_SIZE = 12

export function ArtistsDirectoryClient({ featuredArtists, allArtists }: ArtistsDirectoryClientProps) {
  const [search, setSearch] = useState("")
  const [activeType, setActiveType] = useState("ALL")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const filteredArtists = useMemo(() => {
    let result = allArtists

    if (activeType !== "ALL") {
      result = result.filter((a) => a.artistType === activeType)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.stageName && a.stageName.toLowerCase().includes(q)) ||
          (a.location && a.location.toLowerCase().includes(q))
      )
    }

    return result
  }, [allArtists, activeType, search])

  const visibleArtists = filteredArtists.slice(0, visibleCount)
  const hasMore = visibleCount < filteredArtists.length

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }

  // Reset visible count when filters change
  const handleTypeChange = (type: string) => {
    setActiveType(type)
    setVisibleCount(PAGE_SIZE)
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-primary/5 to-transparent py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Palette className="size-8 text-primary" />
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold tracking-tight">
            Discover East African Artists
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore the vibrant world of musicians, writers, painters, filmmakers, and other creative voices shaping Kenya and East Africa&apos;s cultural landscape.
          </p>

          {/* Search */}
          <div className="mt-8 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                placeholder="Search artists by name, stage name, location..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Featured Artists Carousel */}
        {featuredArtists.length > 0 && activeType === "ALL" && !search && (
          <section className="mb-12">
            <h2 className="font-serif text-2xl font-bold mb-6 flex items-center gap-2">
              <Star className="size-5 text-amber-500 fill-amber-500" />
              Featured Artists
            </h2>
            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
              {featuredArtists.map((artist) => (
                <div key={artist.id} className="shrink-0 w-72">
                  <ArtistCard artist={artist} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filter tabs */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <SlidersHorizontal className="size-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filter by type</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {ARTIST_TYPES.map((type) => (
              <Badge
                key={type.value}
                variant={activeType === type.value ? "default" : "outline"}
                className="cursor-pointer hover:bg-accent transition-colors px-3 py-1"
                onClick={() => handleTypeChange(type.value)}
              >
                {type.label}
              </Badge>
            ))}
          </div>
        </section>

        {/* Artists Grid */}
        {visibleArtists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleArtists.map((artist) => (
              <ArtistCard key={artist.id} artist={artist} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Palette className="size-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-1">No artists found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="text-center mt-10 mb-16">
            <Button variant="outline" size="lg" onClick={handleLoadMore} className="gap-2">
              Load More Artists
              <span className="text-xs text-muted-foreground">
                ({filteredArtists.length - visibleCount} remaining)
              </span>
            </Button>
          </div>
        )}

        {!hasMore && visibleArtists.length > 0 && (
          <div className="text-center mt-10 mb-16">
            <p className="text-sm text-muted-foreground">
              Showing all {filteredArtists.length} artist{filteredArtists.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
