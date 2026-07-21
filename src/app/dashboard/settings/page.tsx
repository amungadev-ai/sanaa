"use client"

import { useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  Settings,
  Save,
  Loader2,
  Globe,
  Mail,
  Share2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

interface SiteSetting {
  id: string
  key: string
  value: string
  label: string | null
  type: string
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const role = (session?.user?.role as string) || ""

  const { data: settings, isLoading } = useQuery<SiteSetting[]>({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings")
      if (!res.ok) throw new Error("Failed to fetch settings")
      const data = await res.json()
      // API returns { settings: Record, raw: SiteSetting[] }
      return Array.isArray(data) ? data : (data.raw || [])
    },
  })

  const initialSettings = useMemo(() => {
    const general: Record<string, string> = {}
    const social: Record<string, string> = {}
    const email: Record<string, string> = {}

    settings?.forEach((s) => {
      if (s.key.startsWith("social_")) {
        social[s.key] = s.value
      } else if (s.key.startsWith("email_") || s.key.startsWith("smtp_") || s.key.startsWith("newsletter_")) {
        email[s.key] = s.value
      } else {
        general[s.key] = s.value
      }
    })

    return { general, social, email }
  }, [settings])

  const [generalSettings, setGeneralSettings] = useState<Record<string, string>>({})
  const [socialSettings, setSocialSettings] = useState<Record<string, string>>({})
  const [emailSettings, setEmailSettings] = useState<Record<string, string>>({})

  // Initialize form state from query data
  const [initialized, setInitialized] = useState(false)
  if (settings && !initialized) {
    setGeneralSettings(initialSettings.general)
    setSocialSettings(initialSettings.social)
    setEmailSettings(initialSettings.email)
    setInitialized(true)
  }

  const saveMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: Object.entries(data).map(([key, value]) => ({ key, value })) }),
      })
      if (!res.ok) throw new Error("Failed to save settings")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] })
      toast.success("Settings saved")
    },
    onError: () => toast.error("Failed to save settings"),
  })

  if (role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Only Admins can access site settings.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Configure your site settings</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2"><Globe className="size-4 hidden sm:inline" /> General</TabsTrigger>
          <TabsTrigger value="social" className="gap-2"><Share2 className="size-4 hidden sm:inline" /> Social</TabsTrigger>
          <TabsTrigger value="email" className="gap-2"><Mail className="size-4 hidden sm:inline" /> Email</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic site configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-10 bg-muted animate-pulse rounded" />
                  </div>
                ))
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Site Name</Label>
                    <Input
                      value={generalSettings.site_name || ""}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, site_name: e.target.value })}
                      placeholder="Sanaa Through My Lens"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Site Description</Label>
                    <Textarea
                      value={generalSettings.site_description || ""}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, site_description: e.target.value })}
                      placeholder="A creative blog celebrating art, culture, and stories..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Site URL</Label>
                    <Input
                      value={generalSettings.site_url || ""}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, site_url: e.target.value })}
                      placeholder="https://sanaathrumylens.co.ke"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Posts Per Page</Label>
                    <Input
                      type="number"
                      value={generalSettings.posts_per_page || "10"}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, posts_per_page: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Footer Text</Label>
                    <Input
                      value={generalSettings.footer_text || ""}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, footer_text: e.target.value })}
                      placeholder="© 2024 Sanaa Through My Lens"
                    />
                  </div>
                  <Button onClick={() => saveMutation.mutate(generalSettings)} disabled={saveMutation.isPending}>
                    {saveMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    <Save className="mr-2 size-4" /> Save General Settings
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>Connect your social media accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-10 bg-muted animate-pulse rounded" />
                  </div>
                ))
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Twitter/X</Label>
                    <Input value={socialSettings.social_twitter || ""} onChange={(e) => setSocialSettings({ ...socialSettings, social_twitter: e.target.value })} placeholder="https://twitter.com/..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Instagram</Label>
                    <Input value={socialSettings.social_instagram || ""} onChange={(e) => setSocialSettings({ ...socialSettings, social_instagram: e.target.value })} placeholder="https://instagram.com/..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Facebook</Label>
                    <Input value={socialSettings.social_facebook || ""} onChange={(e) => setSocialSettings({ ...socialSettings, social_facebook: e.target.value })} placeholder="https://facebook.com/..." />
                  </div>
                  <div className="space-y-2">
                    <Label>YouTube</Label>
                    <Input value={socialSettings.social_youtube || ""} onChange={(e) => setSocialSettings({ ...socialSettings, social_youtube: e.target.value })} placeholder="https://youtube.com/..." />
                  </div>
                  <div className="space-y-2">
                    <Label>LinkedIn</Label>
                    <Input value={socialSettings.social_linkedin || ""} onChange={(e) => setSocialSettings({ ...socialSettings, social_linkedin: e.target.value })} placeholder="https://linkedin.com/..." />
                  </div>
                  <Button onClick={() => saveMutation.mutate(socialSettings)} disabled={saveMutation.isPending}>
                    {saveMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    <Save className="mr-2 size-4" /> Save Social Links
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email & Newsletter Settings</CardTitle>
              <CardDescription>Configure email and newsletter options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                    <div className="h-10 bg-muted animate-pulse rounded" />
                  </div>
                ))
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>SMTP Host</Label>
                    <Input value={emailSettings.smtp_host || ""} onChange={(e) => setEmailSettings({ ...emailSettings, smtp_host: e.target.value })} placeholder="smtp.example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Port</Label>
                    <Input value={emailSettings.smtp_port || ""} onChange={(e) => setEmailSettings({ ...emailSettings, smtp_port: e.target.value })} placeholder="587" />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP User</Label>
                    <Input value={emailSettings.smtp_user || ""} onChange={(e) => setEmailSettings({ ...emailSettings, smtp_user: e.target.value })} placeholder="noreply@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Password</Label>
                    <Input
                      type="password"
                      value={emailSettings.smtp_pass || ""}
                      onChange={(e) => setEmailSettings({ ...emailSettings, smtp_pass: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Newsletter From Name</Label>
                    <Input value={emailSettings.newsletter_from_name || ""} onChange={(e) => setEmailSettings({ ...emailSettings, newsletter_from_name: e.target.value })} placeholder="Sanaa Through My Lens" />
                  </div>
                  <Button onClick={() => saveMutation.mutate(emailSettings)} disabled={saveMutation.isPending}>
                    {saveMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    <Save className="mr-2 size-4" /> Save Email Settings
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
