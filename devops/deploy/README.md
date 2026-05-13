# Deploy Compose (EC2)

This folder is for staging/production deployment only.

The local dev/test DB flow remains unchanged and still uses:

- devops/external/docker-compose.yml

## 1) Staging

Create static env on EC2:

- Copy devops/deploy/staging.env.example to /etc/titan/staging.env
- Fill in real secrets

Run stack:

```bash
docker compose \
  -f ./devops/deploy/docker-compose.staging.yml \
  up -d --build
```

Stop stack:

```bash
docker compose \
  -f ./devops/deploy/docker-compose.staging.yml \
  down
```

## 2) Production

Create static env on EC2:

- Copy devops/deploy/production.env.example to /etc/titan/production.env
- Fill in real secrets

Run stack:

```bash
docker compose \
  -f ./devops/deploy/docker-compose.production.yml \
  up -d --build
```

Stop stack:

```bash
docker compose \
  -f ./devops/deploy/docker-compose.production.yml \
  down
```

## 3) Running staging + production on one EC2

This setup already separates by:

- compose project name (`titan-staging` and `titan-production`)
- host ports (staging defaults: 8080/3002/55432, production defaults:
  80/3001/5432)
- docker volumes (`staging_*` vs `production_*`)
- credentials/secrets (different static env files in `/etc/titan`)

## 4) Security reminders

- Never commit real `.env` files.
- Never commit static EC2 env files from `/etc/titan`.
- Lock down EC2 security groups so DB/API are not open to the public unless
  required.
- If you later add a reverse proxy (Nginx/Caddy/ALB), set `VITE_API_HOST` to
  your API domain/subdomain.

## 5) GitHub Actions auto deploy to EC2

Workflow file:

- .github/workflows/deploy-ec2.yml

Remote deploy helper script:

- devops/deploy/ec2-deploy.sh

Default branch mapping:

- push to `staging` branch deploys staging stack
- push to `main` branch deploys production stack
- `workflow_dispatch` also supports manual deploy target and optional branch
  override

Required repository secrets:

- `EC2_HOST`: public IP or DNS of your EC2 machine
- `EC2_USER`: SSH user (for example `ubuntu`)
- `EC2_SSH_KEY`: private key content used to SSH into EC2
- `EC2_APP_PATH`: absolute path to this repository on EC2

Prerequisites on EC2:

- Docker and Docker Compose plugin installed
- Repository already cloned at `EC2_APP_PATH`
- Static env files created on server:
  - `/etc/titan/staging.env`
  - `/etc/titan/production.env`
- `devops/deploy/ec2-deploy.sh` auto-loads `/etc/titan/<target>.env` if present
  before running compose
- `devops/deploy/ec2-deploy.sh` auto-runs `tsx database/migrate.ts` before
  starting API/Web

## 6) Troubleshooting Product Load Failures

If the UI shows "Unable to load products" instead of an empty list:

- Verify API endpoint returns JSON from EC2:
  `curl "http://127.0.0.1:3001/products?page=1&limit=12&sortBy=newest&categoryID=&name="`
- Ensure `VITE_API_HOST` points to the real API host:port used by browsers.
- Set `CORS_ORIGIN` (and `FRONTEND_URL` for Socket.IO) in
  `/etc/titan/production.env` or `/etc/titan/staging.env` and redeploy.
