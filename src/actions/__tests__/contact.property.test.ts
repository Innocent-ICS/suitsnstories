/**
 * Property-Based Tests for Contact Form Submission
 * Using fast-check for property-based testing
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { submitContactInquiry, type ContactFormData } from '../contact';
import { db } from '@/lib/db';

vi.mock('@/lib/email/resend', () => ({
  sendEmail: vi.fn(() => Promise.resolve(true)),
}));

/**
 * Sanitize input to prevent XSS attacks (matches the implementation)
 */
function sanitizeInput(input: string): string {
  let sanitized = input.replace(/<[^>]*>/g, "");
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
  sanitized = sanitized.replace(/javascript:/gi, "");
  return sanitized;
}

/**
 * Feature: contact-form, Property 1: Form submission persistence
 * Validates: Requirements 1.3, 3.3
 * 
 * For any valid contact form submission (with name, email, and message),
 * submitting the form should result in the inquiry being saved to the database
 * with all submitted data intact.
 */
describe('Property 1: Form submission persistence', () => {
  // Clean up test data after each test
  afterEach(async () => {
    await db.inquiry.deleteMany({
      where: {
        email: {
          contains: '@test-property',
        },
      },
    });
  });

  it('should persist all valid form submissions to the database with data intact', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary valid contact form data that will remain valid after sanitization
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 })
            .filter(s => s.trim().length > 0)
            .filter(s => sanitizeInput(s).trim().length > 0), // Ensure it's still valid after sanitization
          email: fc.uuid().map(id => `user-${id}@test-property.example.com`),
          company: fc.option(fc.string({ minLength: 0, maxLength: 100 }), { nil: undefined }),
          message: fc.string({ minLength: 1, maxLength: 1000 })
            .filter(s => s.trim().length > 0)
            .filter(s => sanitizeInput(s).trim().length > 0), // Ensure it's still valid after sanitization
        }),
        async (formData: ContactFormData) => {
          // Submit the form
          const result = await submitContactInquiry(formData);

          // Verify submission was successful
          expect(result.success).toBe(true);
          expect(result.inquiryId).toBeDefined();

          // Query the database to verify persistence
          const savedInquiry = await db.inquiry.findUnique({
            where: { id: result.inquiryId },
          });

          // Verify the inquiry was saved
          expect(savedInquiry).not.toBeNull();

          if (savedInquiry) {
            // Verify all data was persisted correctly (after sanitization)
            const sanitizedName = sanitizeInput(formData.name).trim();
            const sanitizedMessage = sanitizeInput(formData.message).trim();
            
            expect(savedInquiry.name.trim()).toBe(sanitizedName);
            expect(savedInquiry.email.trim()).toBe(formData.email.trim());
            expect(savedInquiry.message.trim()).toBe(sanitizedMessage);
            
            // Company is optional - Prisma/SQLite stores undefined as null
            if (formData.company) {
              const sanitizedCompany = sanitizeInput(formData.company).trim();
              expect(savedInquiry.company?.trim()).toBe(sanitizedCompany);
            } else {
              expect(savedInquiry.company).toBeNull();
            }

            // Verify default status
            expect(savedInquiry.status).toBe('new');

            // Verify timestamps exist
            expect(savedInquiry.createdAt).toBeInstanceOf(Date);
            expect(savedInquiry.updatedAt).toBeInstanceOf(Date);
          }
        }
      ),
      { numRuns: 25 }
    );
  }, 120_000);
});
