"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  User,
  Lock,
  Shield,
  Camera,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { toast } from "sonner"

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [show2FAVerify, setShow2FAVerify] = useState(false)
  const [show2FADisable, setShow2FADisable] = useState(false)
  const [otp, setOtp] = useState("")
  const [disablePassword, setDisablePassword] = useState("")
  const [devCode, setDevCode] = useState<string | null>(null)

  // Fetch user profile on load
  const { data: profile } = useQuery({
    queryKey: ["my-profile"],
    queryFn: async () => {
      const res = await fetch("/api/users/me")
      if (!res.ok) throw new Error("Failed to fetch profile")
      return res.json()
    },
  })

  // Initialize form state from profile data (once)
  const [initialized, setInitialized] = useState(false)
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [image, setImage] = useState("")
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  if (profile && !initialized) {
    setName(profile.name || "")
    setBio(profile.bio || "")
    setImage(profile.image || "")
    setTwoFactorEnabled(profile.twoFactorEnabled || false)
    setInitialized(true)
  }

  const profileMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/users/${session?.user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, image }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update profile")
      }
      return res.json()
    },
    onSuccess: () => {
      updateSession()
      toast.success("Profile updated")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const passwordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) throw new Error("Passwords do not match")
      if (newPassword.length < 8) throw new Error("Password must be at least 8 characters")
      const res = await fetch(`/api/users/${session?.user?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, password: newPassword }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to change password")
      }
      return res.json()
    },
    onSuccess: () => {
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Password changed")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    formData.append("folder", "profiles")
    try {
      const res = await fetch("/api/media", { method: "POST", body: formData })
      const data = await res.json()
      if (data.url) {
        setImage(data.url)
        toast.success("Image uploaded")
      }
    } catch {
      toast.error("Failed to upload image")
    }
  }

  // Enable 2FA: Generate and send code
  const enable2FAMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/2fa", {
        method: "PUT",
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to enable 2FA")
      }
      return res.json()
    },
    onSuccess: (data) => {
      setShow2FAVerify(true)
      if (data.devCode) {
        setDevCode(data.devCode)
        toast.info(`Dev mode: Your code is ${data.devCode}`)
      } else {
        toast.success("Verification code sent to your email")
      }
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Verify 2FA code
  const verify2FAMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otp }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Invalid code")
      }
      return res.json()
    },
    onSuccess: () => {
      setTwoFactorEnabled(true)
      setShow2FAVerify(false)
      setOtp("")
      setDevCode(null)
      toast.success("2FA enabled successfully")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  // Disable 2FA
  const disable2FAMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/2fa", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: disablePassword }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to disable 2FA")
      }
      return res.json()
    },
    onSuccess: () => {
      setTwoFactorEnabled(false)
      setShow2FADisable(false)
      setDisablePassword("")
      toast.success("2FA disabled")
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handle2FAToggle = () => {
    if (twoFactorEnabled) {
      // Show disable dialog (requires password)
      setShow2FADisable(true)
    } else {
      // Enable 2FA: generate and send code
      enable2FAMutation.mutate()
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2"><User className="size-4 hidden sm:inline" /> General</TabsTrigger>
          <TabsTrigger value="password" className="gap-2"><Lock className="size-4 hidden sm:inline" /> Password</TabsTrigger>
          <TabsTrigger value="security" className="gap-2"><Shield className="size-4 hidden sm:inline" /> Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="size-20">
                  <AvatarImage src={image || undefined} alt={name} />
                  <AvatarFallback className="text-2xl">{name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <label>
                    <Button variant="outline" size="sm" className="gap-2 cursor-pointer" asChild>
                      <span><Camera className="size-4" /> Change Avatar</span>
                    </Button>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <p className="text-xs text-muted-foreground">JPG, PNG or GIF. Max 2MB.</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={session?.user?.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <div>
                  <Badge variant="secondary" className="text-sm">{session?.user?.role || "USER"}</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Bio</Label>
                <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={4} />
              </div>

              <Button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending}>
                {profileMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Enter current password" />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters" />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" />
              </div>
              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-destructive">Passwords do not match</p>
              )}
              <Button onClick={() => passwordMutation.mutate()} disabled={passwordMutation.isPending || !currentPassword || !newPassword}>
                {passwordMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                Change Password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">2FA Authentication</p>
                  <p className="text-sm text-muted-foreground">
                    {twoFactorEnabled
                      ? "Two-factor authentication is enabled"
                      : "Protect your account with 2FA"}
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  onCheckedChange={handle2FAToggle}
                  disabled={enable2FAMutation.isPending}
                />
              </div>

              {twoFactorEnabled && !show2FADisable && (
                <Badge variant="default" className="gap-1">
                  <Shield className="size-3" /> 2FA Enabled
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* 2FA Enable Verification */}
          {show2FAVerify && (
            <Card>
              <CardHeader>
                <CardTitle>Verify 2FA Setup</CardTitle>
                <CardDescription>Enter the 6-digit code sent to your email</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {devCode && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    <p className="font-medium">Dev Mode</p>
                    <p>Your verification code: <span className="font-mono font-bold">{devCode}</span></p>
                  </div>
                )}
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
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setShow2FAVerify(false); setOtp(""); setDevCode(null) }}>Cancel</Button>
                  <Button onClick={() => verify2FAMutation.mutate()} disabled={otp.length < 6 || verify2FAMutation.isPending}>
                    {verify2FAMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Verify & Enable
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 2FA Disable Confirmation */}
          {show2FADisable && (
            <Card>
              <CardHeader>
                <CardTitle>Disable 2FA</CardTitle>
                <CardDescription>Enter your current password to disable two-factor authentication</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input
                    type="password"
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Enter your current password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { setShow2FADisable(false); setDisablePassword("") }}>Cancel</Button>
                  <Button
                    variant="destructive"
                    onClick={() => disable2FAMutation.mutate()}
                    disabled={!disablePassword || disable2FAMutation.isPending}
                  >
                    {disable2FAMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                    Disable 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
