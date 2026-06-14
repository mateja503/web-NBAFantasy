# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# Use a clean, reproducible install from the lockfile (not `npm install`).
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve
FROM nginx:alpine
# Angular outputs the browser bundle here (see angular.json -> outputPath default).
COPY --from=build /app/dist/web-NBAFantasy/browser /usr/share/nginx/html

# SPA-aware nginx config (deep-link fallback + no-cache on config.json).
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Runtime config template + entrypoint that fills it from env vars at startup.
COPY docker/config.template.json /usr/share/nginx/html/config.template.json
COPY docker/entrypoint.sh /docker-entrypoint.d/40-runtime-config.sh
RUN sed -i 's/\r$//' /docker-entrypoint.d/40-runtime-config.sh \
    && chmod +x /docker-entrypoint.d/40-runtime-config.sh

EXPOSE 80
# Reuse the official nginx entrypoint, which runs everything in
# /docker-entrypoint.d/ (including our runtime-config script) before starting.
CMD ["nginx", "-g", "daemon off;"]
