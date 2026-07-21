# Subdomain Dashboard Setup Guide

This guide explains how to connect your subdomains to the role-based dashboards for **Sanaa Through My Lens**.

## Architecture Overview

All subdomains point to the **same Next.js deployment**. The application's middleware detects which subdomain the request is coming from and enforces role-based access automatically.

| Subdomain | Required Role | Dashboard |
|-----------|---------------|-----------|
| `sanaathrumylens.co.ke` | Public + Reader | Public blog + Reader dashboard at `/dashboard` |
| `control.sanaathrumylens.co.ke` | Super Admin | Full system control |
| `admin.sanaathrumylens.co.ke` | Admin+ | Content management & users |
| `editor.sanaathrumylens.co.ke` | Editor+ | Review & publish content |
| `author.sanaathrumylens.co.ke` | Author+ | Write & submit stories |

**Role Inheritance**: Higher roles can access lower subdomains. For example, a Super Admin can access `admin.sanaathrumylens.co.ke`, `editor.sanaathrumylens.co.ke`, and `author.sanaathrumylens.co.ke`.

---

## Step 1: DNS Configuration

Add DNS records for each subdomain pointing to your hosting provider.

### Option A: Vercel Deployment

1. Go to your Vercel project → **Settings** → **Domains**
2. Add each subdomain:
   - `sanaathrumylens.co.ke`
   - `control.sanaathrumylens.co.ke`
   - `admin.sanaathrumylens.co.ke`
   - `editor.sanaathrumylens.co.ke`
   - `author.sanaathrumylens.co.ke`
3. Vercel will show you the DNS records to add

In your DNS provider (Cloudflare, Namecheap, etc.), add:

```
# A Record (point to Vercel's IP) or CNAME (point to cname.vercel-dns.com)
A    @               → 76.76.21.21
CNAME control        → cname.vercel-dns.com
CNAME admin          → cname.vercel-dns.com
CNAME editor         → cname.vercel-dns.com
CNAME author         → cname.vercel-dns.com
```

### Option B: Shared Hosting (cPanel)

1. Log into cPanel at `https://da27.host-ww.net:2083`
2. Go to **Domains** → **Subdomains**
3. Create each subdomain:
   - `control.sanaathrumylens.co.ke` → Document Root: `public_html`
   - `admin.sanaathrumylens.co.ke` → Document Root: `public_html`
   - `editor.sanaathrumylens.co.ke` → Document Root: `public_html`
   - `author.sanaathrumylens.co.ke` → Document Root: `public_html`

> **Important**: All subdomains should point to the **same document root** as the main site. The Next.js app handles the routing internally.

### Option C: VPS (Nginx)

```nginx
# /etc/nginx/sites-available/sanaathrumylens.co.ke

server {
    listen 80;
    server_name sanaathrumylens.co.ke control.sanaathrumylens.co.ke 
                admin.sanaathrumylens.co.ke editor.sanaathrumylens.co.ke 
                author.sanaathrumylens.co.ke;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

The key line is `proxy_set_header Host $host;` — this ensures the subdomain is passed through to Next.js so the middleware can detect it.

---

## Step 2: SSL/HTTPS

Each subdomain needs an SSL certificate.

### Vercel
SSL is automatic — Vercel provisions certificates for all added domains.

### Cloudflare (Recommended for Shared Hosting)
1. Point your nameservers to Cloudflare
2. Enable **Full (Strict)** SSL mode
3. Cloudflare automatically provisions certificates for all subdomains
4. Enable "Always Use HTTPS" in Cloudflare

### Let's Encrypt (VPS)
```bash
sudo certbot --nginx -d sanaathrumylens.co.ke \
  -d control.sanaathrumylens.co.ke \
  -d admin.sanaathrumylens.co.ke \
  -d editor.sanaathrumylens.co.ke \
  -d author.sanaathrumylens.co.ke
```

---

## Step 3: NextAuth Cookie Configuration

For session cookies to work across subdomains, the `NEXTAUTH_URL` must be set and cookies need the root domain.

In your `.env` for production:

```env
NEXTAUTH_URL=https://sanaathrumylens.co.ke
```

In `src/lib/auth.ts`, the cookies should be configured with the root domain:

```typescript
cookies: {
  sessionToken: {
    name: `next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      domain: ".sanaathrumylens.co.ke", // ← dot prefix = all subdomains
      secure: true,
    },
  },
  // ... same for csrfToken, callbackUrl
},
```

This ensures that logging in on `admin.sanaathrumylens.co.ke` also authenticates on `editor.sanaathrumylens.co.ke`.

---

## Step 4: Environment Variables

Set these in your production environment:

```env
# Production Database
DATABASE_URL="mysql://jobready_sanaa_blog_db_admin:030290@Amunga@100%@da27.host-ww.net:3306/jobready_sanaa_blog_db"

# NextAuth
NEXTAUTH_SECRET=your-secure-random-string-here
NEXTAUTH_URL=https://sanaathrumylens.co.ke

# Root Domain (used by subdomain detection)
NEXT_PUBLIC_ROOT_DOMAIN=sanaathrumylens.co.ke

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Cron Key (for scheduled campaigns)
CRON_KEY=your-cron-secret-key

# VAPID Keys (for push notifications)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
```

---

## Step 5: Verify Everything Works

1. **Visit `sanaathrumylens.co.ke`** — Should show the public blog
2. **Visit `sanaathrumylens.co.ke/dashboard`** — Should redirect to sign-in, then show reader dashboard
3. **Visit `control.sanaathrumylens.co.ke`** — Should redirect to sign-in, then super admin dashboard (with rose accent bar)
4. **Visit `admin.sanaathrumylens.co.ke`** — Admin dashboard (amber accent)
5. **Visit `editor.sanaathrumylens.co.ke`** — Editor dashboard (emerald accent)
6. **Visit `author.sanaathrumylens.co.ke`** — Author dashboard (sky accent)

If you try to access a subdomain you don't have permission for, you'll be redirected to `/dashboard/redirect` which shows an access denied page with a link to your correct dashboard.

---

## Local Development

In local development (`localhost:3000`), subdomain enforcement is **disabled**. All roles can access `/dashboard` and the role-based sidebar shows the correct navigation for each role. This makes it easy to test all dashboards without setting up local subdomains.

If you want to test subdomains locally, you can add entries to your `/etc/hosts`:

```
127.0.0.1 control.localhost
127.0.0.1 admin.localhost
127.0.0.1 editor.localhost
127.0.0.1 author.localhost
```

Then access `http://control.localhost:3000/dashboard` etc.

---

## Troubleshooting

### Cookies not working across subdomains
- Make sure the cookie domain is set to `.sanaathrumylens.co.ke` (with the leading dot)
- Make sure `NEXTAUTH_URL` is set to the base domain
- Make sure HTTPS is working (cookies with `Secure` flag only work over HTTPS)

### Subdomain shows 404
- Make sure the subdomain's DNS points to the same server as the main domain
- Make sure the web server (Nginx/Apache) is configured to serve the same app for all subdomains
- Check that the `Host` header is being passed through to Node.js

### Redirect loops
- Make sure your Cloudflare SSL mode is "Full" or "Full (Strict)", not "Flexible"
- Check that the middleware isn't creating infinite redirects by comparing `hostname` correctly

### Middleware not detecting subdomain
- The middleware reads the `Host` header from the request
- If behind a proxy/CDN, make sure `X-Forwarded-Host` is being set
- Check the `next.config.ts` doesn't strip headers
