"use client"

import { Suspense } from "react"
import { useSession } from "next-auth/react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { ShieldAlert, ArrowRight, Home, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SUBDOMAINS, ROLE_HIERARCHY, getSubdomainUrl } from "@/lib/subdomain"

const ROOT_DOMAIN = "sanaathrumylens.co.ke"

function SubdomainRedirectContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const attemptedSubdomain = searchParams.get("attempted") || ""

  const userRole = (session?.user?.role as string) || "READER"
  const attemptedConfig = SUBDOMAINS.find((s) => s.subdomain === attemptedSubdomain)

  // Find the correct subdomain for this user's role
  const userLevel = ROLE_HIERARCHY[userRole] ?? 0
  const correctSubdomain = userLevel >= 3
    ? SUBDOMAINS.find((s) => s.role === userRole)
    : null

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <ShieldAlert className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-xl">Access Restricted</CardTitle>
          <CardDescription className="text-sm">
            You don&apos;t have permission to access this dashboard
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Attempted subdomain info */}
          {attemptedConfig && (
            <div className="rounded-lg border border-border p-4 space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Attempted Access
              </p>
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: attemptedConfig.accentColor }}
                />
                <span className="font-semibold">{attemptedConfig.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {attemptedConfig.description}
              </p>
              <p className="text-xs text-muted-foreground">
                Requires role: <span className="font-medium text-foreground">{attemptedConfig.role}</span>
              </p>
            </div>
          )}

          {/* Current role info */}
          <div className="rounded-lg border border-border p-4 space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Your Current Role
            </p>
            <p className="font-semibold capitalize">{userRole.replace("_", " ")}</p>
            <p className="text-sm text-muted-foreground">
              {correctSubdomain
                ? `You should use the ${correctSubdomain.label} instead.`
                : "Your role uses the Reader Dashboard on the main site."}
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            {session ? (
              <>
                {correctSubdomain ? (
                  <a
                    href={getSubdomainUrl(correctSubdomain.subdomain, "/dashboard")}
                    className="block"
                  >
                    <Button className="w-full gap-2" style={{ backgroundColor: correctSubdomain.accentColor }}>
                      Go to {correctSubdomain.label}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                ) : (
                  <a
                    href={`https://${ROOT_DOMAIN}/dashboard`}
                    className="block"
                  >
                    <Button className="w-full gap-2">
                      Go to Reader Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </a>
                )}
              </>
            ) : (
              <Link href="/auth/signin" className="block">
                <Button className="w-full gap-2">
                  Sign In
                  <LogIn className="h-4 w-4" />
                </Button>
              </Link>
            )}

            <a
              href={`https://${ROOT_DOMAIN}`}
              className="block"
            >
              <Button variant="outline" className="w-full gap-2">
                <Home className="h-4 w-4" />
                Back to Main Site
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SubdomainRedirectPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <SubdomainRedirectContent />
    </Suspense>
  )
}
