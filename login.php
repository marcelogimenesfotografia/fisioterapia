<?php
session_start();
require __DIR__.'/vendor/autoload.php';

use Kreait\Firebase\Factory;
use Kreait\Firebase\Auth\SignIn\FailedToSignIn;

$errorMessage = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $factory = (new Factory)->withServiceAccount('auth_firebase.json');
    $auth = $factory->createAuth();

    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    try {
        $signInResult = $auth->signInWithEmailAndPassword($email, $password);
        $user = $signInResult->data();
        
        // Salva informações do usuário na sessão
        $_SESSION['user_id'] = $user['localId'];
        $_SESSION['user_email'] = $user['email'];
        // Lógica para buscar o clinicId e salvar na sessão...
        // $_SESSION['clinic_id'] = buscarClinicId($user['localId']);

        header('Location: dashboard.php');
        exit;
    } catch (FailedToSignIn $e) {
        $errorMessage = 'E-mail ou senha inválidos.';
    }
}
?>

<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <title>Login - FisioGestão</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>body { font-family: 'Inter', sans-serif; }</style>
</head>
<body class="bg-gray-100">
    <div class="h-screen flex items-center justify-center p-4">
        <div class="max-w-md w-full mx-auto">
            <div class="bg-white p-8 rounded-lg shadow-xl">
                <div class="text-center mb-8">
                    <h1 class="text-3xl font-bold text-blue-600">FisioGestão</h1>
                    <p class="text-gray-500">Acesse sua conta para continuar.</p>
                </div>
                <form method="POST">
                    <div class="space-y-4">
                        <input type="email" name="email" placeholder="Seu e-mail" class="w-full p-3 border rounded-lg" required>
                        <input type="password" name="password" placeholder="Sua senha" class="w-full p-3 border rounded-lg" required>
                    </div>
                    <?php if ($errorMessage): ?>
                        <p class="text-red-500 text-sm mt-4 text-center"><?= htmlspecialchars($errorMessage) ?></p>
                    <?php endif; ?>
                    <button type="submit" class="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg shadow hover:bg-blue-700 mt-6">Entrar</button>
                </form>
            </div>
        </div>
    </div>
</body>
</html>