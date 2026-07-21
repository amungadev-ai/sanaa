'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeDollarSign, Check, X, RefreshCw, ExternalLink, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import Link from 'next/link';

interface SponsoredPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  categories: {
    category: { id: string; name: string; slug: string };
  }[];
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string }> = {
  SPONSORED_REVIEW: { label: 'Pending Review', variant: 'outline', color: 'text-amber-600' },
  PENDING_REVIEW: { label: 'Pending Review', variant: 'outline', color: 'text-amber-600' },
  APPROVED: { label: 'Approved', variant: 'default', color: 'text-emerald-600' },
  REJECTED: { label: 'Rejected', variant: 'destructive', color: 'text-red-600' },
  PUBLISHED: { label: 'Published', variant: 'default', color: 'text-primary' },
  DRAFT: { label: 'Draft', variant: 'secondary', color: 'text-muted-foreground' },
};

export default function SponsoredDashboardPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sponsored-posts', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      const res = await fetch(`/api/sponsored${params}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const handleAction = async (postId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/posts/${postId}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          rejectedReason: action === 'reject' ? 'Does not meet our editorial guidelines for sponsored content.' : undefined,
        }),
      });

      if (res.ok) {
        toast.success(`Post ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
        queryClient.invalidateQueries({ queryKey: ['sponsored-posts'] });
      } else {
        toast.error(`Failed to ${action} post`);
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const handlePublish = async (postId: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PUBLISHED', publishedAt: new Date().toISOString() }),
      });

      if (res.ok) {
        toast.success('Post published successfully');
        queryClient.invalidateQueries({ queryKey: ['sponsored-posts'] });
      } else {
        toast.error('Failed to publish post');
      }
    } catch {
      toast.error('Something went wrong');
    }
  };

  const posts = data?.posts || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BadgeDollarSign className="h-6 w-6 text-primary" />
            Sponsored Submissions
          </h1>
          <p className="text-muted-foreground">Review and manage sponsored content submissions</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="SPONSORED_REVIEW">Pending Review</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="PUBLISHED">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-5 bg-muted rounded w-1/3 mb-3" />
                <div className="h-4 bg-muted rounded w-1/2 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BadgeDollarSign className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No sponsored submissions found</p>
            <p className="text-sm text-muted-foreground mt-1">
              Submissions from the advertise page will appear here
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post: SponsoredPost) => {
            const statusInfo = statusConfig[post.status] || { label: post.status, variant: 'secondary' as const, color: 'text-muted-foreground' };
            const isExpanded = expandedId === post.id;

            return (
              <Card key={post.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : post.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium truncate">{post.title}</h3>
                        <Badge variant={statusInfo.variant} className="shrink-0">
                          {statusInfo.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{post.author.name}</span>
                        <span>·</span>
                        <span>{post.author.email}</span>
                        <span>·</span>
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
                  </div>

                  {isExpanded && (
                    <>
                      <Separator />
                      <div className="p-4 space-y-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Content Preview</h4>
                          <p className="text-sm text-muted-foreground line-clamp-4">
                            {post.content.slice(0, 500)}...
                          </p>
                        </div>

                        {post.categories.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Categories:</span>
                            {post.categories.map((c) => (
                              <Badge key={c.category.id} variant="outline" className="text-xs">
                                {c.category.name}
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          {(post.status === 'SPONSORED_REVIEW' || post.status === 'PENDING_REVIEW') && (
                            <>
                              <Button
                                size="sm"
                                className="gap-1"
                                onClick={() => handleAction(post.id, 'approve')}
                              >
                                <Check className="h-3.5 w-3.5" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                className="gap-1"
                                onClick={() => handleAction(post.id, 'reject')}
                              >
                                <X className="h-3.5 w-3.5" />
                                Reject
                              </Button>
                            </>
                          )}
                          {post.status === 'APPROVED' && (
                            <Button
                              size="sm"
                              className="gap-1"
                              onClick={() => handlePublish(post.id)}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Publish
                            </Button>
                          )}
                          {post.status === 'REJECTED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1"
                              onClick={() => handleAction(post.id, 'approve')}
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Re-consider
                            </Button>
                          )}
                          <Link href={`/dashboard/posts/${post.id}/edit`}>
                            <Button size="sm" variant="outline" className="gap-1">
                              Edit Post
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
