"use client"

import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import {
  FileText,
  MessageSquare,
  Calendar,
  Users,
  Eye,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Rocket,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface DashboardStats {
  totalPosts: number
  publishedPosts: number
  pendingPosts: number
  approvedPosts: number
  draftPosts: number
  totalComments: number
  pendingComments: number
  totalEvents: number
  upcomingEvents: number
  totalUsers: number
  totalViews: number
  recentPosts: { id: string; title: string; slug: string; status: string; createdAt: string; author: { name: string } }[]
  recentComments: { id: string; content: string; createdAt: string; author: { name: string }; post: { title: string } }[]
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const role = (session?.user?.role as string) || "READER"

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats")
      if (!res.ok) throw new Error("Failed to fetch stats")
      return res.json()
    },
  })

  // Fetch flagged content count for moderator dashboard
  const { data: flaggedData } = useQuery<{ counts: { status: string; _count: { id: number } }[] }>({
    queryKey: ["moderator", "flagged-counts"],
    queryFn: async () => {
      const res = await fetch("/api/flagged")
      if (!res.ok) throw new Error("Failed to fetch")
      return res.json()
    },
    enabled: role === "ADMIN",
  })

  const pendingFlaggedCount = flaggedData?.counts?.find((c) => c.status === "PENDING")?._count?.id || 0

  // Build the public site URL for viewing posts (handles subdomain routing)
  const publicSiteUrl = typeof window !== 'undefined' && window.location.hostname.endsWith('.sanaathrumylens.co.ke')
    ? `https://sanaathrumylens.co.ke`
    : ''

  const statCards = () => {
    if (role === "ADMIN") {
      return [
        {
          title: "Pending Comments",
          value: stats?.pendingComments || 0,
          icon: MessageSquare,
          description: "Awaiting review",
          href: "/dashboard/comments?status=PENDING",
          color: "text-violet-600",
          bgColor: "bg-violet-50 dark:bg-violet-950/30",
        },
        {
          title: "Total Comments",
          value: stats?.totalComments || 0,
          icon: CheckCircle2,
          description: "All comments",
          href: "/dashboard/comments",
          color: "text-emerald-600",
          bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
        },
        {
          title: "Published Posts",
          value: stats?.publishedPosts || 0,
          icon: FileText,
          description: "Active content",
          href: "/dashboard/moderation",
          color: "text-amber-600",
          bgColor: "bg-amber-50 dark:bg-amber-950/30",
        },
        {
          title: "Flagged Content",
          value: pendingFlaggedCount,
          icon: Clock,
          description: pendingFlaggedCount > 0 ? "Needs attention" : "All clear",
          href: "/dashboard/flagged",
          color: "text-orange-600",
          bgColor: "bg-orange-50 dark:bg-orange-950/30",
        },
      ]
    }

    const cards = [
      {
        title: "Total Posts",
        value: stats?.totalPosts || 0,
        icon: FileText,
        description: `${stats?.publishedPosts || 0} published`,
        href: "/dashboard/posts",
        color: "text-amber-600",
        bgColor: "bg-amber-50 dark:bg-amber-950/30",
      },
      {
        title: "Pending Reviews",
        value: stats?.pendingPosts || 0,
        icon: Clock,
        description: "Awaiting review",
        href: "/dashboard/posts?status=PENDING_REVIEW",
        color: "text-orange-600",
        bgColor: "bg-orange-50 dark:bg-orange-950/30",
      },
      {
        title: "Approved",
        value: stats?.approvedPosts || 0,
        icon: CheckCircle2,
        description: stats?.approvedPosts ? "Ready to publish" : "None pending",
        href: "/dashboard/posts?status=APPROVED",
        color: "text-emerald-600",
        bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      },
      {
        title: "Comments",
        value: stats?.totalComments || 0,
        icon: MessageSquare,
        description: `${stats?.pendingComments || 0} pending`,
        href: "/dashboard/comments",
        color: "text-violet-600",
        bgColor: "bg-violet-50 dark:bg-violet-950/30",
      },
    ]

    if (role === "ADMIN") {
      cards.push({
        title: "Users",
        value: stats?.totalUsers || 0,
        icon: Users,
        description: "Registered users",
        href: "/dashboard/users",
        color: "text-violet-600",
        bgColor: "bg-violet-50 dark:bg-violet-950/30",
      })
    }

    return cards
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      PUBLISHED: { label: "Published", variant: "default" },
      DRAFT: { label: "Draft", variant: "secondary" },
      PENDING_REVIEW: { label: "Pending", variant: "outline" },
      APPROVED: { label: "Approved", variant: "default" },
      SCHEDULED: { label: "Scheduled", variant: "outline" },
      REJECTED: { label: "Rejected", variant: "destructive" },
      ARCHIVED: { label: "Archived", variant: "secondary" },
    }
    const info = variants[status] || { label: status, variant: "secondary" as const }
    return <Badge variant={info.variant}>{info.label}</Badge>
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {session?.user?.name || "User"}
          </p>
        </div>
        {(role === "ADMIN" || role === "EDITOR") && (
          <div className="flex gap-2">
            <Link href="/dashboard/posts/new">
              <Button className="gap-2">
                <Plus className="size-4" />
                New Post
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: statCards().length }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 sm:h-8 w-12 sm:w-20 mt-2 sm:mt-3" />
                  <Skeleton className="h-3 w-16 sm:w-24 mt-1 sm:mt-2" />
                </CardContent>
              </Card>
            ))
          : statCards().map((card) => (
              <Link key={card.title} href={card.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-3 sm:p-6">
                    <div className={`${card.bgColor} p-1.5 sm:p-2 rounded-lg w-fit`}>
                      <card.icon className={`size-4 sm:size-5 ${card.color}`} />
                    </div>
                    <div className="mt-2 sm:mt-3">
                      <p className="text-xl sm:text-2xl font-bold">{card.value}</p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">{card.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
      </div>

      {/* Quick Actions */}
      {(role === "ADMIN" || role === "EDITOR") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/dashboard/posts?status=PENDING_REVIEW">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-amber-500">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="size-5 text-amber-500" />
                <div>
                  <p className="font-medium text-sm">Review Pending Posts</p>
                  <p className="text-xs text-muted-foreground">{stats?.pendingPosts || 0} posts awaiting review</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          {(stats?.approvedPosts || 0) > 0 && (
            <Link href="/dashboard/posts?status=APPROVED">
              <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-emerald-500">
                <CardContent className="p-4 flex items-center gap-3">
                  <Rocket className="size-5 text-emerald-500" />
                  <div>
                    <p className="font-medium text-sm">Publish Approved Posts</p>
                    <p className="text-xs text-muted-foreground">{stats?.approvedPosts || 0} approved &amp; ready to go live</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
          <Link href="/dashboard/comments?status=PENDING">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-violet-500">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="size-5 text-violet-500" />
                <div>
                  <p className="font-medium text-sm">Moderate Comments</p>
                  <p className="text-xs text-muted-foreground">{stats?.pendingComments || 0} comments pending</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/posts/new">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-orange-500">
              <CardContent className="p-4 flex items-center gap-3">
                <Plus className="size-5 text-orange-500" />
                <div>
                  <p className="font-medium text-sm">Create New Content</p>
                  <p className="text-xs text-muted-foreground">Write a post or create an event</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Admin Quick Actions */}
      {role === "ADMIN" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/dashboard/comments?status=PENDING">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-violet-500">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="size-5 text-violet-500" />
                <div>
                  <p className="font-medium text-sm">Review Pending Comments</p>
                  <p className="text-xs text-muted-foreground">{stats?.pendingComments || 0} comments awaiting moderation</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/flagged">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-amber-500">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="size-5 text-amber-500" />
                <div>
                  <p className="font-medium text-sm">Flagged Content</p>
                  <p className="text-xs text-muted-foreground">Review content reported by the community</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/comments">
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-emerald-500">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500" />
                <div>
                  <p className="font-medium text-sm">All Comments</p>
                  <p className="text-xs text-muted-foreground">{stats?.totalComments || 0} total comments</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Posts</CardTitle>
            <CardDescription>Latest published and draft posts</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            ) : stats?.recentPosts && stats.recentPosts.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                {stats.recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-center justify-between py-1.5 hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors gap-2"
                  >
                    <Link
                      href={role === "ADMIN" ? `${publicSiteUrl}/post/${post.slug}` : `/dashboard/posts/${post.id}/edit`}
                      target={role === "ADMIN" ? "_blank" : undefined}
                      rel={role === "ADMIN" ? "noopener noreferrer" : undefined}
                      className="flex-1 min-w-0"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{post.title}</p>
                        <p className="text-xs text-muted-foreground">
                          by {post.author.name} · <span className="hidden sm:inline">{new Date(post.createdAt).toLocaleDateString()}</span><span className="sm:hidden">{new Date(post.createdAt).toLocaleDateString('en-KE', {month:'short', day:'numeric'})}</span>
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {getStatusBadge(post.status)}
                      {(role === "ADMIN" || role === "EDITOR") && (
                        <a href={`${publicSiteUrl}/post/${post.slug}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No posts yet</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Comments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Comments</CardTitle>
            <CardDescription>Latest reader comments</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            ) : stats?.recentComments && stats.recentComments.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {stats.recentComments.map((comment) => (
                  <div key={comment.id} className="py-2 border-b last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{comment.author.name}</span>
                      <span className="text-xs text-muted-foreground">
                        on {comment.post.title}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {comment.content}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No comments yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
