# MultiPoster TN — Architecture

## Overview

MultiPoster TN is a feature-based SaaS built on **Clean Architecture** principles with clear separation between presentation, application, domain, and infrastructure layers.

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  Next.js App Router · Dashboard UI · Admin Panel            │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    API Layer (Controllers)                   │
│  /api/auth · /api/posts · /api/platforms · /api/ai          │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Service Layer                             │
│  AuthService · PostService · AIService · OAuthService       │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Repository Layer                          │
│  UserRepository · PostRepository · AnalyticsRepository      │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                    Infrastructure                            │
│  MongoDB · Redis/BullMQ · Local/S3 Storage · FFmpeg · Mistral│
└─────────────────────────────────────────────────────────────┘
```

## Folder Structure

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # REST API routes (controllers)
│   │   ├── auth/
│   │   ├── posts/
│   │   ├── platforms/
│   │   ├── oauth/[platform]/
│   │   ├── schedule/
│   │   ├── analytics/
│   │   ├── trends/
│   │   ├── ai/
│   │   └── admin/
│   ├── dashboard/                # SaaS dashboard pages
│   ├── admin/                    # Admin panel
│   ├── login/ · register/        # Auth pages
│   └── page.tsx                  # Landing page
├── features/                     # Feature modules (Clean Architecture)
│   ├── auth/
│   │   ├── dto/
│   │   ├── repositories/
│   │   └── services/
│   ├── posts/
│   ├── platforms/
│   ├── analytics/
│   ├── ai/
│   ├── trends/
│   ├── subscription/
│   └── admin/
├── components/
│   ├── ui/                       # Shadcn-style components
│   ├── dashboard/
│   ├── auth/
│   └── admin/
├── lib/
│   ├── config/                   # Environment validation
│   ├── db/                       # MongoDB connection + models
│   ├── auth/                     # JWT + password hashing
│   ├── crypto/                   # OAuth token encryption
│   ├── queue/                    # BullMQ jobs
│   ├── storage/                  # Local/S3 adapter
│   └── middleware/               # Auth + subscription guards
├── stores/                       # Zustand state
└── types/                        # Shared TypeScript types
workers/                          # Background job processors
docker-compose.yml
Dockerfile
docs/
```

## Database Models

| Model | Purpose |
|-------|---------|
| User | Authentication, profile, roles |
| Subscription | SaaS plans (FREE/PRO/AGENCY) |
| ConnectedAccount | Linked social platform accounts |
| OAuthToken | Encrypted access/refresh tokens |
| RefreshToken | JWT refresh token rotation |
| Post | Video posts with platform results |
| ScheduledPost | BullMQ scheduled publish jobs |
| Analytics | Per-platform engagement metrics |
| Trend | Trending hashtags/sounds/categories |
| Notification | User notifications |
| ActivityLog | Audit trail (90-day TTL) |

## MongoDB Indexes

All models include optimized indexes for:
- User lookup by email
- Posts by userId + createdAt
- Scheduled posts by status + scheduledFor
- Analytics by userId + recordedAt
- Trends by country + platform + growthPercent
- OAuth tokens by expiry (for auto-refresh)
- Activity logs TTL (90 days)

## Queue System

- **publish** queue: Scheduled and immediate post publishing
- **publish-dlq**: Dead letter queue for failed jobs after 3 retries
- **trends** queue: Trend collection every 6 hours

## AI Module

Phase 1: Caption generator, hashtag generator, best posting time, quality check
Phase 2: Viral score (0-100), user behavior analysis

Providers: Mistral API (primary), Local Llama via Ollama (fallback)

## Subscription Tiers

| Feature | FREE | PRO | AGENCY |
|---------|------|-----|--------|
| Posts/month | 10 | Unlimited | Unlimited |
| Connected accounts | 1 | 10 | 50 |
| AI features | Basic | Full | Full |
| Scheduling | ✗ | ✓ | ✓ |
| Multi-client | ✗ | ✗ | ✓ |
