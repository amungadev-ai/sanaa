'use client';

import { useEffect, useRef, useState } from 'react';

interface GoogleAdProps {
  /** Ad slot ID from Google AdSense */
  slot: string;
  /** Ad format: auto, rectangle, horizontal, vertical, fluid */
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical' | 'fluid';
  /** Whether the ad is responsive */
  responsive?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Style object */
  style?: React.CSSProperties;
}

/**
 * Google AdSense ad unit component.
 * Must be used client-side since it relies on the adsbygoogle global.
 * Automatically hides itself when the ad is unfilled to avoid blank spaces.
 */
export function GoogleAd({
  slot,
  format = 'auto',
  responsive = true,
  className = '',
  style,
}: GoogleAdProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const pushed = useRef(false);

  useEffect(() => {
    // Push the ad to Google AdSense only once per mount
    if (pushed.current) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      if (w.adsbygoogle) {
        (w.adsbygoogle = w.adsbygoogle || []).push({});
        pushed.current = true;
      }
    } catch {
      // AdSense not loaded yet — will retry on next render
    }
  }, []);

  return (
    <div className={`google-ad-wrapper ${className}`} style={style} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          ...style,
        }}
        data-ad-client="ca-pub-8031704055036556"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}

/**
 * Sidebar ad unit — shows a Google AdSense rectangle with a styled fallback.
 * Automatically detects unfilled ads and shows a placeholder instead.
 */
export function SidebarAd({ className = '' }: { className?: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [adState, setAdState] = useState<'loading' | 'filled' | 'unfilled'>('loading');

  useEffect(() => {
    const checkAdStatus = () => {
      if (!wrapperRef.current) return;
      const ins = wrapperRef.current.querySelector('ins.adsbygoogle');
      if (ins) {
        const status = ins.getAttribute('data-ad-status');
        if (status === 'filled') {
          setAdState('filled');
        } else if (status === 'unfilled') {
          setAdState('unfilled');
        }
      }
    };

    // Check after delays — AdSense can take time to process
    const t1 = setTimeout(checkAdStatus, 2000);
    const t2 = setTimeout(checkAdStatus, 5000);
    const t3 = setTimeout(checkAdStatus, 8000);

    // Observe for changes
    const observer = new MutationObserver(checkAdStatus);
    if (wrapperRef.current) {
      observer.observe(wrapperRef.current, {
        attributes: true,
        subtree: true,
        attributeFilter: ['data-ad-status'],
      });
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={wrapperRef} className={`ad-sidebar ${className}`}>
      {/* Hide the ins element when unfilled to prevent blank space */}
      <div style={{ display: adState === 'unfilled' ? 'none' : 'block' }}>
        <GoogleAd
          slot="1234567890"
          format="rectangle"
          className="w-full"
        />
      </div>

      {/* Show placeholder when ad is unfilled */}
      {adState === 'unfilled' && (
        <div className="min-h-[250px] bg-muted/30 border border-dashed border-muted-foreground/15 rounded-lg flex flex-col items-center justify-center gap-2 p-4">
          <div className="text-muted-foreground/30 text-2xl">&#10022;</div>
          <p className="text-xs text-muted-foreground/40 font-medium">Advertisement</p>
          <p className="text-[10px] text-muted-foreground/25">Ad space available</p>
        </div>
      )}
    </div>
  );
}

/**
 * In-article ad unit for between posts / within content.
 */
export function InArticleAd({ className = '' }: { className?: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [adState, setAdState] = useState<'loading' | 'filled' | 'unfilled'>('loading');

  useEffect(() => {
    const checkAdStatus = () => {
      if (!wrapperRef.current) return;
      const ins = wrapperRef.current.querySelector('ins.adsbygoogle');
      if (ins) {
        const status = ins.getAttribute('data-ad-status');
        if (status === 'filled') setAdState('filled');
        else if (status === 'unfilled') setAdState('unfilled');
      }
    };

    const t1 = setTimeout(checkAdStatus, 2000);
    const t2 = setTimeout(checkAdStatus, 5000);
    const observer = new MutationObserver(checkAdStatus);
    if (wrapperRef.current) {
      observer.observe(wrapperRef.current, {
        attributes: true,
        subtree: true,
        attributeFilter: ['data-ad-status'],
      });
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
    };
  }, []);

  if (adState === 'unfilled') return null;

  return (
    <div ref={wrapperRef} className={`ad-in-article ${className}`}>
      <GoogleAd
        slot="0987654321"
        format="fluid"
        className="w-full"
      />
    </div>
  );
}

/**
 * Header banner ad unit.
 */
export function HeaderBannerAd({ className = '' }: { className?: string }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [adState, setAdState] = useState<'loading' | 'filled' | 'unfilled'>('loading');

  useEffect(() => {
    const checkAdStatus = () => {
      if (!wrapperRef.current) return;
      const ins = wrapperRef.current.querySelector('ins.adsbygoogle');
      if (ins) {
        const status = ins.getAttribute('data-ad-status');
        if (status === 'filled') setAdState('filled');
        else if (status === 'unfilled') setAdState('unfilled');
      }
    };

    const t1 = setTimeout(checkAdStatus, 2000);
    const t2 = setTimeout(checkAdStatus, 5000);
    const observer = new MutationObserver(checkAdStatus);
    if (wrapperRef.current) {
      observer.observe(wrapperRef.current, {
        attributes: true,
        subtree: true,
        attributeFilter: ['data-ad-status'],
      });
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      observer.disconnect();
    };
  }, []);

  if (adState === 'unfilled') return null;

  return (
    <div ref={wrapperRef} className={`ad-header-banner ${className}`}>
      <GoogleAd
        slot="1122334455"
        format="horizontal"
        className="w-full"
      />
    </div>
  );
}
