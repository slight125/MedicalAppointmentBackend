// Check if server is running
const http = require('http');

const checkServer = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET',
    timeout: 5000
  };

  console.log('🔍 Checking if server is running...');

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Server is running!');
        console.log('📝 Response:', data);
        console.log('\n🎯 You can now run the webhook tests:');
        console.log('   node test-webhook-simple.js');
      } else {
        console.log(`⚠️ Server responded with status: ${res.statusCode}`);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Server is not running:', error.message);
    console.log('\n💡 To start the server:');
    console.log('   npm run dev');
    console.log('\n🔧 Or check if it\'s running on a different port');
  });

  req.on('timeout', () => {
    console.error('❌ Server request timed out');
    req.destroy();
  });

  req.end();
};

checkServer();
