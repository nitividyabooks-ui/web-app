#!/bin/bash

# Preview deployment script for NitiVidya Books website

echo "Starting preview deployment on port 3001..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Create/update .env.local file with preview settings
cat > .env.local << EOF
# Preview environment variables
PORT=3001
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_BASE_URL=http://localhost:3001

# Supabase
NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# Resend
RESEND_API_KEY=$RESEND_API_KEY

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER=$NEXT_PUBLIC_WHATSAPP_NUMBER

# Business
BUSINESS_EMAIL=$BUSINESS_EMAIL

# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=$NEXT_PUBLIC_GA_MEASUREMENT_ID
NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID
EOF

# Build the application
echo "Building the application..."
npm run build

# Start the application in preview mode
echo "Starting preview server on port 3001..."
nohup npm run start 2>&1 &
PID=$!
echo $PID > preview.pid

echo "Preview server started with PID: $PID"
echo "Access the preview at: http://localhost:3001"
echo "To stop the server: kill \$(cat preview.pid)"

# Wait a moment for the server to start
sleep 3

# Check if the server is running
if ps -p $PID > /dev/null; then
    echo "✓ Preview server is running!"
    echo "URL: http://localhost:3001"
else
    echo "✗ Failed to start preview server"
    exit 1
fi