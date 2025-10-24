# Deployment Guide

This guide covers deploying the Supplication Counter App with Docker, nginx proxy manager, and HTTPS.

## Prerequisites

- Docker and Docker Compose installed
- Domain name pointed to your server
- nginx Proxy Manager (or similar reverse proxy) configured

## Environment Variables

### Backend Variables

Create a `.env` file in the root directory:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` with your production values:

```env
# Backend Configuration
JWT_SECRET=your-production-secret-minimum-32-characters-long
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# Frontend API URL (used during Docker build)
VITE_API_URL=https://api.yourdomain.com/api
```

### Important Security Notes

1. **JWT_SECRET**: Use a strong, randomly generated secret (32+ characters)
   ```bash
   # Generate a secure secret
   openssl rand -base64 32
   ```

2. **CORS_ORIGIN**: Set to your frontend domain. For multiple domains:
   ```env
   CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
   ```

3. **VITE_API_URL**: Set to your backend API URL (with `/api` suffix)

## Docker Deployment

### Option 1: Docker Compose (Recommended)

1. **Build and start services:**
   ```bash
   docker-compose up -d --build
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Stop services:**
   ```bash
   docker-compose down
   ```

### Option 2: Individual Docker Containers

#### Build Backend
```bash
docker build -f Dockerfile.backend -t supplication-backend .
```

#### Build Frontend
```bash
docker build -f Dockerfile.frontend \
  --build-arg VITE_API_URL=https://api.yourdomain.com/api \
  -t supplication-frontend .
```

#### Run Backend
```bash
docker run -d \
  --name supplication-backend \
  -p 3001:3001 \
  -e JWT_SECRET="your-secret-here" \
  -e NODE_ENV=production \
  -e CORS_ORIGIN="https://yourdomain.com" \
  -v $(pwd)/data:/app/data \
  supplication-backend
```

#### Run Frontend
```bash
docker run -d \
  --name supplication-frontend \
  -p 80:80 \
  supplication-frontend
```

## nginx Proxy Manager Configuration

### Backend Proxy Host

1. **Domain:** api.yourdomain.com
2. **Forward Hostname/IP:** supplication-backend (or server IP)
3. **Forward Port:** 3001
4. **WebSockets Support:** ✅ Enabled
5. **SSL:**
   - ✅ Force SSL
   - ✅ HTTP/2 Support
   - ✅ HSTS Enabled

**Custom nginx Configuration:**
```nginx
# Add these to the "Advanced" tab
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header Host $host;
```

### Frontend Proxy Host

1. **Domain:** yourdomain.com
2. **Forward Hostname/IP:** supplication-frontend (or server IP)
3. **Forward Port:** 80
4. **SSL:**
   - ✅ Force SSL
   - ✅ HTTP/2 Support
   - ✅ HSTS Enabled

**Custom nginx Configuration for SPA:**
```nginx
# Add to "Advanced" tab for React Router support
location / {
    try_files $uri $uri/ /index.html;
}
```

## Database Persistence

The backend uses SQLite with volume mounting for data persistence.

### Docker Compose
Database is automatically persisted in `./data/database.db`

### Manual Docker
Mount volume:
```bash
-v $(pwd)/data:/app/data
```

### Backup Database
```bash
# Backup
docker exec supplication-backend sqlite3 /app/data/database.db ".backup '/app/data/backup.db'"

# Or copy from host
cp ./data/database.db ./backups/database-$(date +%Y%m%d).db
```

## Health Checks

### Backend Health Check
```bash
curl https://api.yourdomain.com/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-24T...",
  "database": "connected"
}
```

### Docker Health Status
```bash
docker ps
# Look for "healthy" status
```

## Troubleshooting

### Container Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend
```

### Common Issues

#### 1. CORS Errors
- Check `CORS_ORIGIN` environment variable matches frontend domain
- Ensure protocol (https://) is included
- Verify nginx proxy is passing correct headers

#### 2. Database Not Persisting
- Verify volume mount: `docker volume ls`
- Check permissions on host `./data` directory
- Ensure `NODE_ENV=production` is set

#### 3. 502 Bad Gateway
- Check backend container is running: `docker ps`
- Verify backend health: `docker-compose logs backend`
- Check nginx proxy configuration

#### 4. API Connection Failed (Frontend)
- Verify `VITE_API_URL` was set during build
- Rebuild frontend if API URL changed:
  ```bash
  docker-compose up -d --build frontend
  ```

## Production Checklist

- [ ] Strong JWT_SECRET set (32+ characters)
- [ ] CORS_ORIGIN limited to your domain(s)
- [ ] Database backups scheduled
- [ ] HTTPS enabled on both frontend and backend
- [ ] nginx proxy manager configured with SSL
- [ ] Health check endpoint accessible
- [ ] Docker volumes configured for persistence
- [ ] Firewall configured (only 80/443 exposed publicly)
- [ ] Container restart policies set (`restart: unless-stopped`)
- [ ] Logs being monitored/rotated

## Updating the Application

1. Pull latest changes:
   ```bash
   git pull origin main
   ```

2. Rebuild and restart:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

3. Verify health:
   ```bash
   curl https://api.yourdomain.com/api/health
   ```

## Scaling Considerations

For high traffic, consider:

1. **Database:** Migrate from SQLite to PostgreSQL
2. **Sessions:** Use Redis for session storage
3. **Load Balancing:** nginx upstream configuration
4. **CDN:** Serve frontend static assets via CDN

## Support

For issues or questions:
- Check logs: `docker-compose logs`
- Verify environment variables: `docker-compose config`
- Test health endpoint
