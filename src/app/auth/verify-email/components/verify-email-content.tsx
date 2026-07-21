"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Camera, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setErrorMessage("No verification token provided.")
      return
    }

    async function verify() {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`)
        if (res.ok) {
          setStatus("success")
        } else {
          const data = await res.json()
          setStatus("error")
          setErrorMessage(data.error || "Verification failed")
        }
      } catch {
        setStatus("error")
        setErrorMessage("Something went wrong. Please try again.")
      }
    }

    verify()
  }, [token])

  return (
    <Card className="w-full max-w-md shadow-lg border-0 shadow-primary/5">
      <CardHeader className="text-center space-y-2">
        <div className="mx-auto bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-xl">
          <Camera className="size-6" />
        </div>
        <CardTitle className="text-2xl">Email Verification</CardTitle>
        <CardDescription>Verifying your email address</CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <Loader2 className="size-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="size-10 text-green-500" />
            <h3 className="text-lg font-semibold">Email Verified!</h3>
            <p className="text-muted-foreground">Your email has been verified successfully.</p>
            <Button asChild className="mt-2">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 py-4">
            <XCircle className="size-10 text-destructive" />
            <h3 className="text-lg font-semibold">Verification Failed</h3>
            <p className="text-muted-foreground">{errorMessage}</p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/signup">Create Account</Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
