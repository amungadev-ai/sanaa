import { Suspense } from "react"
import { VerifyEmailContent } from "./components/verify-email-content"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background to-muted/50">
      <Suspense fallback={
        <div className="w-full max-w-md p-8 bg-card rounded-xl shadow-lg animate-pulse">
          <div className="h-8 w-8 bg-muted rounded-lg mx-auto mb-4" />
          <div className="h-6 w-48 bg-muted rounded mx-auto mb-2" />
          <div className="h-4 w-64 bg-muted rounded mx-auto mb-8" />
          <div className="h-10 bg-muted rounded" />
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  )
}
