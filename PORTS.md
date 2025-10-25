# Port Configuration

The Supplication Counter App uses the following ports:

- **Backend**: Port `3002` (host) → `3001` (container)
  - Mapped to 3002 to avoid conflicts with other services (like Uptime Kuma)
  - Internal container port remains 3001

- **Frontend**: Port `8081` (host) → `80` (container)
  - Mapped to 8081 to avoid conflicts with nginx Proxy Manager
  - Internal container port remains 80

## Why These Ports?

Common port conflicts on production servers:
- Port `80`: Usually occupied by nginx Proxy Manager or other web servers
- Port `3001`: Often used by services like Uptime Kuma
- Port `443`: HTTPS, typically handled by nginx Proxy Manager

Our configuration avoids these conflicts while maintaining clean internal networking.

## Usage

### Local Access (Development/Testing)
- **Backend API**: `http://localhost:3002/api`
- **Frontend**: `http://localhost:8081`
- **Health Check**: `http://localhost:3002/api/health`

### Production (via nginx Proxy Manager)
- **Frontend**: `https://yourdomain.com` (proxied to `localhost:8081`)
- **Backend API**: `https://api.yourdomain.com` (proxied to `localhost:3002`)

## nginx Proxy Manager Configuration

When setting up proxy hosts in nginx Proxy Manager:

**For Frontend:**
- Domain: `yourdomain.com`
- Forward Hostname/IP: `localhost`
- Forward Port: `8081`

**For Backend:**
- Domain: `api.yourdomain.com`
- Forward Hostname/IP: `localhost`
- Forward Port: `3002`

See NGINX_PROXY_SETUP.md for detailed configuration instructions.
