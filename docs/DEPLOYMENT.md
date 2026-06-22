# VPS Deployment Guide — MultiPoster TN

## Prerequisites

- Ubuntu 22.04+ VPS (2GB RAM minimum, 4GB recommended)
- Docker & Docker Compose
- Domain pointed to VPS IP
- FFmpeg installed on host (for worker container, included in Dockerfile)

## Quick Start (Docker)

```bash
# Clone repository
git clone <repo-url> multiposter-tn
cd multiposter-tn

# Configure environment
cp .env.example .env
nano .env  # Set secrets, OAuth credentials, MongoDB URI

# Generate secure secrets
openssl rand -hex 32  # JWT_ACCESS_SECRET
openssl rand -hex 32  # JWT_REFRESH_SECRET
openssl rand -hex 16  # ENCRYPTION_KEY (must be exactly 32 chars)

# Start all services
docker-compose up -d

# Verify
docker-compose ps
curl http://localhost:3000
```

## Manual VPS Setup (without Docker)

### 1. Install dependencies

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs mongodb-org redis-server ffmpeg nginx
sudo npm install -g pm2 tsx
```

### 2. MongoDB

```bash
sudo systemctl start mongod
sudo systemctl enable mongod

# Create indexes (auto-created on first run via Mongoose)
```

### 3. Redis

```bash
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 4. Application

```bash
cd /var/www/multiposter-tn
npm ci
cp .env.example .env
# Edit .env with production values

npm run build
mkdir -p uploads

# Start with PM2
pm2 start npm --name "multiposter-app" -- start
pm2 start npm --name "multiposter-worker" -- run worker
pm2 save
pm2 startup
```

### 5. Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name multiposter.tn www.multiposter.tn;

    client_max_body_size 500M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo certbot --nginx -d multiposter.tn -d www.multiposter.tn
```

## CI/CD (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /var/www/multiposter-tn
            git pull
            docker-compose up -d --build
```

## OAuth Setup

### Meta (Instagram/Facebook)
1. Create app at [developers.facebook.com](https://developers.facebook.com)
2. Add Instagram Graph API + Facebook Login
3. Set redirect URI: `https://yourdomain.com/api/oauth/meta/callback`

### TikTok
1. Register at [developers.tiktok.com](https://developers.tiktok.com)
2. Enable Content Posting API
3. Redirect URI: `https://yourdomain.com/api/oauth/tiktok/callback`

### YouTube
1. Create project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable YouTube Data API v3
3. OAuth redirect: `https://yourdomain.com/api/oauth/youtube/callback`

## Monitoring

```bash
# PM2 logs
pm2 logs multiposter-app
pm2 logs multiposter-worker

# Docker logs
docker-compose logs -f app worker

# Redis queue monitoring
docker-compose exec redis redis-cli
> KEYS bull:publish:*
```

## Backup

```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/multiposter-tn" --out=/backup/$(date +%Y%m%d)

# Uploads backup
tar -czf uploads-backup.tar.gz uploads/
```

## Scaling to 100k+ Users

1. Move MongoDB to dedicated cluster (MongoDB Atlas M30+)
2. Redis Cluster for BullMQ
3. Migrate storage to AWS S3 (`STORAGE_TYPE=s3`)
4. Horizontal scaling: multiple worker instances
5. CDN for static assets and thumbnails
6. Load balancer with multiple app instances
