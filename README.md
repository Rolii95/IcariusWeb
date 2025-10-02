# Icarius Consulting Website

This is the source for the **Icarius Consulting** marketing website, deployed on **Vercel**.

## 📂 Structure
- `index.html` — Landing page
- `about.html` — About page
- `work.html` — Case studies / Selected work
- `packages.html` — Packages (pricing) page
- `packages.json` — Data source for packages (edit this to update prices/descriptions)
- `404.html` — Custom branded error page
- `sitemap.xml` — Sitemap for SEO
- `robots.txt` — Robots file pointing to sitemap
- `manifest.json` — PWA manifest with icons and theme color
- `favicon.ico`, `favicon.svg` — Favicon icons
- `apple-touch-icon.png` — Apple iOS home screen icon
- `og-image-brand.png` — Open Graph / Twitter preview image
- `icarius-logo.svg` — Primary logo

## 🚀 Deployment
This project is deployed automatically to **Vercel** whenever changes are pushed to GitHub.

### Initial Setup
1. Connect the repo to Vercel.
2. Ensure `index.html` is used as the entry point.
3. No special build command is needed (static site).

### Updating Content
- **Packages:** Update `packages.json` to change pricing or descriptions. The site fetches this file dynamically.
- **Logo / Icons:** Replace the files in root (`icarius-logo.svg`, `favicon.*`, `apple-touch-icon.png`, `og-image-brand.png`).
- **SEO:** Update `sitemap.xml`, `robots.txt`, and meta tags in HTML if needed.

### PWA Support
The site includes a manifest and icons so it can be installed as a Progressive Web App (PWA).

## 🛠️ Notes
- Hosted on: [https://icarius-consulting.com](https://icarius-consulting.com)
- Built with: **HTML5 + CSS3 (Inter font)**, no JS framework required.
- Analytics, calendly, and form integrations can be added via embedded scripts.
- Booking CTAs resolve the scheduler URL from `NEXT_PUBLIC_BOOKING_URL`. Provide this in `.env.local` for local previews and set the same value in Vercel Project Settings.
