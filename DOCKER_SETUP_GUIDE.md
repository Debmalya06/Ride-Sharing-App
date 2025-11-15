# 🐳 Docker Setup Guide - SmartRide Application

## Overview

This guide explains how to build and run the SmartRide ride-sharing application using Docker and Docker Compose.

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Network                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐  │
│  │  Frontend    │  │  Backend    │  │  MySQL Database  │  │
│  │ (React/Nginx)│  │(Spring Boot)│  │   (MySQL 8.0)    │  │
│  │   Port 80    │  │  Port 8080  │  │    Port 3306     │  │
│  └──────┬───────┘  └──────┬──────┘  └──────┬───────────┘  │
│         │                 │                 │              │
│         └────────────┬────┴────────────┬────┘              │
│                      │                 │                   │
│              ride-sharing-network (bridge)                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- ✅ Docker 20.10+ 
- ✅ Docker Compose 2.0+
- ✅ 4GB RAM minimum
- ✅ 10GB free disk space

**Installation:**
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Docker Engine on Linux](https://docs.docker.com/engine/install/)

---

## Quick Start

### 1. **Build and Start All Services**

```bash
# Navigate to project root
cd Development-of-a-Dynamic-Ride-Sharing-and-Carpooling-Platform_September_Batch-3_2025

# Build and run all services
docker-compose up -d --build
```

### 2. **Verify Services are Running**

```bash
# Check all containers
docker-compose ps

# Expected output:
# NAME                      STATUS
# ride-sharing-mysql        Up (healthy)
# ride-sharing-backend      Up (healthy)
# ride-sharing-frontend     Up (healthy)
```

### 3. **Access the Application**

- **Frontend:** http://localhost
- **Backend API:** http://localhost:8080/api
- **Test Endpoint:** http://localhost:8080/api/test

---

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```bash
# Database Configuration
DB_ROOT_PASSWORD=root_secure_password
DB_NAME=Ride_Sharing
DB_USERNAME=ride_user
DB_PASSWORD=ride_secure_password

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_here

# Email Configuration (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your_app_specific_password

# Email Settings
APP_EMAIL_FROM=SmartRide <support@smartride.com>
APP_EMAIL_SUPPORT=support@smartride.com

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Application Settings
APP_BASE_URL=http://localhost:5173
APP_PLATFORM_COMMISSION=10.0
```

### Using Environment File

```bash
# Create and edit .env file
cp .env.example .env
nano .env

# Run with environment file
docker-compose --env-file .env up -d
```

---

## Individual Service Management

### Backend (Spring Boot)

**Build Backend Only:**
```bash
docker-compose build backend
```

**Run Backend Only:**
```bash
docker-compose up -d backend
```

**View Backend Logs:**
```bash
docker-compose logs -f backend
```

**Check Backend Health:**
```bash
curl http://localhost:8080/api/test
```

### Frontend (React)

**Build Frontend Only:**
```bash
docker-compose build frontend
```

**Run Frontend Only:**
```bash
docker-compose up -d frontend
```

**View Frontend Logs:**
```bash
docker-compose logs -f frontend
```

### Database (MySQL)

**View Database Logs:**
```bash
docker-compose logs -f mysql
```

**Connect to Database:**
```bash
docker-compose exec mysql mysql -u ride_user -p Ride_Sharing

# When prompted, enter: ride_secure_password
```

**Execute SQL Query:**
```bash
docker-compose exec mysql mysql -u ride_user -p Ride_Sharing \
  -e "SELECT * FROM users LIMIT 5;"
```

---

## Common Commands

### Start/Stop Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (CAUTION: removes data)
docker-compose down -v

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart backend
```

### Logs and Debugging

```bash
# View all logs
docker-compose logs

# View logs for specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mysql

# Follow logs in real-time
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100

# View logs from last 10 minutes
docker-compose logs --since 10m
```

### Execute Commands in Containers

```bash
# Bash into backend container
docker-compose exec backend /bin/bash

# Run command in backend
docker-compose exec backend java -version

# Run command in database
docker-compose exec mysql mysql -u ride_user -p
```

### Building Images

```bash
# Build all images
docker-compose build

# Build specific image
docker-compose build backend
docker-compose build frontend

# Build without cache
docker-compose build --no-cache backend

# Build with progress output
docker-compose build --progress=plain
```

---

## Health Checks

Each service includes health checks:

```bash
# Check service health
docker-compose ps

# Detailed health status
docker ps --format "table {{.Names}}\t{{.Status}}"

# View container health
docker inspect ride-sharing-backend --format='{{.State.Health.Status}}'
```

---

## Performance Tuning

### Memory and CPU Limits

Edit `docker-compose.yml` to add resource limits:

```yaml
services:
  backend:
    # ... other config ...
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Database Optimization

```bash
# Check MySQL connections
docker-compose exec mysql mysql -u ride_user -p -e \
  "SHOW PROCESSLIST;"

# Check database size
docker-compose exec mysql mysql -u ride_user -p -e \
  "SELECT table_schema AS Database, 
          SUM(data_length + index_length) / 1024 / 1024 AS Size_MB 
   FROM information_schema.tables 
   GROUP BY table_schema;"
```

---

## Production Deployment

### Security Considerations

1. **Use secrets instead of environment variables:**
```bash
docker secret create db_password -
docker-compose -f docker-compose.prod.yml up
```

2. **Enable HTTPS:**
```yaml
services:
  frontend:
    ports:
      - "443:443"
    volumes:
      - ./certs:/etc/nginx/certs:ro
```

3. **Change Default Credentials:**
```bash
# Never use default passwords
DB_PASSWORD=ultra_secure_password_here
JWT_SECRET=long_random_secret_key_here
```

### Scaling

```bash
# Scale backend instances (requires reverse proxy)
docker-compose up -d --scale backend=3

# Note: Frontend and MySQL should not be scaled this way
```

---

## Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready - wait 30s
# 2. Port 8080 already in use
# 3. Environment variables missing
```

**Solution:**
```bash
# Restart backend after database is ready
docker-compose restart backend
```

### Frontend Not Loading

```bash
# Check nginx logs
docker-compose logs frontend

# Check if backend is responding
curl http://localhost:8080/api/test

# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Database Connection Issues

```bash
# Test database connectivity
docker-compose exec backend curl -v mysql:3306

# Check MySQL logs
docker-compose logs mysql

# Verify credentials in .env
docker-compose config | grep -i database
```

### Slow Performance

```bash
# Check resource usage
docker stats

# Check disk space
docker system df

# Clean up unused resources
docker system prune -a
```

---

## Development Workflow

### Hot Reload (Frontend)

Mount source directory:

```yaml
services:
  frontend:
    volumes:
      - ./client/src:/app/src:cached
```

### Live Debugging (Backend)

Enable debug mode:

```bash
docker-compose up -d --build
docker-compose logs -f backend | grep "Started RideSharingApplication"
```

### Database Backup/Restore

**Backup Database:**
```bash
docker-compose exec mysql mysqldump -u ride_user -p Ride_Sharing > backup.sql
# Enter password: ride_secure_password
```

**Restore Database:**
```bash
docker-compose exec -T mysql mysql -u ride_user -p Ride_Sharing < backup.sql
```

---

## Cleanup

```bash
# Stop all containers
docker-compose down

# Remove all containers and images
docker-compose down --rmi all

# Remove volumes (delete database)
docker-compose down -v

# Full cleanup (removes all Docker resources)
docker system prune -a -v
```

---

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Security Best Practices](https://docs.docker.com/engine/security/)

---

## Support

For issues, check:
1. Docker and Docker Compose version compatibility
2. System requirements (RAM, disk space)
3. Port availability (80, 8080, 3306)
4. Environment variables in `.env` file
5. Service logs via `docker-compose logs`

---

**Last Updated:** November 15, 2025  
**Version:** 1.0.0
