# Running Ride-Sharing App Docker Image Locally

## Quick Start

### 1. Pull the Image from Docker Hub
```bash
docker pull debmalya06/ride-sharing-app:latest
```

### 2. Run the Container

**Simplest way:**
```bash
docker run -p 8080:8080 debmalya06/ride-sharing-app:latest
```

**With environment variables:**
```bash
docker run -p 8080:8080 \
  -e DB_USERNAME=root \
  -e DB_PASSWORD=your_password \
  -e JWT_SECRET=your_jwt_secret \
  -e MAIL_USERNAME=your_email@gmail.com \
  -e MAIL_PASSWORD=your_app_password \
  debmalya06/ride-sharing-app:latest
```

**With .env file (Recommended):**
```bash
docker run -p 8080:8080 --env-file .env debmalya06/ride-sharing-app:latest
```

## Complete Setup with Docker Compose

### Step 1: Create `docker-compose.yml`
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: ride-sharing-db
    environment:
      MYSQL_ROOT_PASSWORD: Poiu0987#
      MYSQL_DATABASE: Ride_Sharing
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

  ride-sharing-app:
    image: debmalya06/ride-sharing-app:latest
    container_name: ride-sharing-backend
    ports:
      - "8080:8080"
    environment:
      SPRING_DATASOURCE_URL: jdbc:mysql://mysql:3306/Ride_Sharing?createDatabaseIfNotExist=true
      SPRING_DATASOURCE_USERNAME: root
      SPRING_DATASOURCE_PASSWORD: Poiu0987#
      JWT_SECRET: ${JWT_SECRET:-change-this-in-production}
      MAIL_HOST: ${MAIL_HOST:-smtp.gmail.com}
      MAIL_PORT: ${MAIL_PORT:-587}
      MAIL_USERNAME: ${MAIL_USERNAME:-}
      MAIL_PASSWORD: ${MAIL_PASSWORD:-}
    depends_on:
      mysql:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/test"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  mysql_data:
```

### Step 2: Create `.env` file
```env
# Database
MYSQL_ROOT_PASSWORD=Poiu0987#
DB_USERNAME=root
DB_PASSWORD=Poiu0987#

# JWT
JWT_SECRET=your_secure_jwt_secret_here

# Email (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
```

### Step 3: Start the Stack
```bash
# Start all services
docker-compose up

# Start in background
docker-compose up -d

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f ride-sharing-app
```

## Useful Docker Commands

### Container Management
```bash
# List running containers
docker ps

# List all containers (including stopped)
docker ps -a

# View container logs
docker logs <container_id>

# Follow logs in real-time
docker logs -f <container_id>

# Stop a container
docker stop <container_id>

# Start a stopped container
docker start <container_id>

# Remove a container
docker rm <container_id>

# View container details
docker inspect <container_id>
```

### Image Management
```bash
# List all images
docker images

# Pull latest image
docker pull debmalya06/ride-sharing-app:latest

# Remove an image
docker rmi debmalya06/ride-sharing-app:latest

# Tag an image
docker tag debmalya06/ride-sharing-app:latest ride-sharing-app:local
```

### Docker Compose Commands
```bash
# Start services
docker-compose up

# Start in background
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild services
docker-compose up --build

# Execute command in container
docker-compose exec ride-sharing-app bash

# List services
docker-compose ps
```

### Networking
```bash
# Enter container shell
docker exec -it <container_id> /bin/bash

# Test API from outside
curl http://localhost:8080/api/test

# Test API from inside container
docker exec <container_id> curl http://localhost:8080/api/test
```

## Troubleshooting

### Container exits immediately
```bash
# Check logs
docker logs <container_id>

# Look for errors related to database connection or configuration
```

### Port already in use
```bash
# Use a different port
docker run -p 9090:8080 debmalya06/ride-sharing-app:latest

# Or find what's using port 8080
netstat -ano | findstr :8080  # Windows
lsof -i :8080                 # Mac/Linux
```

### Database connection errors
```bash
# Ensure MySQL is running
docker ps | grep mysql

# Check MySQL logs
docker logs <mysql_container_id>

# Verify MySQL is accessible
docker exec <mysql_container_id> mysql -u root -p<password> -e "SELECT 1;"
```

### Environment variables not loading
```bash
# Verify env file exists
ls -la .env

# Check env file format (no quotes needed)
cat .env

# Pass individual vars explicitly
docker run -e VAR_NAME=value image_name
```

## Performance Optimization

### Limit Resource Usage
```bash
docker run -p 8080:8080 \
  -m 512m \
  --cpus="1.0" \
  --env-file .env \
  debmalya06/ride-sharing-app:latest
```

- `-m 512m`: Limit memory to 512MB
- `--cpus="1.0"`: Limit to 1 CPU core

### Use Named Volumes for Data Persistence
```yaml
services:
  mysql:
    volumes:
      - ride_sharing_db:/var/lib/mysql

volumes:
  ride_sharing_db:
    driver: local
```

## Health Checks

The Docker image includes a health check that verifies the application is running:

```bash
# Check health status
docker inspect --format='{{json .State.Health}}' <container_id>

# View health check logs
docker inspect <container_id> | grep -A 10 Health
```

## Monitoring and Logging

### View Real-time Logs
```bash
docker logs -f ride-sharing-app
```

### Save Logs to File
```bash
docker logs <container_id> > app.log 2>&1
```

### Use Log Drivers
```yaml
services:
  ride-sharing-app:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Production Deployment

### For Production Use:
1. Use specific image tags (not `latest`)
2. Set resource limits
3. Use named volumes for data persistence
4. Configure proper logging
5. Use environment variables for secrets
6. Enable health checks
7. Set restart policies

Example:
```yaml
services:
  ride-sharing-app:
    image: debmalya06/ride-sharing-app:v1.0.0
    restart: unless-stopped
    mem_limit: 1g
    cpus: 2
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "5"
```

## Support

For issues or questions:
1. Check Docker logs: `docker logs <container_id>`
2. Verify environment variables
3. Check database connectivity
4. Review GitHub issues: https://github.com/Debmalya06/Ride-Sharing-App/issues

---

**Happy containerizing! 🐳**
