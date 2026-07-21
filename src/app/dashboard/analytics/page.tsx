"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import Link from "next/link"
import {
  Eye,
  Users,
  TrendingUp,
  Trophy,
  ExternalLink,
  ArrowUpRight,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts"

interface AnalyticsData {
  totalPageViews: number
  uniqueVisitors: number
  avgDailyViews: number
  topPost: { id: string; title: string; views: number } | null
  viewsTrend: { date: string; views: number }[]
  topPosts: {
    id: string
    title: string
    slug: string
    views: number
    publishedAt: string | null
    author: { name: string }
  }[]
  viewsByCategory: { category: string; views: number; color: string | null }[]
  topReferrers: { referrer: string; views: number }[]
}

const trendChartConfig: ChartConfig = {
  views: {
    label: "Page Views",
    color: "hsl(38, 92%, 50%)",
  },
}

const categoryChartConfig: ChartConfig = {
  views: {
    label: "Views",
    color: "hsl(25, 95%, 53%)",
  },
}

const CATEGORY_COLORS = [
  "hsl(38, 92%, 50%)",
  "hsl(25, 95%, 53%)",
  "hsl(0, 84%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(47, 96%, 53%)",
  "hsl(280, 67%, 55%)",
  "hsl(199, 89%, 48%)",
  "hsl(15, 90%, 55%)",
]

export default function AnalyticsPage() {
  const [days, setDays] = useState("30")

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["analytics-overview", days],
    queryFn: async () => {
      const res = await fetch(`/api/analytics/overview?days=${days}`)
      if (!res.ok) throw new Error("Failed to fetch analytics")
      return res.json()
    },
  })

  const statCards = [
    {
      title: "Total Page Views",
      value: data?.totalPageViews ?? 0,
      icon: Eye,
      description: `Last ${days} days`,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/30",
    },
    {
      title: "Unique Visitors",
      value: data?.uniqueVisitors ?? 0,
      icon: Users,
      description: `Last ${days} days`,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950/30",
    },
    {
      title: "Avg. Daily Views",
      value: data?.avgDailyViews ?? 0,
      icon: TrendingUp,
      description: "Per day average",
      color: "text-rose-600",
      bgColor: "bg-rose-50 dark:bg-rose-950/30",
    },
    {
      title: "Top Post",
      value: data?.topPost?.views ?? 0,
      icon: Trophy,
      description: data?.topPost?.title || "No data yet",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
      isTopPost: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track your site performance and audience engagement
          </p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                  </div>
                  <Skeleton className="h-8 w-20 mt-3" />
                  <Skeleton className="h-3 w-24 mt-2" />
                </CardContent>
              </Card>
            ))
          : statCards.map((card) => (
              <Card key={card.title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className={`${card.bgColor} p-2 rounded-lg`}>
                      <card.icon className={`size-5 ${card.color}`} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <p className="text-xl sm:text-2xl font-bold">
                      {card.isTopPost ? (
                        <span className="flex items-center gap-1">
                          {card.value.toLocaleString()}
                          <span className="text-sm font-normal text-muted-foreground">
                            views
                          </span>
                        </span>
                      ) : (
                        card.value.toLocaleString()
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {card.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {/* Page Views Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Page Views Trend</CardTitle>
          <CardDescription>
            Daily page views over the last {days <= 14 ? days : 14} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <ChartContainer config={trendChartConfig} className="h-[300px] w-full">
              <AreaChart data={data?.viewsTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(value) => {
                    const d = new Date(value)
                    return d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(38, 92%, 50%)"
                  fill="hsl(38, 92%, 50%)"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Posts Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Posts by Views</CardTitle>
            <CardDescription>Most viewed published content</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : data?.topPosts && data.topPosts.length > 0 ? (
              <>
              {/* Mobile: Card list */}
              <div className="sm:hidden space-y-2">
                {data.topPosts.map((post, idx) => (
                  <div key={post.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-muted-foreground w-5 shrink-0">{idx + 1}.</span>
                      <Link
                        href={`/dashboard/posts/${post.id}/edit`}
                        className="text-sm font-medium truncate hover:text-primary transition-colors"
                      >
                        {post.title}
                      </Link>
                    </div>
                    <Badge variant="secondary" className="font-mono shrink-0 ml-2">
                      {post.views.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
              <div className="hidden sm:block">
              <div className="max-h-96 overflow-y-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.topPosts.map((post, idx) => (
                      <TableRow key={post.id}>
                        <TableCell>
                          <Link
                            href={`/dashboard/posts/${post.id}/edit`}
                            className="flex items-center gap-2 hover:text-primary transition-colors"
                          >
                            <span className="text-xs font-mono text-muted-foreground w-5">
                              {idx + 1}.
                            </span>
                            <span className="text-sm font-medium truncate max-w-[200px]">
                              {post.title}
                            </span>
                            <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="font-mono">
                            {post.views.toLocaleString()}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No post view data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Views by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Views by Category</CardTitle>
            <CardDescription>Traffic distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : data?.viewsByCategory && data.viewsByCategory.length > 0 ? (
              <ChartContainer config={categoryChartConfig} className="h-[300px] w-full">
                <BarChart
                  data={data.viewsByCategory}
                  layout="vertical"
                  margin={{ left: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="category"
                    tick={{ fontSize: 12 }}
                    width={100}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="views"
                    radius={[0, 4, 4, 0]}
                    fill="hsl(25, 95%, 53%)"
                  >
                    {data.viewsByCategory.map((_, index) => (
                      <rect
                        key={index}
                        fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No category view data yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Referrers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Referrers</CardTitle>
          <CardDescription>Where your traffic comes from</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : data?.topReferrers && data.topReferrers.length > 0 ? (
            <div className="space-y-3">
              {data.topReferrers.map((ref, idx) => {
                const maxViews = data.topReferrers[0]?.views || 1
                const percentage = (ref.views / maxViews) * 100
                return (
                  <div key={ref.referrer} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-5">
                      {idx + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">
                          {ref.referrer}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {ref.views} views
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500 dark:bg-amber-400"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No referrer data yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
