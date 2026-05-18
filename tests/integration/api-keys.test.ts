/**
 * API Keys Integration Tests
 * 
 * Tests that verify the rotated API keys are functional
 */

import { describe, it, expect } from 'vitest';

describe('API Keys Integration Tests', () => {
  
  describe('Groq API Key', () => {
    it('should successfully authenticate with Groq API', async () => {
      const groqKey = process.env.GROQ_KEY;
      
      if (!groqKey) {
        throw new Error('GROQ_KEY is not configured');
      }

      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${groqKey}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
    }, 10000);
  });

  describe('OpenRouter API Key', () => {
    it('should successfully authenticate with OpenRouter API', async () => {
      const openRouterKey = process.env.OPEN_ROUTER_KEY;
      
      if (!openRouterKey) {
        throw new Error('OPEN_ROUTER_KEY is not configured');
      }

      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
    }, 10000);
  });

  describe('PayStack API Key', () => {
    it('should successfully authenticate with PayStack API', async () => {
      const paystackKey = process.env.PAYSTACK_SECRET_KEY;
      
      if (!paystackKey) {
        throw new Error('PAYSTACK_SECRET_KEY is not configured');
      }

      // Test with a simple API call to verify the key
      const response = await fetch('https://api.paystack.co/bank', {
        headers: {
          'Authorization': `Bearer ${paystackKey}`,
          'Content-Type': 'application/json',
        },
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('status');
      expect(data.status).toBe(true);
    }, 10000);
  });
});
