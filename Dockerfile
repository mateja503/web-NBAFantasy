# Stage 1: Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# Stage 2: Serve
FROM nginx:alpine
# Note: Angular 19 usually outputs to dist/[project-name]/browser
# Update 'web-nba-fantasy' to match your actual project name in angular.json
COPY --from=build /app/dist/web-NBAFantasy/browser /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]