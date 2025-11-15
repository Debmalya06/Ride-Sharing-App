# Application Configuration Guide

## Overview

The SmartRide application uses environment variables for configuration. All sensitive credentials are stored as **placeholders** in `application.properties` and resolved at runtime.

## Configuration Strategy

### ✅ What's in Version Control
- `application.properties` - Contains **ONLY placeholders** (safe to commit)
- `application.properties.example` - Template showing all required variables

### ❌ What's NOT in Version Control
- `.env` files - Local environment variables (gitignored)
- Actual secret values - Database passwords, API keys, etc.
- Environment-specific configs like `application-prod.properties`

## Running the Application

### Option 1: Using Environment Variables (Docker)

Set environment variables before running:

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USERNAME=ride_sharing_user
export DB_PASSWORD=your_secure_password
export JWT_SECRET=your_jwt_secret_key_at_least_32_chars
export MAIL_HOST=smtp.gmail.com
export MAIL_USERNAME=your_email@gmail.com
export MAIL_PASSWORD=your_app_specific_password
export APP_EMAIL_FROM="SmartRide <support@smartride.com>"
export APP_EMAIL_SUPPORT=support@smartride.com
export RAZORPAY_KEY_ID=rzp_test_xxxxx
export RAZORPAY_KEY_SECRET=xxxxx

java -jar app.jar
```

### Option 2: Using `.env` File (Development)

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=Poiu0987#
JWT_SECRET=your_dev_jwt_secret_key_here
MAIL_HOST=smtp.gmail.com
MAIL_USERNAME=debmalyapan4@gmail.com
MAIL_PASSWORD=zide dsvv ooan vxqf
APP_EMAIL_FROM=SmartRide <debmalyapan4@gmail.com>
APP_EMAIL_SUPPORT=debmalyapan4@gmail.com
RAZORPAY_KEY_ID=rzp_test_ROaOSbk5bPYuzJ
RAZORPAY_KEY_SECRET=7vz5E8ixIrLGazcp87JfiNcS
```

Then run the application, and Spring Boot will load these variables.

### Option 3: Using Docker Compose

```bash
docker-compose up
```

Docker Compose will use the environment variables defined in `docker-compose.yml`.

## Required Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | No | `localhost` | MySQL server hostname |
| `DB_PORT` | No | `3306` | MySQL server port |
| `DB_USERNAME` | No | `root` | Database username |
| `DB_PASSWORD` | **YES** | None | Database password |
| `JWT_SECRET` | **YES** | None | JWT signing secret (min 32 chars) |
| `MAIL_HOST` | **YES** | None | SMTP server hostname |
| `MAIL_USERNAME` | **YES** | None | Email address for sending |
| `MAIL_PASSWORD` | **YES** | None | Email app-specific password |
| `APP_EMAIL_FROM` | **YES** | None | Sender name and email |
| `APP_EMAIL_SUPPORT` | **YES** | None | Support email address |
| `RAZORPAY_KEY_ID` | **YES** | None | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | **YES** | None | Razorpay API secret |

## Setup Instructions

### 1. Database Setup

```bash
# Using MySQL Docker
docker run -d \
  -e MYSQL_ROOT_PASSWORD=Poiu0987# \
  -e MYSQL_DATABASE=Ride_Sharing \
  -p 3306:3306 \
  mysql:8.0
```

Or use existing MySQL installation:
```bash
mysql -u root -p
CREATE DATABASE Ride_Sharing;
```

### 2. Gmail SMTP Setup (Email Configuration)

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Factor Authentication
3. Generate App Password:
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Windows Computer" (or your device)
   - Copy the generated password
4. Use this password for `MAIL_PASSWORD`

### 3. Razorpay Setup

1. Sign up at [Razorpay](https://razorpay.com/)
2. Go to Settings → API Keys
3. Copy test keys (or live keys for production)
4. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

### 4. JWT Secret Generation

Generate a secure JWT secret (minimum 32 characters):

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Using Java
java -cp . -c "System.out.println(java.util.Base64.getEncoder().encodeToString(new java.security.SecureRandom().generateSeed(32)));"
```

## Running Locally (Development)

### Using IDE (IntelliJ IDEA / VS Code)

1. Create `.env` file in project root
2. Install `.env` file support extension
3. Run `RideSharingApplication.java`
4. Application automatically loads `.env` variables

### Using Maven

```bash
# Set environment variables first
export DB_PASSWORD=your_password
export JWT_SECRET=your_secret
export MAIL_PASSWORD=your_email_password
export RAZORPAY_KEY_ID=your_key_id
export RAZORPAY_KEY_SECRET=your_key_secret

# Run
cd Ride-Sharing
mvn clean install
mvn spring-boot:run
```

### Using Docker

```bash
# Build
docker build -f Ride-Sharing/Dockerfile -t ride-sharing:latest .

# Run with environment variables
docker run -p 8080:8080 \
  -e DB_PASSWORD=your_password \
  -e JWT_SECRET=your_secret \
  -e MAIL_PASSWORD=your_email_password \
  -e RAZORPAY_KEY_ID=your_key_id \
  -e RAZORPAY_KEY_SECRET=your_key_secret \
  ride-sharing:latest
```

### Using Docker Compose

```bash
docker-compose up
```

## Verifying Configuration

Once the application starts, verify it's working:

```bash
# Test basic endpoint
curl http://localhost:8080/api/test

# Test with authentication
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"1234567890","password":"test"}'
```

## Troubleshooting

### Error: Could not resolve placeholder

**Cause:** Environment variable not set
**Solution:** Set the required environment variable and restart

```bash
export MISSING_VARIABLE=value
```

### Error: Access denied for user 'root'@'localhost'

**Cause:** Database password is incorrect or MySQL not running
**Solution:** 

```bash
# Check MySQL is running
mysql -u root -p

# Update DB_PASSWORD if needed
export DB_PASSWORD=correct_password
```

### Error: Failed to send OTP email

**Cause:** SMTP credentials incorrect or Gmail 2FA not enabled
**Solution:**

1. Verify MAIL_USERNAME and MAIL_PASSWORD are correct
2. Generate new App Password from Google Account
3. Check Gmail allows "Less secure app access" if not using App Password

### Error: Razorpay authentication failed

**Cause:** API keys are incorrect or expired
**Solution:**

1. Verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
2. Generate new keys from Razorpay dashboard
3. Make sure using correct keys (test vs live)

## Production Deployment

For production, use environment-specific configuration:

1. Create `application-prod.properties` (DO NOT COMMIT)
2. Set environment variables in your deployment platform:
   - AWS: Parameter Store / Secrets Manager
   - Azure: Key Vault
   - Kubernetes: Secrets
   - Heroku: Config Vars
   - Docker: .env files or secrets

3. Run with production profile:
```bash
java -Dspring.profiles.active=prod -jar app.jar
```

## Security Best Practices

✅ **DO:**
- Use strong, unique passwords (minimum 12 characters)
- Rotate credentials regularly
- Use environment-specific secrets
- Enable HTTPS in production
- Never commit `.env` or secrets

❌ **DON'T:**
- Commit `.env` files to Git
- Share credentials via email or chat
- Use default passwords in production
- Hardcode secrets in code
- Use test credentials in production

## References

- [Spring Boot Externalized Configuration](https://spring.io/guides/gs/centralized-configuration/)
- [12 Factor App - Config](https://12factor.net/config)
- [OWASP - Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
