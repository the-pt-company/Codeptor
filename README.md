<div align="center">

# KudosDev

**A full-stack developer portfolio and community platform.**

Build in public. Showcase your work. Track what matters.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

</div>

---

## 🎯 What is KudosDev?

Most developer portfolios are static pages that go stale the moment they're deployed. KudosDev is different — it's a **living platform** where developers can showcase projects, publish technical blogs, and monitor real-time engagement analytics, all from a single, unified interface.

Whether you're building credibility for your next role or sharing knowledge with the community, KudosDev gives you the tools to do it professionally.

---

## ✨ Key Features

- **Project Showcase** — Create rich project pages with descriptions, tech stacks, live demos, and media galleries
- **Blog Engine** — Write and publish technical blogs in Markdown with syntax highlighting, reading time estimation, and SEO metadata
- **Analytics Dashboard** — Track page views, engagement trends, and content performance with real-time visualizations
- **Authentication** — Secure JWT-based auth with registration, login, and password reset flows
- **Profile System** — Public developer profiles with skills, social links, and shareable profile cards
- **File Uploads** — Upload project thumbnails and media assets directly through the platform

---

## 🏗️ Architecture

KudosDev is built as a **service-oriented architecture** with three independently running services sharing a common MongoDB database.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                        │
└──────────────┬──────────────────────────────┬───────────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────┐   ┌──────────────────────────────┐
│    Frontend (React SPA)  │   │                              │
│       localhost:3000     │   │                              │
│                          │   │                              │
│  • Tailwind CSS UI       │   │                              │
│  • Client-side routing   │   │                              │
│  • Markdown rendering    │   │                              │
└──────────┬───────────────┘   │                              │
           │ REST API          │                              │
           ▼                   │                              │
┌──────────────────────────┐   │   Analytics Service (Express)│
│  Backend API (FastAPI)   │   │        localhost:4000        │
│     localhost:8000       │   │                              │
│                          │   │   • Event tracking           │
│  • JWT Authentication    │   │   • Rate limiting            │
│  • User & Profile CRUD   │   │   • Security middleware      │
│  • Project Management    │   │   • Request logging          │
│  • Blog System           │   │                              │
│  • File Uploads          │   │                              │
└──────────┬───────────────┘   └──────────────┬───────────────┘
           │                                  │
           ▼                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MongoDB (Shared)                         │
│                                                                 │
│   Users · Projects · Blogs · Analytics Events · Sessions        │
└─────────────────────────────────────────────────────────────────┘
```

### Why this architecture?

| Decision | Rationale |
|----------|-----------|
| **Separate analytics service** | Isolates high-frequency tracking writes from the main API, allowing independent scaling and rate limiting |
| **FastAPI for the core API** | Async-first Python framework with automatic OpenAPI docs, Pydantic validation, and excellent MongoDB driver support via Motor |
| **React SPA with Tailwind** | Component-driven UI with utility-first styling for rapid, consistent development |
| **Shared MongoDB** | Simplifies data access across services while keeping deployment straightforward for a portfolio-scale project |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React · Tailwind CSS · React Router · Axios |
| **Backend API** | Python · FastAPI · Motor (async MongoDB) |
| **Analytics** | Node.js · Express · Mongoose |
| **Database** | MongoDB |
| **Auth** | JWT · bcrypt |
| **DevOps** | Concurrently (multi-service orchestration) |

---

## 🔄 How It Works

```
User Action → React UI → Axios HTTP Request
                              │
        ┌─────────────────────┼──────────────────────┐
        ▼                     ▼                      ▼
   Auth Flow            CRUD Operations        Analytics Event
   (FastAPI)              (FastAPI)              (Express)
        │                     │                      │
        ▼                     ▼                      ▼
   JWT Issued           MongoDB Read/Write      Event Stored
        │                     │                      │
        ▼                     ▼                      ▼
   Token Stored         JSON Response           Aggregated for
   (Client-side)        → UI Updated            Dashboard Display
```

1. The **React frontend** handles all user interactions and communicates with backend services via REST APIs
2. The **FastAPI backend** processes authentication, manages users/projects/blogs, and serves as the primary data layer
3. The **Analytics service** independently captures page views and engagement events with built-in rate limiting
4. **MongoDB** stores all persistent data, with each service using its own collections

---

## 📁 Project Structure

```
KudosD/
├── frontend/                   # React client application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route-level pages
│   │   ├── context/            # React context (Auth, Theme)
│   │   └── lib/                # API client & utilities
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                    # FastAPI server
│   ├── server.py               # Routes, models, auth logic
│   ├── database.py             # MongoDB connection layer
│   ├── requirements.txt
│   └── uploads/                # User-uploaded assets
│
├── analytics/                  # Express analytics microservice
│   ├── server.js               # Service entry point
│   └── src/
│       ├── routes/             # Analytics endpoints
│       └── middleware/         # Rate limiting, security
│
├── package.json                # Root orchestration scripts
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10
- **MongoDB** — local instance or [MongoDB Atlas](https://www.mongodb.com/atlas)

### Setup

```bash
# Clone the repository
git clone <repo-url>
cd KudosD

# Create environment files from templates
npm run setup

# Install all dependencies (root + frontend + backend)
npm run install-all

# Set up Python virtual environment
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

> **Important:** Edit `backend/.env` and `analytics/.env` with your MongoDB connection string and a strong `SECRET_KEY` before running.

### Run

```bash
npm start
```

This launches all services concurrently:

| Service | URL |
|---------|-----|
| Frontend | [http://localhost:3000](http://localhost:3000) |
| Backend API | [http://localhost:8000](http://localhost:8000) |
| API Docs (Swagger) | [http://localhost:8000/docs](http://localhost:8000/docs) |
| Analytics | [http://localhost:4000](http://localhost:4000) |

---

## ⚙️ Configuration

Each service uses its own `.env` file, created from `.env.example` templates via `npm run setup`.

| Service | Config File | Key Variables |
|---------|-------------|---------------|
| **Backend** | `backend/.env` | `MONGO_URL`, `SECRET_KEY`, `CORS_ORIGINS` |
| **Frontend** | `frontend/.env` | `REACT_APP_BACKEND_URL` |
| **Analytics** | `analytics/.env` | `MONGO_URI`, `PORT`, `CORS_ORIGIN`, `RATE_LIMIT_MAX` |

---

## 📜 Available Scripts

Run from the project root:

| Command | Description |
|---------|-------------|
| `npm start` | Start all services concurrently |
| `npm run stop` | Kill running services on ports 3000 & 8000 |
| `npm run clean-start` | Stop existing processes, then start fresh |
| `npm run install-all` | Install dependencies for all services |
| `npm run setup` | Generate `.env` files from templates |

---

## 🗺️ Roadmap

- [ ] OAuth integration (GitHub, Google)
- [ ] Real-time notifications
- [ ] Comment and reaction system for blogs
- [ ] Project collaboration and team features
- [ ] Public API with developer tokens
- [ ] Deployment pipeline with Docker Compose
- [ ] Full-text search across projects and blogs
- [ ] Email notifications for engagement milestones

---

<div align="center">

**Built with ☕ and curiosity.**

</div>
