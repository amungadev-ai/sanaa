<?php
/**
 * CDN List Files Endpoint
 * GET /api/list.php?folder=posts&page=1&limit=20
 * 
 * Headers:
 *   X-API-Key: <your-api-key>
 * 
 * Response:
 *   { success: true, data: { files: [...], total: N, page: 1, limit: 20 } }
 */

// Load config from CDN root using absolute path
$cdnRoot = '/home/cgqcqobh/public_html/cdn.sanaathrumylens.co.ke';
require_once $cdnRoot . '/config.php';

handleCORS();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

authenticate();

$folder = preg_replace('/[^a-zA-Z0-9_-]/', '', $_GET['folder'] ?? '');
$page = max(1, intval($_GET['page'] ?? 1));
$limit = min(100, max(1, intval($_GET['limit'] ?? 20)));

// Scan uploads directory
$allFiles = [];

if (is_dir(UPLOAD_DIR)) {
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator(UPLOAD_DIR, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $file) {
        if ($file->isFile()) {
            $relativePath = substr($file->getPathname(), strlen(UPLOAD_DIR));
            
            // Filter by folder if specified
            if ($folder && strpos($relativePath, "/$folder/") === false && strpos($relativePath, "$folder/") !== 0) {
                continue;
            }
            
            $allFiles[] = [
                'url'       => CDN_BASE_URL . '/uploads/' . $relativePath,
                'path'      => $relativePath,
                'filename'  => $file->getFilename(),
                'size'      => $file->getSize(),
                'mimeType'  => mime_content_type($file->getPathname()),
                'modified'  => date('c', $file->getMTime()),
            ];
        }
    }
}

// Sort by modified date descending
usort($allFiles, function($a, $b) {
    return strtotime($b['modified']) - strtotime($a['modified']);
});

// Paginate
$total = count($allFiles);
$offset = ($page - 1) * $limit;
$files = array_slice($allFiles, $offset, $limit);

sendSuccess([
    'files' => $files,
    'total' => $total,
    'page'  => $page,
    'limit' => $limit,
    'totalPages' => ceil($total / $limit),
]);

// ============================================
// Helper Functions
// ============================================

function handleCORS() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, ALLOWED_ORIGINS)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    header('Access-Control-Allow-Methods: GET, OPTIONS');
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
