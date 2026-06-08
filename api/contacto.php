<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Solo POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false]);
    exit;
}

// Rate limiting por IP (usando archivos temporales)
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile = sys_get_temp_dir() . '/korbax_rl_' . md5($ip) . '.json';
$limit = 5;
$window = 3600; // 1 hora

$now = time();
$rl = file_exists($rateFile) ? json_decode(file_get_contents($rateFile), true) : ['count' => 0, 'reset' => $now + $window];

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

// Leer JSON
$raw = file_get_contents('php://input');
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
function clean(mixed $val): string {
    return htmlspecialchars(strip_tags(trim((string)($val ?? ''))), ENT_QUOTES, 'UTF-8');
}

$nombre = clean($data['nombre'] ?? '');
$empresa = clean($data['empresa'] ?? '');
$telefono = clean($data['telefono'] ?? '');
$mensaje = clean($data['mensaje'] ?? '');
$consentimiento = !empty($data['consentimiento']);

if ($nombre === '' || $telefono === '' || $mensaje === '' || !$consentimiento) {
    http_response_code(422);
    echo json_encode(['ok' => false]);
    exit;
}

// Validaciones adicionales
if (mb_strlen($nombre) > 120 || mb_strlen($telefono) > 30 || mb_strlen($mensaje) > 2000) {
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
    'X-Mailer: PHP/' . PHP_VERSION,
]);

$enviado = mail($destinatario, $asunto, $cuerpo, $headers);

if ($enviado) {
    http_response_code(200);
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['ok' => false]);
}
