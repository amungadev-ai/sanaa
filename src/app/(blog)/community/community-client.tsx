"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  PenLine,
  CheckCircle2,
  Loader2,
  AlertCircle,
  BookOpen,
  Shield,
  Users,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  slug: string;
  color: string | null;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
}

// Role hierarchy for subdomain mapping
const ROLE_SUBDOMAIN_MAP: Record<string, string> = {
  ADMIN: "admin",
  EDITOR: "editor",
};

export function CommunityClient() {
  const { data: session, status } = useSession();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Word count
  const wordCount = content
    .split(/\s+/)
    .filter(Boolean).length;

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, tagRes] = await Promise.all([
          fetch("/api/categories"),
          fetch("/api/tags"),
        ]);
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
        }
        if (tagRes.ok) {
          const tagData = await tagRes.json();
          setTags(tagData);
        }
      } catch {
        // Silently fail — form can still work without preloaded data
      } finally {
        setIsLoadingData(false);
      }
    }
    fetchData();
  }, []);

  const userRole = session?.user?.role as string | undefined;
  const isReader = userRole === "READER";
  const isStaff = userRole && userRole !== "READER" && ROLE_SUBDOMAIN_MAP[userRole];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (title.length < 5) {
      setError("Title must be at least 5 characters");
      return;
    }
    if (title.length > 200) {
      setError("Title must be at most 200 characters");
      return;
    }
    if (content.length < 100) {
      setError("Content must be at least 100 characters");
      return;
    }
    if (selectedCategoryIds.length === 0) {
      setError("Please select at least one category");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/community/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          categoryIds: selectedCategoryIds,
          tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Submission failed. Please try again.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function toggleCategory(id: string) {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  function toggleTag(id: string) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  // Success state
  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-8 text-center space-y-4">
            <CheckCircle2 className="size-16 text-emerald-500 mx-auto" />
            <h2 className="text-2xl font-bold font-serif">Thank You!</h2>
            <p className="text-muted-foreground text-lg">
              Your submission is under review. Our editorial team will review your
              article and get back to you.
            </p>
            <p className="text-sm text-muted-foreground">
              You&apos;ll receive a notification once your article is published.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <Button asChild>
                <Link href="/">Back to Home</Link>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(false);
                  setTitle("");
                  setContent("");
                  setSelectedCategoryIds([]);
                  setSelectedTagIds([]);
                }}
              >
                Submit Another Story
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center size-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 mb-4">
          <PenLine className="size-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
          Share Your Voice
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Have a perspective on arts and culture in East Africa? We want to hear
          from you.
        </p>
      </div>

      {/* Requirements */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        <Card>
          <CardContent className="pt-6 text-center">
            <FileText className="size-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <h3 className="font-semibold mb-1">Minimum 100 Words</h3>
            <p className="text-sm text-muted-foreground">
              Share enough detail to make your perspective meaningful
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="size-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <h3 className="font-semibold mb-1">Original Content</h3>
            <p className="text-sm text-muted-foreground">
              Your submission must be your own original work
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="size-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
            <h3 className="font-semibold mb-1">Editorial Review</h3>
            <p className="text-sm text-muted-foreground">
              All submissions are reviewed before publishing
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Auth-dependent content */}
      {status === "loading" && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {status !== "loading" && !session?.user?.id && (
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-8 text-center space-y-4">
            <Users className="size-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-semibold">Sign in to submit your story</h2>
            <p className="text-muted-foreground">
              Create a free reader account or sign in to share your perspective
              with our community.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/auth/signin">Sign In</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth/signup">Create Account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {status !== "loading" && session?.user?.id && isStaff && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardContent className="pt-8 text-center space-y-4">
            <AlertCircle className="size-12 text-amber-500 mx-auto" />
            <h2 className="text-xl font-semibold">
              Staff members use the dashboard editor
            </h2>
            <p className="text-muted-foreground">
              As a {userRole}, you can create and publish articles directly from
              your dashboard.
            </p>
            <Button asChild>
              <Link href="/dashboard/posts/new">Go to Dashboard Editor</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {status !== "loading" && session?.user?.id && isReader && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Submit Your Story</CardTitle>
            <CardDescription>
              Fill out the form below to submit your community voice article.
              It will be reviewed by our editorial team before publishing.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Give your article a compelling title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {title.length}/200 characters
                </p>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Share your perspective on arts and culture in East Africa..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[250px]"
                  required
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className={wordCount < 100 ? "text-destructive" : "text-emerald-600"}>
                    {wordCount} words (minimum 100)
                  </span>
                  <span>{content.length} characters</span>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2">
                <Label>Categories (select at least one)</Label>
                {isLoadingData ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Loading categories...
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors border ${
                          selectedCategoryIds.includes(cat.id)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-input hover:bg-accent"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tags (optional) */}
              <div className="space-y-2">
                <Label>Tags (optional)</Label>
                {isLoadingData ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Loading tags...
                  </div>
                ) : tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm transition-colors border ${
                          selectedTagIds.includes(tag.id)
                            ? "bg-secondary text-secondary-foreground border-secondary"
                            : "bg-background text-muted-foreground border-input hover:bg-accent"
                        }`}
                      >
                        #{tag.name}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No tags available</p>
                )}
              </div>

              {/* Submit */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4 border-t">
                <Button
                  type="submit"
                  className="w-full sm:w-auto gap-2"
                  disabled={
                    isSubmitting ||
                    title.length < 5 ||
                    content.length < 100 ||
                    selectedCategoryIds.length === 0
                  }
                >
                  {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                  Submit for Review
                </Button>
                <p className="text-xs text-muted-foreground text-center sm:text-left">
                  By submitting, you confirm this is your original work and you
                  agree to our editorial guidelines.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Info section at the bottom */}
      <div className="mt-12 text-center">
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
        >
          Community Voice
        </Badge>
        <p className="mt-3 text-sm text-muted-foreground max-w-lg mx-auto">
          Community Voice articles are written by our readers. Each submission is
          reviewed by our editorial team to ensure quality and relevance. Approved
          articles are published with a special &quot;Community Voice&quot; badge.
        </p>
      </div>
    </div>
  );
}
