# ClearGive Docker Setup

This repository contains Docker configuration to run both the ClearGive frontend and backend applications in parallel.

## Prerequisites

- Docker
- Docker Compose

## Getting Started

1. Make sure you have set up the environment variables in `server/.env` file (you can copy from `.env.example` and modify as needed)

2. Build and start the application:

```bash
docker-compose up -d
```

3. Access the applications:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8080/api/health

## Database Information

This setup uses SQLite as the database engine. The SQLite database file is stored in a Docker volume named `sqlite_data` and mounted at `/app/server/data/cleargive.db` within the container.

The database persists between container restarts, and you can back it up by copying it from the container or volume.

## Development vs Production

This Docker setup builds the frontend application and serves it statically. If you need to make frequent changes to the frontend code during development, consider using the development mode outside of Docker.

For production usage, you may want to add more security configurations and optimizations. 