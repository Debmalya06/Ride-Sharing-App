# Docker Hub Setup & GitHub Actions Guide

## 🐳 Docker Hub Personal Access Token Setup

### Problem
```
unauthorized: access token has insufficient scopes
```

This error occurs when your Docker Hub token doesn't have the required permissions to push images.

### Solution

#### Step 1: Create a New Personal Access Token

1. Go to **[Docker Hub](https://hub.docker.com/)**
2. Sign in with your account
3. Click your **Profile Icon** (top-right) → **Account Settings**
4. Navigate to **Security** tab
5. Click **Personal Access Tokens**
6. Click **Generate New Token**

#### Step 2: Configure Token Permissions

**Token Name:** `DOCKER_BUILD_PUSH_TOKEN`

**Scopes (Check these):**
- ✅ **Read** - To pull images
- ✅ **Write** - To push images
- ✅ **Delete** - To manage image versions

**DO NOT** use Read-only tokens for pushing!

#### Step 3: Copy the Token

Once generated, Docker Hub shows the token **only once**:
```
dckr_pat_xxxxxxxxxxxxxxxxxxxxxxxx
```

Copy it immediately (you cannot view it again).

---

## 🔐 Add Token to GitHub Secrets

### Step 1: Go to GitHub Repository Settings

1. Navigate to your GitHub repository
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**

### Step 2: Create New Repository Secrets

Create these secrets:

| Secret Name | Value |
|---|---|
| `DOCKERHUB_USERNAME` | Your Docker Hub username |
| `DOCKERHUB_TOKEN` | The PAT you just created |

### Step 3: Add Secrets

1. Click **New repository secret**
2. Name: `DOCKERHUB_USERNAME`
3. Value: Your Docker Hub username
4. Click **Add secret**

Repeat for `DOCKERHUB_TOKEN`

---

## 🔄 GitHub Actions Workflow

### Automatic Docker Build & Push

The workflow automatically triggers on:
- ✅ Push to `DebmalyaPan` branch
- ✅ Push to `main` branch
- ✅ Pull requests

### What Happens

1. **Checkout** - Gets the code
2. **Setup Java 21** - Configures JDK
3. **Build JAR** - `mvn clean package` in `Ride-Sharing/` directory
4. **Setup Docker** - Prepares Docker Buildx
5. **Login to Docker Hub** - Uses your token
6. **Build & Push** - Creates Docker image and pushes to Docker Hub

### Generated Tags

The workflow creates two tags for each build:

```
debmalya06/ride-sharing-app:latest           ← Latest version
debmalya06/ride-sharing-app:abc123def...     ← Git commit SHA
```

---

## 🐳 Local Docker Testing

### Build Locally

```bash
# Navigate to project root
cd Development-of-a-Dynamic-Ride-Sharing-and-Carpooling-Platform_September_Batch-3_2025

# Build the image
docker build -f Ride-Sharing/Dockerfile -t ride-sharing-app:local .
```

### Run Locally

```bash
docker run -p 8080:8080 \
  -e DB_PASSWORD=yourpassword \
  -e JWT_SECRET=your_jwt_secret \
  -e MAIL_PASSWORD=your_email_password \
  ride-sharing-app:local
```

### View Logs

```bash
docker logs <container_id>
```

---

## 🚀 Push to Docker Hub Manually

### Login to Docker Hub

```bash
docker login
# Enter username and password when prompted
```

### Tag Image

```bash
docker tag ride-sharing-app:local debmalya06/ride-sharing-app:v1.0
```

### Push Image

```bash
docker push debmalya06/ride-sharing-app:v1.0
docker push debmalya06/ride-sharing-app:latest
```

---

## 📦 Use Docker Image in Production

### Pull from Docker Hub

```bash
docker pull debmalya06/ride-sharing-app:latest
```

### Run Container

```bash
docker run -d \
  --name ride-sharing \
  -p 8080:8080 \
  -e DB_USERNAME=prod_user \
  -e DB_PASSWORD=secure_password \
  -e JWT_SECRET=prod_jwt_secret \
  -e MAIL_PASSWORD=prod_mail_password \
  -e RAZORPAY_KEY_ID=rzp_live_xxxx \
  -e RAZORPAY_KEY_SECRET=xxxx \
  debmalya06/ride-sharing-app:latest
```

### View Logs

```bash
docker logs -f ride-sharing
```

---

## ⚙️ Docker Compose

### Start All Services

```bash
docker-compose up -d
```

### Stop All Services

```bash
docker-compose down
```

### View Logs

```bash
docker-compose logs -f
```

---

## 🔍 Troubleshooting

### Error: "unauthorized: access token has insufficient scopes"

**Solution:**
1. Regenerate your Docker Hub PAT with proper scopes (Read, Write, Delete)
2. Update `DOCKERHUB_TOKEN` secret in GitHub
3. Re-run the workflow

### Error: "lstat /target: no such file or directory"

**Solution:**
The Dockerfile path in the workflow is correct. This error happens when:
- Maven build failed (check logs)
- `target/` directory is empty

Run: `mvn clean package` manually to verify

### Error: "failed to solve: lstat /Ride-Sharing/target/*.jar"

**Solution:**
The Dockerfile must be built from the **project root**, not the `Ride-Sharing/` directory.

**Correct:**
```bash
docker build -f Ride-Sharing/Dockerfile .
```

**Incorrect:**
```bash
cd Ride-Sharing && docker build -f Dockerfile .
```

### Image Not Pushing to Docker Hub

**Check:**
1. `DOCKERHUB_TOKEN` is valid and has proper scopes
2. `DOCKERHUB_USERNAME` is correct
3. Maven build succeeded (JAR exists)
4. Dockerfile path is correct

---

## 📋 Checklist

- [ ] Docker Hub account created
- [ ] Personal Access Token generated with Read/Write/Delete scopes
- [ ] `DOCKERHUB_USERNAME` added to GitHub Secrets
- [ ] `DOCKERHUB_TOKEN` added to GitHub Secrets
- [ ] Dockerfile updated with correct paths
- [ ] Maven build successful locally
- [ ] GitHub Actions workflow runs successfully
- [ ] Image appears in Docker Hub repository

---

## 📚 References

- [Docker Hub Personal Access Tokens](https://docs.docker.com/docker-hub/access-tokens/)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)

---

**Last Updated:** November 15, 2025
