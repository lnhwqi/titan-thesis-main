## Introduction

Titan is a E-commerce platform base on type-safe template

## Quick Start - Installation (For New Users)

### Prerequisites

- **Node.js**: `>=18.0.0` ([Download here](https://nodejs.org))
- **PostgreSQL**: `>=14.0`
  ([Download here](https://www.postgresql.org/download))
- **npm**: `>=9.0.0` (comes with Node.js)

### Step 1: Verify Installation

```bash
node --version      # Should be >= 18.0.0
npm --version       # Should be >= 9.0.0
```

### Step 2: Install All Libraries

#### Option A: Automatic (Recommended - Using npm Workspaces)

```bash
# Navigate to main project folder
cd titan-thesis-main

# Single command installs EVERYTHING (root + Api + Web)
npm install
```

#### Option B: Manual Step-by-Step (If Option A doesn't work)

```bash
# Navigate to main project folder
cd titan-thesis-main

# Step 1: Install Api workspace dependencies
cd Api
npm install
cd ..

# Step 2: Install Web workspace dependencies
cd Web
npm install
cd ..

# Step 3: Install root shared dependencies (back in main folder)
npm install
```

**Both options will install:**

- Root shared libraries (date-fns, decoders, uuid, TypeScript, ESLint, Vitest)
- Api/ dependencies (Express, Kysely, PostgreSQL, bcrypt, Socket.io, etc.)
- Web/ dependencies (React, Vite, socket.io-client, react-icons, recharts, etc.)

### Step 3: Verify Installation Success

```bash
# Check TypeScript compilation
npm run tsc

# Should output: "tsc --noEmit" with EXIT CODE: 0
```

### Step 4: Setup & Run Docker Services

```bash
# Start PostgreSQL and other services in Docker
npm run external:start

# This starts:
# - PostgreSQL database on localhost:5432
# - Any other external services configured
```

### Step 5: Create Database & Run Migrations

```bash
# Create the database (if not auto-created by Docker)
# psql -U postgres -c "CREATE DATABASE titan_dev;"

# Run database migrations
npm run db:migrate

# This creates all tables and schema
```

### Step 6: Seed Sample Data (Optional)

```bash
# Populate database with sample data
npm run db:seed

# Now you have:
# - Sample products
# - Sample users/sellers
# - Sample orders
# - Sample categories
```

### Step 7: Configure Environment Variables

Create `.env` file in `Api/` folder:

```env
NODE_ENV=development
APP_ENV=development
APP_PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_DATABASE=titan_dev
DB_MAX_POOL=20
JWT_SECRET=your-secret-key-32-chars-or-more
```

### Step 8: Start Development

```bash
# Start API + Web simultaneously
npm start

# Or run separately:
# API: localhost:3000
# Web: localhost:5173
```

---

## Complete Installation Summary

**Quick Reference for New Users:**

```bash
# 1. Verify Node.js and npm
node --version && npm --version

# 2. Install all libraries (monorepo)
cd titan-thesis-main
npm install

# 3. Start Docker services (PostgreSQL)
npm run external:start

# 4. Run database migrations
npm run db:migrate

# 5. (Optional) Seed sample data
npm run db:seed

# 6. Configure Api/.env with database credentials

# 7. Start development servers
npm start
```

---

## All Available Commands

### Development

```bash
npm start                   # Start API + Web servers
npm run tsc                 # Type check (TypeScript strict mode)
npm run lint                # ESLint code linting
```

### Testing

```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
```

### Database

```bash
npm run db:migrate         # Run pending migrations
npm run db:migrate:create  # Create new migration file
npm run db:seed            # Seed sample data
npm run db:rollback        # Rollback last migration
```

### Deployment

```bash
npm run deploy:staging     # Deploy to staging
npm run deploy:staging:down # Stop staging deployment
npm run deploy:production  # Deploy to production
npm run deploy:production:down # Stop production deployment
```

### External Services

```bash
npm run external:start     # Start external Docker services
npm run ai:ingest         # Ingest AI knowledge base
npm run ai:ingest:reset   # Reset AI knowledge base
npm run ai:ingest:faq     # Ingest FAQ to knowledge base
```

---

## Troubleshooting

### "Cannot find module 'kysely'" after install

```bash
# Clean reinstall
rm -rf node_modules Api/node_modules Web/node_modules package-lock.json
npm install --legacy-peer-deps
```

### TypeScript errors (npm run tsc fails)

```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npm install
npm run tsc
```

### PostgreSQL connection error

```bash
# Verify PostgreSQL is running
psql --version

# Check connection
psql -U postgres -d titan_dev

# If database doesn't exist, create it:
createdb titan_dev

# Then run migrations:
npm run db:migrate
```

### Port 3000 or 5173 already in use

```bash
# Find and kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or change port in Api/.env
APP_PORT=3001
```

---

## Description

In this project,

- Admin
- Shop Seller
- User

## Technical stack:

- Backend: NodeJS + Typescript + ExpressJS
- Frontend: ReactJS + Typescript
- Database:PostgreSQL

## Environment variables (API)

- NODE_ENV
- APP_ENV
- APP_PORT
- DB_HOST
- DB_PORT
- DB_USER
- DB_PASSWORD
- DB_DATABASE
- DB_MAX_POOL
- JWT_SECRET
- ZALO_APP_ID
- ZALO_KEY1
- ZALO_KEY2
- ZALO_CREATE_URL
- ZALO_QUERY_URL
