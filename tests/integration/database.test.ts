/**
 * Database Connection Tests
 * 
 * Verifies database connectivity with current credentials
 */

import { describe, it, expect } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { withPrismaConnectionSettings } from '../../src/lib/db';

function createPrismaClient() {
  const databaseUrl = withPrismaConnectionSettings(process.env.DATABASE_URL);

  return new PrismaClient(
    databaseUrl
      ? {
          datasources: {
            db: { url: databaseUrl },
          },
        }
      : undefined
  );
}

describe('Database Connection Tests', () => {
  
  it('should successfully connect to the database', async () => {
    const prisma = createPrismaClient();
    
    try {
      // Simple query to test connection
      await prisma.$queryRaw`SELECT 1 as result`;
      expect(true).toBe(true);
    } catch (error) {
      throw new Error(`Database connection failed: ${error}`);
    } finally {
      await prisma.$disconnect();
    }
  }, 10000);

  it('should be able to query User table', async () => {
    const prisma = createPrismaClient();
    
    try {
      const userCount = await prisma.user.count();
      expect(typeof userCount).toBe('number');
      expect(userCount).toBeGreaterThanOrEqual(0);
    } catch (error) {
      throw new Error(`Failed to query User table: ${error}`);
    } finally {
      await prisma.$disconnect();
    }
  }, 10000);
});
