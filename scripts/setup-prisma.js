#!/usr/bin/env node

/**
 * Dynamic Prisma Provider Switcher
 *
 * Switches the Prisma schema provider based on DATABASE_URL:
 * - mysql://  → provider = "mysql" + adds @db.Text annotations
 * - postgres: → provider = "postgresql"
 * - file:     → provider = "sqlite" (default for local dev)
 *
 * This allows the same schema to work with both SQLite (local dev)
 * and MySQL (Vercel production).
 *
 * MySQL-specific transformations:
 * - Adds @db.Text for long String fields (content, bio, etc.)
 *   In MySQL, String defaults to VARCHAR(191) which is too short for HTML content.
 *   SQLite has no such limitation.
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

// Fields that need @db.Text in MySQL (VARCHAR(191) is too short)
const TEXT_FIELDS = [
  // Post model
  'content             String',
  'excerpt             String?',
  'coverImageAlt       String?',
  'seoDescription      String?',
  'rejectedReason      String?',
  'changeNote          String?',
  // Comment model
  'content       String',
  // Event model
  'description String',
  'excerpt     String?',
  // User model
  'bio           String?',
  // Artist model
  'bio           String',
  'shortBio      String?',
  'socialLinks   String?',
  // Email Campaign model
  'content     String',
  'preheader   String?',
  // Site Setting model
  'value String',
  // Newsletter model
  'name      String?',
  // Category model
  'description String?',
  // Ad model
  'description String?',
];

function getProviderFromUrl(url) {
  if (!url) return 'sqlite';
  if (url.startsWith('mysql://')) return 'mysql';
  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) return 'postgresql';
  if (url.startsWith('file:')) return 'sqlite';
  return 'sqlite';
}

function switchProvider(schemaContent, provider) {
  return schemaContent.replace(
    /provider\s*=\s*"(sqlite|mysql|postgresql)"/,
    `provider = "${provider}"`
  );
}

function addMySqlTextAnnotations(schemaContent) {
  let updated = schemaContent;

  for (const field of TEXT_FIELDS) {
    const fieldName = field.trim().split(/\s+/)[0];

    // Pattern: fieldName    String?    →   fieldName    String?   @db.Text
    // Pattern: fieldName    String     →   fieldName    String    @db.Text
    // @db.Text applies to both required and optional fields (no @db.Text? syntax)
    if (field.includes('String?')) {
      const regex = new RegExp(`(\\b${fieldName}\\s+String\\?)(?!\\s+@db\\.Text)(\\s*$)`, 'm');
      updated = updated.replace(regex, '$1   @db.Text$2');
    } else {
      const regex = new RegExp(`(\\b${fieldName}\\s+String)(?!\\s*@db\\.Text)(\\s*$)`, 'm');
      updated = updated.replace(regex, '$1   @db.Text$2');
    }
  }

  return updated;
}

function removeMySqlTextAnnotations(schemaContent) {
  // Remove @db.Text and @db.Text? annotations
  return schemaContent
    .replace(/\s+@db\.Text\?/g, '')
    .replace(/\s+@db\.Text/g, '');
}

function main() {
  const databaseUrl = process.env.DATABASE_URL || '';
  const targetProvider = getProviderFromUrl(databaseUrl);

  console.log(`[setup-prisma] DATABASE_URL prefix detected: ${databaseUrl.split(':')[0]}://`);
  console.log(`[setup-prisma] Switching Prisma provider to: ${targetProvider}`);

  if (!fs.existsSync(schemaPath)) {
    console.error('[setup-prisma] ERROR: prisma/schema.prisma not found!');
    process.exit(1);
  }

  let schema = fs.readFileSync(schemaPath, 'utf-8');
  const currentProviderMatch = schema.match(/provider\s*=\s*"(sqlite|mysql|postgresql)"/);
  const currentProvider = currentProviderMatch ? currentProviderMatch[1] : 'unknown';

  // Step 1: Remove any existing @db.Text annotations (clean slate)
  schema = removeMySqlTextAnnotations(schema);

  // Step 2: Switch provider
  schema = switchProvider(schema, targetProvider);

  // Step 3: Add MySQL-specific annotations if needed
  if (targetProvider === 'mysql') {
    schema = addMySqlTextAnnotations(schema);
    console.log('[setup-prisma] Added @db.Text annotations for MySQL long-text fields');
  }

  fs.writeFileSync(schemaPath, schema, 'utf-8');
  console.log(`[setup-prisma] Provider switched: "${currentProvider}" → "${targetProvider}"`);
}

main();
