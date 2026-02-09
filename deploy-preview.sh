#!/bin/bash

# Preview deployment script using Docker

echo "🚀 Starting Docker-based preview deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "⚠️  Docker Compose not found. Installing..."
    DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
    mkdir -p $DOCKER_CONFIG/cli-plugins
    curl -SL https://github.com/docker/compose/releases/download/v2.20.2/docker-compose-linux-x86_64 -o $DOCKER_CONFIG/cli-plugins/docker-compose
    chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
fi

# Build and start the preview container
echo "🔨 Building Docker image for preview environment..."
docker-compose -f docker-compose.preview.yml up -d --build

if [ $? -eq 0 ]; then
    echo "✅ Preview server deployed successfully!"
    echo "🌐 Access the preview at: http://localhost:3001"
    echo ""
    echo "📋 To check container status: docker ps"
    echo "📋 To view logs: docker logs nitividyabooks-preview"
    echo "📋 To stop: docker-compose -f docker-compose.preview.yml down"
else
    echo "❌ Failed to deploy preview server"
    exit 1
fi

# Wait a moment for the container to start
echo "⏳ Waiting for application to start..."
sleep 10

# Check if the container is running
if docker ps | grep nitividyabooks-preview > /dev/null; then
    echo "✅ Container is running!"
    CONTAINER_IP=$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' nitividyabooks-preview)
    echo "🌐 Container IP: $CONTAINER_IP"
else
    echo "❌ Container failed to start properly"
    echo "📋 Check logs: docker logs nitividyabooks-preview"
    exit 1
fi