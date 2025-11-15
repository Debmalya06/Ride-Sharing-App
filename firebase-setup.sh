#!/bin/bash

# Firebase Cloud Functions Setup for SMS OTP
# This script helps deploy the sendOtp Cloud Function

echo "=========================================="
echo "Firebase Cloud Functions Setup"
echo "=========================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not installed"
    echo "📥 Install it: npm install -g firebase-tools"
    exit 1
fi

# Login to Firebase
echo "🔐 Logging into Firebase..."
firebase login

# Initialize Firebase project
echo "🚀 Initializing Firebase project in functions/"
firebase init functions

# Install dependencies
echo "📦 Installing Twilio dependency..."
cd functions
npm install twilio

# Deploy function
echo "🚀 Deploying Cloud Function..."
firebase deploy --only functions:sendOtp

echo "✅ Cloud Function deployed successfully!"
echo "📍 Function URL: https://region-PROJECT_ID.cloudfunctions.net/sendOtp"
