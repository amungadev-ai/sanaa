"use client"

import { useState, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Plus,
  Search,
  FileText,
  Trash2,
  MoreHorizontal,
  Eye,
  Pencil,
  Loader2,
  Globe,
  Send,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { toast } from "sonner"

interface Post {
  id: string
  title: string
  slug: string
  status: string
  featuredImage: string | null
  views: number
  createdAt: string
  isCommunityVoice: boolean
  author: { id: string; name: string }
  categories: { category: { id: string; name: string; color: string | null } }[]
}

interface PostsResponse {
  posts: Post[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

function PostsContent() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "ALL")
  const [deletePost, setDeletePost] = useState<Post | null>(null)

  // Pagination from URL
  const currentPage = parseInt(searchParams.get("page") || "1")
  const currentLimit = parseInt(searchParams.get("limit") || "10")

  const role = (session?.user?.role as string) || "READER"
  const isModerator = role === "ADMIN"
  const canCreatePost = ["ADMIN", "EDITOR"].includes(role)
  const canEditPost = ["ADMIN", "EDITOR"].includes(role)
  const canDeletePost = ["ADMIN", "EDITOR"].includes(role)
  const canPublishPost = ["ADMIN", "EDITOR"].includes(role)
  const canViewOnly = false

  // Build the public site URL for viewing posts (handles subdomain routing)
  const publicSiteUrl = typeof window !== 'undefined' && window.location.hostname.endsWith('.sanaathrumylens.co.ke')
    ? `https://sanaathrumylens.co.ke`
    : ''

  const { data: postsData, isLoading } = useQuery<PostsResponse>({
    queryKey: ["posts", search, statusFilter, currentPage, currentLimit],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter && statusFilter !== "ALL") params.set("status", statusFilter)
      if (isModerator) params.set("authorId", session?.user?.id || "")
      params.set("page", String(currentPage))
      params.set("limit", String(currentLimit))
      const res = await fetch(`/api/posts?${params}`)
      if (!res.ok) throw new Error("Failed to fetch posts")
      return res.json()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/posts/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to delete post")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      setDeletePost(null)
      toast.success("Post deleted successfully")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to publish post")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] })
      toast.success("Post published successfully — now visible on the public site")
    },
    onError: (err: Error) => toast.error(err.message),
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
      PUBLISHED: { label: "Published", variant: "default" },
      DRAFT: { label: "Draft", variant: "secondary" },
      PENDING_REVIEW: { label: "Pending Review", variant: "outline" },
      APPROVED: { label: "Approved", variant: "default" },
      SCHEDULED: { label: "Scheduled", variant: "outline" },
      REJECTED: { label: "Rejected", variant: "destructive" },
      ARCHIVED: { label: "Archived", variant: "secondary" },
    }
    const info = variants[status] || { label: status, variant: "secondary" as const }
    return <Badge variant={info.variant}>{info.label}</Badge>
  }

  const pagination = postsData?.pagination

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isModerator ? "Posts Overview" : "Posts"}
          </h1>
          <p className="text-muted-foreground">
            {isModerator ? "View published and pending posts" : "Manage all blog posts"}
          </p>
        </div>
        {canCreatePost && (
          <Link href="/dashboard/posts/new">
            <Button className="gap-2">
              <Plus className="size-4" />
              New Post
            </Button>
          </Link>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING_REVIEW">Pending Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="size-5" />
            {isModerator ? "Your Posts" : "All Posts"} ({pagination?.total || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Mobile: Card layout */}
              <div className="space-y-3 sm:hidden">
                {postsData?.posts?.map((post) => (
                  <div key={post.id} className="p-3 rounded-lg border bg-card space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {canViewOnly ? (
                            <a href={`${publicSiteUrl}/post/${post.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium text-sm hover:text-primary transition-colors truncate inline-flex items-center gap-1">
                              {post.title}
                              <ExternalLink className="size-3 text-muted-foreground shrink-0" />
                            </a>
                          ) : (
                            <Link href={`/dashboard/posts/${post.id}/edit`} className="font-medium text-sm hover:text-primary transition-colors truncate">
                              {post.title}
                            </Link>
                          )}
                          {post.isCommunityVoice && (
                            <Badge className="text-[10px] px-1 py-0 h-4 bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400 dark:bg-emerald-500/10 shrink-0">Community</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          by {post.author.name} · {new Date(post.createdAt).toLocaleDateString('en-KE', {month:'short', day:'numeric'})}
                        </p>
                      </div>
                      <div className="shrink-0">{getStatusBadge(post.status)}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5"><Eye className="size-3" />{post.views}</span>
                        {post.categories.length > 0 && (
                          <span>{post.categories.slice(0,1).map(pc => pc.category.name).join('')}{post.categories.length > 1 ? ` +${post.categories.length-1}` : ''}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {canPublishPost && post.status === "APPROVED" && (
                          <Button size="sm" variant="default" className="gap-1 text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => publishMutation.mutate(post.id)} disabled={publishMutation.isPending}>
                            {publishMutation.isPending ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                            Publish
                          </Button>
                        )}
                        <a href={`${publicSiteUrl}/post/${post.slug}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="gap-1 text-xs h-7">
                            <Globe className="size-3" />View
                          </Button>
                        </a>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canEditPost && (
                              <DropdownMenuItem asChild>
                                <Link href={`/dashboard/posts/${post.id}/edit`}><Pencil className="mr-2 size-4" />Edit</Link>
                              </DropdownMenuItem>
                            )}
                            {canDeletePost && (
                              <DropdownMenuItem className="text-destructive" onClick={() => setDeletePost(post)}>
                                <Trash2 className="mr-2 size-4" />Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
                {(!postsData?.posts || postsData.posts.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-8">No posts found</p>
                )}
              </div>
              {/* Desktop: Table */}
              <div className="hidden sm:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[250px]">Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Categories</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {postsData?.posts?.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {canViewOnly ? (
                              <a
                                href={`${publicSiteUrl}/post/${post.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium hover:text-primary transition-colors inline-flex items-center gap-1"
                              >
                                {post.title}
                                <ExternalLink className="size-3 text-muted-foreground" />
                              </a>
                            ) : (
                              <Link
                                href={`/dashboard/posts/${post.id}/edit`}
                                className="font-medium hover:text-primary transition-colors"
                              >
                                {post.title}
                              </Link>
                            )}
                            {post.isCommunityVoice && (
                              <Badge className="text-xs bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/25 shrink-0">
                                Community
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(post.status)}</TableCell>
                        <TableCell className="text-muted-foreground">{post.author.name}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {post.categories.slice(0, 2).map((pc) => (
                              <Badge key={pc.category.id} variant="outline" className="text-xs">
                                {pc.category.name}
                              </Badge>
                            ))}
                            {post.categories.length > 2 && (
                              <Badge variant="outline" className="text-xs">+{post.categories.length - 2}</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="size-3" />
                            {post.views}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Prominent Publish button for APPROVED posts */}
                            {canPublishPost && post.status === "APPROVED" && (
                              <Button
                                size="sm"
                                variant="default"
                                className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                onClick={() => publishMutation.mutate(post.id)}
                                disabled={publishMutation.isPending}
                              >
                                {publishMutation.isPending ? (
                                  <Loader2 className="size-3 animate-spin" />
                                ) : (
                                  <Send className="size-3" />
                                )}
                                Publish
                              </Button>
                            )}
                            {/* View on Site — always visible */}
                            <a href={`${publicSiteUrl}/post/${post.slug}`} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="outline" className="gap-1 text-xs">
                                <Globe className="size-3" />
                                View
                              </Button>
                            </a>
                            {/* More actions dropdown */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-8">
                                  <MoreHorizontal className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canEditPost && (
                                  <DropdownMenuItem asChild>
                                    <Link href={`/dashboard/posts/${post.id}/edit`}>
                                      <Pencil className="mr-2 size-4" />
                                      Edit
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem asChild>
                                  <a href={`${publicSiteUrl}/post/${post.slug}`} target="_blank" rel="noopener noreferrer">
                                    <Eye className="mr-2 size-4" />
                                    View on Site
                                  </a>
                                </DropdownMenuItem>
                                {canPublishPost && post.status === "APPROVED" && (
                                  <DropdownMenuItem
                                    className="text-emerald-600"
                                    onClick={() => publishMutation.mutate(post.id)}
                                    disabled={publishMutation.isPending}
                                  >
                                    <Send className="mr-2 size-4" />
                                    Publish Now
                                  </DropdownMenuItem>
                                )}
                                {canDeletePost && (
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => setDeletePost(post)}
                                  >
                                    <Trash2 className="mr-2 size-4" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!postsData?.posts || postsData.posts.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No posts found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletePost} onOpenChange={(open) => !open && setDeletePost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletePost?.title}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePost && deleteMutation.mutate(deletePost.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function PostsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="size-8 animate-spin text-muted-foreground" /></div>}>
      <PostsContent />
    </Suspense>
  )
}
