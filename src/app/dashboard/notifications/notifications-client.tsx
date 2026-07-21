'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Send, Users, Smartphone, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface NotificationStats {
  totalSubscriptions: number;
  uniqueSubscribers: number;
}

interface RecentNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  user: { id: string; name: string; username: string; image: string | null };
}

interface NotificationsClientProps {
  stats: NotificationStats;
  recentNotifications: RecentNotification[];
}

type RecipientType = 'role' | 'all';

export function NotificationsClient({ stats, recentNotifications }: NotificationsClientProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [recipientType, setRecipientType] = useState<RecipientType>('all');
  const [minRole, setMinRole] = useState('READER');
  const [sending, setSending] = useState(false);
  const [sentResult, setSentResult] = useState<{ sent: number; failed: number } | null>(null);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and message are required');
      return;
    }

    setSending(true);
    setSentResult(null);

    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        body: body.trim(),
        type: 'admin_broadcast',
      };

      if (url.trim()) {
        payload.url = url.trim();
      }

      if (recipientType === 'all') {
        payload.minRole = 'READER';
      } else {
        payload.minRole = minRole;
      }

      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSentResult({ sent: data.sent, failed: data.failed });
        toast.success(`Notification sent to ${data.sent} device${data.sent !== 1 ? 's' : ''}`);
        setTitle('');
        setBody('');
        setUrl('');
      } else {
        toast.error(data.error || 'Failed to send notification');
      }
    } catch {
      toast.error('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const roleLabels: Record<string, string> = {
    READER: 'All Readers',
    EDITOR: 'Editors & Above',
    ADMIN: 'Admins Only',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="h-6 w-6" />
          Push Notifications
        </h1>
        <p className="text-muted-foreground mt-1">
          Compose and send push notifications to your subscribers
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{stats.totalSubscriptions}</p>
                <p className="text-sm text-muted-foreground">Active Subscriptions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-bold">{stats.uniqueSubscribers}</p>
                <p className="text-sm text-muted-foreground">Unique Subscribers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compose Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Compose Notification
          </CardTitle>
          <CardDescription>
            Write a push notification to send to your subscribers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="push-title">Title</Label>
            <Input
              id="push-title"
              placeholder="e.g., New Story Published!"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="push-body">Message</Label>
            <Textarea
              id="push-body"
              placeholder="e.g., Check out our latest story about Nairobi's art scene..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">{body.length}/300 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="push-url">Link URL (optional)</Label>
            <Input
              id="push-url"
              placeholder="e.g., /post/my-new-story"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Where users go when they click the notification
            </p>
          </div>

          <div className="space-y-2">
            <Label>Recipients</Label>
            <div className="flex gap-2 mb-2">
              <Button
                variant={recipientType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRecipientType('all')}
              >
                <Users className="h-4 w-4 mr-1" />
                Everyone
              </Button>
              <Button
                variant={recipientType === 'role' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setRecipientType('role')}
              >
                Specific Role
              </Button>
            </div>
            {recipientType === 'role' && (
              <Select value={minRole} onValueChange={setMinRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(roleLabels).map(([role, label]) => (
                    <SelectItem key={role} value={role}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Send Result */}
          {sentResult && (
            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted">
              <div className="flex items-center gap-1.5 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">{sentResult.sent} delivered</span>
              </div>
              {sentResult.failed > 0 && (
                <div className="flex items-center gap-1.5 text-amber-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{sentResult.failed} failed</span>
                </div>
              )}
            </div>
          )}

          <Button onClick={handleSend} disabled={sending || !title.trim() || !body.trim()} className="gap-2">
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Notification
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>Latest notifications delivered to users</CardDescription>
        </CardHeader>
        <CardContent>
          {recentNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No notifications sent yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotifications.slice(0, 20).map((notif) => (
                <div key={notif.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="mt-0.5">
                    <Badge
                      variant={
                        notif.type === 'error' ? 'destructive' :
                        notif.type === 'warning' ? 'outline' :
                        notif.type === 'success' ? 'default' :
                        'secondary'
                      }
                      className="text-[10px]"
                    >
                      {notif.type}
                    </Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{notif.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{notif.message}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>To: {notif.user.name}</span>
                      <span>·</span>
                      <span>{new Date(notif.createdAt).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
