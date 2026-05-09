#!/bin/bash
# Start backend server in background
cd canteen-system/server && npm start &
SERVER_PID=$!

# Wait for server to be ready
sleep 2

# Start frontend in foreground
cd /home/runner/workspace/canteen-system/client && npm run dev
