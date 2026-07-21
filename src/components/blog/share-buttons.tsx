'use client';

import { useState } from 'react';
import { Twitter, Facebook, Link2, MessageCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ShareButtonsProps {
  title: string;
  slug: string;
  className?: string;
  /** Compact mode: smaller buttons, no "Share:" label */
  compact?: boolean;
}

export function ShareButtons({ title, slug, className = '', compact = false }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/post/${slug}`
    : `https://sanaathrumylens.co.ke/post/${slug}`;

  const encodedTitle = encodeURIComponent(title);
  const encodedUrl = encodeURIComponent(url);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const btnSize = compact ? 'h-7 w-7' : 'h-8 w-8';
  const iconSize = compact ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <div className={`flex items-center gap-1.5 ${compact ? '' : 'gap-2'} ${className}`}>
      {!compact && (
        <span className="text-sm font-medium text-muted-foreground mr-1">Share:</span>
      )}
      <Button
        variant="outline"
        size="icon"
        className={btnSize}
        asChild
      >
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Twitter"
        >
          <Twitter className={iconSize} />
        </a>
      </Button>
      <Button
        variant="outline"
        size="icon"
        className={btnSize}
        asChild
      >
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on Facebook"
        >
          <Facebook className={iconSize} />
        </a>
      </Button>
      <Button
        variant="outline"
        size="icon"
        className={btnSize}
        asChild
      >
        <a
          href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share on WhatsApp"
        >
          <MessageCircle className={iconSize} />
        </a>
      </Button>
      <Button
        variant="outline"
        size="icon"
        className={btnSize}
        onClick={handleCopyLink}
        aria-label="Copy link"
      >
        {copied ? <Check className={`${iconSize} text-emerald-500`} /> : <Link2 className={iconSize} />}
      </Button>
    </div>
  );
}
