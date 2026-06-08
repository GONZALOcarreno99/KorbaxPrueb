<?php
declare(strict_types=1);

// No filtrar errores al cliente (los detalles solo deben ir al log del servidor)
ini_set('display_errors', '0');
error_reporting(E_ALL);
@header_remove('X-Powered-By');

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false]);
    exit;
}

// CORS / anti-CSRF: no se expone Access-Control-Allow-Origin (los navegadores
// bloquean llamadas de otros sitios) y, si viene cabecera Origin, debe ser el
// mismo host del sitio. Se autoadapta a cualquier dominio donde se despliegue.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '') {
    $oHost = parse_url($origin, PHP_URL_HOST) ?: '';
    $host  = preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? '');
    if (strcasecmp((string)$oHost, (string)$host) !== 0) {
        http_response_code(403);
        echo json_encode(['ok' => false]);
        exit;
    }
}

// Rate limiting por IP (usando archivos temporales)
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/korbax_rl_' . md5($ip) . '.json';
$limit = 5;
$window = 3600; // 1 hora

$now = time();
$rl = file_exists($rateFile) ? json_decode((string)file_get_contents($rateFile), true) : null;
if (!is_array($rl) || !isset($rl['count'], $rl['reset'])) {
    $rl = ['count' => 0, 'reset' => $now + $window];
}

if ($now > $rl['reset']) {
    $rl = ['count' => 0, 'reset' => $now + $window];
}

if ($rl['count'] >= $limit) {
    http_response_code(429);
    echo json_encode(['ok' => false]);
    exit;
}

$rl['count']++;
file_put_contents($rateFile, json_encode($rl), LOCK_EX);

// Leer JSON (cap de tamaño para evitar abuso/DoS)
$raw = file_get_contents('php://input', false, null, 0, 50000);
if ($raw === false || strlen($raw) >= 50000) {
    http_response_code(413);
    echo json_encode(['ok' => false]);
    exit;
}
$data = json_decode($raw, true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['ok' => false]);
    exit;
}

// Honeypot
if (!empty($data['hp'])) {
    http_response_code(200);
    echo json_encode(['ok' => true]); // Silencioso ante bots
    exit;
}

// Sanitizar y validar
// Campo de una línea: sin etiquetas ni caracteres de control/saltos (anti inyección de cabeceras)
function clean_line(mixed $val): string {
    $s = strip_tags(trim((string)($val ?? '')));
    return (string)preg_replace('/[\x00-\x1F\x7F]+/u', ' ', $s);
}
// Texto multilínea (mensaje): permite saltos de línea, quita control peligroso y normaliza CRLF
function clean_text(mixed $val): string {
    $s = strip_tags(trim((string)($val ?? '')));
    $s = (string)preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+/u', '', $s);
    return str_replace("\r\n", "\n", $s);
}

$nombre = clean_line($data['nombre'] ?? '');
$empresa = clean_line($data['empresa'] ?? '');
$telefono = clean_line($data['telefono'] ?? '');
$mensaje = clean_text($data['mensaje'] ?? '');
$consentimiento = !empty($data['consentimiento']);

if ($nombre === '' || $telefono === '' || $mensaje === '' || !$consentimiento) {
    http_response_code(422);
    echo json_encode(['ok' => false]);
    exit;
}

// Validaciones adicionales
if (mb_strlen($nombre) > 120 || mb_strlen($empresa) > 120 || mb_strlen($telefono) > 30 || mb_strlen($mensaje) > 2000) {
    http_response_code(422);
    echo json_encode(['ok' => false]);
    exit;
}

// El teléfono solo admite dígitos y símbolos de marcación
if (!preg_match('/^[0-9+\-\s().]{6,30}$/', $telefono)) {
    http_response_code(422);
    echo json_encode(['ok' => false]);
    exit;
}

// Configuración — usa variable de entorno en producción
$destinatario = getenv('KORBAX_MAIL_TO') ?: 'industriaskorbax@gmail.com';
$asunto = 'Nueva consulta desde el sitio web — Industrias Korbax';

$cuerpo = "Has recibido una nueva consulta desde el sitio web.\n\n"
    . "Nombre: {$nombre}\n"
    . ($empresa !== '' ? "Negocio: {$empresa}\n" : '')
    . "Teléfono: {$telefono}\n\n"
    . "Mensaje:\n{$mensaje}\n\n"
    . "---\n"
    . "IP: {$ip}\n"
    . "Fecha: " . date('d/m/Y H:i:s') . "\n"
    . "Consentimiento LPDP: Sí\n";

// Cabeceras seguras (sin inyección)
$headers = implode("\r\n", [
    'From: no-reply@industriaskorbax.com',
    'Reply-To: ' . filter_var($destinatario, FILTER_SANITIZE_EMAIL),
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
]);

$enviado = mail($destinatario, $asunto, $cuerpo, $headers);

if ($enviado) {
    http_response_code(200);
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false]);
}
