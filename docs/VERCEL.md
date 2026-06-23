# Vercel deployment & OAuth

Deploy MultiPoster TN to Vercel for a public HTTPS URL — required for TikTok, Meta, and Google OAuth callbacks.

## 1. Deploy to Vercel

```bash
npm i -g vercel
vercel login
vercel
```

Or connect the GitHub repo in the [Vercel dashboard](https://vercel.com).

Production URL: **https://multi-flame.vercel.app**

## 2. Environment variables

In **Vercel → Project → Settings → Environment Variables**, add:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://multi-flame.vercel.app` |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | 32+ char random string |
| `JWT_REFRESH_SECRET` | 32+ char random string |
| `ENCRYPTION_KEY` | Exactly 32 characters |
| `REDIS_URL` | Upstash Redis URL (for queues) |
| `TIKTOK_CLIENT_KEY` | From TikTok developer portal |
| `TIKTOK_CLIENT_SECRET` | From TikTok developer portal |
| `META_APP_ID` / `META_APP_SECRET` | Meta developer app |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Cloud console |

OAuth redirect URIs are **auto-built** from `NEXT_PUBLIC_APP_URL`:

```
https://multi-flame.vercel.app/api/oauth/tiktok/callback
https://multi-flame.vercel.app/api/oauth/instagram/callback
https://multi-flame.vercel.app/api/oauth/facebook/callback
https://multi-flame.vercel.app/api/oauth/youtube/callback
```

You can override with explicit `TIKTOK_REDIRECT_URI`, etc. if needed.

## 3. Register callbacks in developer portals

### TikTok
1. [developers.tiktok.com](https://developers.tiktok.com) → your app → Login Kit  
2. Add redirect URI:  
   `https://multi-flame.vercel.app/api/oauth/tiktok/callback`
3. **Sandbox:** add your TikTok account under **Sandbox → Target users** (fixes `non_sandbox_target`).  
   See [TIKTOK-OAUTH.md](TIKTOK-OAUTH.md).

### Meta (Instagram / Facebook)
1. [developers.facebook.com](https://developers.facebook.com) → your app  
2. Valid OAuth redirect URIs:  
   `https://multi-flame.vercel.app/api/oauth/instagram/callback`  
   `https://multi-flame.vercel.app/api/oauth/facebook/callback`

### Google (YouTube)
1. [console.cloud.google.com](https://console.cloud.google.com) → Credentials  
2. Authorized redirect URI:  
   `https://multi-flame.vercel.app/api/oauth/youtube/callback`

## 4. Test OAuth

1. Open **https://multi-flame.vercel.app** (not localhost)  
2. Register / login  
3. **Settings** → Connect TikTok (or other platform)  
4. Complete authorization → redirected back to Settings

## Preview deployments

Each PR gets a unique URL (`https://multiposter-tn-git-branch-xxx.vercel.app`). Either:

- Use **only production** URL for OAuth testing, or  
- Add each preview URL to TikTok/Meta/Google (tedious on free tiers)

Recommended: test OAuth on **production** Vercel deployment first.

## Custom domain

When you add `multiposter.tn`:

1. Update `NEXT_PUBLIC_APP_URL=https://multiposter.tn` in Vercel  
2. Update all redirect URIs in developer portals  
3. Redeploy

## 5. Video uploads (Vercel Blob)

Vercel serverless functions reject request bodies over **~4.5 MB** (`FUNCTION_PAYLOAD_TOO_LARGE`). Video uploads bypass that limit via **direct client → Vercel Blob** upload.

1. In Vercel: **Storage → Create → Blob** (link to this project).
2. Vercel adds `BLOB_READ_WRITE_TOKEN` automatically — no manual copy needed.
3. Redeploy after linking the Blob store.
4. On production, the **New Post** form uploads the file straight to Blob, then sends only the URL to `/api/posts`.

Local dev still uses normal multipart upload to `/api/posts` (no Blob required).

## Limitations on Vercel

| Feature | Notes |
|---------|--------|
| **BullMQ worker** | Serverless functions can't run long-lived workers. Use [Upstash QStash](https://upstash.com/docs/qstash) or a separate VPS worker for scheduled posts. |
| **FFmpeg / video processing** | May hit function time/memory limits on large files. Hobby plan: 10s max; Pro: up to 60s (`maxDuration` on `/api/posts`). |
| **Local file storage** | Ephemeral on Vercel — use S3 (`STORAGE_TYPE=s3`) for production. |

For full scheduling + video processing at scale, use the Docker/VPS guide in [DEPLOYMENT.md](DEPLOYMENT.md) alongside or instead of Vercel.
