# Memofold 🧠

Веб-приложение для изучения английского языка методом интервальных повторений (SRS) с механикой "Гармошка".

[Project]() В настоящее время - хостинг сайта приостановлен

## ✨ Особенности
*   **Active Recall:** Уникальный интерфейс скрытия колонок для глубокого запоминания.
*   **Smart SRS:** Алгоритм автоматически рассчитывает время следующего повторения.
*   **Deck Builder:** Гибкий конструктор уроков из готовых наборов и своих слов.
*   **Analytics:** Визуализация прогресса и качества обучения.

## 🛠 Технический стек

**Backend:**
*   **Go** (Golang)
*   **Clean Architecture** (Handler -> Service -> Repository)
*   **PostgreSQL** (GORM + Raw SQL для сложной аналитики)
*   **JWT** (Access + Refresh Tokens с ротацией)

**Frontend(vibe-codding):**
*   **React** + **TypeScript** + **Vite**
*   **Mantine UI** (Адаптивный интерфейс)
*   **Ky** 
*   **Recharts** (Графики)

## 🏗 Архитектура
Проект построен как монорепозиторий:
*   `/backend` - REST API на Go. Реализована пакетная обработка данных, транзакционность (ACID) и фоновая очистка мусора (Garbage Collector).
*   `/frontend` - SPA на React. Реализована сложная логика стейта для режима тренировки и конструктора колод.

## 🚀 Запуск локально

### Creating .env
```
nano .env
```
### paste 
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

### docker
```
docker compose up -d --build
```

