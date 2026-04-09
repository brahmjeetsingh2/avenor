# 🎯 Avenor

**End-to-end placement & internship tracker for engineering colleges.**

Every engineering college runs placements on Excel sheets and WhatsApp groups. Avenor is the system that should have existed — company timelines, application tracking, interview experiences, offer comparisons, AI interview prep, and real-time notifications in one place.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  CLIENT  (Vercel)                        │
│  React 18 · TailwindCSS · Zustand · Socket.io-client    │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS / WSS
┌────────────────────────▼────────────────────────────────┐
│                  SERVER  (Render)                        │
│  Express.js · Socket.io · JWT/RBAC · BullMQ Worker      │
└──────┬──────────┬───────────┬───────────┬───────────────┘
       │          │           │           │
  ┌────▼───┐ ┌───▼────┐ ┌────▼────┐ ┌───▼──────────┐
  │MongoDB │ │ Redis  │ │  Bull   │ │  AI (Groq)   │
  │ Atlas  │ │Upstash │ │ Queue   │ │              │
  │+Search │ │        │ │         │ │              │
  └────────┘ └────────┘ └─────────┘ └──────────────┘
```

## Tech Stack

| Layer       | Technology                                           |
|-------------|------------------------------------------------------|
| Frontend    | React 18, TailwindCSS, Zustand, React Router v6      |
| Backend     | Node.js, Express.js                                  |
| Database    | MongoDB Atlas + Atlas Search                         |
| Cache       | Redis (Upstash)                                      |
| Queue       | Bull (notification fanout)                           |
| Realtime    | Socket.io                                            |
| Auth        | JWT (access + refresh) + RBAC + Google OAuth         |
| AI          | Groq (Llama 3.1 8B Instant)                          |
| Deploy      | Vercel (frontend) + Render (backend)                 |

## Features

### Three Roles
- **Student** — Apply to companies, track status, prep for interviews, compare offers
- **Coordinator** — Manage companies, shortlists, bulk announce to 500 students
- **Alumni** — Share interview experiences, salary data, refer juniors

### Core Modules
- 🏢 **Company Timeline** — Announced → PPT → Test → Interview → Offer → Closed
- 📋 **Application Tracker** — Kanban board + table view per student
- 📖 **Experience Feed** — Interview experiences with upvotes, search, ranking
- 🤖 **AI Interview Prep** — Groq AI summarises senior experiences into prep guide
- 💰 **Salary Insights** — Anonymous salary data with bar charts and aggregations
- ⚖️ **Offer Comparison** — Side-by-side comparison with best-in-class highlighting
- 🔔 **Notifications** — Real-time Socket.io + Bull queue fanout to all students
- 📊 **Analytics Dashboard** — KPIs, funnels, branch charts, activity feed
- 🔍 **Global Search** — Full-text search with Cmd+K, suggestions, recent history

### System Design
- **Notification fanout**: BullMQ batches 50 recipients/job to avoid blocking
- **Feed ranking**: score = upvotes×0.4 + recency×0.3 + company_match×0.2 + role_match×0.1
- **Redis cache**: Dashboard stats cached 10min TTL; feed top-20 cached 5min TTL
- **Atlas Search**: Fuzzy full-text search on experiences (role, tips, questions)
- **JWT rotation**: Access token 15min + httpOnly refresh token 7d with rotation

---

## Local Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free M0)
- Upstash Redis account (free)
- AI API key (Groq)

### 1. Clone & install

```bash
git clone https://github.com/yourname/avenor
cd avenor

# Install server deps
cd server && npm install && cd ..

# Install client deps
cd client && npm install && cd ..
```

### 2. Configure environment

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Edit `server/.env` — fill in:
- `MONGODB_URI` — Atlas connection string
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- `REDIS_URL` — Upstash Redis URL
- `GROQ_API_KEY` — from console.groq.com

### 3. Run

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

- Frontend: http://localhost:5173
- API health: http://localhost:8000/api/health

---

## Deployment

### MongoDB Atlas
1. [cloud.mongodb.com](https://cloud.mongodb.com) → Create free M0 cluster
2. Database Access → Add user with password (no `@` in password)
3. Network Access → Allow from anywhere (`0.0.0.0/0`)
4. Connect → Drivers → Node.js → copy connection string
5. Atlas Search → Create Search Index on `experiences` collection (see `search.service.js` for config)

### Upstash Redis
1. [console.upstash.com](https://console.upstash.com) → Create database → Singapore region
2. Copy the `REDIS_URL` (starts with `rediss://`)

### Backend — Render
1. [render.com](https://render.com) → New Web Service → Connect GitHub
2. Root directory: `server`
3. Build: `npm install` | Start: `node server.js`
4. Add all env vars from `server/.env.example` in Render dashboard
5. Free tier: service sleeps after 15min inactivity (use UptimeRobot to ping `/api/health`)

### Frontend — Vercel
1. [vercel.com](https://vercel.com) → Import GitHub repo
2. Root directory: `client`
3. Framework: Vite
4. Add env var: `VITE_API_URL=https://your-render-app.onrender.com/api`
5. Deploy

### Google OAuth (optional)
1. [console.cloud.google.com](https://console.cloud.google.com) → APIs → Credentials → OAuth 2.0
2. Authorised redirect URI: `https://your-render-app.onrender.com/api/auth/google/callback`
3. Add `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` + `GOOGLE_CALLBACK_URL` to Render env vars

---

## API Reference

| Method | Endpoint                          | Role        | Description                    |
|--------|-----------------------------------|-------------|--------------------------------|
| POST   | /api/auth/register                | Public      | Register new user              |
| POST   | /api/auth/login                   | Public      | Login, returns JWT             |
| GET    | /api/auth/me                      | Auth        | Get current user               |
| GET    | /api/companies                    | Auth        | List companies (paginated)     |
| POST   | /api/companies                    | Coordinator | Create company                 |
| PATCH  | /api/companies/:id/stage          | Coordinator | Update recruitment stage       |
| POST   | /api/applications                 | Student     | Apply to company               |
| GET    | /api/applications/my              | Student     | My applications                |
| PATCH  | /api/applications/:id/status      | Coordinator | Update application status      |
| POST   | /api/applications/bulk-status     | Coordinator | Bulk status update             |
| GET    | /api/experiences                  | Auth        | Experience feed (ranked)       |
| POST   | /api/experiences                  | Student/Alumni | Post experience             |
| PATCH  | /api/experiences/:id/upvote       | Auth        | Toggle upvote                  |
| GET    | /api/salary/stats                 | Auth        | Aggregated salary stats        |
| POST   | /api/salary                       | Student/Alumni | Submit anonymous salary     |
| GET    | /api/dashboard/stats              | Coordinator | Placement KPIs                 |
| GET    | /api/dashboard/export             | Coordinator | Download placements CSV        |
| POST   | /api/notifications/announce       | Coordinator | Bulk announce to students      |
| POST   | /api/ai/interview-prep            | Student     | SSE stream AI prep guide       |
| GET    | /api/search?q=...                 | Auth        | Global full-text search        |

---

## Project Structure

```
hiretrack/
├── client/               # React frontend (Vercel)
│   ├── src/
│   │   ├── components/   # UI + layout + shared
│   │   ├── pages/        # Route-level pages
│   │   ├── hooks/        # useAuth, useSocket, useSearch, useTheme
│   │   ├── store/        # Zustand stores
│   │   ├── services/     # Axios API calls
│   │   └── utils/        # Helpers, constants
│   └── vercel.json
│
├── server/               # Express backend (Render)
│   ├── config/           # DB, Redis, Socket.io
│   ├── controllers/      # Route handlers
│   ├── models/           # Mongoose schemas
│   ├── routes/           # Express routers
│   ├── middleware/        # JWT, RBAC, error handler
│   ├── queues/           # Bull notification queue + worker
│   ├── services/         # AI, search, notification helpers
│   └── server.js
│
└── render.yaml           # Render deployment config
```

---

## Startup Angle

Free for students. Charge colleges **₹50,000/year** for the coordinator dashboard + analytics.

5,000 engineering colleges × ₹50K = **₹250 crore TAM**.

LinkedIn for placement season.

---

Built with ❤️ for every engineering student who missed a deadline because it was buried in a WhatsApp group.
