const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Testing ShopSphere Setup...\n');

// Test backend
console.log('📦 Testing Backend...');
const backend = spawn('npm', ['run', 'server'], {
  cwd: path.join(__dirname),
  stdio: 'pipe'
});

backend.stdout.on('data', (data) => {
  console.log(`Backend: ${data}`);
});

backend.stderr.on('data', (data) => {
  console.error(`Backend Error: ${data}`);
});

// Test frontend
setTimeout(() => {
  console.log('🎨 Testing Frontend...');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'pipe'
  });

  frontend.stdout.on('data', (data) => {
    console.log(`Frontend: ${data}`);
  });

  frontend.stderr.on('data', (data) => {
    console.error(`Frontend Error: ${data}`);
  });

  // Stop after 30 seconds
  setTimeout(() => {
    console.log('\n✅ Test completed! Both servers should be running.');
    console.log('Backend: http://localhost:5000');
    console.log('Frontend: http://localhost:5173');
    backend.kill();
    frontend.kill();
    process.exit(0);
  }, 30000);
}, 5000);
