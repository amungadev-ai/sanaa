import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In development, if the cached PrismaClient doesn't have the latest models
// (e.g., after a schema change), we need to create a new instance
if (process.env.NODE_ENV !== 'production' && globalForPrisma.prisma) {
  try {
    // Check if the cached client has all expected models
    if (typeof (globalForPrisma.prisma as Record<string, unknown>).readingList === 'undefined') {
      console.log('[db] Schema changed detected, recreating PrismaClient')
      globalForPrisma.prisma = undefined
    }
  } catch {
    globalForPrisma.prisma = undefined
  }
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db