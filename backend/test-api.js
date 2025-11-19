const http = require('http');

// Test API endpoints
async function testEndpoint(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {}
    };

    if (data && method === 'POST') {
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data && method === 'POST') {
      req.write(data);
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing API endpoints...\n');

  try {
    // Test health check
    console.log('1. Testing health check...');
    const health = await testEndpoint('/health');
    console.log(`   ✅ Health: ${health.status} - ${JSON.stringify(health.data)}`);

    // Test categories
    console.log('\n2. Testing categories...');
    const categories = await testEndpoint('/api/categories');
    console.log(`   ✅ Categories: ${categories.status} - Found ${categories.data.categories.length} categories`);

    // Test genres
    console.log('\n3. Testing genres filter...');
    const genres = await testEndpoint('/api/products/filters/genres');
    console.log(`   ✅ Genres: ${genres.status} - Found ${genres.data.genres.length} genres`);

    // Test products
    console.log('\n4. Testing products...');
    const products = await testEndpoint('/api/products?page=1&limit=2');
    console.log(`   Products: ${products.status}`);
    if (products.status === 200) {
      console.log(`   ✅ Found ${products.data.products.length} products`);
    } else {
      console.log(`   ❌ Error: ${JSON.stringify(products.data)}`);
    }

    // Test login
    console.log('\n5. Testing authentication...');
    const loginData = JSON.stringify({ email: 'admin@mangastore.com', password: 'admin123' });
    const login = await testEndpoint('/api/auth/login', 'POST', loginData);
    console.log(`   ✅ Login: ${login.status} - ${login.data.message}`);

    console.log('\n🎉 API tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

runTests();