# Kostel Frontend — Deployment Guide

This repo is a **pure SPA** (React + Vite). It has no server, no database, and
no Prisma. The built `dist/` folder is served by Nginx, which also proxies
`/api` to the NestJS backend.

> **Backend deploy script handles both repos.**
> See `kostel-be/deploy/deploy.sh` for the automated end-to-end flow.

---

## Server Info

| Item | Value |
|------|-------|
| IP | `167.71.204.121` |
| SSH Port | `5522` |
| User | `kostel` |
| FE path | `/home/kostel/projects/kostel-fe` |
| BE path | `/home/kostel/projects/kostel-be` |

---

## Deployment (automated)

The backend repo's deploy script builds and deploys both repos:

```bash
ssh -p 5522 kostel@167.71.204.121
cd /home/kostel/projects/kostel-be
bash deploy/deploy.sh
```

This runs:
1. `git pull` in both repos
2. `npm ci` in BE (production deps) + `npm ci && npm run build` in FE
3. `prisma generate && prisma db push` (schema lives in BE)
4. `npm run build` in BE (NestJS → `dist/`)
5. `pm2 restart kostel-be`
6. `nginx -t && nginx -s reload`

---

## Manual Deployment (FE only)

If you only need to update the frontend:

```bash
# 1. Build locally
cd D:\appfolder\kostel\kostel-fe
npm run build

# 2. Upload dist to server
scp -r -P 5522 dist/* kostel@167.71.204.121:/home/kostel/projects/kostel-fe/dist/

# 3. Reload nginx (if needed)
ssh -p 5522 kostel@167.71.204.121 "sudo nginx -t && sudo nginx -s reload"
```

---

## Nginx Configuration

Production nginx config lives in `kostel-be/deploy/nginx.conf`. It:

- Serves `kostel-fe/dist` as static files (SPA fallback to `index.html`)
- Proxies `/api/` to NestJS on `127.0.0.1:4000`
- Serves `/uploads/` as static files from `kostel-be/uploads/`
- Caches static assets (JS, CSS, images, fonts) for 1 year
- Allows uploads up to 10MB (contract PDFs, ID cards, signatures)

Install on server:
```bash
sudo cp /home/kostel/projects/kostel-be/deploy/nginx.conf /etc/nginx/sites-available/kostel
sudo ln -sf /etc/nginx/sites-available/kostel /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo nginx -s reload
```

---

## Useful Commands

```bash
# SSH into server
ssh -p 5522 kostel@167.71.204.121

# Check PM2 status (backend)
pm2 status

# View backend logs
pm2 logs kostel-be

# Restart backend
pm2 restart kostel-be

# Check nginx config
sudo nginx -t

# Check nginx status
sudo systemctl status nginx
```
