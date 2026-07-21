"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Shield,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Flag,
  FileText,
  Eye,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

interface PendingComment {
  id: string
  content: string
  createdAt: string
  author: { id: string; name: string; image: string | null }
  post: { id: string; title: string; slug: string }
}

interface PostOverview {
  id: string
  title: string
  slug: string
  status: string
  views: number
  createdAt: string
  author: { id: string; name: string; image: string | null }
  _count: { comments: number; bookmarks: number }
}

export default function ModerationPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()

  const { data: pendingComments, isLoading: loadingComments } = useQuery<PendingComment[]>({
    queryKey: ["moderation", "pending-comments"],
    queryFn: async () => {
      const res = await fetch("/api/comments?status=PENDING&limit=20")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      return data.comments || []
    },
  })

  const { data: recentComments, isLoading: loadingRecent } = useQuery<PendingComment[]>({
    queryKey: ["moderation", "recent-comments"],
    queryFn: async () => {
      const res = await fetch("/api/comments?limit=10")
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      return data.comments || []
    },
  })

  const { data: flaggedData } = useQuery<{ counts: { status: string; _count: { id: number } }[] }>({
    queryKey: ["moderation", "flagged-counts"],
    queryFn: async () => {
      const res = await fetch("/api/flagged")
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    },
  })

  const pendingFlaggedCount = flaggedData?.counts?.find((c) => c.status === "PENDING")?._count?.id || 0

  // Fetch recent posts for overview
  const { data: postsData, isLoading: loadingPosts } = useQuery<{ posts: PostOverview[] }>({
    queryKey: ["moderation", "recent-posts"],
    queryFn: async () => {
      const res = await fetch("/api/posts?limit=5&status=PUBLISHED")
      if (!res.ok) throw new Error("Failed to fetch posts")
      return res.json()
    },
  })

  const moderateMutation = useMutation({
    mutationFn: async ({ commentId, action }: { commentId: string; action: "APPROVE" | "REJECT" }) => {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action === "APPROVE" ? "APPROVED" : "REJECTED" }),
      })
      if (!res.ok) throw new Error("Failed to moderate")
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["moderation"] })
      toast.success(variables.action === "APPROVE" ? "Comment approved" : "Comment rejected")
    },
    onError: () => toast.error("Failed to moderate comment"),
  })

  const getPostStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      PUBLISHED: { label: "Published", variant: "default" },
      DRAFT: { label: "Draft", variant: "secondary" },
      PENDING_REVIEW: { label: "Pending", variant: "outline" },
      REJECTED: { label: "Rejected", variant: "destructive" },
    }
    const info = map[status] || { label: status, variant: "secondary" as const }
    return <Badge variant={info.variant}>{info.label}</Badge>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6 text-violet-500" />
          Moderation Hub
        </h1>
        <p className="text-muted-foreground mt-1">
          Review and moderate community content to keep conversations respectful and safe
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="bg-violet-50 dark:bg-violet-950/30 p-1.5 sm:p-2 rounded-lg">
                <Clock className="size-4 sm:size-5 text-violet-600" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-lg sm:text-2xl font-bold">{pendingComments?.length || 0}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-1.5 sm:p-2 rounded-lg">
                <CheckCircle2 className="size-4 sm:size-5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-lg sm:text-2xl font-bold">{recentComments?.length || 0}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Recent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="bg-amber-50 dark:bg-amber-950/30 p-1.5 sm:p-2 rounded-lg">
                <Flag className="size-4 sm:size-5 text-amber-600" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-lg sm:text-2xl font-bold">{pendingFlaggedCount}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Flagged</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="bg-sky-50 dark:bg-sky-950/30 p-1.5 sm:p-2 rounded-lg">
                <FileText className="size-4 sm:size-5 text-sky-600" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-lg sm:text-2xl font-bold">{postsData?.posts?.length || 0}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Posts</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Comments Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Pending Comments
          </CardTitle>
          <CardDescription>
            Review and approve or reject comments before they appear on the site
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingComments ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2 p-4 border rounded-lg">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : pendingComments && pendingComments.length > 0 ? (
            <div className="space-y-4">
              {pendingComments.map((comment) => (
                <div key={comment.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar className="size-6">
                          <AvatarImage src={comment.author.image || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {comment.author.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{comment.author.name}</span>
                        <Badge variant="outline" className="text-[10px]">Pending</Badge>
                        <span className="text-xs text-muted-foreground">
                          on <a href={typeof window !== 'undefined' && window.location.hostname.endsWith('.sanaathrumylens.co.ke') ? `https://sanaathrumylens.co.ke/post/${comment.post.slug}` : `/post/${comment.post.slug}`} className="hover:text-primary transition-colors" target="_blank" rel="noopener noreferrer">{comment.post.title}</a>
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">{comment.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(comment.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs h-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        disabled={moderateMutation.isPending}
                        onClick={() => moderateMutation.mutate({ commentId: comment.id, action: "APPROVE" })}
                      >
                        <CheckCircle2 className="size-3" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 text-xs h-7 text-destructive hover:bg-destructive/10"
                        disabled={moderateMutation.isPending}
                        onClick={() => moderateMutation.mutate({ commentId: comment.id, action: "REJECT" })}
                      >
                        <XCircle className="size-3" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500/50 mb-3" />
              <p className="font-medium text-muted-foreground">All caught up!</p>
              <p className="text-sm text-muted-foreground mt-1">No pending comments to review</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Posts Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Posts Overview
              </CardTitle>
              <CardDescription className="mt-1">
                Monitor published content — click to view on site, flag problematic posts
              </CardDescription>
            </div>
            <Link href="/dashboard/posts">
              <Button variant="outline" size="sm" className="gap-1.5">
                View All Posts
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loadingPosts ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2 p-4 border rounded-lg">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          ) : postsData?.posts && postsData.posts.length > 0 ? (
            <div className="space-y-3">
              {postsData.posts.map((post) => (
                <div key={post.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getPostStatusBadge(post.status)}
                        <span className="text-xs text-muted-foreground">
                          by {post.author.name}
                        </span>
                      </div>
                      <a
                        href={typeof window !== 'undefined' && window.location.hostname.endsWith('.sanaathrumylens.co.ke') ? `https://sanaathrumylens.co.ke/post/${post.slug}` : `/post/${post.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:text-primary transition-colors inline-flex items-center gap-1"
                      >
                        {post.title}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {post.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {post._count.comments} comments
                        </span>
                        <span>
                          {new Date(post.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a href={typeof window !== 'undefined' && window.location.hostname.endsWith('.sanaathrumylens.co.ke') ? `https://sanaathrumylens.co.ke/post/${post.slug}` : `/post/${post.slug}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-medium text-muted-foreground">No published posts</p>
              <p className="text-sm text-muted-foreground mt-1">Posts will appear here once published</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flagged Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-amber-500" />
            Flagged Content
          </CardTitle>
          <CardDescription>
            {pendingFlaggedCount > 0
              ? `${pendingFlaggedCount} item${pendingFlaggedCount > 1 ? 's' : ''} awaiting your review`
              : "Flagged content is reviewed on the dedicated Flagged Content page"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingFlaggedCount > 0 ? (
            <div className="text-center py-4">
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 mb-4">
                <AlertTriangle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                <p className="font-medium text-amber-700 dark:text-amber-400">
                  {pendingFlaggedCount} item{pendingFlaggedCount > 1 ? 's' : ''} flagged by the community
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please review these reports and take appropriate action
                </p>
              </div>
              <Link href="/dashboard/flagged">
                <Button className="gap-1.5">
                  <Flag className="h-4 w-4" />
                  Review Flagged Content
                </Button>
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-medium text-muted-foreground">No flagged content</p>
              <p className="text-sm text-muted-foreground mt-1">
                When readers flag comments or posts, they&apos;ll appear on the Flagged Content page for your review
              </p>
              <Link href="/dashboard/flagged">
                <Button variant="outline" className="mt-4 gap-1.5">
                  <Flag className="h-4 w-4" />
                  View Flagged Content
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Community Guidelines Reminder */}
      <Card className="border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-950/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-violet-500" />
            Moderation Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>As a moderator, you help keep the Sanaa community safe and respectful. When reviewing content:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Approve</strong> comments that are respectful, on-topic, and add value to the conversation</li>
            <li><strong>Reject</strong> comments that contain hate speech, personal attacks, spam, or are off-topic</li>
            <li><strong>Flag posts</strong> that violate community guidelines by using the Report button on the article page</li>
            <li>Be fair and consistent — everyone deserves a voice as long as it&apos;s respectful</li>
            <li>When in doubt, approve — the community can flag inappropriate content later</li>
            <li>Review flagged content promptly to maintain a safe community environment</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
