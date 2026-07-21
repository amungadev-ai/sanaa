'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  BookOpen,
  Plus,
  Trash2,
  Pencil,
  Globe,
  Lock,
  ChevronDown,
  ChevronUp,
  ListPlus,
  Check,
  X,
  Loader2,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

interface ReadingList {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  updatedAt: string;
  items: { post: { id: string; featuredImage: string | null } }[];
  _count: { items: number };
}

interface ListItem {
  id: string;
  note: string | null;
  createdAt: string;
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    featuredImage: string | null;
    publishedAt: string | null;
    readingTime: number;
    author: { id: string; name: string; username: string; image: string | null };
    categories: { category: { id: string; name: string; slug: string; color: string | null } }[];
  };
}

interface Bookmark {
  id: string;
  post: {
    id: string;
    title: string;
    slug: string;
    featuredImage: string | null;
    publishedAt: string | null;
    readingTime: number;
    author: { id: string; name: string; username: string; image: string | null };
    categories: { category: { id: string; name: string; slug: string; color: string | null } }[];
  };
}

interface ReadingListsClientProps {
  initialLists: ReadingList[];
  bookmarks: Bookmark[];
}

export function ReadingListsClient({ initialLists, bookmarks }: ReadingListsClientProps) {
  const [lists, setLists] = useState(initialLists);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListPublic, setNewListPublic] = useState(false);

  // Edit state
  const [editingListId, setEditingListId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPublic, setEditPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  // Expand state
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [listItems, setListItems] = useState<ListItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);

  // Add to list from bookmarks
  const [bookmarkListDropdowns, setBookmarkListDropdowns] = useState<Record<string, boolean>>({});
  const [userLists, setUserLists] = useState<{ id: string; name: string; itemCount: number }[]>([]);
  const [listsLoaded, setListsLoaded] = useState(false);
  const [addingToList, setAddingToList] = useState<Record<string, string | null>>({});
  const [addedToLists, setAddedToLists] = useState<Record<string, Set<string>>>({});

  const fetchUserLists = async () => {
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

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    try {
      const res = await fetch('/api/reading-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newListName.trim(),
          description: newListDescription.trim() || undefined,
          isPublic: newListPublic,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLists((prev) => [
          { ...data.list, items: [], _count: { items: data.list.itemCount || 0 } },
          ...prev,
        ]);
        setNewListName('');
        setNewListDescription('');
        setNewListPublic(false);
        setShowNewList(false);
        setListsLoaded(false);
        toast.success('List created successfully');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create list');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      const res = await fetch(`/api/reading-lists/${listId}`, { method: 'DELETE' });
      if (res.ok) {
        setLists((prev) => prev.filter((l) => l.id !== listId));
        if (expandedListId === listId) setExpandedListId(null);
        if (editingListId === listId) setEditingListId(null);
        toast.success('List deleted');
      }
    } catch {
      toast.error('Failed to delete list');
    }
  };

  const handleStartEdit = (list: ReadingList) => {
    setEditingListId(list.id);
    setEditName(list.name);
    setEditDescription(list.description || '');
    setEditPublic(list.isPublic);
  };

  const handleCancelEdit = () => {
    setEditingListId(null);
    setEditName('');
    setEditDescription('');
    setEditPublic(false);
  };

  const handleSaveEdit = async (listId: string) => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/reading-lists/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
          isPublic: editPublic,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLists((prev) =>
          prev.map((l) =>
            l.id === listId
              ? {
                  ...l,
                  name: data.list.name,
                  description: data.list.description,
                  isPublic: data.list.isPublic,
                }
              : l
          )
        );
        setEditingListId(null);
        toast.success('List updated');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update list');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleExpand = async (listId: string) => {
    if (expandedListId === listId) {
      setExpandedListId(null);
      setListItems([]);
      return;
    }

    setExpandedListId(listId);
    setLoadingItems(true);
    try {
      const res = await fetch(`/api/reading-lists/${listId}?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setListItems(data.list?.items || []);
      } else {
        setListItems([]);
      }
    } catch {
      setListItems([]);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleRemoveItem = async (listId: string, itemId: string, postId: string) => {
    setRemovingItemId(itemId);
    try {
      const res = await fetch(`/api/reading-lists/${listId}/items`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        setListItems((prev) => prev.filter((item) => item.id !== itemId));
        setLists((prev) =>
          prev.map((l) =>
            l.id === listId
              ? { ...l, _count: { items: Math.max(0, l._count.items - 1) } }
              : l
          )
        );
        toast.success('Removed from list');
      } else {
        toast.error('Failed to remove item');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setRemovingItemId(null);
    }
  };

  const handleAddToList = async (postId: string, listId: string, listName: string) => {
    setAddingToList((prev) => ({ ...prev, [postId]: listId }));
    try {
      const res = await fetch(`/api/reading-lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId }),
      });
      if (res.ok) {
        setAddedToLists((prev) => ({
          ...prev,
          [postId]: new Set([...(prev[postId] || []), listId]),
        }));
        toast.success(`Added to "${listName}"`);
      } else if (res.status === 409) {
        toast.info('Already in this list');
        setAddedToLists((prev) => ({
          ...prev,
          [postId]: new Set([...(prev[postId] || []), listId]),
        }));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to add to list');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setAddingToList((prev) => ({ ...prev, [postId]: null }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Reading Lists
          </h1>
          <p className="text-muted-foreground mt-1">Organize your saved stories into lists</p>
        </div>
        <Button onClick={() => setShowNewList(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New List
        </Button>
      </div>

      {showNewList && (
        <Card>
          <CardContent className="pt-6 space-y-3">
            <div>
              <Label htmlFor="new-list-name">List Name</Label>
              <Input
                id="new-list-name"
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name..."
                onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="new-list-desc">Description (optional)</Label>
              <Input
                id="new-list-desc"
                type="text"
                value={newListDescription}
                onChange={(e) => setNewListDescription(e.target.value)}
                placeholder="What's this list about..."
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="new-list-public"
                checked={newListPublic}
                onCheckedChange={setNewListPublic}
              />
              <Label htmlFor="new-list-public" className="flex items-center gap-1.5">
                {newListPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {newListPublic ? 'Public' : 'Private'}
              </Label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button onClick={handleCreateList} size="sm">Create</Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNewList(false);
                  setNewListName('');
                  setNewListDescription('');
                  setNewListPublic(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {lists.length === 0 && !showNewList ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium">No reading lists yet</p>
          <p className="text-muted-foreground mt-1">Create your first list to organize saved stories</p>
          <Button onClick={() => setShowNewList(true)} className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Create Your First List
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {lists.map((list) => (
            <Card key={list.id}>
              {editingListId === list.id ? (
                /* Inline Edit Form */
                <CardContent className="pt-6 space-y-3">
                  <div>
                    <Label htmlFor={`edit-name-${list.id}`}>List Name</Label>
                    <Input
                      id={`edit-name-${list.id}`}
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`edit-desc-${list.id}`}>Description</Label>
                    <Input
                      id={`edit-desc-${list.id}`}
                      type="text"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="What's this list about..."
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`edit-public-${list.id}`}
                      checked={editPublic}
                      onCheckedChange={setEditPublic}
                    />
                    <Label htmlFor={`edit-public-${list.id}`} className="flex items-center gap-1.5">
                      {editPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                      {editPublic ? 'Public' : 'Private'}
                    </Label>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => handleSaveEdit(list.id)} disabled={saving}>
                      {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              ) : (
                /* Normal Display */
                <>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <CardTitle className="text-lg truncate">{list.name}</CardTitle>
                        <Badge
                          variant={list.isPublic ? 'default' : 'secondary'}
                          className="text-[10px] px-1.5 py-0 shrink-0 gap-0.5"
                        >
                          {list.isPublic ? (
                            <><Globe className="h-2.5 w-2.5" /> Public</>
                          ) : (
                            <><Lock className="h-2.5 w-2.5" /> Private</>
                          )}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleStartEdit(list)}
                          title="Edit list"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteList(list.id)}
                          title="Delete list"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {list.description && (
                      <p className="text-sm text-muted-foreground">{list.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <button
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => handleToggleExpand(list.id)}
                    >
                      <span>
                        {list._count.items} {list._count.items === 1 ? 'story' : 'stories'}
                      </span>
                      {expandedListId === list.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {/* Expanded items */}
                    {expandedListId === list.id && (
                      <div className="mt-4 border-t pt-4">
                        {loadingItems ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : listItems.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No stories in this list yet
                          </p>
                        ) : (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {listItems.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors group"
                              >
                                {/* Thumbnail */}
                                {item.post.featuredImage ? (
                                  <img
                                    src={item.post.featuredImage}
                                    alt={item.post.title}
                                    className="h-12 w-16 rounded object-cover shrink-0"
                                  />
                                ) : (
                                  <div className="h-12 w-16 rounded bg-muted flex items-center justify-center shrink-0">
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <Link
                                    href={`/post/${item.post.slug}`}
                                    className="text-sm font-medium hover:underline line-clamp-1"
                                  >
                                    {item.post.title}
                                  </Link>
                                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                    <span>{item.post.author.name}</span>
                                    {item.post.readingTime > 0 && (
                                      <>
                                        <span>·</span>
                                        <span className="flex items-center gap-0.5">
                                          <Clock className="h-3 w-3" />
                                          {item.post.readingTime} min
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Remove button */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0"
                                  disabled={removingItemId === item.id}
                                  onClick={() => handleRemoveItem(list.id, item.id, item.post.id)}
                                  title="Remove from list"
                                >
                                  {removingItemId === item.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <X className="h-3.5 w-3.5" />
                                  )}
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>
      )}

      {bookmarks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Bookmarked Stories ({bookmarks.length})</h2>
          <div className="space-y-2">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
              >
                {/* Thumbnail */}
                {bookmark.post.featuredImage ? (
                  <img
                    src={bookmark.post.featuredImage}
                    alt={bookmark.post.title}
                    className="h-10 w-14 rounded object-cover shrink-0"
                  />
                ) : (
                  <div className="h-10 w-14 rounded bg-muted flex items-center justify-center shrink-0">
                    <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/post/${bookmark.post.slug}`}
                    className="text-sm font-medium hover:underline line-clamp-1"
                  >
                    {bookmark.post.title}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {bookmark.post.author.name}
                    {bookmark.post.readingTime > 0 && ` · ${bookmark.post.readingTime} min read`}
                  </p>
                </div>

                {/* Add to list dropdown */}
                <DropdownMenu
                  onOpenChange={(open) => {
                    if (open) fetchUserLists();
                    setBookmarkListDropdowns((prev) => ({ ...prev, [bookmark.post.id]: open }));
                  }}
                >
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1.5 shrink-0">
                      <ListPlus className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Add to List</span>
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
                            disabled={addingToList[bookmark.post.id] === list.id}
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddToList(bookmark.post.id, list.id, list.name);
                            }}
                            className="flex items-center justify-between"
                          >
                            <span className="truncate">{list.name}</span>
                            {addedToLists[bookmark.post.id]?.has(list.id) ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            ) : addingToList[bookmark.post.id] === list.id ? (
                              <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
