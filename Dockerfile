# --- Stage 1: Build the Go binary ---
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Copy only dependency files first to utilize Docker cache
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Copy the rest of the backend code
COPY backend/ .

# Build the app into a single binary named 'server'
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/main.go

# --- Stage 2: Final Light Image ---
FROM alpine:latest
WORKDIR /root/

# Install CA certificates so your Go app can make HTTPS requests (to APIs)
RUN apk --no-cache add ca-certificates

# Copy only the compiled binary from the builder stage
COPY --from=builder /app/server .

EXPOSE 8080
CMD ["./server"]