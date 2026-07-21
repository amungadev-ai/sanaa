'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Check, Loader2, ListPlus, Plus } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface SaveToListButtonProps {
  postId: string;
  variant?: 'outline' | 'default' | 'ghost';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  showLabel?: boolean;
}

interface ReadingList {
  id: string;
  name: string;
  itemCount: number;
}

export function SaveToListButton({
  postId,
  variant = 'outline',
  size = 'sm',
  showLabel = false,
}: SaveToListButtonProps) {
  const { data: session } = useSession();
  const [userLists, setUserLists] = useState<ReadingList[]>([]);
  const [listsLoaded, setListsLoaded] = useState(false);
  const [addingToList, setAddingToList] = useState<string | null>(null);
  const [addedLists, setAddedLists] = useState<Set<string>>(new Set());

  const fetchLists = async () => {
    if (listsLoaded) return;
    try {
      const res = await fetch('/api/reading-lists');
      if (res.ok) {
        const data = await res.json();
        setUserLists(
          data.lists.map((l: { id: string; name: string; itemCount: number }) => ({
            id: l.id,
            name: l.name,
            itemCount: l.itemCount,
          }))
        );
        setListsLoaded(true);
      }
    } catch {
      // silently fail
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
        setAddedLists((prev) => new Set([...prev, listId]));
        toast.success(`Added to "${listName}"`);
      } else if (res.status === 409) {
        setAddedLists((prev) => new Set([...prev, listId]));
        toast.info('Already in this list');
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

  // Not logged in — show a link to sign in
  if (!session) {
    return (
      <Link href="/auth/signin">
        <Button variant={variant} size={size} className="gap-1.5">
          <ListPlus className="h-4 w-4" />
          {showLabel && <span>Save to List</span>}
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) fetchLists(); }}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-1.5">
          <ListPlus className="h-4 w-4" />
          {showLabel && <span>Save to List</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Save to Reading List
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!listsLoaded || userLists.length === 0 ? (
          <>
            <DropdownMenuItem disabled className="text-muted-foreground">
              {listsLoaded ? 'No lists yet' : 'Loading...'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/reading-lists" className="flex items-center gap-2 text-primary">
                <Plus className="h-4 w-4" /> Create a list
              </Link>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            {userLists.map((list) => (
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
                {addedLists.has(list.id) ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                ) : addingToList === list.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                ) : (
                  <span className="text-xs text-muted-foreground">{list.itemCount}</span>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/reading-lists" className="flex items-center gap-2 text-primary">
                <Plus className="h-4 w-4" /> Create new list
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
