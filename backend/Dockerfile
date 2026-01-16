# 1. Build Stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Копируем go.mod и go.sum из папки backend
COPY go.mod go.sum ./
RUN go mod download

# Копируем исходный код
COPY . .

# Собираем бинарник "server"
# Важно: CGO_ENABLED=0 для статической линковки (чтобы работал на Alpine)
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/main.go

# 2. Run Stage (минимальный образ)
FROM alpine:latest

WORKDIR /root/

# Копируем бинарник из первого этапа
COPY --from=builder /app/server .

# Если нужны SSL сертификаты (для HTTPS запросов из Go)
RUN apk --no-cache add ca-certificates

# Порт, который слушает твой Go сервер
EXPOSE 8080

# Запуск
CMD ["./server"]