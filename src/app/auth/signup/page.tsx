import { Suspense } from "react"
import { SignUpForm } from "./components/signup-form"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background to-muted/50 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full flex flex-col items-center">
        <Suspense fallback={
          <div className="w-full max-w-md p-8 bg-card rounded-xl shadow-lg animate-pulse">
            <div className="h-8 w-8 bg-muted rounded-lg mx-auto mb-4" />
            <div className="h-6 w-48 bg-muted rounded mx-auto mb-2" />
            <div className="h-4 w-64 bg-muted rounded mx-auto mb-8" />
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
              <div className="h-10 bg-muted rounded" />
            </div>
          </div>
        }>
          <SignUpForm />
        </Suspense>
      </div>
    </div>
  )
}
