#!/usr/bin/env node

// Test script for API Gateway endpoints
// Usage: node test-api-gateway.js [api-gateway-url]

const https = require('https');
const http = require('http');

// Get API URL from command line or environment
const API_URL = process.argv[2] || process.env.REACT_APP_API_URL || 'https://your-api-gateway-url.amazonaws.com/prod/todos';

console.log('🔍 Testing API Gateway endpoints...');
console.log('API URL:', API_URL);

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3001',
        ...options.headers
      }
    };

    const req = client.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Test functions
async function testCorsPreflight() {
  console.log('\n🌐 Testing CORS preflight request...');
  try {
    const result = await makeRequest(API_URL, {
      method: 'OPTIONS',
      headers: {
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const allowedOrigin = result.headers['access-control-allow-origin'];
    const allowedMethods = result.headers['access-control-allow-methods'];
    
    console.log('✅ CORS preflight test passed');
    console.log('   Allowed Origin:', allowedOrigin);
    console.log('   Allowed Methods:', allowedMethods);
    
    if (allowedOrigin !== 'http://localhost:3001') {
      console.warn('⚠️  Warning: Origin is not http://localhost:3001');
    }
    
    return true;
  } catch (error) {
    console.error('❌ CORS preflight test failed:', error.message);
    return false;
  }
}

async function testGetTodos() {
  console.log('\n📋 Testing GET /todos...');
  try {
    const result = await makeRequest(API_URL);
    
    if (result.statusCode === 200) {
      console.log('✅ GET /todos test passed');
      console.log('   Status:', result.statusCode);
      console.log('   Todos count:', Array.isArray(result.body.todos) ? result.body.todos.length : 'N/A');
      return true;
    } else {
      console.error('❌ GET /todos test failed:', result.statusCode, result.body);
      return false;
    }
  } catch (error) {
    console.error('❌ GET /todos test failed:', error.message);
    return false;
  }
}

async function testCreateTodo() {
  console.log('\n➕ Testing POST /todos...');
  try {
    const testTodo = { text: `Test todo ${new Date().toISOString()}` };
    const result = await makeRequest(API_URL, {
      method: 'POST',
      body: testTodo
    });
    
    if (result.statusCode === 201 || result.statusCode === 200) {
      console.log('✅ POST /todos test passed');
      console.log('   Status:', result.statusCode);
      console.log('   Created todo:', result.body.text);
      return { success: true, todo: result.body };
    } else {
      console.error('❌ POST /todos test failed:', result.statusCode, result.body);
      return { success: false };
    }
  } catch (error) {
    console.error('❌ POST /todos test failed:', error.message);
    return { success: false };
  }
}

async function testUpdateTodo(todoId) {
  console.log(`\n✏️  Testing PUT /todos/${todoId}...`);
  try {
    const result = await makeRequest(`${API_URL}/${todoId}`, {
      method: 'PUT',
      body: { text: 'Updated test todo', completed: true }
    });
    
    if (result.statusCode === 200) {
      console.log('✅ PUT /todos/{id} test passed');
      console.log('   Status:', result.statusCode);
      return true;
    } else {
      console.error('❌ PUT /todos/{id} test failed:', result.statusCode, result.body);
      return false;
    }
  } catch (error) {
    console.error('❌ PUT /todos/{id} test failed:', error.message);
    return false;
  }
}

async function testDeleteTodo(todoId) {
  console.log(`\n🗑️  Testing DELETE /todos/${todoId}...`);
  try {
    const result = await makeRequest(`${API_URL}/${todoId}`, {
      method: 'DELETE'
    });
    
    if (result.statusCode === 204 || result.statusCode === 200) {
      console.log('✅ DELETE /todos/{id} test passed');
      console.log('   Status:', result.statusCode);
      return true;
    } else {
      console.error('❌ DELETE /todos/{id} test failed:', result.statusCode, result.body);
      return false;
    }
  } catch (error) {
    console.error('❌ DELETE /todos/{id} test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API Gateway tests...\n');
  
  const results = {
    cors: false,
    get: false,
    post: false,
    put: false,
    delete: false
  };
  
  let createdTodoId = null;
  
  try {
    // Test CORS preflight
    results.cors = await testCorsPreflight();
    
    // Test GET todos
    results.get = await testGetTodos();
    
    // Test POST todo
    const createResult = await testCreateTodo();
    results.post = createResult.success;
    if (createResult.success && createResult.todo) {
      createdTodoId = createResult.todo.id;
    }
    
    // Test PUT todo if we have a created todo
    if (createdTodoId) {
      results.put = await testUpdateTodo(createdTodoId);
    }
    
    // Test DELETE todo if we have a created todo
    if (createdTodoId) {
      results.delete = await testDeleteTodo(createdTodoId);
    }
    
  } catch (error) {
    console.error('💥 Test suite failed:', error.message);
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log('CORS Preflight:', results.cors ? '✅ PASS' : '❌ FAIL');
  console.log('GET /todos:', results.get ? '✅ PASS' : '❌ FAIL');
  console.log('POST /todos:', results.post ? '✅ PASS' : '❌ FAIL');
  console.log('PUT /todos/{id}:', results.put ? '✅ PASS' : '❌ FAIL');
  console.log('DELETE /todos/{id}:', results.delete ? '✅ PASS' : '❌ FAIL');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`\nTotal: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Your API Gateway is ready for use.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };