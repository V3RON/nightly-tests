const { spawn } = require('child_process');

const platform = process.env.PLATFORM || 'android'; // android | ios
const message = process.env.LOG_MESSAGE || 'Hello World';
const timeout = parseInt(process.env.TIMEOUT || '30', 10) * 1000; // ms

console.log(`Waiting for log "${message}" on ${platform} (timeout: ${timeout / 1000}s)...`);

let found = false;
let logProcess;
const timer = setTimeout(() => {
  if (!found) {
    console.error(`❌ Timeout: Log "${message}" not found within ${timeout / 1000}s`);
    if (logProcess) logProcess.kill();
    process.exit(1);
  }
}, timeout);

function startLogStream(cmd, args) {
  logProcess = spawn(cmd, args);

  logProcess.stdout.on('data', (data) => {
    const line = data.toString();
    if (line.includes(message)) {
      console.log(`✅ Found log: ${line.trim()}`);
      found = true;
      clearTimeout(timer);
      logProcess.kill();
      process.exit(0);
    }
  });

  logProcess.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  logProcess.on('close', () => {
    if (!found) {
      console.error(`❌ Log stream ended without finding "${message}"`);
      process.exit(1);
    }
  });
}

if (platform === 'android') {
  // Clear old logs first
  spawn('adb', ['logcat', '-c']).on('close', () => {
    startLogStream('adb', ['logcat', '*:V']);
  });
} else if (platform === 'ios') {
  startLogStream('xcrun', [
    'simctl', 'spawn', 'booted',
    'log', 'stream', '--style', 'compact'
  ]);
} else {
  console.error(`❌ Unknown platform: ${platform}`);
  process.exit(1);
}
