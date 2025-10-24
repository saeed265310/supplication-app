# nginx Proxy Manager Setup Guide

This guide covers setting up nginx Proxy Manager for the Supplication Counter App with HTTPS.

## Architecture Overview

```
[Internet] → [nginx Proxy Manager] → [Docker Containers]
                ├── yourdomain.com (Frontend on port 80)
                └── api.yourdomain.com (Backend on port 3001)
```

## Prerequisites

1. nginx Proxy Manager installed and running
2. Domain DNS configured:
   - `yourdomain.com` → Server IP
   - `api.yourdomain.com` → Server IP (or wildcard `*.yourdomain.com`)
3. Ports 80 and 443 open on firewall
4. Docker containers running (see DEPLOYMENT.md)

## Step 1: Create Backend Proxy Host

### Basic Configuration
1. **Details Tab:**
   - Domain Names: `api.yourdomain.com`
   - Scheme: `http`
   - Forward Hostname / IP: `localhost` (or container name if on same Docker network)
   - Forward Port: `3001`
   - Cache Assets: ✅
   - Block Common Exploits: ✅
   - Websockets Support: ✅

### SSL Tab:
   - SSL Certificate: Request a new SSL Certificate
   - Force SSL: ✅
   - HTTP/2 Support: ✅
   - HSTS Enabled: ✅
   - HSTS Subdomains: ✅

### Advanced Tab:
```nginx
# Proxy headers for backend
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Port $server_port;

# Timeouts
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;

# Buffer settings
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;
```

## Step 2: Create Frontend Proxy Host

### Basic Configuration
1. **Details Tab:**
   - Domain Names: `yourdomain.com` and `www.yourdomain.com`
   - Scheme: `http`
   - Forward Hostname / IP: `localhost`
   - Forward Port: `80`
   - Cache Assets: ✅
   - Block Common Exploits: ✅
   - Websockets Support: ❌ (not needed for static frontend)

### SSL Tab:
   - SSL Certificate: Request a new SSL Certificate
   - Force SSL: ✅
   - HTTP/2 Support: ✅
   - HSTS Enabled: ✅
   - HSTS Subdomains: ✅

### Advanced Tab:
```nginx
# SPA routing support - all requests go to index.html
location / {
    proxy_pass http://localhost:80;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Handle SPA routing
    proxy_intercept_errors on;
    error_page 404 = @fallback;
}

location @fallback {
    proxy_pass http://localhost:80/index.html;
    proxy_set_header Host $host;
}

# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    proxy_pass http://localhost:80;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## Step 3: Verify Configuration

### Test Backend Health
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

### Test Frontend
```bash
curl -I https://yourdomain.com
```

Should return `200 OK` and redirect HTTP to HTTPS.

### Test CORS
```bash
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api.yourdomain.com/api/login
```

Should return CORS headers.

## Step 4: Update Environment Variables

Update your `.env` file:

```env
# Backend
CORS_ORIGIN=https://yourdomain.com
JWT_SECRET=your-secure-secret-key-here
NODE_ENV=production

# Frontend (rebuild required if changed)
VITE_API_URL=https://api.yourdomain.com/api
```

Rebuild and restart containers:
```bash
docker-compose down
docker-compose up -d --build
```

## Alternative: Single Domain Setup

If you want to use a single domain (e.g., `yourdomain.com` for both):

### Backend at `/api` path

Modify the frontend proxy host Advanced tab:

```nginx
# Serve frontend
location / {
    proxy_pass http://localhost:80;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

# Proxy API requests to backend
location /api {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Port $server_port;
}
```

Update `.env`:
```env
CORS_ORIGIN=https://yourdomain.com
VITE_API_URL=https://yourdomain.com/api
```

## Troubleshooting

### Issue: 502 Bad Gateway

**Cause:** Backend container not reachable

**Solutions:**
1. Check container is running: `docker ps`
2. Test backend locally: `curl http://localhost:3001/api/health`
3. If using container name instead of localhost, ensure nginx Proxy Manager is on same Docker network

### Issue: CORS Errors

**Cause:** CORS_ORIGIN mismatch

**Solutions:**
1. Check backend logs: `docker-compose logs backend`
2. Verify CORS_ORIGIN includes your domain with `https://`
3. Restart backend after changing env: `docker-compose restart backend`

### Issue: Frontend Shows Old Content

**Cause:** Browser cache or Caddy cache

**Solutions:**
1. Hard refresh: Ctrl+Shift+R (Cmd+Shift+R on Mac)
2. Clear browser cache
3. Rebuild frontend: `docker-compose up -d --build frontend`

### Issue: Can't Get SSL Certificate

**Cause:** DNS not propagated or ports blocked

**Solutions:**
1. Verify DNS: `nslookup api.yourdomain.com`
2. Check ports: `sudo netstat -tlnp | grep ':80\|:443'`
3. Disable firewall temporarily to test
4. Check nginx Proxy Manager logs

### Issue: WebSocket Connection Failed

**Cause:** Websockets not enabled or proxy timeout

**Solutions:**
1. Enable Websockets Support in proxy host
2. Add to Advanced tab:
   ```nginx
   proxy_http_version 1.1;
   proxy_set_header Upgrade $http_upgrade;
   proxy_set_header Connection "upgrade";
   ```

## Security Best Practices

1. **Enable HSTS:** Force browsers to use HTTPS
2. **Hide nginx version:** Add to Custom nginx Configuration:
   ```nginx
   server_tokens off;
   ```

3. **Rate limiting:** Add to Advanced tab:
   ```nginx
   limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
   limit_req zone=api_limit burst=20 nodelay;
   ```

4. **Block bad bots:**
   ```nginx
   if ($http_user_agent ~* (bot|crawler|spider|scraper)) {
       return 403;
   }
   ```

5. **Add security headers:** Add to Custom Locations:
   ```nginx
   add_header X-Frame-Options "SAMEORIGIN" always;
   add_header X-Content-Type-Options "nosniff" always;
   add_header X-XSS-Protection "1; mode=block" always;
   add_header Referrer-Policy "no-referrer-when-downgrade" always;
   ```

## Monitoring

### Check SSL Certificate Expiry
nginx Proxy Manager automatically renews Let's Encrypt certificates.

### Monitor Logs
```bash
# nginx Proxy Manager logs
docker logs nginx-proxy-manager

# Backend logs
docker-compose logs -f backend

# Frontend (Caddy) logs
docker-compose logs -f frontend
```

### Health Checks
Set up monitoring (e.g., UptimeRobot, Pingdom) for:
- https://yourdomain.com (frontend)
- https://api.yourdomain.com/api/health (backend)

## Example: Complete nginx Proxy Manager Export

You can export these settings and import them on another server:

```json
{
  "name": "Supplication App Backend",
  "domain_names": ["api.yourdomain.com"],
  "forward_scheme": "http",
  "forward_host": "localhost",
  "forward_port": 3001,
  "certificate_id": 1,
  "ssl_forced": 1,
  "hsts_enabled": 1,
  "http2_support": 1,
  "block_exploits": 1,
  "caching_enabled": 1,
  "allow_websocket_upgrade": 1
}
```

## Support

For issues:
1. Check Docker container status
2. Review nginx Proxy Manager logs
3. Test direct container access (bypass proxy)
4. Verify DNS and SSL certificates
