<script setup>
import { ref, onMounted } from 'vue';
import axios from '@/services/axiosInstance';
import Swal from 'sweetalert2';
import { isSidebarOpen } from '@/assets/js/dashboardState.js';
import dashboard_banner from '@/components/dashboard/dashboard_banner.vue'

// ------------------------------------------
// ESTADO
// ------------------------------------------
const paymentMethods = ref([]);
const isLoading = ref(true);

const isModalOpen = ref(false);
const isEditMode = ref(false);

const formData = ref({
    id: null,
    platform: 'Zelle',
    account_holder: '',
    email_or_id: ''
});

// ------------------------------------------
// MÉTODOS
// ------------------------------------------

// Obtener métodos del backend
const fetchPaymentMethods = async () => {
    isLoading.value = true;
    try {
        const response = await axios.get('/api/user_service/payment-methods', { withCredentials: true });
        paymentMethods.value = response.data;
    } catch (error) {
        console.error("Error al obtener métodos de pago:", error);
        Swal.fire('Error', 'No se pudieron cargar los métodos de pago', 'error');
    } finally {
        isLoading.value = false;
    }
};

// Abrir modal de crear
const openCreateModal = () => {
    isEditMode.value = false;
    formData.value = { id: null, platform: 'Zelle', account_holder: '', email_or_id: '' };
    isModalOpen.value = true;
};

// Abrir modal de edición
const openEditModal = (method) => {
    isEditMode.value = true;
    formData.value = { ...method };
    isModalOpen.value = true;
};

// Cerrar modal
const closeModal = () => {
    isModalOpen.value = false;
};

// Guardar (Crear o Actualizar)
const savePaymentMethod = async () => {
    if (!formData.value.platform || !formData.value.account_holder || !formData.value.email_or_id) {
        return Swal.fire('Error', 'Todos los campos son obligatorios', 'error');
    }

    try {
        if (isEditMode.value) {
            await axios.put(`/api/user_service/payment-methods/${formData.value.id}`, formData.value, { withCredentials: true });
            Swal.fire({ title: 'Actualizado', text: 'Método de pago actualizado correctamente', icon: 'success', toast: true, timer: 3000, showConfirmButton: false, position: 'top-end' });
        } else {
            await axios.post('/api/user_service/payment-methods', formData.value, { withCredentials: true });
            Swal.fire({ title: 'Agregado', text: 'Método de pago agregado correctamente', icon: 'success', toast: true, timer: 3000, showConfirmButton: false, position: 'top-end' });
        }
        closeModal();
        fetchPaymentMethods();
    } catch (error) {
        console.error("Error al guardar:", error);
        Swal.fire('Error', error.response?.data?.error || 'Ocurrió un error al guardar', 'error');
    }
};

// Eliminar
const deleteMethod = async (id) => {
    const result = await Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción no se puede deshacer.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await axios.delete(`/api/user_service/payment-methods/${id}`, { withCredentials: true });
             Swal.fire({ title: 'Eliminado', text: 'Método de pago eliminado', icon: 'success', toast: true, timer: 3000, showConfirmButton: false, position: 'top-end' });
            fetchPaymentMethods();
        } catch (error) {
             console.error("Error al eliminar:", error);
             Swal.fire('Error', 'No se pudo eliminar el método', 'error');
        }
    }
};

onMounted(() => {
    fetchPaymentMethods();
});
</script>

<template>
    <div class="dashboard-content">
        <dashboard_banner />

        <section class="products-section products-section-payment">
            <div class="products-header">
                <div class="results-info">
                    <span>{{ paymentMethods.length }} resultado{{ paymentMethods.length !== 1 ? 's' : '' }}</span>
                </div>

                <div class="button-beetwen">
                    <button class="btn-create" @click="openCreateModal">
                        <i class='bx bx-plus'></i> Nuevo Método
                    </button>
                </div>
            </div>

            <div v-if="isLoading" class="loading-state">
                <div class="spinner"></div>
                <p>Cargando métodos de pago...</p>
            </div>

            <div v-else-if="paymentMethods.length === 0" class="no-results" style="text-align: center; padding: 40px; color: #000; font-weight: 500;">
                <h3>Sin métodos de pago</h3>
            </div>

            <div v-else class="payment-methods-grid">
                <div class="payment-card" v-for="method in paymentMethods" :key="method.id">
                    <div class="platform-header">
                        <div class="platform-icon" :class="method.platform.toLowerCase()">
                            <img v-if="method.platform === 'Zinli'" src="@/assets/img/payment-methods/Zinli-logo.png" alt="Zinli" class="platform-logo platform-logo-zinli" />
                            <img v-else-if="method.platform === 'Zelle'" src="@/assets/img/payment-methods/Zelle-logo.png" alt="Zelle" class="platform-logo platform-logo-zelle" />
                            <img v-else-if="method.platform === 'Binance'" src="@/assets/img/payment-methods/Binance-logo.png" alt="Binance" class="platform-logo platform-logo-binance" />
                            <i class='bx bx-wallet' v-else></i>
                        </div>
                        <span class="platform-name">{{ method.platform }}</span>
                    </div>
                    
                    <div class="method-details">
                        <p class="holder-name"><i class='bx bx-user'></i> {{ method.account_holder }}</p>
                        <p class="account-id"><i class='bx bx-id-card'></i> {{ method.email_or_id }}</p>
                    </div>
                    
                    <div class="card-actions">
                        <button class="btn-action edit" @click="openEditModal(method)" tooltip="Editar">
                            <i class='bx bx-edit-alt'></i>
                        </button>
                        <button class="btn-action delete" @click="deleteMethod(method.id)" tooltip="Eliminar">
                            <i class='bx bx-trash'></i>
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Agregar/Editar Modal Overlay -->
        <div class="modal-overlay active" v-if="isModalOpen" @click.self="closeModal">
            <div class="modal-container-2" style="max-width: 450px; height: auto;" @click.stop>
                <div class="modal-header-2">
                    <h2>{{ isEditMode ? 'Editar Método' : 'Nuevo Método de Pago' }}</h2>
                    <button class="close-button-2" @click="closeModal">&times;</button>
                </div>
                
                <div class="modal-content-2">
                    <form @submit.prevent="savePaymentMethod" class="harvest-form">
                        <div class="form-grid">
                            <div class="form-group full-width">
                                <label>Plataforma <span class="required" style="color: #ff4d4f;">*</span></label>
                                <select v-model="formData.platform" required>
                                    <option value="Zelle">Zelle</option>
                                    <option value="Binance">Binance</option>
                                    <option value="Zinli">Zinli</option>
                                    <option value="Otros">Otros</option>
                                </select>
                            </div>

                            <div class="form-group full-width">
                                <label>Titular de la cuenta <span class="required" style="color: #ff4d4f;">*</span></label>
                                <input type="text" v-model="formData.account_holder" placeholder="Ej. Juan Pérez" required />
                            </div>

                            <div class="form-group full-width">
                                <label>Correo / ID / Teléfono <span class="required" style="color: #ff4d4f;">*</span></label>
                                <input type="text" v-model="formData.email_or_id" required />
                            </div>
                        </div>

                        <div class="form-actions">
                            <button type="button" class="cancel-button" @click="closeModal">Cancelar</button>
                            <button type="submit" class="submit-button">Guardar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped src="@/assets/css/pages/dashboard/payment_methods.css"></style>
