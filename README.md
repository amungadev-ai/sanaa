# Sanaa Through My Lens

> Arts & Culture Opinion Blog — Highlighting stories around the art scene in Kenya and East Africa

**Sanaa** means *Art* in Swahili. Sanaa Through My Lens is an arts and culture opinion blog that highlights stories around the art scene — music, film, book reviews & commentary, events, and infortainment. We feature mainly events around Kenya, East Africa, and the world.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Prisma ORM (SQLite dev / MySQL production)
- **Auth**: NextAuth.js v4 (Credentials + Google OAuth + 2FA)
- **Editor**: Tiptap WYSIWYG
- **Charts**: Recharts
- **Fonts**: Playfair Display (headlines) + Inter (body)
- **Icons**: Lucide React

## Features

### Phase 1 — Public Blog & Core CMS
- Modern newspaper-style layout with trending ticker, hero featured posts, category tabs
- Events calendar with city/category filters
- Full-text search
- Newsletter subscription ("This Week in East African Arts")
- Dark/light mode
- SEO optimized (meta tags, Open Graph, JSON-LD)
- Social sharing (Twitter, Facebook, WhatsApp)
- Responsive mobile-first design
- **6 Role-Based Access Levels**: Super Admin, Admin, Editor, Author, Moderator, Reader
- Role-aware sidebar navigation with role inheritance
- Post management with editorial workflow (Draft → Pending Review → Approved → Published)
- Tiptap WYSIWYG editor with image upload & YouTube embed
- Scheduled publishing & revision history
- Comment moderation
- Events management
- Categories & tags with color coding
- Media library with drag-drop upload
- User management (Super Admin only)
- 2FA (Email OTP)
- Profile management

### Phase 2 — Advanced Features
- **Artist/Creator Profiles** — Dedicated public pages with bio, social links, linked posts & events; dashboard CRUD management
- **Content Calendar** — Visual month/week view showing scheduled posts, events, and pending reviews
- **Ad Manager** — Create, manage, and track ads with 5 placement types (Header Banner, Sidebar, In-Article, Footer, Between Posts); impression & click tracking
- **Ad Rendering** — Reusable `AdSlot` component with IntersectionObserver-based impression tracking and click tracking; integrated on homepage, post detail, and between posts
- **Built-in Analytics** — Page view tracking, daily stats, top posts, views by category, referrer tracking; Recharts-powered dashboard with 7/30/90 day ranges
- **Bookmark/Saved Posts** — Readers can save articles and events; animated bookmark button; dedicated reader dashboard with bookmarks & comments tabs
- **Push Notifications** — In-app notification bell with 30s polling; browser push notification support via Service Worker & Web Push API; notification prompt in header
- **Sponsored Post Workflow** — Public "Advertise with Us" page with pricing tiers; advertiser submission → admin review → publish flow; sponsored badge & disclosure on posts
- **Email Campaigns** — Create, schedule, and send email campaigns from the CMS; subscriber management with CSV export; open & click tracking via tracking pixel and click redirects; scheduled campaign processor for cron-based sending
- **Reader Dashboard** — Bookmarks, comments, and settings tabs; newsletter & notification preferences; dark mode toggle

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- A MySQL database (for production) or SQLite (included for dev)

### Installation

```bash
# Clone the repo
git clone https://github.com/Lulu-ke/sanaathrumylens.co.ke_website.git
cd sanaathrumylens.co.ke_website

# Install dependencies
bun install

# Copy environment config
cp .env.example .env
# Edit .env with your database and auth credentials

# Set up database
bun run db:push
bun run db:seed

# Start development server
bun run dev
```

### Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@sanaathrumylens.co.ke | Admin@2024! |
| Editor | editor@sanaathrumylens.co.ke | Editor@2024! |
| Author | author@sanaathrumylens.co.ke | Author@2024! |
| Moderator | moderator@sanaathrumylens.co.ke | Moderator@2024! |

> ⚠️ Change these passwords immediately after first login in production!

## Project Structure

```
src/
├── app/
│   ├── (blog)/              # Public blog pages
│   │   ├── page.tsx         # Homepage
│   │   ├── post/[slug]/     # Article pages
│   │   ├── category/        # Category pages
│   │   ├── tag/             # Tag pages
│   │   ├── author/          # Author profiles
│   │   ├── artist/[slug]/   # Artist profiles
│   │   ├── artists/         # Artists directory
│   │   ├── events/          # Events listing & detail
│   │   ├── search/          # Search page
│   │   ├── newsletter/      # Newsletter signup
│   │   ├── advertise/       # Advertise with Us
│   │   └── about/           # About page
│   ├── auth/                # Sign-in pages
│   ├── dashboard/           # CMS dashboard
│   │   ├── posts/           # Post management
│   │   ├── comments/        # Comment moderation
│   │   ├── events/          # Event management
│   │   ├── artists/         # Artist management
│   │   ├── calendar/        # Content calendar
│   │   ├── analytics/       # Built-in analytics
│   │   ├── ads/             # Ad management
│   │   ├── sponsored/       # Sponsored content review
│   │   ├── campaigns/       # Email campaigns
│   │   ├── subscribers/     # Newsletter subscribers
│   │   ├── categories/      # Category management
│   │   ├── tags/            # Tag management
│   │   ├── media/           # Media library
│   │   ├── users/           # User management
│   │   ├── reader/          # Reader dashboard
│   │   ├── settings/        # Site settings
│   │   └── profile/         # Profile settings
│   └── api/                 # API routes
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── blog/                # Blog-specific components
│   │   ├── ad-slot.tsx      # Ad rendering with tracking
│   │   ├── artist-card.tsx  # Artist profile cards
│   │   ├── bookmark-button.tsx
│   │   └── ...
│   ├── layout/              # Header, Footer, NotificationBell
│   ├── analytics/           # Analytics tracker
│   └── editor/              # Tiptap editor
├── lib/                     # Utilities, auth, db, push-notifications
└── types/                   # TypeScript types
```

## API Routes

### Public (No Auth Required)
- `GET /api/posts` — List published posts
- `GET /api/artists` — List artists
- `GET /api/events` — List events
- `GET /api/categories` — List categories
- `GET /api/tags` — List tags
- `GET /api/ads` — List active ads
- `POST /api/analytics/track` — Track page views
- `POST /api/ads/track` — Track ad impressions/clicks
- `POST /api/sponsored/submit` — Submit sponsored content
- `POST /api/newsletter` — Subscribe to newsletter
- `GET /api/campaigns/track` — Email open/click tracking

### Protected (Auth Required)
- `GET/POST /api/bookmarks` — Reader bookmarks
- `GET/PATCH/DELETE /api/notifications` — User notifications
- `POST /api/campaigns/[id]/send` — Send email campaign (Admin+)
- `POST /api/campaigns/process-scheduled` — Process scheduled campaigns (cron)
- `GET /api/analytics/overview` — Analytics dashboard (Editor+)

## Production Deployment

1. Set `DATABASE_URL` to your MySQL connection string in `.env`
2. Change Prisma provider to `"mysql"` in `prisma/schema.prisma`
3. Add MySQL column types (`@db.MediumText`, `@db.LongText`) to the schema
4. Run `bun run db:push` against MySQL
5. Configure Google OAuth credentials
6. Set up SMTP for email OTP, newsletters, and campaigns
7. Set up your media CDN (e.g., `cdn.sanaathrumylens.co.ke`)
8. Generate VAPID keys for browser push notifications
9. Set up a cron job to call `POST /api/campaigns/process-scheduled` with header `x-cron-key: YOUR_CRON_KEY`

## License

Private — All rights reserved.
