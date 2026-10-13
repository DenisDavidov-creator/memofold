# Memofold 🧠

A web application for learning English vocabulary with spaced repetition (SRS) and an "accordion" review mechanic.

> 🎓 This project was developed as my graduation thesis (diploma project).

**Live demo:** hosting is currently suspended.

## ✨ Features
*   **Active Recall:** A unique column-hiding interface for deeper memorization.
*   **Smart SRS:** The algorithm automatically calculates when each word should be reviewed next.
*   **Deck Builder:** A flexible lesson builder that combines ready-made word sets with your own words.
*   **Analytics:** Visualization of learning progress and quality.

## 🛠 Tech Stack

**Backend:**
*   **Go** (Golang)
*   **Clean Architecture** (Handler -> Service -> Repository)
*   **PostgreSQL** (GORM + raw SQL for complex analytics)
*   **JWT** (access + refresh tokens with rotation)

**Frontend (vibe-coded):**
*   **React** + **TypeScript** + **Vite**
*   **Mantine UI** (responsive interface)
*   **Ky** (HTTP client)
*   **Recharts** (charts)

## 🏗 Architecture
The project is organized as a monorepo:
*   `/backend` - REST API in Go. Features batch data processing, ACID transactions, and a background cleanup job (garbage collector).
*   `/frontend` - React SPA. Handles complex state logic for the training mode and the deck builder.

## 🚀 Running Locally

### Create a `.env` file
```
nano .env
```
### Paste the following
```
# Database Internal Settings (Used by Postgres image)
POSTGRES_USER=Nya
POSTGRES_PASSWORD=Nya_password
POSTGRES_DB=Nya_memofold

# Application Settings (Used by Go code)
DB_HOST=db
DB_PORT=5432
DB_USER=Nya
DB_PASSWORD=Nya_password
DB_NAME=Nya_memofold
JWT_SECRET_KEY=super_puper_secret_key
HTTP_SERVER=8080

# Migration Setting (Used by the migrate service)
DB_URL=postgres://Nya:Nya_password@db:5432/Nya_memofold?sslmode=disable
```

### Start with Docker
```
docker compose up -d --build
```
