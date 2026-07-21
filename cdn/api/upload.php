<?php
/**
 * CDN Upload Endpoint
 * POST /api/upload.php
 * 
 * Headers:
 *   X-API-Key: <your-api-key>
 * 
 * Body: multipart/form-data
 *   file: <file> (required)
 *   folder: <string> (optional — 'posts', 'artists', 'events', 'profiles', 'ads', 'misc')
 *   altText: <string> (optional)
 * 
 * Response:
 *   { success: true, data: { url, filename, originalName, size, mimeType, folder } }
 */

// Load config from CDN root using absolute path
$cdnRoot = '/home/cgqcqobh/public_html/cdn.sanaathrumylens.co.ke';
require_once $cdnRoot . '/config.php';

// CORS headers
handleCORS();

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

// Authenticate
authenticate();

// Check upload directory exists
if (!is_dir(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

// Get the uploaded file
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    $errorMessages = [
        UPLOAD_ERR_INI_SIZE   => 'File exceeds server upload_max_filesize',
        UPLOAD_ERR_FORM_SIZE  => 'File exceeds form MAX_FILE_SIZE',
        UPLOAD_ERR_PARTIAL    => 'File was only partially uploaded',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temp folder',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
        UPLOAD_ERR_EXTENSION  => 'Upload blocked by PHP extension',
    ];
    $errCode = $_FILES['file']['error'] ?? UPLOAD_ERR_NO_FILE;
    $msg = $errorMessages[$errCode] ?? 'Unknown upload error';
    sendError("Upload failed: $msg", 400);
}

$file = $_FILES['file'];

// Validate file size
if ($file['size'] > MAX_FILE_SIZE) {
    sendError('File too large. Maximum size is ' . (MAX_FILE_SIZE / 1024 / 1024) . 'MB', 400);
}

// Validate MIME type
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, ALLOWED_MIME_TYPES)) {
    sendError("File type '$mimeType' not allowed. Allowed: " . implode(', ', ALLOWED_MIME_TYPES), 400);
}

// Get folder parameter
$folder = preg_replace('/[^a-zA-Z0-9_-]/', '', $_POST['folder'] ?? 'misc');
$allowedFolders = ['posts', 'artists', 'events', 'profiles', 'ads', 'misc'];
if (!in_array($folder, $allowedFolders)) {
    $folder = 'misc';
}

// Build upload path: uploads/YYYY/MM/folder/
$datePath = '';
if (ORGANIZE_BY_DATE) {
    $year = date('Y');
    $month = date('m');
    $datePath = "$year/$month/";
}

$uploadPath = UPLOAD_DIR . $datePath . $folder . '/';

if (!is_dir($uploadPath)) {
    mkdir($uploadPath, 0755, true);
}

// Generate unique filename
$originalName = pathinfo($file['name'], PATHINFO_FILENAME);
$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
$safeName = preg_replace('/[^a-zA-Z0-9_-]/', '-', $originalName);
$safeName = substr($safeName, 0, 50); // Limit length
$uniqueName = $safeName . '-' . uniqid() . '.' . $extension;

$targetPath = $uploadPath . $uniqueName;

// Move file
if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    sendError('Failed to save file', 500);
}

// Build URL
$relativePath = $datePath . $folder . '/' . $uniqueName;
$url = CDN_BASE_URL . '/uploads/' . $relativePath;

// Return success
sendSuccess([
    'url'        => $url,
    'filename'   => $uniqueName,
    'originalName' => $file['name'],
    'size'       => $file['size'],
    'mimeType'   => $mimeType,
    'folder'     => $folder,
    'path'       => $relativePath,
]);

// ============================================
// Helper Functions
// ============================================

function handleCORS() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, ALLOWED_ORIGINS)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    header('Access-Control-Allow-Methods: POST, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-API-Key');
    header('Access-Control-Allow-Credentials: true');
    
    // Handle preflight
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
