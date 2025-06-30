#!/bin/bash

echo "🚀 Starting JBRC Bilty Management System..."
echo ""

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Please start MongoDB first:"
    echo "   macOS: brew services start mongodb-community"
    echo "   Ubuntu: sudo systemctl start mongod"
    echo "   Windows: net start MongoDB"
    echo ""
    echo "After starting MongoDB, run this script again."
    exit 1
fi

echo "✅ MongoDB is running"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

echo "🌐 Starting the application..."
echo "   Server will be available at: http://localhost:3001"
echo "   Create Bilty: http://localhost:3001/create-bilty"
echo "   View Bilties: http://localhost:3001/view-bilties"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the application
npm start 