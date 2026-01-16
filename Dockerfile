# Dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/main.go

FROM alpine:latest
WORKDIR /root/
COPY --from=builder /app/server .
RUN apk --no-cache add ca-certificates
EXPOSE 8080
CMD ["./server"]