# MultiPoster TN

**Post once, publish everywhere.**

Social media publishing platform for Tunisian content creators. Upload a short-form video and publish simultaneously to TikTok, Instagram Reels, Facebook Reels, and YouTube Shorts.

## Features

- Multi-platform publishing (TikTok, Instagram, Facebook, YouTube)
- Direct and scheduled publishing (up to 30 days)
- AI caption & hashtag generation (FR/AR/EN)
- Analytics dashboard with Recharts
- Trend discovery for Tunisia
- SaaS subscription tiers (FREE / PRO / AGENCY)
- Admin panel

## Tech Stack

- **Frontend:** Next.js 15 App Router, TypeScript, TailwindCSS, Shadcn/UI, React Query, Zustand
- **Backend:** Next.js API Routes, Node.js, TypeScript
- **Database:** MongoDB + Mongoose
- **Queue:** Redis + BullMQ
- **AI:** Mistral API / Local Llama
- **Video:** FFmpeg
- **Deploy:** Docker, VPS-ready

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Start MongoDB and Redis (or use Docker)
docker-compose up -d mongo redis

# Run development server
npm run dev

# Run background workers (separate terminal)
npm run worker
```

Open [http://localhost:3000](http://localhost:3000)

## Docker (Full Stack)

```bash
cp .env.example .env
# Edit .env with your secrets
docker-compose up -d
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/forgot-password` | Request password reset |
| GET | `/api/platforms` | List platforms & connection status |
| GET | `/api/oauth/:platform/connect` | Start OAuth flow |
| POST | `/api/posts` | Create & publish post |
| GET | `/api/posts` | List user posts |
| POST | `/api/schedule` | Schedule a post |
| GET | `/api/analytics` | Dashboard analytics |
| GET | `/api/trends` | Trending content (Tunisia) |
| POST | `/api/ai?action=captions` | AI caption generator |
| POST | `/api/ai?action=hashtags` | AI hashtag generator |
| POST | `/api/ai?action=viral-score` | Viral score (PRO+) |
| GET | `/api/admin` | Admin overview |

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Vercel deployment & OAuth](docs/VERCEL.md)
- [VPS Deployment Guide](docs/DEPLOYMENT.md)
- [Security Checklist](docs/SECURITY.md)

## Project Structure

Feature-based Clean Architecture with Repository pattern, Service layer, and DTO validation. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

## License

Private — All rights reserved.
