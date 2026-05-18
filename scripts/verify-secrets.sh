#!/bin/bash

echo "🔐 Verifying Secrets Configuration..."
echo "======================================"
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

echo "✓ Environment variables loaded"
echo ""

echo "📋 Running configuration tests..."
npm run test -- tests/secrets-verification.test.ts

echo ""
echo "🌐 Running API integration tests..."
npm run test -- tests/integration/api-keys.test.ts

echo ""
echo "💾 Running database connection tests..."
npm run test -- tests/integration/database.test.ts

echo ""
echo "======================================"
echo "✅ All verification tests complete!"
