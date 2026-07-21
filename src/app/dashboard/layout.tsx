"use client"

import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Calendar,
  Users,
  FolderOpen,
  Tags,
  Image,
  Megaphone,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
  PenTool,
  Palette,
  BadgeDollarSign,
  Mail,
  UserPlus,
  BarChart3,
  CalendarDays,
  Bookmark,
  BookMarked,
  ExternalLink,
  Shield,
  Flag,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/layout/notification-bell"
import {
  SUBDOMAINS,
  BASE_DOMAIN_CONFIG,
  type SubdomainConfig,
} from "@/lib/subdomain"

// ============================================
// useSubdomain hook
// ============================================

function useSubdomain(): SubdomainConfig | null {
  return useMemo(() => {
    if (typeof window === "undefined") return null
    const hostname = window.location.hostname
    // localhost/dev — no subdomain
    if (hostname === "localhost" || hostname.startsWith("127.0.0.1") || hostname === "0.0.0.0") {
      return null
    }
    const ROOT_DOMAIN = "sanaathrumylens.co.ke"
    if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
      const subdomainPart = hostname.replace(`.${ROOT_DOMAIN}`, "")
      if (!subdomainPart || subdomainPart === "www") return null
      return SUBDOMAINS.find((s) => s.subdomain === subdomainPart) || null
    }
    return null
  }, [])
}

// ============================================
// Navigation config
// ============================================

const roleNavItems: Record<string, { label: string; href: string; icon: React.ElementType }[]> = {
  ADMIN: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Posts", href: "/dashboard/posts", icon: FileText },
    { label: "Comments", href: "/dashboard/comments", icon: MessageSquare },
    { label: "Events", href: "/dashboard/events", icon: Calendar },
    { label: "Artists", href: "/dashboard/artists", icon: Palette },
    { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { label: "Users", href: "/dashboard/users", icon: Users },
    { label: "Categories", href: "/dashboard/categories", icon: FolderOpen },
    { label: "Tags", href: "/dashboard/tags", icon: Tags },
    { label: "Media", href: "/dashboard/media", icon: Image },
    { label: "Ads", href: "/dashboard/ads", icon: Megaphone },
    { label: "Sponsored", href: "/dashboard/sponsored", icon: BadgeDollarSign },
    { label: "Campaigns", href: "/dashboard/campaigns", icon: Mail },
    { label: "Subscribers", href: "/dashboard/subscribers", icon: UserPlus },
    { label: "Settings", href: "/dashboard/settings", icon: Settings },
    { label: "Profile", href: "/dashboard/profile", icon: User },
  ],
  EDITOR: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Posts", href: "/dashboard/posts", icon: FileText },
    { label: "Comments", href: "/dashboard/comments", icon: MessageSquare },
    { label: "Events", href: "/dashboard/events", icon: Calendar },
    { label: "Artists", href: "/dashboard/artists", icon: Palette },
    { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
    { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { label: "Categories", href: "/dashboard/categories", icon: FolderOpen },
    { label: "Tags", href: "/dashboard/tags", icon: Tags },
    { label: "Media", href: "/dashboard/media", icon: Image },
    { label: "Profile", href: "/dashboard/profile", icon: User },
  ],
  READER: [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Bookmarks", href: "/dashboard/reader", icon: Bookmark },
    { label: "Reading Lists", href: "/dashboard/reading-lists", icon: BookMarked },
    { label: "Profile", href: "/dashboard/profile", icon: User },
  ],
}

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  EDITOR: "Editor",
  READER: "Reader",
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  EDITOR: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  READER: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

interface SidebarContentProps {
  session: ReturnType<typeof useSession>["data"]
  role: string
  pathname: string
  onClose: () => void
  subdomain: SubdomainConfig | null
}

function SidebarContent({ session, role, pathname, onClose, subdomain }: SidebarContentProps) {
  const navItems = roleNavItems[role] || roleNavItems.READER

  return (
    <div className="flex flex-col h-full">
      {/* Accent bar at top of sidebar */}
      {subdomain && (
        <div
          className="h-1 w-full shrink-0"
          style={{ backgroundColor: subdomain.accentColor }}
        />
      )}

      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
          {subdomain ? (
            // Subdomain-specific branding
            <>
              <div
                className="h-8 w-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: subdomain.accentColor }}
              >
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm leading-none" style={{ color: subdomain.accentColor }}>
                  {subdomain.label}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {subdomain.subdomain}.sanaathrumylens.co.ke
                </span>
              </div>
            </>
          ) : (
            // Base domain branding (existing)
            <>
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-serif font-bold text-sm">S</span>
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-sm tracking-wider leading-none">SANAATHRUMYLENS</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">{roleLabels[role]} Panel</span>
              </div>
            </>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            return (
              <TooltipProvider key={item.href} delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="hidden lg:block">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )
          })}
        </nav>
      </ScrollArea>

      {/* User Info at bottom */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={session?.user?.image || undefined} />
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {session?.user?.name ? getInitials(session.user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name || "User"}</p>
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-full", roleColors[role])}>
              {roleLabels[role]}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const subdomain = useSubdomain()

  const role = (session?.user?.role as string) || "READER"

  // Determine the "View Site" URL based on subdomain
  const viewSiteUrl = subdomain
    ? "https://sanaathrumylens.co.ke"
    : "/"

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent
          session={session}
          role={role}
          pathname={pathname}
          onClose={() => setSidebarOpen(false)}
          subdomain={subdomain}
        />
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center justify-between h-full px-4 sm:px-6">
            {/* Left: Mobile menu + Breadcrumb */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <span className="text-sm text-muted-foreground hidden sm:block capitalize">
                {pathname === "/dashboard" ? "Overview" : pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ")}
              </span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Subdomain indicator badge (visible when on a subdomain) */}
              {subdomain && (
                <span
                  className="hidden md:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: subdomain.accentColor }}
                >
                  {subdomain.label}
                </span>
              )}

              {/* Notifications */}
              <NotificationBell />

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="h-7 w-7 sm:h-8 sm:w-8"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>

              {/* View Site */}
              {subdomain ? (
                <a href={viewSiteUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="sm" className="hidden sm:flex gap-1.5 text-xs">
                    View Site <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              ) : (
                <Link href="/" target="_blank">
                  <Button variant="ghost" size="sm" className="hidden sm:flex gap-1.5 text-xs">
                    View Site
                  </Button>
                </Link>
              )}

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 h-7 sm:h-8 px-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={session?.user?.image || undefined} />
                      <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                        {session?.user?.name ? getInitials(session.user.name) : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{session?.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      // Clear the custom x-user-role cookie before signing out
                      // to prevent stale role cookies from redirecting users to wrong subdomains
                      document.cookie = "x-user-role=; path=/; domain=.sanaathrumylens.co.ke; max-age=0; samesite=lax; secure"
                      document.cookie = "x-user-role=; path=/; max-age=0"
                      signOut({ callbackUrl: "/auth/signin" })
                    }}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-3 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
