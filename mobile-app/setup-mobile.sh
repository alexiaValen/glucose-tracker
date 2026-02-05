#!/bin/bash

# GraceFlow Mobile App - Setup Script
# This script helps configure your development environment

echo ""
echo "🌿 =================================="
echo "   GraceFlow Mobile App Setup"
echo "🌿 =================================="
echo ""

# Get local IP address
echo "📱 Detecting your local IP address..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
else
    # Windows (Git Bash)
    LOCAL_IP=$(ipconfig | grep "IPv4" | awk '{print $NF}' | head -n 1)
fi

echo "✅ Found IP: $LOCAL_IP"
echo ""

# Create .env file
echo "📝 Creating .env file..."
cat > .env << ENVEOF
# GraceFlow Mobile App Configuration
# Auto-generated on $(date)

# For testing on physical devices (same WiFi network)
EXPO_PUBLIC_API_URL=http://${LOCAL_IP}:3000/api/v1

# For iOS Simulator / Android Emulator, use:
# EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1

# For production, use:
# EXPO_PUBLIC_API_URL=https://api.graceflow.com/api/v1
ENVEOF

echo "✅ Created .env file with API URL: http://${LOCAL_IP}:3000/api/v1"
echo ""

echo "⚠️  IMPORTANT:"
echo "   1. Make sure your backend server is running on this machine"
echo "   2. Your phone must be on the SAME WiFi network"
echo "   3. Check your firewall allows connections on port 3000"
echo ""

echo "🎯 Next Steps:"
echo "   1. Start backend: cd backend && npm run dev"
echo "   2. Start mobile app: npm start"
echo "   3. Scan QR code with Expo Go app"
echo ""

echo "📱 Testing Options:"
echo "   - Physical Device: Use QR code (requires same WiFi)"
echo "   - iOS Simulator: Press 'i' in terminal"
echo "   - Android Emulator: Press 'a' in terminal"
echo ""
