'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Mail, Bold, Italic, Heading2, Link2, List, Save, Send, Clock, Eye, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    preheader: '',
    content: '',
  });

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const res = await fetch(`/api/campaigns/${id}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (campaign) {
      setFormData({
        subject: campaign.subject || '',
        preheader: campaign.preheader || '',
        content: campaign.content || '',
      });
    }
  }, [campaign]);

  const { data: subscriberData } = useQuery({
    queryKey: ['subscriber-count'],
    queryFn: async () => {
      const res = await fetch('/api/newsletter');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const activeSubscribers = subscriberData?.subscribers?.filter((s: { status: string }) => s.status === 'ACTIVE').length || 0;

  const insertFormatting = (tag: string) => {
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);

    let replacement = '';
    switch (tag) {
      case 'bold':
        replacement = `<strong>${selectedText || 'Bold text'}</strong>`;
        break;
      case 'italic':
        replacement = `<em>${selectedText || 'Italic text'}</em>`;
        break;
      case 'heading':
        replacement = `<h2 style="font-size:20px;font-weight:bold;margin:16px 0 8px;">${selectedText || 'Heading'}</h2>`;
        break;
      case 'link':
        replacement = `<a href="https://example.com" style="color:#f97316;">${selectedText || 'Link text'}</a>`;
        break;
      case 'list':
        replacement = `<ul style="padding-left:20px;"><li>${selectedText || 'List item'}</li></ul>`;
        break;
    }

    const newContent = formData.content.substring(0, start) + replacement + formData.content.substring(end);
    setFormData((prev) => ({ ...prev, content: newContent }));
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status: 'DRAFT' }),
      });
      if (res.ok) {
        toast.success('Draft saved');
        router.push('/dashboard/campaigns');
      } else {
        toast.error('Failed to save');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchedule = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'SCHEDULED',
          scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        }),
      });
      if (res.ok) {
        toast.success('Campaign scheduled');
        router.push('/dashboard/campaigns');
      } else {
        toast.error('Failed to schedule');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendNow = async () => {
    if (!confirm('Send this campaign now? This cannot be undone.')) return;
    setIsSaving(true);
    try {
      const sendRes = await fetch(`/api/campaigns/${id}/send`, { method: 'POST' });
      if (sendRes.ok) {
        toast.success('Campaign sent!');
        router.push('/dashboard/campaigns');
      } else {
        toast.error('Failed to send');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this campaign?')) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Campaign deleted');
        router.push('/dashboard/campaigns');
      } else {
        toast.error('Failed to delete');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-48 animate-pulse" />
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  if (campaign?.status === 'SENT') {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campaign Already Sent</h1>
          <p className="text-muted-foreground">This campaign has already been sent and cannot be edited.</p>
        </div>
        <Card>
          <CardContent className="p-6">
            <h3 className="font-medium mb-2">{campaign.subject}</h3>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>Sent to {campaign.recipientCount} subscribers</span>
              <span>{campaign.openCount} opens</span>
              <span>{campaign.clickCount} clicks</span>
            </div>
          </CardContent>
        </Card>
        <div className="flex gap-2">
          <a href={`/api/campaigns/${id}/preview`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          </a>
          <Button variant="outline" onClick={() => router.push('/dashboard/campaigns')}>
            Back to Campaigns
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            Edit Campaign
          </h1>
          <p className="text-muted-foreground">
            {campaign?.status === 'SCHEDULED' ? 'Scheduled campaign' : 'Edit your email campaign'}
          </p>
        </div>
        <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline" className="text-sm">
          {activeSubscribers} active subscribers
        </Badge>
        {campaign?.status && (
          <Badge variant={campaign.status === 'SCHEDULED' ? 'outline' : 'secondary'}>
            {campaign.status}
          </Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject Line *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
              placeholder="Enter email subject line..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="preheader">Preheader Text</Label>
            <Input
              id="preheader"
              value={formData.preheader}
              onChange={(e) => setFormData((prev) => ({ ...prev, preheader: e.target.value }))}
              placeholder="Preview text shown in email clients..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content-editor">Email Content *</Label>
            <div className="flex items-center gap-1 p-2 border rounded-t-lg bg-muted/30">
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormatting('bold')} title="Bold">
                <Bold className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormatting('italic')} title="Italic">
                <Italic className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormatting('heading')} title="Heading">
                <Heading2 className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormatting('link')} title="Link">
                <Link2 className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => insertFormatting('list')} title="List">
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              id="content-editor"
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              rows={12}
              className="rounded-t-none font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <Button variant="outline" onClick={() => router.push('/dashboard/campaigns')}>
          Cancel
        </Button>
        <div className="flex items-center gap-2">
          <a href={`/api/campaigns/${id}/preview`} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </Button>
          </a>
          <Button variant="outline" className="gap-2" onClick={handleSaveDraft} disabled={isSaving}>
            <Save className="h-4 w-4" />
            Save Draft
          </Button>
          <Button variant="outline" className="gap-2" onClick={handleSchedule} disabled={isSaving}>
            <Clock className="h-4 w-4" />
            Schedule
          </Button>
          <Button className="gap-2" onClick={handleSendNow} disabled={isSaving}>
            <Send className="h-4 w-4" />
            Send Now
          </Button>
        </div>
      </div>
    </div>
  );
}
