<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2';
import { isSidebarOpen } from '@/assets/js/dashboardState.js';

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
        <div class="app-brand-container">
            <button v-if="!isSidebarOpen" class="btn-menu-toggle" @click="isSidebarOpen = true">
                <i class='bx bx-menu'></i>
            </button>
            <div class="brand-icon" style="background-color: #fccd1e; color: #111820;">
                <i class='bx bx-wallet-alt'></i>
            </div>
            <h3 class="app-brand-title">Métodos de Pago</h3>
        </div>

        <section class="products-section">
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
                             <i class='bx bxl-paypal' v-if="method.platform === 'Zinli'"></i>
                             <i class='bx bx-mobile' v-else-if="method.platform === 'Zelle'"></i>
                             <i class='bx bxl-bitcoin' v-else-if="method.platform === 'Binance'"></i>
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
        <div class="form-modal-overlay" v-if="isModalOpen" @click.self="closeModal">
            <div class="form-modal">
                <div class="modal-header">
                    <h2>{{ isEditMode ? 'Editar Método' : 'Nuevo Método de Pago' }}</h2>
                    <button class="close-btn" @click="closeModal"><i class='bx bx-x'></i></button>
                </div>
                
                <form @submit.prevent="savePaymentMethod" class="modal-body">
                    <div class="form-group row">
                        <label>Plataforma <span class="required">*</span></label>
                        <select v-model="formData.platform" required>
                            <option value="Zelle">Zelle</option>
                            <option value="Binance">Binance</option>
                            <option value="Zinli">Zinli</option>
                            <option value="Otros">Otros</option>
                        </select>
                    </div>

                    <div class="form-group row">
                        <label>Titular de la cuenta <span class="required">*</span></label>
                        <input type="text" v-model="formData.account_holder" placeholder="Ej. Juan Pérez" required />
                    </div>

                    <div class="form-group row">
                        <label>Correo / ID / Teléfono <span class="required">*</span></label>
                        <input type="text" v-model="formData.email_or_id" placeholder="Correo electrónico o ID Binance" required />
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn-cancel" @click="closeModal">Cancelar</button>
                        <button type="submit" class="btn-submit">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Respetando estilo del Componente Publicaciones */
.btn-create {
    background: #fccd1e;
    color: #000;
    border: none;
    padding: 10px 24px;
    border-radius: 5px; /* Pill shape commonly used in headers */
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background 0.2s;
}
.btn-create:hover { background: #e0b40b; }

.products-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
}

.results-info {
    font-size: 14px;
    color: #111;
    font-weight: 500;
}

.no-results h3 {
    font-size: 18px;
    color: #111;
    font-weight: 500;
}

/* Cards (Modified earlier for UI) */
.payment-methods-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
}

.payment-card {
    background: #fff;
    border: 1px solid #eaeaea;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    transition: transform 0.2s, box-shadow 0.2s;
}

.payment-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }

.platform-header {
    display: flex;
    align-items: center;
    gap: 12px;
}
.platform-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    color: #fff;
}
.platform-icon.zelle { background: #7113e3; }
.platform-icon.binance { background: #f3ba2f; color: #0b0e11; }
.platform-icon.zinli { background: #ff4a5f; }
.platform-icon.otros { background: #607d8b; }

.platform-name {
    font-size: 16px;
    font-weight: 700;
    color: #111820;
}

.method-details p {
    font-size: 14px;
    color: #444;
    margin: 4px 0;
    display: flex;
    align-items: center;
    gap: 8px;
}
.method-details p i { color: #888; }

.card-actions {
    display: flex;
    gap: 10px;
    margin-top: auto;
    border-top: 1px solid #f0f0f0;
    padding-top: 14px;
}

.btn-action {
    flex: 1;
    border: 1px solid #ddd;
    background: transparent;
    padding: 8px;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #555;
    font-size: 18px;
    transition: all 0.2s;
}
.btn-action.edit:hover { background: #f0f4ff; border-color: #3665f3; color: #3665f3; }
.btn-action.delete:hover { background: #fff1f1; border-color: #ff4d4f; color: #ff4d4f; }

.loading-state { text-align: center; padding: 60px; color: #777; }
.spinner {
    width: 40px; height: 40px; border: 4px solid #f3f3f3;
    border-top: 4px solid #3665f3; border-radius: 50%;
    animation: spin 1s linear infinite; margin: 0 auto 15px;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

/* Modal Styles */
.form-modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5); z-index: 1000;
    display: flex; align-items: center; justify-content: center;
}
.form-modal {
    background: #fff; width: 100%; max-width: 450px;
    border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    animation: modalSlide 0.2s ease-out;
}
@keyframes modalSlide { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.modal-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 20px 24px; border-bottom: 1px solid #eee;
    border-radius: 12px;
}
.modal-header h2 { margin: 0; font-size: 18px; color: #111; }
.close-btn { background: none; border: none; font-size: 24px; color: #888; cursor: pointer; }
.close-btn:hover { color: #111; }

.modal-body { padding: 24px; }
.form-group.row { margin-bottom: 16px; display: flex; flex-direction: column; gap: 6px; }
.form-group.row label { font-size: 13px; font-weight: 600; color: #444; }
.required { color: #ff4d4f; }
.form-group.row input, .form-group.row select {
    width: 100%; padding: 10px 12px; border: 1px solid #ddd;
    border-radius: 6px; font-size: 14px; outline: none; transition: border 0.2s;
    box-sizing: border-box;
}
.form-group.row input:focus, .form-group.row select:focus { border-color: #3665f3; }

.modal-footer {
    display: flex; justify-content: flex-end; gap: 12px;
    margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee;
}
.btn-cancel { padding: 10px 20px; border: 1px solid #ddd; background: #fff; border-radius: 6px; cursor: pointer; }
.btn-submit { padding: 10px 20px; border: none; background: #3665f3; color: #fff; border-radius: 6px; cursor: pointer; font-weight: 600;}
.btn-submit:hover { background: #2351db; }
</style>
