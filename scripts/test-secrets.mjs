#!/usr/bin/env node

/**
 * Manual Secrets Verification Script
 * Tests all rotated secrets to ensure they're working
 */

import { config } from 'dotenv';

// Load .env.local
config({ path: '.env.local' });

console.log('🔐 Secrets Verification Test\n');
console.log('=' .repeat(60));

let allPassed = true;
const results = [];

// Helper function to test a secret
function testSecret(name, value, validator) {
  const result = {
    name,
    status: '❌ FAIL',
    message: ''
  };

  if (!value) {
    result.message = 'Not configured';
    allPassed = false;
  } else if (validator && !validator(value)) {
    result.message = 'Invalid format';
    allPassed = false;
  } else {
    result.status = '✅ PASS';
    result.message = 'Configured correctly';
  }

  results.push(result);
}

// Test all secrets
console.log('\n📋 Configuration Tests:\n');

testSecret('AUTH_SECRET', process.env.AUTH_SECRET, (v) => v.length > 20);
testSecret('GOOGLE_CLIENT_ID', process.env.GOOGLE_CLIENT_ID, (v) => v.includes('.apps.googleusercontent.com'));
testSecret('GOOGLE_CLIENT_SECRET', process.env.GOOGLE_CLIENT_SECRET, (v) => v.startsWith('GOCSPX-'));
testSecret('DATABASE_URL', process.env.DATABASE_URL, (v) => v.startsWith('postgresql://'));
testSecret('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY, (v) => v.length > 20);
testSecret('PAYSTACK_SECRET_KEY', process.env.PAYSTACK_SECRET_KEY, (v) => v.match(/^sk_(test|live)_/));
testSecret('NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY', process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY, (v) => v.match(/^pk_(test|live)_/));
testSecret('GROQ_KEY', process.env.GROQ_KEY, (v) => v.startsWith('gsk_'));
testSecret('OPEN_ROUTER_KEY', process.env.OPEN_ROUTER_KEY, (v) => v.startsWith('sk-or-v1-'));
testSecret('NEXT_PUBLIC_APP_URL', process.env.NEXT_PUBLIC_APP_URL, (v) => v.match(/^https?:\/\//));

// Print results
results.forEach(r => {
  console.log(`${r.status} ${r.name.padEnd(35)} - ${r.message}`);
});

console.log('\n' + '='.repeat(60));

// API Integration Tests
console.log('\n🌐 API Integration Tests:\n');

// Test Groq API
async function testGroqAPI() {
  try {
    const response = await fetch('https://api.groq.com/openai/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      console.log('✅ PASS Groq API                        - Authentication successful');
      return true;
    } else {
      console.log(`❌ FAIL Groq API                        - HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL Groq API                        - ${error.message}`);
    return false;
  }
}

// Test OpenRouter API
async function testOpenRouterAPI() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPEN_ROUTER_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      console.log('✅ PASS OpenRouter API                  - Authentication successful');
      return true;
    } else {
      console.log(`❌ FAIL OpenRouter API                  - HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL OpenRouter API                  - ${error.message}`);
    return false;
  }
}

// Test PayStack API
async function testPayStackAPI() {
  try {
    const response = await fetch('https://api.paystack.co/bank', {
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      console.log('✅ PASS PayStack API                    - Authentication successful');
      return true;
    } else {
      console.log(`❌ FAIL PayStack API                    - HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ FAIL PayStack API                    - ${error.message}`);
    return false;
  }
}

// Run API tests
const apiTests = await Promise.all([
  testGroqAPI(),
  testOpenRouterAPI(),
  testPayStackAPI(),
]);

const apiTestsPassed = apiTests.every(t => t);
allPassed = allPassed && apiTestsPassed;

console.log('\n' + '='.repeat(60));

// Summary
console.log('\n📊 Summary:\n');
const passedCount = results.filter(r => r.status.includes('✅')).length;
const totalCount = results.length;

console.log(`Configuration Tests: ${passedCount}/${totalCount} passed`);
console.log(`API Integration Tests: ${apiTests.filter(t => t).length}/${apiTests.length} passed`);

if (allPassed) {
  console.log('\n✅ All tests passed! Your secrets are configured correctly.\n');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed. Please check the configuration above.\n');
  process.exit(1);
}
