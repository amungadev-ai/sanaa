'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bookmark, MessageCircle, Settings, Trash2, ExternalLink, Mail, Bell, Monitor, User as UserIcon, BookOpen, Globe, Lock, Plus } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ReaderDashboardClientProps {
  user: {
    name: string;
    email: string;
    image: string | null;
  };
  bookmarks: {
    id: string;
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
  }[];
  comments: {
    id: string;
    content: string;
    status: string;
    createdAt: string;
    post: { id: string; title: string; slug: string };
  }[];
  readingLists: {
    id: string;
    name: string;
    description: string | null;
    isPublic: boolean;
    slug: string;
    updatedAt: string;
    items: {
      post: { id: string; title: string; slug: string; featuredImage: string | null; readingTime: number; author: { id: string; name: string } };
    }[];
    _count: { items: number };
  }[];
}

export function ReaderDashboardClient({ user, bookmarks, comments, readingLists: initialLists }: ReaderDashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'reading-lists' | 'comments' | 'settings'>('bookmarks');
  const [bookmarkList, setBookmarkList] = useState(bookmarks);
  const [lists, setLists] = useState(initialLists);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [creatingList, setCreatingList] = useState(false);
  const { theme, setTheme } = useTheme();

  // Settings state — persisted in localStorage (lazy init reads from storage on client)
  const [settings, setSettings] = useState(() => {
    if (typeof window === 'undefined') {
      return { receiveNewsletter: true, emailNotifications: true, browserNotifications: false };
    }
    const storedNewsletter = localStorage.getItem('reader-receive-newsletter');
    const storedEmailNotif = localStorage.getItem('reader-email-notifications');
    const storedBrowserNotif = localStorage.getItem('reader-browser-notifications');
    return {
      receiveNewsletter: storedNewsletter !== null ? storedNewsletter === 'true' : true,
      emailNotifications: storedEmailNotif !== null ? storedEmailNotif === 'true' : true,
      browserNotifications: storedBrowserNotif !== null ? storedBrowserNotif === 'true' : false,
    };
  });

  const handleToggleNewsletter = (checked: boolean) => {
    setSettings((prev) => ({ ...prev, receiveNewsletter: checked }));
    localStorage.setItem('reader-receive-newsletter', String(checked));
    toast.success(checked ? 'Newsletter subscription enabled' : 'Newsletter subscription disabled');
  };

  const handleToggleEmailNotif = (checked: boolean) => {
    setSettings((prev) => ({ ...prev, emailNotifications: checked }));
    localStorage.setItem('reader-email-notifications', String(checked));
    toast.success(checked ? 'Email notifications enabled' : 'Email notifications disabled');
  };

  const handleToggleBrowserNotif = (checked: boolean) => {
    setSettings((prev) => ({ ...prev, browserNotifications: checked }));
    localStorage.setItem('reader-browser-notifications', String(checked));
    if (checked && typeof window !== 'undefined' && 'Notification' in window) {
      Notification.requestPermission();
    }
    toast.success(checked ? 'Browser notifications enabled' : 'Browser notifications disabled');
  };

  const handleDarkMode = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  const handleRemoveBookmark = async (postId: string) => {
    try {
      const res = await fetch(`/api/bookmarks/${postId}`, { method: 'DELETE' });
      if (res.ok) {
        setBookmarkList((prev) => prev.filter((b) => b.post.id !== postId));
        toast.success('Bookmark removed');
      }
    } catch {
      toast.error('Failed to remove bookmark');
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    setCreatingList(true);
    try {
      const res = await fetch('/api/reading-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setLists((prev) => [
          { ...data.list, items: [], _count: { items: 0 } },
          ...prev,
        ]);
        setNewListName('');
        setShowNewList(false);
        toast.success('Reading list created');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to create list');
      }
    } catch {
      toast.error('Failed to create list');
    } finally {
      setCreatingList(false);
    }
  };

  const handleDeleteList = async (listId: string) => {
    try {
      const res = await fetch(`/api/reading-lists/${listId}`, { method: 'DELETE' });
      if (res.ok) {
        setLists((prev) => prev.filter((l) => l.id !== listId));
        toast.success('Reading list deleted');
      }
    } catch {
      toast.error('Failed to delete list');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* User Profile Header */}
      <div className="flex items-center gap-4 mb-8">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.image || undefined} />
          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-serif text-2xl font-bold">{user.name}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b overflow-x-auto">
        {([
          { key: 'bookmarks' as const, label: 'Bookmarks', icon: Bookmark },
          { key: 'reading-lists' as const, label: 'Reading Lists', icon: BookOpen },
          { key: 'comments' as const, label: 'Comments', icon: MessageCircle },
          { key: 'settings' as const, label: 'Settings', icon: Settings },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === key
                ? 'text-primary border-primary'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'bookmarks' && (
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold">Your Bookmarks ({bookmarkList.length})</h2>
          {bookmarkList.length === 0 ? (
            <div className="text-center py-12">
              <Bookmark className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No bookmarks yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Save stories to read later by clicking the bookmark icon
              </p>
              <Link href="/">
                <Button variant="outline" className="mt-4">Browse Stories</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {bookmarkList.map((bookmark) => {
                const post = bookmark.post;
                const primaryCategory = post.categories[0]?.category;
                return (
                  <div
                    key={bookmark.id}
                    className="flex items-start gap-4 p-4 border rounded-lg hover:bg-accent/30 transition-colors"
                  >
                    {post.featuredImage && (
                      <img
                        src={post.featuredImage}
                        alt=""
                        className="w-20 h-14 object-cover rounded-md shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <Link href={`/post/${post.slug}`} className="group">
                        <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
                          {post.title}
                        </h3>
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        {primaryCategory && (
                          <Badge
                            className="text-[10px] h-4"
                            style={{
                              backgroundColor: primaryCategory.color || undefined,
                              color: '#fff',
                              border: 'none',
                            }}
                          >
                            {primaryCategory.name}
                          </Badge>
                        )}
                        <span>{post.readingTime} min read</span>
                        <span>·</span>
                        <span>{post.author.name}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveBookmark(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'reading-lists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold">Your Reading Lists ({lists.length})</h2>
            <Button onClick={() => setShowNewList(true)} size="sm" className="gap-1">
              <Plus className="h-4 w-4" />
              New List
            </Button>
          </div>

          {showNewList && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Input
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="List name..."
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
                    disabled={creatingList}
                  />
                  <Button onClick={handleCreateList} size="sm" disabled={creatingList}>
                    {creatingList ? 'Creating...' : 'Create'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowNewList(false); setNewListName(''); }}
                    disabled={creatingList}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {lists.length === 0 && !showNewList ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No reading lists yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create lists to organize your saved stories by topic, mood, or any way you like
              </p>
              <Button onClick={() => setShowNewList(true)} className="mt-4 gap-1">
                <Plus className="h-4 w-4" />
                Create Your First List
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {lists.map((list) => (
                <Card key={list.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium line-clamp-1">{list.name}</h3>
                          <Badge variant="outline" className="text-[10px] h-5 gap-1 shrink-0">
                            {list.isPublic ? (
                              <><Globe className="h-3 w-3" /> Public</>
                            ) : (
                              <><Lock className="h-3 w-3" /> Private</>
                            )}
                          </Badge>
                        </div>
                        {list.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{list.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{list._count.items} {list._count.items === 1 ? 'story' : 'stories'}</span>
                          <span>·</span>
                          <span>Updated {new Date(list.updatedAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        {/* Preview thumbnails */}
                        {list.items.length > 0 && (
                          <div className="flex gap-2 mt-3">
                            {list.items.map((item) => (
                              <Link key={item.post.id} href={`/post/${item.post.slug}`}>
                                {item.post.featuredImage ? (
                                  <img
                                    src={item.post.featuredImage}
                                    alt={item.post.title}
                                    className="w-12 h-12 rounded object-cover hover:opacity-80 transition-opacity"
                                  />
                                ) : (
                                  <div className="w-12 h-12 rounded bg-muted flex items-center justify-center">
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                              </Link>
                            ))}
                            {list._count.items > 3 && (
                              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                                +{list._count.items - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Link href={`/list/${list.slug}`}>
                          <Button variant="ghost" size="sm" className="text-xs gap-1">
                            <ExternalLink className="h-3 w-3" />
                            View
                          </Button>
                        </Link>
                        <Link href="/dashboard/reading-lists">
                          <Button variant="ghost" size="sm" className="text-xs gap-1">
                            Manage
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteList(list.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center">
            For full list management, visit{' '}
            <Link href="/dashboard/reading-lists" className="text-primary hover:underline">
              Reading Lists
            </Link>
          </p>
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-bold">Your Comments ({comments.length})</h2>
          {comments.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No comments yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Join the conversation on our stories
              </p>
              <Link href="/">
                <Button variant="outline" className="mt-4">Browse Stories</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Link
                      href={`/post/${comment.post.slug}`}
                      className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1"
                    >
                      {comment.post.title}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                    <Badge
                      variant={comment.status === 'APPROVED' ? 'default' : 'outline'}
                      className="text-[10px]"
                    >
                      {comment.status.toLowerCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{comment.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(comment.createdAt).toLocaleDateString('en-KE', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Newsletter Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <CardTitle className="font-serif text-lg">Newsletter Preferences</CardTitle>
              </div>
              <CardDescription>Manage your newsletter subscription</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="newsletter-toggle">Receive Newsletter</Label>
                  <p className="text-sm text-muted-foreground">
                    Get our latest stories and updates delivered to your inbox
                  </p>
                </div>
                <Switch
                  id="newsletter-toggle"
                  checked={settings.receiveNewsletter}
                  onCheckedChange={handleToggleNewsletter}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle className="font-serif text-lg">Notification Preferences</CardTitle>
              </div>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notif-toggle">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for new comments and replies
                  </p>
                </div>
                <Switch
                  id="email-notif-toggle"
                  checked={settings.emailNotifications}
                  onCheckedChange={handleToggleEmailNotif}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="browser-notif-toggle">Browser Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get push notifications in your browser
                  </p>
                </div>
                <Switch
                  id="browser-notif-toggle"
                  checked={settings.browserNotifications}
                  onCheckedChange={handleToggleBrowserNotif}
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Preferences */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-primary" />
                <CardTitle className="font-serif text-lg">Display Preferences</CardTitle>
              </div>
              <CardDescription>Customize your viewing experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode-toggle">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark themes
                  </p>
                </div>
                <Switch
                  id="dark-mode-toggle"
                  checked={theme === 'dark'}
                  onCheckedChange={handleDarkMode}
                />
              </div>
            </CardContent>
          </Card>

          {/* Profile Section (Read-Only) */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" />
                <CardTitle className="font-serif text-lg">Profile Information</CardTitle>
              </div>
              <CardDescription>Your current profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  value={user.name}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input
                  id="profile-email"
                  value={user.email}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-bio">Bio</Label>
                <Textarea
                  id="profile-bio"
                  value="No bio yet"
                  readOnly
                  className="bg-muted cursor-not-allowed resize-none"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Profile editing will be available in a future update.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
