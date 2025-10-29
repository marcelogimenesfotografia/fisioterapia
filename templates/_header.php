<?php
session_start();
// Se o usuário não estiver logado, redireciona para o login
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

// Lógica para obter a view ativa a partir do nome do arquivo
$activeView = basename($_SERVER['PHP_SELF'], '.php'); 
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= ucfirst($activeView) ?> - FisioGestão</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="//unpkg.com/alpinejs" defer></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .sidebar-link { display: flex; align-items: center; padding: 0.75rem 1rem; border-radius: 0.5rem; transition: background-color 0.2s; color: #D1D5DB; }
        .sidebar-link:hover { background-color: #374151; }
        .sidebar-link.active { background-color: #4B5563; color: #FFFFFF; font-weight: 600; }
    </style>
</head>
<body class="bg-gray-200">
    <div class="flex h-screen">
        <!-- Menu Lateral -->
        <aside class="w-64 bg-gray-800 text-white flex-col flex-shrink-0 hidden md:flex">
            <div class="h-16 flex items-center justify-center text-xl font-bold border-b border-gray-700 px-4">
                <span>FisioGestão</span>
            </div>
            <nav class="flex-1 p-4 space-y-2">
                <a href="dashboard.php" class="sidebar-link <?= $activeView === 'dashboard' ? 'active' : '' ?>">Início</a>
                <a href="pacientes.php" class="sidebar-link <?= $activeView === 'pacientes' ? 'active' : '' ?>">Pacientes</a>
            </nav>
            <div class="p-4 border-t border-gray-700">
                <p class="font-mono text-sm break-words"><?= htmlspecialchars($_SESSION['user_email']) ?></p>
                <a href="logout.php" class="block w-full mt-2 text-center text-sm bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg">Sair</a>
            </div>
        </aside>

        <!-- Conteúdo Principal -->
        <main class="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">