'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Bookmark, ListPlus, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface BookmarkButtonProps {
  postId: string;
  initialBookmarked?: boolean;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

interface ReadingListOption {
  id: string;
  name: string;
  slug: string;
  itemCount: number;
}

export function BookmarkButton({
  postId,
  initialBookmarked = false,
  variant = 'ghost',
  size = 'icon',
  className = '',
  showLabel = false,
}: BookmarkButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [isLoading, setIsLoading] = useState(false);
  const [readingLists, setReadingLists] = useState<ReadingListOption[]>([]);
  const [listsLoaded, setListsLoaded] = useState(false);
  const [addingToList, setAddingToList] = useState<string | null>(null);
  const [addedToLists, setAddedToLists] = useState<Set<string>>(new Set());

  const fetchReadingLists = async () => {
    if (listsLoaded) return;
    try {
      const res = await fetch('/api/reading-lists');
      if (res.ok) {
        const data = await res.json();
        setReadingLists(data.lists.map((l: ReadingListOption) => ({
          id: l.id,
          name: l.name,
          slug: l.slug,
          itemCount: l.itemCount,
        })));
        setListsLoaded(true);
      }
    } catch {
      // silently fail
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user?.id) {
      router.push('/api/auth/signin');
      return;
    }

    setIsLoading(true);

    try {
      if (isBookmarked) {
        const res = await fetch(`/api/bookmarks/${postId}`, { method: 'DELETE' });
        if (res.ok) {
          setIsBookmarked(false);
          toast.success('Bookmark removed');
        } else {
          toast.error('Failed to remove bookmark');
        }
      } else {
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId }),
        });
        if (res.ok) {
          setIsBookmarked(true);
          toast.success('Post bookmarked');
        } else if (res.status === 409) {
          setIsBookmarked(true);
          toast.info('Already bookmarked');
        } else {
          toast.error('Failed to bookmark post');
        }
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToList = async (listId: string, listName: string) => {
    setAddingToList(listId);
    try {
      const res = await fetch(`/api/reading-lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        setAddedToLists((prev) => new Set(prev).add(listId));
        toast.success(`Added to "${listName}"`);
      } else if (res.status === 409) {
        toast.info('Already in this list');
        setAddedToLists((prev) => new Set(prev).add(listId));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to add to list');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setAddingToList(null);
    }
  };

  const handleDropdownOpen = (open: boolean) => {
    if (open && session?.user?.id) {
      fetchReadingLists();
    }
  };

  // If not bookmarked, just show the simple bookmark toggle
  if (!isBookmarked) {
    return (
      <Button
        variant={variant}
        size={size}
        className={`${className} relative`}
        onClick={handleToggle}
        disabled={isLoading}
        aria-label="Add bookmark"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key="not-bookmarked"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Bookmark className="h-4 w-4" />
          </motion.div>
        </AnimatePresence>
        {showLabel && (
          <span className="ml-1.5 text-sm">Save</span>
        )}
      </Button>
    );
  }

  // When bookmarked, show bookmark + dropdown for "Save to List"
  return (
    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
      <Button
        variant={variant}
        size={size}
        className={`${className} relative`}
        onClick={handleToggle}
        disabled={isLoading}
        aria-label="Remove bookmark"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key="bookmarked"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <Bookmark className="h-4 w-4 fill-primary text-primary" />
          </motion.div>
        </AnimatePresence>
        {showLabel && (
          <span className="ml-1.5 text-sm">Saved</span>
        )}
      </Button>
      <DropdownMenu onOpenChange={handleDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={`${className} relative ml-0.5`}
            aria-label="Save to reading list"
          >
            <ListPlus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Save to Reading List
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {!session?.user?.id ? (
            <DropdownMenuItem disabled>
              Sign in to save to lists
            </DropdownMenuItem>
          ) : listsLoaded && readingLists.length === 0 ? (
            <>
              <DropdownMenuItem disabled className="text-muted-foreground">
                No lists yet
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/dashboard/reading-lists" className="flex items-center gap-2 text-primary">
                  <Plus className="h-4 w-4" /> Create a list
                </a>
              </DropdownMenuItem>
            </>
          ) : (
            <>
              {readingLists.map((list) => (
                <DropdownMenuItem
                  key={list.id}
                  disabled={addingToList === list.id}
                  onClick={(e) => {
                    e.preventDefault();
                    handleAddToList(list.id, list.name);
                  }}
                  className="flex items-center justify-between"
                >
                  <span className="truncate">{list.name}</span>
                  {addedToLists.has(list.id) ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  ) : addingToList === list.id ? (
                    <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
                  ) : (
                    <span className="text-xs text-muted-foreground">{list.itemCount}</span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/dashboard/reading-lists" className="flex items-center gap-2 text-primary">
                  <Plus className="h-4 w-4" /> Create new list
                </a>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
