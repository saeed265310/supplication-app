# Stage 1: Use the official Caddy image
FROM caddy:2-alpine

# Copy the Caddy configuration file
COPY Caddyfile /etc/caddy/Caddyfile

# Copy all your application files into the server's web root
COPY . /srv

# Expose port 80 to allow traffic to the Caddy server
EXPOSE 80
