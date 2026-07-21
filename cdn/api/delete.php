<?php
/**
 * CDN Delete Endpoint
 * DELETE /api/delete.php
 * 
 * Headers:
 *   X-API-Key: <your-api-key>
 * 
 * Body: JSON
 *   { "path": "2025/05/posts/image-name-abc123.jpg" }
 * 
 * Response:
 *   { success: true, message: "File deleted" }
 */

// Load config from CDN root using absolute path
$cdnRoot = '/home/cgqcqobh/public_html/cdn.sanaathrumylens.co.ke';
require_once $cdnRoot . '/config.php';

// CORS headers
handleCORS();

// Only allow DELETE and POST (some clients can't send DELETE)
$method = $_SERVER['REQUEST_METHOD'];
if ($method !== 'DELETE' && $method !== 'POST') {
    sendError('Method not allowed', 405);
}

// Authenticate
authenticate();

// Get the file path from request body
$input = json_decode(file_get_contents('php://input'), true);
$filePath = $input['path'] ?? '';

if (empty($filePath)) {
    sendError('Missing file path', 400);
}

// Sanitize path — prevent directory traversal attacks
$filePath = preg_replace('/\.\.+/', '', $filePath);  // Remove ..
$filePath = ltrim($filePath, '/');  // Remove leading slashes

// Build full path
$fullPath = UPLOAD_DIR . $filePath;

// Verify the path is within the uploads directory
$realUploadDir = realpath(UPLOAD_DIR);
$realFilePath = realpath($fullPath);

if ($realFilePath === false || strpos($realFilePath, $realUploadDir) !== 0) {
    sendError('Invalid file path', 400);
}

// Check file exists
if (!file_exists($fullPath)) {
    sendError('File not found', 404);
}

// Delete the file
if (!unlink($fullPath)) {
    sendError('Failed to delete file', 500);
}

// Try to clean up empty parent directories
cleanEmptyDirs(dirname($fullPath));

sendSuccess(['message' => 'File deleted', 'path' => $filePath]);

// ============================================
// Helper Functions
// ============================================

function handleCORS() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, ALLOWED_ORIGINS)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    header('Access-Control-Allow-Methods: DELETE, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-API-Key');
    header('Access-Control-Allow-Credentials: true');
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}

function authenticate() {
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    
    if (empty($apiKey)) {
        sendError('Missing API key. Provide X-API-Key header.', 401);
    }
    
    if (!in_array($apiKey, API_KEYS)) {
        sendError('Invalid API key', 403);
    }
}

function cleanEmptyDirs($dir) {
    $realUploadDir = realpath(UPLOAD_DIR);
    while ($dir !== $realUploadDir && is_dir($dir) && is_empty_dir($dir)) {
        rmdir($dir);
        $dir = dirname($dir);
    }
}

function is_empty_dir($dir) {
    $files = array_diff(scandir($dir), ['.', '..']);
    return count($files) === 0;
}

function sendSuccess($data) {
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'data' => $data]);
    exit;
}

function sendError($message, $code = 400) {
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => $message]);
    exit;
}
