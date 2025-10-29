<?php
session_start();
require __DIR__.'/../vendor/autoload.php';
use Kreait\Firebase\Factory;

header('Content-Type: application/json');

// Validações de segurança
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Acesso negado.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$name = trim($input['name'] ?? '');
$phone = trim($input['phone'] ?? '');
$id = $input['id'] ?? null;
$clinicId = "Cg071Ld6G4aU05E1kI3H"; // $_SESSION['clinic_id'];

if (empty($name)) {
    echo json_encode(['success' => false, 'message' => 'O nome é obrigatório.']);
    exit;
}

try {
    $factory = (new Factory)->withServiceAccount(__DIR__.'/../auth_firebase.json');
    $db = $factory->createFirestore()->database();
    
    $patientsRef = $db->collection('clinics')->document($clinicId)->collection('patients');
    $dataToSave = ['name' => $name, 'phone' => $phone];
    
    if ($id) {
        $patientDoc = $patientsRef->document($id);
        $patientDoc->set($dataToSave, ['merge' => true]);
        $savedData = ['id' => $id] + $dataToSave;
    } else {
        $newPatientDoc = $patientsRef->add($dataToSave);
        $savedData = ['id' => $newPatientDoc->id()] + $dataToSave;
    }

    echo json_encode(['success' => true, 'patient' => $savedData]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro no servidor: ' . $e->getMessage()]);
}
?>