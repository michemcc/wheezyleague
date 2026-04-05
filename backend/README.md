# The Wheezy League API — Node.js / Express Backend

REST API for The Wheezy League. Validates Auth0 JWTs, serves user profiles, run stats, posts, challenges, routes, and symptom logs.

## Quick Start

```bash
cd backend
npm install
cp .env.example .env      # fill in AUTH0_DOMAIN, AUTH0_AUDIENCE
npm run dev               # runs on http://localhost:4000
```

## Endpoints

All routes under `/api/*` require a valid Auth0 Bearer token.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check (public) |
| GET | `/api/users/:id/profile` | Get user profile |
| PATCH | `/api/users/:id/profile` | Update profile fields |
| GET | `/api/users/:id/dashboard` | Get run stats & dashboard data |
| GET | `/api/posts` | List posts (`?page=1&filter=all`) |
| POST | `/api/posts` | Create a post |
| POST | `/api/posts/:id/like` | Like a post |
| DELETE | `/api/posts/:id/like` | Unlike a post |
| GET | `/api/challenges` | List challenges |
| POST | `/api/challenges/:id/join` | Join a challenge |
| DELETE | `/api/challenges/:id/join` | Leave a challenge |
| GET | `/api/routes` | List community routes |
| POST | `/api/routes/:id/save` | Save a route |
| DELETE | `/api/routes/:id/save` | Unsave a route |
| GET | `/api/symptoms/:userId` | Get symptom log |
| POST | `/api/symptoms/:userId` | Add symptom entry |

## Connect Frontend

In your frontend `.env.local`:
```env
VITE_DATA_MODE=real
VITE_API_BASE_URL=http://localhost:4000/api
```

## Add a Real Database

The API uses an **in-memory store** (`src/models/store.js`) by default — data resets on server restart. To persist data:

1. Install `pg` (PostgreSQL) or `mongoose` (MongoDB)
2. Replace `Map` operations in each route with DB queries
3. Set `DATABASE_URL` in `.env`

The route signatures and response shapes don't change — only the data layer.
