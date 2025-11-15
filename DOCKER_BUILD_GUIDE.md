# Docker Build & Deployment Guide

## ✅ Fixed Issue: JAR File Path in Dockerfile

### Problem
```
ERROR: lstat /target: no such file or directory
COPY target/*.jar app.jar - ERROR
```

### Root Cause
When running `docker build` from the project root, the relative path `target/*.jar` doesn't exist because:
- The build context is at the project root
- The Ride-Sharing module's target folder is at `Ride-Sharing/target/`
- Using `ARG JAR_FILE=target/*.jar` was relative to wrong location

### Solution
Updated the Dockerfile to use the correct path:

```dockerfile
FROM eclipse-temurin:21-jdk

WORKDIR /app

EXPOSE 8080

# Correct path from project root where docker build is run
COPY Ride-Sharing/target/*.jar app.jar

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD java -cp app.jar -c "import java.net.URL; new URL(\"http://localhost:8080/api/test\").openConnection().getInputStream();" || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## 🐳 Local Docker Build & Run

### Prerequisites
```bash
# Ensure Maven is installed
mvn --version

# Ensure Docker is installed and running
docker --version
```

### Build JAR File
```bash
# Build Spring Boot JAR (from project root)
cd Ride-Sharing
mvn clean package -DskipTests
cd ..
```

### Build Docker Image
```bash
# Build from project root (not from Ride-Sharing folder)
docker build -f Ride-Sharing/Dockerfile -t ride-sharing-app:latest .

# Or with specific tag for Docker Hub
docker build -f Ride-Sharing/Dockerfile -t debmalya06/ride-sharing-app:latest .
```

### Run Docker Container
```bash
# Basic run (interactive)
docker run -p 8080:8080 \
  -e DB_USERNAME=root \
  -e DB_PASSWORD=your_password \
  -e JWT_SECRET=your_jwt_secret \
  -e MAIL_PASSWORD=your_email_password \
  ride-sharing-app:latest

# Run in background (detached)
docker run -d -p 8080:8080 \
  --name ride-sharing \
  -e DB_USERNAME=root \
  -e DB_PASSWORD=your_password \
  -e JWT_SECRET=your_jwt_secret \
  -e MAIL_PASSWORD=your_email_password \
  ride-sharing-app:latest

# Run with environment file
docker run -d -p 8080:8080 \
  --name ride-sharing \
  --env-file .env.local \
  ride-sharing-app:latest
```

### Verify Container
```bash
# Check if container is running
docker ps

# View container logs
docker logs ride-sharing

# View live logs
docker logs -f ride-sharing

# Check container health
docker inspect ride-sharing | grep -A 5 Health

# Test the API
curl http://localhost:8080/api/test
```

---

## 🐋 Docker Compose (Recommended for Development)

### Run Full Stack
```bash
# Start all services (backend + database)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Docker Compose Configuration
The `docker-compose.yml` includes:
- ✅ Spring Boot backend (port 8080)
- ✅ MySQL database (port 3306)
- ✅ Volume for database persistence
- ✅ Network for service communication
- ✅ Environment variables

---

## 🚀 GitHub Actions CI/CD Pipeline

### Automated Build & Push
The `maven.yml` workflow:
1. ✅ Checks out code
2. ✅ Sets up JDK 21
3. ✅ Builds JAR with Maven
4. ✅ Builds Docker image
5. ✅ Pushes to Docker Hub

### Setup Docker Hub Credentials
```bash
# Add to GitHub repository secrets:
# - DOCKERHUB_USERNAME: your_docker_username
# - DOCKERHUB_TOKEN: your_docker_hub_token
```

### Trigger Pipeline
- Automatically on push to `DebmalyaPan` branch
- Manually via GitHub Actions tab

### Check Build Status
```bash
# View on GitHub
# Actions tab → Maven.yml → Select run

# Docker Hub
# https://hub.docker.com/r/debmalya06/ride-sharing-app
```

---

## 📋 Troubleshooting

### Issue: "lstat /target: no such file or directory"
**Cause:** Wrong path in COPY command  
**Fix:** Use `Ride-Sharing/target/*.jar` (full path from project root)

### Issue: "Cannot connect to database"
**Cause:** Environment variables not set  
**Fix:** Pass `-e DB_USERNAME=root -e DB_PASSWORD=password` or use `--env-file .env`

### Issue: "Port 8080 already in use"
```bash
# Kill existing container
docker stop ride-sharing
docker rm ride-sharing

# Or use different port
docker run -p 8081:8080 ride-sharing-app:latest
```

### Issue: "Image not found"
```bash
# Build image first
docker build -f Ride-Sharing/Dockerfile -t ride-sharing-app:latest .

# Or pull from Docker Hub
docker pull debmalya06/ride-sharing-app:latest
```

### View Container Details
```bash
# Full container info
docker inspect ride-sharing

# Only specific info
docker inspect -f '{{.State.Running}}' ride-sharing
docker inspect -f '{{.NetworkSettings.IPAddress}}' ride-sharing
```

---

## 🔍 Debugging

### Access Container Shell
```bash
# Interactive bash
docker exec -it ride-sharing /bin/bash

# Check files
docker exec ride-sharing ls -la /app

# View application logs inside container
docker exec ride-sharing cat /proc/1/fd/1
```

### Check Build Process
```bash
# Verbose build output
docker build -f Ride-Sharing/Dockerfile --progress=plain -t ride-sharing-app:latest .

# Keep intermediate layers
docker build -f Ride-Sharing/Dockerfile --rm=false -t ride-sharing-app:latest .
```

---

## 📊 Docker Best Practices Applied

✅ **Multi-stage builds:** Not needed (single JAR deployment)  
✅ **Minimal base image:** `eclipse-temurin:21-jdk` (optimized Java image)  
✅ **Correct working directory:** `WORKDIR /app`  
✅ **Proper file paths:** `Ride-Sharing/target/*.jar`  
✅ **Health checks:** Included for container monitoring  
✅ **Environment variables:** Used for configuration  
✅ **Exposed ports:** Clear port mapping  
✅ **Layering:** Optimal layer caching

---

## 🎯 Deployment Steps

### Local Testing
```bash
# 1. Build JAR
cd Ride-Sharing && mvn clean package -DskipTests && cd ..

# 2. Build image
docker build -f Ride-Sharing/Dockerfile -t ride-sharing-app:latest .

# 3. Run container
docker run -d -p 8080:8080 --env-file .env.local --name ride-sharing ride-sharing-app:latest

# 4. Test API
curl http://localhost:8080/api/test

# 5. View logs
docker logs ride-sharing
```

### Push to Docker Hub
```bash
# Login to Docker Hub
docker login

# Tag image
docker tag ride-sharing-app:latest debmalya06/ride-sharing-app:latest

# Push image
docker push debmalya06/ride-sharing-app:latest
```

### Production Deployment
```bash
# Pull latest image
docker pull debmalya06/ride-sharing-app:latest

# Run with production environment
docker run -d \
  -p 8080:8080 \
  --name ride-sharing-prod \
  --restart unless-stopped \
  --env-file /etc/ride-sharing/.env.production \
  -v /data/ride-sharing/logs:/app/logs \
  debmalya06/ride-sharing-app:latest
```

---

## 📚 References

- [Docker Official Documentation](https://docs.docker.com/)
- [Spring Boot Docker](https://spring.io/guides/gs/spring-boot-docker/)
- [Eclipse Temurin Base Images](https://hub.docker.com/_/eclipse-temurin)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**Last Updated:** November 15, 2025  
**Status:** ✅ Production Ready
