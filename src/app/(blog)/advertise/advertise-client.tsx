'use client';

import { useState } from 'react';
import { Check, Star, Zap, Crown, Send, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const tiers = [
  {
    name: 'Basic',
    icon: Zap,
    price: '$150',
    period: '/post',
    description: 'Perfect for local businesses and startups',
    features: [
      'Single sponsored article',
      'Up to 500 words',
      '1 category placement',
      'Social media mention',
      '7-day featured placement',
      'Basic analytics report',
    ],
    color: 'border-border',
    iconColor: 'text-amber-500',
    popular: false,
  },
  {
    name: 'Premium',
    icon: Star,
    price: '$350',
    period: '/post',
    description: 'Maximum visibility and engagement',
    features: [
      'Enhanced sponsored article',
      'Up to 1,500 words',
      '2 category placements',
      'Social media campaign (3 posts)',
      '14-day featured placement',
      'Detailed analytics & CTR report',
      'Newsletter feature inclusion',
      'Custom banner design',
    ],
    color: 'border-primary',
    iconColor: 'text-primary',
    popular: true,
  },
  {
    name: 'Featured',
    icon: Crown,
    price: '$600',
    period: '/post',
    description: 'Ultimate brand exposure package',
    features: [
      'Premium long-form article',
      'Up to 3,000 words',
      '3+ category placements',
      'Full social media campaign',
      '30-day featured placement',
      'Comprehensive analytics suite',
      'Newsletter lead feature',
      'Custom banner + sidebar ad',
      'Dedicated account manager',
      'Performance guarantee',
    ],
    color: 'border-amber-500',
    iconColor: 'text-amber-600',
    popular: false,
  },
];

export default function AdvertiseClient() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    advertiserName: '',
    advertiserEmail: '',
    companyName: '',
    postTitle: '',
    postContent: '',
    proposedCategory: '',
    budget: '',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/sponsored/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsSubmitted(true);
        toast.success('Submission received! We\'ll be in touch shortly.');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to submit');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <Card className="max-w-lg w-full text-center p-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="font-serif text-2xl font-bold mb-3">Thank You!</h1>
          <p className="text-muted-foreground mb-6">
            Your sponsored content submission has been received. Our team will review it and get back to you within 24-48 hours.
          </p>
          <Button onClick={() => { setIsSubmitted(false); setFormData({ advertiserName: '', advertiserEmail: '', companyName: '', postTitle: '', postContent: '', proposedCategory: '', budget: '', notes: '' }); }}>
            Submit Another
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Hero */}
      <div className="text-center mb-12 sm:mb-16">
        <Badge variant="outline" className="mb-4 text-amber-600 border-amber-300">
          Partner With Us
        </Badge>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
          Advertise with <span className="text-primary">Sanaa Through My Lens</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Reach a passionate audience of art enthusiasts, culture lovers, and creative professionals across Kenya and East Africa.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12 sm:mb-16">
        {[
          { value: '25K+', label: 'Monthly Readers' },
          { value: '12K+', label: 'Newsletter Subscribers' },
          { value: '45K+', label: 'Social Media Reach' },
          { value: '3.5min', label: 'Avg. Read Time' },
        ].map((stat) => (
          <div key={stat.label} className="text-center p-4 rounded-lg bg-accent/50">
            <p className="text-2xl sm:text-3xl font-bold text-primary">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Pricing Tiers */}
      <div className="mb-16">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-center mb-8">
          Choose Your Package
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative ${tier.color} ${tier.popular ? 'scale-105 shadow-lg' : ''}`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <tier.icon className={`h-8 w-8 mx-auto mb-2 ${tier.iconColor}`} />
                <CardTitle className="font-serif text-xl">{tier.name}</CardTitle>
                <CardDescription>{tier.description}</CardDescription>
                <div className="mt-3">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full mt-6 gap-2"
                  variant={tier.popular ? 'default' : 'outline'}
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, budget: tier.name }));
                    document.getElementById('submit-form')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Submission Form */}
      <div id="submit-form" className="scroll-mt-20">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="font-serif text-2xl">Submit Your Sponsored Content</CardTitle>
            <CardDescription>
              Fill out the form below and our team will review your submission within 24-48 hours.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="advertiserName">Full Name *</Label>
                  <Input
                    id="advertiserName"
                    value={formData.advertiserName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, advertiserName: e.target.value }))}
                    required
                    placeholder="Your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="advertiserEmail">Email Address *</Label>
                  <Input
                    id="advertiserEmail"
                    type="email"
                    value={formData.advertiserEmail}
                    onChange={(e) => setFormData((prev) => ({ ...prev, advertiserEmail: e.target.value }))}
                    required
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company / Brand Name *</Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, companyName: e.target.value }))}
                  required
                  placeholder="Your company or brand"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postTitle">Proposed Post Title *</Label>
                <Input
                  id="postTitle"
                  value={formData.postTitle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, postTitle: e.target.value }))}
                  required
                  placeholder="Enter a catchy title for your sponsored post"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="postContent">Post Content / Brief *</Label>
                <Textarea
                  id="postContent"
                  value={formData.postContent}
                  onChange={(e) => setFormData((prev) => ({ ...prev, postContent: e.target.value }))}
                  required
                  rows={6}
                  placeholder="Provide the content or a detailed brief for your sponsored post..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="proposedCategory">Preferred Category</Label>
                  <Select
                    value={formData.proposedCategory}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, proposedCategory: value }))}
                  >
                    <SelectTrigger id="proposedCategory">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="music">Music</SelectItem>
                      <SelectItem value="film-video">Film & Video</SelectItem>
                      <SelectItem value="books-literature">Books & Literature</SelectItem>
                      <SelectItem value="visual-arts">Visual Arts</SelectItem>
                      <SelectItem value="theatre-performance">Theatre & Performance</SelectItem>
                      <SelectItem value="interviews-features">Interviews & Features</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget Tier</Label>
                  <Select
                    value={formData.budget}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, budget: value }))}
                  >
                    <SelectTrigger id="budget">
                      <SelectValue placeholder="Select a tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Basic">Basic — $150</SelectItem>
                      <SelectItem value="Premium">Premium — $350</SelectItem>
                      <SelectItem value="Featured">Featured — $600</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  placeholder="Any special requests, preferred dates, or other details..."
                />
              </div>

              <Button type="submit" className="w-full gap-2" size="lg" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit for Review
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                By submitting, you agree to our advertising terms and conditions. All sponsored content is clearly labeled.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
