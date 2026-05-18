/**
 * Secrets Verification Test Suite
 * 
 * This test suite verifies that all critical secrets are properly configured
 * and functional after rotation.
 */

import { describe, it, expect } from 'vitest';

describe('Environment Variables - Secrets Configuration', () => {
  
  describe('Authentication Secrets', () => {
    it('should have AUTH_SECRET configured', () => {
      expect(process.env.AUTH_SECRET).toBeDefined();
      expect(process.env.AUTH_SECRET).not.toBe('');
      expect(process.env.AUTH_SECRET!.length).toBeGreaterThan(20);
    });

    it('should have GOOGLE_CLIENT_ID configured', () => {
      expect(process.env.GOOGLE_CLIENT_ID).toBeDefined();
      expect(process.env.GOOGLE_CLIENT_ID).not.toBe('');
      expect(process.env.GOOGLE_CLIENT_ID).toMatch(/\.apps\.googleusercontent\.com$/);
    });

    it('should have GOOGLE_CLIENT_SECRET configured', () => {
      expect(process.env.GOOGLE_CLIENT_SECRET).toBeDefined();
      expect(process.env.GOOGLE_CLIENT_SECRET).not.toBe('');
      expect(process.env.GOOGLE_CLIENT_SECRET).toMatch(/^GOCSPX-/);
    });
  });

  describe('Database Secrets', () => {
    it('should have DATABASE_URL configured', () => {
      expect(process.env.DATABASE_URL).toBeDefined();
      expect(process.env.DATABASE_URL).not.toBe('');
      expect(process.env.DATABASE_URL).toMatch(/^postgresql:\/\//);
    });

    it('should have SUPABASE_SERVICE_ROLE_KEY configured', () => {
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
      expect(process.env.SUPABASE_SERVICE_ROLE_KEY).not.toBe('');
    });
  });

  describe('Payment Gateway Secrets', () => {
    it('should have PAYSTACK_SECRET_KEY configured', () => {
      expect(process.env.PAYSTACK_SECRET_KEY).toBeDefined();
      expect(process.env.PAYSTACK_SECRET_KEY).not.toBe('');
      expect(process.env.PAYSTACK_SECRET_KEY).toMatch(/^sk_(test|live)_/);
    });

    it('should have NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY configured', () => {
      expect(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY).toBeDefined();
      expect(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY).not.toBe('');
      expect(process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY).toMatch(/^pk_(test|live)_/);
    });
  });

  describe('AI/LLM API Keys', () => {
    it('should have GROQ_KEY configured', () => {
      expect(process.env.GROQ_KEY).toBeDefined();
      expect(process.env.GROQ_KEY).not.toBe('');
      expect(process.env.GROQ_KEY).toMatch(/^gsk_/);
    });

    it('should have OPEN_ROUTER_KEY configured', () => {
      expect(process.env.OPEN_ROUTER_KEY).toBeDefined();
      expect(process.env.OPEN_ROUTER_KEY).not.toBe('');
      expect(process.env.OPEN_ROUTER_KEY).toMatch(/^sk-or-v1-/);
    });
  });

  describe('Application Configuration', () => {
    it('should have NEXT_PUBLIC_APP_URL configured', () => {
      expect(process.env.NEXT_PUBLIC_APP_URL).toBeDefined();
      expect(process.env.NEXT_PUBLIC_APP_URL).not.toBe('');
      expect(process.env.NEXT_PUBLIC_APP_URL).toMatch(/^https?:\/\//);
    });
  });
});
