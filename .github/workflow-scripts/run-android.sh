#!/bin/bash

# Build and install the Android app
./gradlew installDebug

echo "Starting Metro bundler in background..."
yarn start &
METRO_PID=$!

echo "Reversing Metro port..."
adb reverse tcp:8081 tcp:8081

echo "Starting log monitoring and launching app..."
PLATFORM=android LOG_MESSAGE="LOADED_OK" TIMEOUT=30 node ${GITHUB_WORKSPACE}/.github/workflow-scripts/waitForLogs.js &
LOG_PID=$!

sleep 2

adb shell am start -n com.rnapp/.MainActivity
wait $LOG_PID

# Clean up Metro process
kill $METRO_PID 2>/dev/null || true
