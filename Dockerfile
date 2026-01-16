# Dockerfile (лежит в корне)

# 1. Сборка
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Копируем go.mod из папки backend
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Копируем исходный код из папки backend
COPY backend/ .

# Билдим
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/main.go

# 2. Запуск (легкий образ)
FROM alpine:latest

WORKDIR /root/

# Копируем бинарник
COPY --from=builder /app/server .

# Копируем миграции (если они нужны при старте)
# COPY --from=builder /app/db/migrations ./db/migrations 

EXPOSE 8080

CMD ["./server"]