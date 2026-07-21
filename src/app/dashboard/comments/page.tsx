"use client"

import { useState, Suspense } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSearchParams, useRouter } from "next/navigation"
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  Reply,
  MoreHorizontal,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { toast } from "sonner"

interface Comment {
  id: string
  content: string
  status: string
  createdAt: string
  author: { id: string; name: string; image: string | null }
  post: { id: string; title: string }
  parentId: string | null
}

interface CommentsResponse {
  comments: Comment[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function CommentsContent() {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [replyComment, setReplyComment] = useState<Comment | null>(null)
  const [replyContent, setReplyContent] = useState("")

  // Pagination from URL
  const currentPage = parseInt(searchParams.get("page") || "1")
  const currentLimit = parseInt(searchParams.get("limit") || "20")

  const { data: commentsData, isLoading } = useQuery<CommentsResponse>({
    queryKey: ["comments", statusFilter, currentPage, currentLimit],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter)
      params.set("page", String(currentPage))
      params.set("limit", String(currentLimit))
      const res = await fetch(`/api/comments?${params}`)
      if (!res.ok) throw new Error("Failed to fetch comments")
      return res.json()
    },
  })

  const moderateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Failed to update comment")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] })
      toast.success("Comment updated")
    },
    onError: () => toast.error("Failed to update comment"),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete comment")
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] })
      toast.success("Comment deleted")
    },
    onError: () => toast.error("Failed to delete comment"),
  })

  const replyMutation = useMutation({
    mutationFn: async ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) => {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, content, parentId }),
      })
      if (!res.ok) throw new Error("Failed to reply")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments"] })
      setReplyComment(null)
      setReplyContent("")
      toast.success("Reply posted")
    },
    onError: () => toast.error("Failed to post reply"),
  })

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("page", String(page))
    router.push(`?${params.toString()}`)
  }

  const handlePageSizeChange = (size: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("limit", String(size))
    params.set("page", "1")
    router.push(`?${params.toString()}`)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      PENDING: { label: "Pending", variant: "outline" },
      APPROVED: { label: "Approved", variant: "default" },
      REJECTED: { label: "Rejected", variant: "destructive" },
      SPAM: { label: "Spam", variant: "secondary" },
    }
    const info = variants[status] || { label: status, variant: "secondary" as const }
    return <Badge variant={info.variant}>{info.label}</Badge>
  }

  const pendingCount = commentsData?.comments?.filter((c) => c.status === "PENDING").length || 0
  const pagination = commentsData?.pagination

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Comments</h1>
          <p className="text-muted-foreground">Moderate and manage reader comments</p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge variant="outline" className="gap-1">
              <AlertTriangle className="size-3" />
              {pendingCount} pending
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Comments</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="SPAM">Spam</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : commentsData?.comments && commentsData.comments.length > 0 ? (
          commentsData.comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback>{comment.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{comment.author.name}</span>
                      {getStatusBadge(comment.status)}
                      <span className="text-xs text-muted-foreground">
                        on &quot;{comment.post.title}&quot;
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(comment.createdAt).toLocaleString()}
                    </p>
                    <p className="text-sm mt-2 whitespace-pre-wrap">{comment.content}</p>
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      {comment.status === "PENDING" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="hidden sm:flex gap-1 text-emerald-600 hover:text-emerald-700 h-7 text-xs"
                            onClick={() => moderateMutation.mutate({ id: comment.id, status: "APPROVED" })}
                            disabled={moderateMutation.isPending}
                          >
                            <CheckCircle2 className="size-3" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="hidden sm:flex gap-1 text-destructive hover:text-destructive h-7 text-xs"
                            onClick={() => moderateMutation.mutate({ id: comment.id, status: "REJECTED" })}
                            disabled={moderateMutation.isPending}
                          >
                            <XCircle className="size-3" />
                            Reject
                          </Button>
                        </>
                      )}
                      {(comment.status === "APPROVED" || comment.status === "REJECTED") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 h-7 text-xs"
                          onClick={() => moderateMutation.mutate({ id: comment.id, status: "PENDING" })}
                          disabled={moderateMutation.isPending}
                        >
                          Reset
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 h-7 text-xs"
                        onClick={() => {
                          setReplyComment(comment)
                          setReplyContent("")
                        }}
                      >
                        <Reply className="size-3" />
                        Reply
                      </Button>
                      {/* Secondary actions in dropdown */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-7">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {comment.status === "PENDING" && (
                            <>
                              <DropdownMenuItem
                                className="text-emerald-600 focus:text-emerald-700 sm:hidden"
                                onClick={() => moderateMutation.mutate({ id: comment.id, status: "APPROVED" })}
                                disabled={moderateMutation.isPending}
                              >
                                <CheckCircle2 className="mr-2 size-4" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive sm:hidden"
                                onClick={() => moderateMutation.mutate({ id: comment.id, status: "REJECTED" })}
                                disabled={moderateMutation.isPending}
                              >
                                <XCircle className="mr-2 size-4" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem
                            className="text-orange-600 focus:text-orange-700"
                            onClick={() => moderateMutation.mutate({ id: comment.id, status: "SPAM" })}
                            disabled={moderateMutation.isPending}
                          >
                            <AlertTriangle className="mr-2 size-4" />
                            Mark as Spam
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => deleteMutation.mutate(comment.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <MessageSquare className="size-8 mx-auto mb-2 opacity-50" />
              <p>No comments found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 0 && (
        <PaginationControls
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.limit}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}

      {/* Reply Dialog */}
      <Dialog open={!!replyComment} onOpenChange={(open) => !open && setReplyComment(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to {replyComment?.author.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-3 rounded-md">
              <p className="text-sm text-muted-foreground">{replyComment?.content}</p>
            </div>
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyComment(null)}>Cancel</Button>
            <Button
              onClick={() => replyComment && replyMutation.mutate({
                postId: replyComment.post.id,
                content: replyContent,
                parentId: replyComment.id,
              })}
              disabled={!replyContent.trim() || replyMutation.isPending}
            >
              {replyMutation.isPending ? "Sending..." : "Send Reply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function CommentsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>}>
      <CommentsContent />
    </Suspense>
  )
}
