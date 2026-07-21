"use client"

import { useState, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Camera, Eye, EyeOff, Loader2, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import Link from "next/link"

// Subdomain detection — matches the middleware's SUBDOMAINS
const ROOT_DOMAIN = "sanaathrumylens.co.ke"
const SUBDOMAIN_PREFIXES = ["admin", "editor"]

function detectSubdomain(): string | null {
  if (typeof window === "undefined") return null
  const hostname = window.location.hostname
  if (hostname === "localhost" || hostname.startsWith("127.0.0.1") || hostname === "0.0.0.0") {
    return null
  }
  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomainPart = hostname.replace(`.${ROOT_DOMAIN}`, "")
    if (!subdomainPart || subdomainPart === "www") return null
    if (SUBDOMAIN_PREFIXES.includes(subdomainPart)) return subdomainPart
  }
  return null
}

// Role hierarchy for subdomain redirect logic
const ROLE_SUBDOMAIN_MAP: Record<string, string> = {
  ADMIN: "admin",
  EDITOR: "editor",
}

export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"

  const [isOnSubdomain, setIsOnSubdomain] = useState(false)
  const [detectedSubdomain, setDetectedSubdomain] = useState<string | null>(null)

  useEffect(() => {
    const sub = detectSubdomain()
    setIsOnSubdomain(!!sub)
    setDetectedSubdomain(sub)
  }, [])

  // If we're on a subdomain (e.g., control.sanaathrumylens.co.ke),
  // build the full URL for the callback so NextAuth redirects back to this subdomain
  const fullCallbackUrl = typeof window !== "undefined" && callbackUrl.startsWith("/")
    ? `${window.location.origin}${callbackUrl}`
    : callbackUrl

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false)
  const [otp, setOtp] = useState("")
  const [otpLoading, setOtpLoading] = useState(false)

  async function handlePostLoginRedirect() {
    try {
      const sessionRes = await fetch("/api/auth/session");
      const sessionData = await sessionRes.json();
      const role = sessionData?.user?.role || "READER";

      // Set x-user-role cookie for subdomain middleware
      // Always clear any stale role cookie first, then set new one for non-readers
      document.cookie = "x-user-role=; path=/; domain=.sanaathrumylens.co.ke; max-age=0; samesite=lax; secure"
      document.cookie = "x-user-role=; path=/; max-age=0"
      if (role && role !== "READER") {
        document.cookie = `x-user-role=${role}; path=/; domain=.sanaathrumylens.co.ke; max-age=86400; samesite=lax; secure`;
      }

      // On a subdomain: check if READER tried to login — reject them
      if (isOnSubdomain && role === "READER") {
        setError("This login is for staff only. Readers sign in on the main site.")
        // Sign them out since they shouldn't be authenticated on a subdomain
        await signIn("credentials", { redirect: false, email: "__signout__", password: "__signout__" });
        // Also clear the session manually
        await fetch("/api/auth/signout", { method: "POST" });
        return
      }

      // On base domain: if ADMIN+, redirect to their subdomain dashboard
      if (!isOnSubdomain && role !== "READER" && ROLE_SUBDOMAIN_MAP[role]) {
        const subdomain = ROLE_SUBDOMAIN_MAP[role]
        const protocol = window.location.protocol
        window.location.href = `${protocol}//${subdomain}.${ROOT_DOMAIN}/dashboard`
        return
      }

      // Default redirect using callbackUrl
      window.location.href = fullCallbackUrl;
    } catch {
      // Cookie setting is best-effort, fall through to default redirect
      window.location.href = fullCallbackUrl;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === "2FA required") {
          setRequires2FA(true)
        } else {
          setError("Invalid email or password")
        }
      } else {
        await handlePostLoginRedirect()
      }
    } catch {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handle2FA(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setOtpLoading(true)

    try {
      // Verify the 2FA code via API
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: otp }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Invalid OTP code")
        return
      }

      // 2FA code verified via API — now sign in with the code as a credential
      const result = await signIn("credentials", {
        email,
        password,
        twoFactorCode: otp,
        redirect: false,
      })

      if (result?.error) {
        setError("Sign in failed after 2FA verification. Please try again.")
        setRequires2FA(false)
        setOtp("")
      } else {
        await handlePostLoginRedirect()
      }
    } catch {
      setError("Verification failed. Please try again.")
    } finally {
      setOtpLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    await signIn("google", { callbackUrl: fullCallbackUrl })
  }

  if (requires2FA) {
    return (
      <Card className="w-full max-w-md shadow-lg border-0 shadow-primary/5">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-xl">
            <Camera className="size-6" />
          </div>
          <CardTitle className="text-2xl">Two-Factor Authentication</CardTitle>
          <CardDescription>
            Enter the verification code sent to your email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handle2FA} className="space-y-6">
            <div className="flex flex-col items-center gap-4">
              <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={otp.length < 6 || otpLoading}>
              {otpLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Verify Code
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setRequires2FA(false); setOtp("") }}
          >
            Back to sign in
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md shadow-lg border-0 shadow-primary/5">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-xl">
          {isOnSubdomain ? <Shield className="size-6" /> : <Camera className="size-6" />}
        </div>
        <CardTitle className="text-2xl">
          {isOnSubdomain ? "Staff Login" : "Welcome Back"}
        </CardTitle>
        <CardDescription>
          {isOnSubdomain
            ? "Use your dashboard credentials to sign in"
            : "Sign in to Sanaa Through My Lens"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Staff-only notice on subdomain */}
        {isOnSubdomain && (
          <div className="mb-4 rounded-md bg-primary/10 p-3 text-sm text-primary flex items-center gap-2">
            <Shield className="size-4 shrink-0" />
            <span>Staff login — use your dashboard credentials</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="size-4 text-muted-foreground" />
                ) : (
                  <Eye className="size-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
              />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Remember me
              </Label>
            </div>
            <Link href="/auth/forgot-password" className="text-sm text-primary hover:underline">
              Forgot Password?
            </Link>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Sign In
          </Button>
        </form>

        {/* Google OAuth — only shown on base domain */}
        {!isOnSubdomain && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or continue with</span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignIn}
              type="button"
            >
              <svg className="mr-2 size-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
          </>
        )}
      </CardContent>
      <CardFooter className="flex-col gap-2">
        {/* Sign Up link — only shown on base domain */}
        {!isOnSubdomain && (
          <Link href="/auth/signup" className="text-sm text-primary hover:underline">
            Don&apos;t have an account? Sign Up
          </Link>
        )}
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Back to home
        </Link>
      </CardFooter>
    </Card>
  )
}
