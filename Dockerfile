# Stage 1: Build the Vite + React production bundle
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve static files via lightweight Nginx on Cloud Run
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["/bin/sh", "-c", "sed -i \"s/8080/${PORT:-8080}/g\" /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
