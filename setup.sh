#!/bin/bash

# Setup script for NitiVidya Books website

echo "Setting up NitiVidya Books website..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Check if environment variables are properly set
echo "Checking environment variables..."
if [ -z "$RESEND_API_KEY" ]; then
    echo "ERROR: RESEND_API_KEY not set"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_WHATSAPP_NUMBER" ]; then
    echo "ERROR: NEXT_PUBLIC_WHATSAPP_NUMBER not set"
    exit 1
fi

if [ -z "$BUSINESS_EMAIL" ]; then
    echo "ERROR: BUSINESS_EMAIL not set"
    exit 1
fi

echo "Environment variables are set correctly!"

# Build the application
echo "Building the application..."
npm run build

echo "Setup complete! Application is ready for deployment."