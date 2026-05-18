"use server";

import * as z from "zod";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email/resend";
import { inquiryReceivedEmail } from "@/lib/email/templates";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  assertSameOriginRequest,
  getServerActionSecurityContext,
} from "@/lib/security/request";

// Validation schema for contact form
const ContactFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }).trim(),
  email: z.string().trim().email({ message: "Invalid email address" }),
  company: z.string().optional(),
  message: z.string().min(1, { message: "Message is required" }).trim(),
});

// Type for the contact form data
export type ContactFormData = z.infer<typeof ContactFormSchema>;

// Type for the submission result
export interface SubmissionResult {
  success: boolean;
  error?: string;
  inquiryId?: string;
}

/**
 * Sanitize input to prevent XSS attacks
 * Removes potentially dangerous HTML tags and script content
 */
function sanitizeInput(input: string): string {
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, "");
  
  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  
  // Remove event handlers (onclick, onerror, etc.)
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, "");
  
  return sanitized;
}

/**
 * Submit a contact inquiry
 * Validates input, sanitizes data, and saves to database
 */
export async function submitContactInquiry(
  data: ContactFormData
): Promise<SubmissionResult> {
  try {
    const requestContext = await getServerActionSecurityContext();
    assertSameOriginRequest(requestContext);

    const rateLimit = await checkRateLimit({
      scope: "contact-form",
      identifier: requestContext.ip,
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!rateLimit.allowed) {
      return { success: false, error: "Too many inquiries. Please try again shortly." };
    }

    // Validate input fields
    const validatedFields = ContactFormSchema.safeParse(data);

    if (!validatedFields.success) {
      const errors = validatedFields.error.issues.map((err) => err.message).join(", ");
      return { success: false, error: errors };
    }

    const { name, email, company, message } = validatedFields.data;

    // Sanitize text inputs to prevent XSS (but not email - it's already validated)
    const sanitizedName = sanitizeInput(name);
    const sanitizedCompany = company ? sanitizeInput(company) : undefined;
    const sanitizedMessage = sanitizeInput(message);

    // Save inquiry to database using Prisma (prevents SQL injection)
    const inquiry = await db.inquiry.create({
      data: {
        name: sanitizedName,
        email: email, // Email is validated by Zod, no need to sanitize
        company: sanitizedCompany,
        message: sanitizedMessage,
        status: "new",
      },
    });

    // Send confirmation email (non-blocking)
    const template = inquiryReceivedEmail(sanitizedName);
    sendEmail({ to: email, ...template }).catch(console.error);

    return {
      success: true,
      inquiryId: inquiry.id,
    };
  } catch (error) {
    // Log error for debugging but don't expose sensitive details to client
    console.error("Error submitting contact inquiry:", error);
    
    // Return generic error message to prevent information disclosure
    return {
      success: false,
      error: "Failed to submit inquiry. Please try again later.",
    };
  }
}
