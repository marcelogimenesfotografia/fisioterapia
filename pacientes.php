<?php
require __DIR__.'/vendor/autoload.php';
use Kreait\Firebase\Factory;

// Busca os dados iniciais com PHP
$factory = (new Factory)->withServiceAccount('auth_firebase.json');
$db = $factory->createFirestore()->database();

// IMPORTANTE: Em um app real, pegue o clinicId da sessão do usuário
$clinicId = "Cg071Ld6G4aU05E1kI3H"; 
// $_SESSION['clinic_id'];

$patientsRef = $db->collection('clinics')->document($clinicId)->collection('patients');
$documents = $patientsRef->documents();
$initialPatients = [];
foreach ($documents as $doc) {
    if ($doc->exists()) {
        $patientData = $doc->data();
        $patientData['id'] = $doc->id();
        $initialPatients[] = $patientData;
    }
}

// Inclui o cabeçalho DEPOIS de buscar os dados
include 'templates/_header.php';
?>

<div 
    x-data="{
        // O PHP entrega os dados iniciais para o Alpine.js
        patients: <?= htmlspecialchars(json_encode($initialPatients)) ?>,
        
        // Estado do Modal
        isModalOpen: false,
        isEditing: false,
        modalForm: { id: null, name: '', phone: '' },
        
        // Funções do Alpine.js
        openModal(patient = null) {
            if (patient) {
                this.isEditing = true;
                this.modalForm = { ...patient };
            } else {
                this.isEditing = false;
                this.modalForm = { id: null, name: '', phone: '' };
            }
            this.isModalOpen = true;
        },
        
        async savePatient() {
            const response = await fetch('api/salvar_paciente.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.modalForm)
            });
            const result = await response.json();
            
            if (result.success) {
                if (this.isEditing) {
                    const index = this.patients.findIndex(p => p.id === result.patient.id);
                    if (index !== -1) this.patients[index] = result.patient;
                } else {
                    this.patients.push(result.patient);
                }
                this.isModalOpen = false;
            } else {
                alert('Erro: ' + (result.message || 'Ocorreu um problema.'));
            }
        }
    }"
>
    <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Pacientes</h1>
        <button @click="openModal()" class="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg">+ Adicionar Paciente</button>
    </div>

    <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <table class="w-full">
            <thead class="bg-gray-50 border-b">
                <tr>
                    <th class="p-4 text-left font-semibold text-gray-600">Nome</th>
                    <th class="p-4 text-left font-semibold text-gray-600">Telefone</th>
                    <th class="p-4 text-left font-semibold text-gray-600">Ações</th>
                </tr>
            </thead>
            <tbody>
                <template x-for="patient in patients" :key="patient.id">
                    <tr class="border-b hover:bg-gray-50">
                        <td class="p-4" x-text="patient.name"></td>
                        <td class="p-4" x-text="patient.phone || 'N/A'"></td>
                        <td class="p-4">
                            <button @click="openModal(patient)" class="font-semibold text-blue-600 hover:underline">Editar</button>
                        </td>
                    </tr>
                </template>
                <template x-if="patients.length === 0">
                    <tr><td colspan="3" class="p-8 text-center text-gray-500">Nenhum paciente cadastrado.</td></tr>
                </template>
            </tbody>
        </table>
    </div>

    <!-- Modal de Paciente -->
    <div x-show="isModalOpen" x-transition class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div @click.away="isModalOpen = false" class="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <form @submit.prevent="savePatient()">
                <div class="p-6 border-b">
                    <h2 class="text-2xl font-bold" x-text="isEditing ? 'Editar Paciente' : 'Adicionar Paciente'"></h2>
                </div>
                <div class="p-6 space-y-4">
                    <input type="text" x-model="modalForm.name" placeholder="Nome Completo" class="w-full p-2 border rounded" required>
                    <input type="tel" x-model="modalForm.phone" placeholder="Telefone" class="w-full p-2 border rounded">
                </div>
                <div class="p-6 bg-gray-50 flex justify-end space-x-4">
                    <button type="button" @click="isModalOpen = false" class="bg-gray-200 font-semibold py-2 px-6 rounded-lg">Cancelar</button>
                    <button type="submit" class="bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg">Salvar</button>
                </div>
            </form>
        </div>
    </div>
</div>

<?php include 'templates/_footer.php'; ?>