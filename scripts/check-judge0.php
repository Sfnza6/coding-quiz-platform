<?php
// CLI only: exercise the same client used by student submissions.
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$backend = $argv[1] ?? 'C:/xampp/htdocs/coding_quiz';
require $backend . '/judge0_client.php';
$settings = judge0_client_settings();
if (isset($settings['_error'])) { fwrite(STDERR, $settings['_error'] . PHP_EOL); exit(1); }
$cases = [
    'Python' => [71, 'print(2+3)'],
    'C++' => [52, "#include <iostream>\nint main(){std::cout << 5;}"],
    'JavaScript' => [63, 'console.log(5)'],
    'Java' => [62, 'public class Main {public static void main(String[] args){System.out.println(5);}}'],
];
$failed = false;
foreach ($cases as $name => [$id, $code]) {
    $result = judge0_client_submit($settings, $id, $code, '');
    $ok = ($result['status']['id'] ?? 0) === 3 && trim($result['stdout'] ?? '') === '5';
    echo $name . ': ' . ($ok ? 'PASS' : 'FAIL') . PHP_EOL;
    if (!$ok) { echo json_encode($result, JSON_UNESCAPED_UNICODE) . PHP_EOL; $failed = true; }
}
exit($failed ? 1 : 0);
