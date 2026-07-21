'use client';

import { Sparkles, Calendar, BookOpen, Star } from 'lucide-react';
import { NewsletterForm } from '@/components/blog/newsletter-form';

export function NewsletterPageClient() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        {/* Decorative element */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>

        <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-3">
          This Week in <span className="text-primary">East African Arts</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
          Get our weekly newsletter with curated event picks, new reviews, and exclusive content from the East African art scene.
        </p>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-md mx-auto sm:max-w-none">
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
            <Calendar className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Event Picks</span>
            <span className="text-xs text-muted-foreground">Curated events across EA</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">New Reviews</span>
            <span className="text-xs text-muted-foreground">Music, film, books & more</span>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
            <Star className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium">Exclusive Content</span>
            <span className="text-xs text-muted-foreground">Behind-the-scenes stories</span>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-sm mx-auto bg-card border rounded-xl p-6 sm:p-8">
          <NewsletterForm variant="full" />
        </div>

        <p className="text-xs text-muted-foreground mt-6">
          We respect your privacy. Unsubscribe anytime. No spam, ever.
        </p>
      </div>
    </div>
  );
}
