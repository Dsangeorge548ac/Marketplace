<script setup>
import { reactive, ref, watch, computed } from 'vue';
import axios from 'axios';
import Swal from 'sweetalert2'

const props = defineProps({
  openModal: {
    type: Boolean,
    required: true
  },
  user: {
      type: Object,
      default: null
  },
  roles: {
      type: Array,
      default: () => ["Administrador", "Usuario", "Asociado", "Developer"]
  }
});


const emit = defineEmits(['close', 'updated', 'created']);

const isEditing = computed(() => !!props.user);
const isSubmitting = ref(false);

const form = reactive({
    // Basic Info (from 'users' table)
    id: null,
    name: '',
    email: '',
    role: '',
    message: '',

    // Extended Info (from related tables)
    first_name: '',
    last_name: '',
    phone: '',
    verification: 0,
    
    birth_date: '',
    nationality: '',
    address: '',
    city: '',
    
    state: '',
    zip_code: '',
    country: '',
    id_document: null,
    address_document: null
});

// Cargar datos cuando cambia el usuario seleccionado
watch(() => props.user, (newUser) => {
    if (newUser) {
        Object.assign(form, newUser);
        
        // Ensure role is Capitalized to match select options
        if (form.role) {
            form.role = form.role.charAt(0).toUpperCase() + form.role.slice(1).toLowerCase();
            // Handle special cases if any (e.g. multi-word roles) although currently they are single word.
            if (form.role === 'Developer') {
                 // Developer is already capitalized by above logic
            }
        }

    } else {
        // Reset all fields
        Object.keys(form).forEach(key => form[key] = (key === 'verification' ? 0 : ''));
        form.id = null;
    }
}, { immediate: true });

const closeModal = () => {
    emit('close');
};

const handleSubmit = async () => {
    if (!form.name || !form.email || !form.role) {
        Swal.fire('Error', 'Nombre, Email y Rol son obligatorios', 'error');
        return;
    }

    isSubmitting.value = true;

    try {
        if (isEditing.value) {
            // Actualizar
            // Use PUT /:id
            // Note: form contains all fields, backend extracts what it needs (email, role)
            const { data } = await axios.put(`/api/user_service/${form.id}`, form, {
                withCredentials: true
            });

            if (data.success) {
                Swal.fire('Éxito', 'Usuario actualizado correctamente', 'success');
                emit('updated');
                closeModal();
            } else {
                throw new Error(data.message || 'Error desconocido');
            }
        } else {
            // Crear (Opcional, si se implementa crear usuario desde admin)
            // Por ahora solo editamos
            Swal.fire('Info', 'La creación de usuarios desde admin no está implementada en este backend aún.', 'info');
        }

    } catch (error) {
        console.error(error);
        const msg = error.response?.data?.message || error.message || 'Error al procesar';
        Swal.fire('Error', msg, 'error');
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <div v-if="openModal" class="modal-overlay" @click="closeModal">
        <div class="modal-container-2" @click.stop>
            
            <div class="modal-header-2">
                <h2>{{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}</h2>
                <button type="button" class="close-button-2" @click="closeModal">&times;</button>
            </div>
            
            <div class="modal-content-2">
                <form @submit.prevent="handleSubmit" class="land-form">
                    
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="name">Nombre *</label>
                            <input type="text" id="name" v-model="form.name" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="email">Correo electrónico *</label>
                            <input type="email" id="email" v-model="form.email" required :readonly="isEditing" :class="{'readonly-input': isEditing}"> 
                        </div>

                         <div class="form-group">
                            <label for="role">Rol de usuario *</label>
                            <select id="role" v-model="form.role" class="form-control" required>
                                <option value="" disabled>Seleccione un rol</option>
                                <option v-for="role in roles" :key="role" :value="role">
                                    {{ role }}
                                </option>
                            </select>
                        </div>


                        <div class="form-group">
                            <label for="phone">Teléfono</label>
                            <input type="text" id="phone" v-model="form.phone">
                        </div>


                        <div class="form-group">
                            <label for="country">País</label>
                            <input type="text" id="country" v-model="form.country">
                        </div>

                         <div class="form-group">
                            <label for="city">Ciudad</label>
                            <input type="text" id="city" v-model="form.city">
                        </div>

                        <div class="form-group">
                            <label for="state">Estado</label>
                            <input type="text" id="state" v-model="form.state">
                        </div>

                        <div class="form-group">
                            <label for="zip_code">Código postal</label>
                            <input type="text" id="zip_code" v-model="form.zip_code">
                        </div>

            
                         <div class="form-group full-width">
                            <label>Documento de identidad</label>
                            <div id="id_document" class="border rounded p-4 bg-light">
                                <div v-if="form.id_document">
                                    <i class="fas fa-file-check fa-2x text-success d-block mb-2"></i>
                                    <small class="text-success">Documento cargado</small>
                                </div>
                                <div v-else>
                                    <i class="fas fa-file-upload fa-2x text-muted d-block mb-2"></i>
                                    <small class="text-muted">No hay documento cargado</small>
                                </div>
                            </div>
                        </div>

                        <div class="form-group full-width">
                            <label>Comprobante de domicilio</label>
                            <div id="address_document" class="border rounded p-4 bg-light">
                                <div v-if="form.address_document">
                                    <i class="fas fa-file-check fa-2x text-success d-block mb-2"></i>
                                    <small class="text-success">Documento cargado</small>
                                </div>
                                <div v-else>
                                    <i class="fas fa-file-upload fa-2x text-muted d-block mb-2"></i>
                                    <small class="text-muted">No hay documento cargado</small>
                                </div>
                            </div>
                        </div>

                        <div class="form-group full-width">
                            <label for="message">Comentarios Internos</label>
                            <textarea id="message" v-model="form.message" placeholder="Notas administrativas sobre este usuario..."></textarea>
                        </div>

                    </div>

                    <div class="form-actions">
                        <button type="button" class="cancel-button" @click="closeModal">Cancelar</button>
                        <button type="submit" class="submit-button" :disabled="isSubmitting">
                            {{ isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Guardar') }}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(2px);
}

.modal-container-2 {
  background: white;
  border-radius: 16px;
  width: 100%;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.section-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 10px;
    border-bottom: 2px solid #f3f4f6;
    padding-bottom: 5px;
}

.full-width {
    margin-top: 0 !important;
}

.form-group {
    margin-bottom: 0 !important;
}

.readonly-input {
    background-color: #f9fafb;
    border-color: #e5e7eb;
    color: #4b5563;
    pointer-events: none;
}

.btn-doc {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #e0f2fe;
    color: #0284c7;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 0.9rem;
    transition: 0.2s;
}
.btn-doc:hover {
    background: #bae6fd;
}
</style>
