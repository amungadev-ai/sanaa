<?php
/**
 * CDN Configuration for cdn.sanaathrumylens.co.ke
 *
 * UPDATE THESE VALUES AFTER CREATING THE SUBDOMAIN IN CPANEL
 */

// ============================================
// ABSOLUTE PATH — Update to match your cPanel home directory
// ============================================
define('CDN_ROOT', '/home/cgqcqobh/public_html/cdn.sanaathrumylens.co.ke');

// API Keys — generate strong random keys (use: openssl rand -hex 32)
// Add the NEXTJS_API_KEY to your Vercel environment variables as CDN_API_KEY
define('API_KEYS', [
    // Production Next.js app key
    'nextjs_prod'  => '85fd8bb00d36c59256965e8d44095865f3a1c1717a0369f7adb0e5225abf4168',
    // Staging/development key (optional)
    'nextjs_dev'   => 'CHANGE_ME_to_another_strong_random_key',
]);

// Allowed origins for CORS
define('ALLOWED_ORIGINS', [
    'https://sanaathrumylens.co.ke',
    'https://www.sanaathrumylens.co.ke',
    'https://control.sanaathrumylens.co.ke',
    'https://admin.sanaathrumylens.co.ke',
    'https://editor.sanaathrumylens.co.ke',
    'https://author.sanaathrumylens.co.ke',
    'https://moderator.sanaathrumylens.co.ke',
    'http://localhost:3000',  // For local development
]);

// Upload settings — using absolute path
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10MB
define('UPLOAD_DIR', CDN_ROOT . '/uploads/');
define('ALLOWED_MIME_TYPES', [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/avif',
]);

// Subdirectory organization: uploads/YYYY/MM/
define('ORGANIZE_BY_DATE', true);

// CDN base URL
define('CDN_BASE_URL', 'https://cdn.sanaathrumylens.co.ke');
