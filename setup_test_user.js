#!/usr/bin/env node

/**
 * Setup a test user for attendance testing
 * This script will:
 * 1. Create a test user via the local app's signup endpoint
 * 2. Log the credentials for manual browser testing
 */

const http = require('http');

const testEmail = `test_${Date.now()}@example.com`;
const testPassword = 'TestPass123!';

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 54357,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: JSON.parse(data),
            headers: res.headers,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: data,
            headers: res.headers,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function run() {
  console.log('\n📝 Setting up test user for attendance testing...\n');

  try {
    console.log('Creating test user...');
    console.log(`Email: ${testEmail}`);
    console.log(`Password: ${testPassword}\n`);

    const signupRes = await makeRequest('POST', '/api/auth/signup', {
      email: testEmail,
      password: testPassword,
    });

    if (signupRes.status !== 200) {
      console.error('❌ Signup failed:', signupRes.status);
      console.error('Response:', signupRes.body);
      process.exit(1);
    }

    if (signupRes.body.success) {
      console.log('✅ User created successfully!');
      console.log('\n📋 Test Credentials:');
      console.log('================================');
      console.log(`Email:    ${testEmail}`);
      console.log(`Password: ${testPassword}`);
      console.log('================================\n');

      console.log('🌐 Next steps:');
      console.log('1. Open: http://localhost:54357/auth/login');
      console.log('2. Sign in with the above credentials');
      console.log('3. Navigate to: http://localhost:54357/test-attendance');
      console.log('4. Click "Run Test" to validate attendance logging\n');
    } else {
      console.error('❌ Signup returned error:', signupRes.body.error);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

run();
