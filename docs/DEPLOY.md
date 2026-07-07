# Kostel Deployment Guide

## Server Info
- IP: 167.71.204.121
- SSH Port: 5522
- User: kostel
- PG Port: 5510
- PG User: kostel
- PG DB: kostel

---

## Step 1: Build Frontend (Local)

```powershell
cd D:\appfolder\kostel\kostel-FE
npm run build
```

## Step 2: SSH into Server

```powershell
ssh -p 5522 kostel@167.71.204.121
```

## Step 3: Install Node.js (if not installed)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v  # should show v20.x
npm -v
```

## Step 4: Install Nginx + PM2

```bash
sudo apt update
sudo apt install -y nginx
sudo npm install -g pm2 tsx
```

## Step 5: Upload Project Files

From your Windows machine (run in PowerShell):

```powershell
# Set working directory
cd D:\appfolder\kostel\kostel-FE

# Create remote directory
ssh -p 5522 kostel@167.71.204.121 "mkdir -p /home/kostel/kostel-FE"

# Upload dist folder (built frontend)
scp -r -P 5522 dist/* kostel@167.71.204.121:/home/kostel/kostel-FE/dist/

# Upload server source
scp -r -P 5522 src/server/* kostel@167.71.204.121:/home/kostel/kostel-FE/src/server/

# Upload prisma folder
scp -r -P 5522 prisma/* kostel@167.71.204.121:/home/kostel/kostel-FE/prisma/

# Upload config files
scp -P 5522 package.json kostel@167.71.204.121:/home/kostel/kostel-FE/
scp -P 5522 package-lock.json kostel@167.71.204.121:/home/kostel/kostel-FE/
scp -P 5522 ecosystem.config.js kostel@167.71.204.121:/home/kostel/kostel-FE/
scp -P 5522 .env.production kostel@167.71.204.121:/home/kostel/kostel-FE/.env
```

## Step 6: Setup on Server (SSH in)

```bash
cd /home/kostel/kostel-FE

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy
```

**Note:** Edit `.env` on server with your actual database password:
```bash
nano .env
```
Change `your_password_here` to the actual PostgreSQL password.

## Step 7: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/kostel
```

Paste this content (update `server_name` with your domain):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /home/kostel/kostel-FE/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Uploads proxy
    location /uploads {
        proxy_pass http://127.0.0.1:4000;
    }
}
```

Enable the site:
```bash
sudo ln -sf /etc/nginx/sites-available/kostel /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## Step 8: Start with PM2

```bash
cd /home/kostel/kostel-FE
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # follow the instructions it gives you
```

## Step 9: Open Firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 5522/tcp
sudo ufw reload
```

---

## Useful Commands

```bash
# SSH into server
ssh -p 5522 kostel@167.71.204.121

# Check PM2 status
pm2 status

# View logs
pm2 logs kostel-api

# Restart server
pm2 restart kostel-api

# Check nginx
sudo nginx -t
sudo systemctl status nginx
```
