<?php
/**
 * CDN Test Endpoint — Diagnostics
 * GET /api/test.php
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$cdnRoot = '/home/cgqcqobh/public_html/cdn.sanaathrumylens.co.ke';

$result = [
    'status' => 'ok',
    'message' => 'CDN API is working!',
    'php_version' => phpversion(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
    'max_upload_size' => ini_get('upload_max_filesize'),
    'max_post_size' => ini_get('post_max_size'),

    // Path diagnostics
    'paths' => [
        '__DIR__' => __DIR__,
        'cdn_root' => $cdnRoot,
        'cdn_root_exists' => is_dir($cdnRoot),
        'config_php' => $cdnRoot . '/config.php',
        'config_exists' => file_exists($cdnRoot . '/config.php'),
        'upload_dir' => $cdnRoot . '/uploads/',
        'upload_dir_exists' => is_dir($cdnRoot . '/uploads/'),
        'upload_dir_writable' => is_writable($cdnRoot . '/uploads/'),
    ],

    // Check key files exist
    'files' => [
        'config.php' => file_exists($cdnRoot . '/config.php'),
        'index.php' => file_exists($cdnRoot . '/index.php'),
        'api/upload.php' => file_exists($cdnRoot . '/api/upload.php'),
        'api/delete.php' => file_exists($cdnRoot . '/api/delete.php'),
        'api/list.php' => file_exists($cdnRoot . '/api/list.php'),
        'uploads/.htaccess' => file_exists($cdnRoot . '/uploads/.htaccess'),
    ],

    // Try to load config and show key values (without exposing secrets)
    'config_test' => null,
];

// Test config loading
if (file_exists($cdnRoot . '/config.php')) {
    require_once $cdnRoot . '/config.php';
    $result['config_test'] = [
        'loaded' => true,
        'cdn_root_constant' => defined('CDN_ROOT') ? CDN_ROOT : 'NOT DEFINED',
        'upload_dir_constant' => defined('UPLOAD_DIR') ? UPLOAD_DIR : 'NOT DEFINED',
        'cdn_base_url' => defined('CDN_BASE_URL') ? CDN_BASE_URL : 'NOT DEFINED',
        'api_keys_count' => defined('API_KEYS') ? count(API_KEYS) : 0,
        'api_key_prod_set' => defined('API_KEYS') && isset(API_KEYS['nextjs_prod']) && API_KEYS['nextjs_prod'] !== 'CHANGE_ME_to_a_strong_random_key_use_openssl_rand_hex_32',
        'allowed_origins_count' => defined('ALLOWED_ORIGINS') ? count(ALLOWED_ORIGINS) : 0,
    ];
}

// Try to create uploads dir if missing
if (!is_dir($cdnRoot . '/uploads/')) {
    $created = @mkdir($cdnRoot . '/uploads/', 0755, true);
    $result['paths']['upload_dir_created_now'] = $created;
    $result['paths']['upload_dir_exists'] = is_dir($cdnRoot . '/uploads/');
    $result['paths']['upload_dir_writable'] = is_writable($cdnRoot . '/uploads/');
}

echo json_encode($result, JSON_PRETTY_PRINT);
