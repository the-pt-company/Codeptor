# KudosDev Analytics Backend

Scalable analytics microservice — **Node.js · Express · Firebase Firestore · Firebase Admin SDK**

## Quick Start

```bash
cd analytics
npm install
cp .env.example .env   # edit FIREBASE_CREDENTIALS_JSON
npm run dev             # dev with hot-reload
npm start               # production
```

Server runs on `http://localhost:4000`.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `FIREBASE_CREDENTIALS_JSON` | Firebase Firestore URI | *(required)* |
| `PORT` | Server port | `4000` |
| `NODE_ENV` | `development` / `production` | `development` |
| `CORS_ORIGIN` | Allowed origins (comma-sep) | `*` |
| `RATE_LIMIT_MAX` | Max reqs per window | `100` |
| `RATE_LIMIT_WINDOW_MS` | Window in ms | `900000` |

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/health` | Health check |
| `POST` | `/api/analytics/track` | Track visit `{ "page": "/path" }` |
| `GET` | `/api/analytics/stats` | All pages aggregate |
| `GET` | `/api/analytics/stats/:page` | Stats for one page |

## Deploy on Render

1. Push to GitHub
2. Render → **New Web Service** → connect repo
3. Set:
   - **Root Directory**: `analytics`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add env vars: `FIREBASE_CREDENTIALS_JSON`, `NODE_ENV=production`, `CORS_ORIGIN`

## Structure

```
analytics/
├── server.js
├── src/
│   ├── config/db.js
│   ├── models/Visitor.js, Visit.js
│   ├── controllers/analyticsController.js
│   ├── routes/analyticsRoutes.js
│   ├── middleware/errorHandler.js, rateLimiter.js
│   └── utils/AppError.js
├── .env.example
└── package.json
```
