"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "next/link"
import {
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flag,
  MessageSquare,
  FileText,
  ExternalLink,
  Ban,
  Eye,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface FlaggedItem {
  id: string
  contentType: string
  contentId: string
  reason: string
  description: string | null
  status: string
  createdAt: string
  reviewedAt: string | null
  reviewNotes: string | null
  reporter: { id: string; name: string; email: string; image: string | null }
  reviewedBy: { id: string; name: string } | null
  contentData: Record<string, unknown> | null
}

interface FlaggedResponse {
  flags: FlaggedItem[]
  counts: { status: string; _count: { id: number } }[]
}

const REASON_COLORS: Record<string, string> = {
  SPAM: "bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
  HARASSMENT: "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  HATE_SPEECH: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300",
  MISINFORMATION: "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  INAPPROPRIATE: "bg-purple-100 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
  OTHER: "bg-slate-100 text-slate-700 dark:bg-slate-950/30 dark:text-slate-400",
}

const REASON_LABELS: Record<string, string> = {
  SPAM: "Spam",
  HARASSMENT: "Harassment",
  HATE_SPEECH: "Hate Speech",
  MISINFORMATION: "Misinformation",
  INAPPROPRIATE: "Inappropriate",
  OTHER: "Other",
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING: { label: "Pending", variant: "outline" },
  REVIEWED: { label: "Reviewed", variant: "secondary" },
  DISMISSED: { label: "Dismissed", variant: "secondary" },
  ACTION_TAKEN: { label: "Action Taken", variant: "default" },
}

export default function FlaggedContentPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState("ALL")

  const { data: flaggedData, isLoading } = useQuery<FlaggedResponse>({
    queryKey: ["flagged", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter)
      const res = await fetch(`/api/flagged?${params}`)
      if (!res.ok) throw new Error("Failed to fetch flagged content")
      return res.json()
    },
  })

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, reviewNotes, takeAction }: { id: string; status: string; reviewNotes?: string; takeAction?: boolean }) => {
      const res = await fetch(`/api/flagged/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewNotes, takeAction }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to review flag")
      }
      return res.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["flagged"] })
      if (variables.status === "ACTION_TAKEN") {
        toast.success("Action taken and content rejected")
      } else if (variables.status === "DISMISSED") {
        toast.success("Flag dismissed")
      } else if (variables.status === "REVIEWED") {
        toast.success("Flag marked as reviewed")
      }
    },
    onError: (error) => toast.error(error.message || "Failed to review flag"),
  })

  const flags = flaggedData?.flags || []
  const counts = flaggedData?.counts || []

  const pendingCount = counts.find((c) => c.status === "PENDING")?._count.id || 0
  const dismissedCount = counts.find((c) => c.status === "DISMISSED")?._count.id || 0
  const actionTakenCount = counts.find((c) => c.status === "ACTION_TAKEN")?._count.id || 0

  const getContentAuthor = (flag: FlaggedItem) => {
    if (!flag.contentData) return null
    const data = flag.contentData as Record<string, unknown>
    const author = data.author as { id: string; name: string; image: string | null } | null
    return author
  }

  const getCommentContent = (flag: FlaggedItem) => {
    if (!flag.contentData || flag.contentType !== "COMMENT") return null
    const data = flag.contentData as Record<string, unknown>
    return {
      content: data.content as string,
      status: data.status as string,
      post: data.post as { id: string; title: string; slug: string } | null,
    }
  }

  const getPostContent = (flag: FlaggedItem) => {
    if (!flag.contentData || flag.contentType !== "POST") return null
    const data = flag.contentData as Record<string, unknown>
    return {
      title: data.title as string,
      slug: data.slug as string,
      status: data.status as string,
      excerpt: data.excerpt as string | null,
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Shield className="h-6 w-6 text-violet-500" />
          Flagged Content
        </h1>
        <p className="text-muted-foreground mt-1">
          Review content reported by the community
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="bg-violet-50 dark:bg-violet-950/30 p-2 rounded-lg">
                <Clock className="size-5 text-violet-600" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg">
                <CheckCircle2 className="size-5 text-emerald-600" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold">{dismissedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Dismissed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
                <AlertTriangle className="size-5 text-amber-600" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold">{actionTakenCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Action Taken</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <div className="overflow-x-auto">
          <TabsList>
          <TabsTrigger value="ALL">All</TabsTrigger>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="REVIEWED">Reviewed</TabsTrigger>
          <TabsTrigger value="DISMISSED">Dismissed</TabsTrigger>
          <TabsTrigger value="ACTION_TAKEN">Action Taken</TabsTrigger>
          </TabsList>
        </div>
      </Tabs>

      {/* Flagged Content List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : flags.length > 0 ? (
        <div className="space-y-4">
          {flags.map((flag) => {
            const author = getContentAuthor(flag)
            const commentContent = getCommentContent(flag)
            const postContent = getPostContent(flag)
            const statusInfo = STATUS_BADGE[flag.status] || { label: flag.status, variant: "secondary" as const }

            return (
              <Card key={flag.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Flag header: type icon + reason + status */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {flag.contentType === "COMMENT" ? (
                          <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                        <span className="text-xs text-muted-foreground font-medium">
                          {flag.contentType === "COMMENT" ? "Comment" : "Post"}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${REASON_COLORS[flag.reason] || REASON_COLORS.OTHER}`}
                        >
                          {REASON_LABELS[flag.reason] || flag.reason}
                        </span>
                        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                      </div>

                      {/* Content preview */}
                      {flag.contentType === "COMMENT" && commentContent && (
                        <div className="mb-2">
                          <p className="text-sm line-clamp-3">{commentContent.content}</p>
                          {commentContent.post && (
                            <p className="text-xs text-muted-foreground mt-1">
                              on{" "}
                              <Link
                                href={`/post/${commentContent.post.slug}`}
                                className="hover:text-primary transition-colors inline-flex items-center gap-0.5"
                                target="_blank"
                              >
                                {commentContent.post.title}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </p>
                          )}
                        </div>
                      )}

                      {flag.contentType === "POST" && postContent && (
                        <div className="mb-2">
                          <p className="text-sm font-medium line-clamp-2">{postContent.title}</p>
                          {postContent.excerpt && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{postContent.excerpt}</p>
                          )}
                          <Link
                            href={`/post/${postContent.slug}`}
                            className="text-xs hover:text-primary transition-colors inline-flex items-center gap-0.5 mt-1"
                            target="_blank"
                          >
                            View post <ExternalLink className="h-3 w-3" />
                          </Link>
                        </div>
                      )}

                      {!flag.contentData && (
                        <p className="text-sm text-muted-foreground italic mb-2">
                          Content no longer available (may have been deleted)
                        </p>
                      )}

                      {/* Reporter info */}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-muted-foreground">Reported by</span>
                        <div className="flex items-center gap-1.5">
                          <Avatar className="size-4">
                            {flag.reporter.image ? (
                              <AvatarImage src={flag.reporter.image} alt={flag.reporter.name} />
                            ) : null}
                            <AvatarFallback className="text-[8px]">
                              {flag.reporter.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium">{flag.reporter.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(flag.createdAt).toLocaleDateString("en-KE", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {/* Content author info */}
                      {author && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">Content by</span>
                          <div className="flex items-center gap-1.5">
                            <Avatar className="size-4">
                              {author.image ? (
                                <AvatarImage src={author.image} alt={author.name} />
                              ) : null}
                              <AvatarFallback className="text-[8px]">
                                {author.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium">{author.name}</span>
                          </div>
                        </div>
                      )}

                      {/* Description from reporter */}
                      {flag.description && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                          <span className="font-medium">Reporter note:</span> {flag.description}
                        </div>
                      )}

                      {/* Review info */}
                      {flag.reviewedBy && flag.reviewedAt && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          Reviewed by {flag.reviewedBy.name} on{" "}
                          {new Date(flag.reviewedAt).toLocaleDateString("en-KE", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                          {flag.reviewNotes && (
                            <span className="ml-1">— {flag.reviewNotes}</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    {flag.status === "PENDING" && (
                      <div className="flex flex-wrap gap-2 mt-2 sm:mt-0 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-destructive hover:bg-destructive/10"
                          disabled={reviewMutation.isPending}
                          onClick={() =>
                            reviewMutation.mutate({
                              id: flag.id,
                              status: "ACTION_TAKEN",
                              takeAction: true,
                            })
                          }
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Take Action
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-muted-foreground hover:bg-muted"
                          disabled={reviewMutation.isPending}
                          onClick={() =>
                            reviewMutation.mutate({
                              id: flag.id,
                              status: "DISMISSED",
                            })
                          }
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Dismiss
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          disabled={reviewMutation.isPending}
                          onClick={() =>
                            reviewMutation.mutate({
                              id: flag.id,
                              status: "REVIEWED",
                            })
                          }
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Review
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Shield className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-medium text-muted-foreground">
                {statusFilter === "ALL" ? "No flagged content" : `No ${statusFilter.toLowerCase().replace("_", " ")} flags`}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {statusFilter === "ALL"
                  ? "When readers flag comments or content, they'll appear here for your review"
                  : "Try selecting a different filter"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Moderation Guidelines */}
      <Card className="border-violet-200 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-950/20">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-violet-500" />
            Flag Review Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>When reviewing flagged content, consider the following:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Take Action</strong> — Reject the content and mark the flag as resolved. Use for clear violations.</li>
            <li><strong>Dismiss</strong> — The flag is not valid. The content stays as-is.</li>
            <li><strong>Review</strong> — You&apos;ve reviewed the content but want to take no action for now.</li>
            <li>Be fair and consistent — context matters when evaluating flagged content</li>
            <li>Check the reporter&apos;s note for additional context about the flag</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
