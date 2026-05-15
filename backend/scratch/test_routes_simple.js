const http = require('http');

const API_URL = 'http://localhost:5000/api';

function testRoute(path) {
  return new Promise((resolve) => {
    http.get(`${API_URL}${path}`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`[${res.statusCode}] GET ${path}`);
        if (res.statusCode === 404) {
          console.log(`   Response: ${data}`);
        }
        resolve();
      });
    }).on('error', (err) => {
      console.log(`[ERROR] GET ${path} - ${err.message}`);
      resolve();
    });
  });
}

async function runTests() {
  console.log('Testing backend routes reachability...');
  const routes = [
    '/lms/courses',
    '/lms/certificates/mine',
    '/lms/courses/someid/performance',
    '/lms/courses/someid/performance/mine'
  ];

  for (const route of routes) {
    await testRoute(route);
  }
}

runTests();
