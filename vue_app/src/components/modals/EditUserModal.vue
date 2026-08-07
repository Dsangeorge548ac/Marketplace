<script setup>
import { reactive, ref, watch, computed } from 'vue';
import axios, { getApiBaseUrl } from '@/services/axiosInstance';
import Swal from 'sweetalert2'
import { checkSession } from '@/services/authService';

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
const verificationData = ref(null);
const verificationFeedback = ref('');
const isVerificationLoading = ref(false);
const isVerificationActionRunning = ref(false);
const sessionUser = ref(null);

const isReviewer = computed(() => {
    const role = String(sessionUser.value?.role || '').toLowerCase();
    return role === 'administrador' || role === 'developer';
});

const isVerifiedUser = computed(() => {
    return String(verificationData.value?.verification || '').toLowerCase() === 'verificado';
});

const canEditFullProfile = computed(() => isVerifiedUser.value);

const form = reactive({
    // Basic Info (from 'users' table)
    id: null,
    name: '',
    email: '',
    role: '',
    message: '',

    // Extended Info (from related tables)
    business_name: '',
    tax_address: '',
    tax_id: '',
    phone: '',
    status: '',
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

const syncFormWithVerificationData = (data) => {
    if (!data) return;
    form.business_name = data.business_name || data.verification_business_name || form.business_name || '';
    form.tax_address = data.tax_address || data.verification_tax_address || form.tax_address || '';
    form.tax_id = data.tax_id || data.verification_tax_id || form.tax_id || '';
    form.phone = data.phone || data.verification_phone || form.phone || '';
    form.status = data.verification || data.verification_status || form.status || '';
    form.message = data.verification_feedback || data.message || form.message || '';
};

// Cargar datos cuando cambia el usuario seleccionado
watch(() => props.user, (newUser) => {
    if (newUser) {
        Object.assign(form, newUser);
        syncFormWithVerificationData(newUser);
        
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

watch(() => props.user?.id, async (userId) => {
    if (!props.openModal || !userId || !isReviewer.value) {
        verificationData.value = null;
        verificationFeedback.value = '';
        return;
    }

    isVerificationLoading.value = true;
    try {
        const { data } = await axios.get(`/api/user_service/account/requests/${userId}`, { withCredentials: true });
        verificationData.value = data.data || null;
        verificationFeedback.value = data.data?.verification_feedback || '';
        syncFormWithVerificationData(data.data || null);
    } catch (error) {
        verificationData.value = null;
        verificationFeedback.value = '';
    } finally {
        isVerificationLoading.value = false;
    }
}, { immediate: true });

watch(() => props.openModal, async (isOpen) => {
    if (!isOpen) {
        verificationData.value = null;
        verificationFeedback.value = '';
        return;
    }
    sessionUser.value = await checkSession();
    if (props.user?.id && isReviewer.value) {
        await reloadVerificationData();
    }
}, { immediate: true });

const fileUrl = (storedPath) => {
    if (!storedPath) return '';
    if (String(storedPath).startsWith('http')) return String(storedPath);
    
    let baseURL = getApiBaseUrl();
    baseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;

    const cleanPath = String(storedPath).replace(/^\/+/, '');
    return `${baseURL}/user_service/${cleanPath}`;
};

const reloadVerificationData = async () => {
    if (!props.user?.id || !isReviewer.value) return;
    isVerificationLoading.value = true;
    try {
        const { data } = await axios.get(`/api/user_service/account/requests/${props.user.id}`, { withCredentials: true });
        verificationData.value = data.data || null;
        verificationFeedback.value = data.data?.verification_feedback || verificationFeedback.value;
        syncFormWithVerificationData(data.data || null);
    } catch (error) {
        verificationData.value = null;
    } finally {
        isVerificationLoading.value = false;
    }
};

const approveVerification = async () => {
    if (!props.user?.id || !isReviewer.value) return;

    isVerificationActionRunning.value = true;
    try {
        await axios.put(
            `/api/user_service/account/requests/${props.user.id}/approve`,
            { feedback: form.message || 'Verificado correctamente' },
            { withCredentials: true }
        );

        Swal.fire('Aprobado', 'Usuario verificado correctamente', 'success');
        await reloadVerificationData();
        emit('updated');
        closeModal();
    } catch (error) {
        const msg = error.response?.data?.message || 'No se pudo verificar al usuario';
        Swal.fire('Error', msg, 'error');
    } finally {
        isVerificationActionRunning.value = false;
    }
};

const cancelVerification = async () => {
    if (!props.user?.id || !isReviewer.value) return;
    if (!form.message.trim()) {
        Swal.fire('Observaciones requeridas', 'Debes indicar un comentario interno para rechazar la verificacion', 'warning');
        return;
    }

    isVerificationActionRunning.value = true;
    try {
        await axios.put(
            `/api/user_service/account/requests/${props.user.id}/cancel`,
            { feedback: form.message },
            { withCredentials: true }
        );

        Swal.fire('Cancelado', 'La verificacion ha sido rechazada y el usuario ha sido notificado', 'success');
        await reloadVerificationData();
        emit('updated');
        closeModal();
    } catch (error) {
        const msg = error.response?.data?.message || 'No se pudo rechazar el proceso';
        Swal.fire('Error', msg, 'error');
    } finally {
        isVerificationActionRunning.value = false;
    }
};

const revokeVerification = async () => {
    if (!props.user?.id || !isReviewer.value) return;

    isVerificationActionRunning.value = true;
    try {
        await axios.put(
            `/api/user_service/account/requests/${props.user.id}/revoke`,
            { feedback: form.message || 'Verificacion removida por administrador' },
            { withCredentials: true }
        );

        Swal.fire('Revocado', 'Verificacion removida y datos eliminados', 'success');
        await reloadVerificationData();
        emit('updated');
    } catch (error) {
        const msg = error.response?.data?.message || 'No se pudo revocar la verificacion';
        Swal.fire('Error', msg, 'error');
    } finally {
        isVerificationActionRunning.value = false;
    }
};

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
                    <section class="form-panel stacked-section">
                        <div class="section-head">
                            <h3>Datos del usuario</h3>
                            <p>Información principal de acceso y perfil.</p>
                        </div>

                        <div class="form-grid compact-grid">
                            <div class="form-group">
                                <label for="name">Nombre *</label>
                                <input type="text" id="name" v-model="form.name" required>
                            </div>

                            <div class="form-group">
                                <label for="email">Correo electrónico *</label>
                                <input
                                    type="email"
                                    id="email"
                                    v-model="form.email"
                                    required
                                    :readonly="!canEditFullProfile"
                                    :disabled="!canEditFullProfile"
                                    :class="{'readonly-input': !canEditFullProfile}"
                                >
                            </div>

                            <div class="form-group">
                                <label for="phone">Teléfono</label>
                                <input type="text" id="phone" v-model="form.phone" :disabled="!canEditFullProfile">
                            </div>

                            <div class="form-group">
                                <label for="business_name">Razón social</label>
                                <input type="text" id="business_name" v-model="form.business_name" :disabled="!canEditFullProfile">
                            </div>

                            <div class="form-group">
                                <label for="tax_id">Rif / Cédula</label>
                                <input type="text" id="tax_id" v-model="form.tax_id" :disabled="!canEditFullProfile">
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
                        </div>
                    </section>

                    <section class="form-panel stacked-section status-section-verification">
                        <div class="section-head">
                            <h3>Estado de verificación</h3>
                            <p>Revisa el estado antes de guardar cambios.</p>
                        </div>

                        <div class="verification-inline">
                            <div class="status-pill" :class="`status-${String(form.status || 'sin_estado').toLowerCase().replace(/\s+/g, '-')}`">
                                {{ form.status || 'Sin estado' }}
                            </div>
                            <p class="card-note">
                                {{ isVerifiedUser ? 'La solicitud de verificación fue aprobada.' : 'Revisa los documentos y el estado antes de guardar cambios.' }}
                            </p>
                        </div>
                    </section>

                    <section class="form-panel stacked-section">
                        <div class="section-head">
                            <h3>Documentos</h3>
                            <p>Todos los archivos se muestran uno debajo del otro.</p>
                        </div>

                        <div class="docs-card">
                            <div class="doc-box">
                                <span class="doc-title">Documento de alianza con la CBM</span>
                                <div v-if="verificationData?.cbm_alliance_document" class="doc-entry">
                                    <a :href="fileUrl(verificationData.cbm_alliance_document)" target="_blank" rel="noopener">Abrir documento</a>
                                </div>
                                <div v-else class="doc-empty">
                                    <i class="fas fa-file-upload"></i>
                                    <span>No hay documento cargado</span>
                                </div>
                            </div>

                            <div class="doc-box">
                                <span class="doc-title">Comprobante de cédula o RIF</span>
                                <div v-if="verificationData?.tax_id_document" class="doc-entry">
                                    <a :href="fileUrl(verificationData.tax_id_document)" target="_blank" rel="noopener">Abrir archivo</a>
                                </div>
                                <div v-else class="doc-empty">
                                    <i class="fas fa-file-upload"></i>
                                    <span>No hay documento cargado</span>
                                </div>
                            </div>

                            <div class="doc-box">
                                <span class="doc-title">Foto del rostro</span>
                                <div v-if="verificationData?.face_photo" class="doc-entry">
                                    <a :href="fileUrl(verificationData.face_photo)" target="_blank" rel="noopener">Abrir imagen</a>
                                </div>
                                <div v-else class="doc-empty">
                                    <i class="fas fa-file-upload"></i>
                                    <span>No hay documento cargado</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section class="form-panel stacked-section">
                        <div class="section-head">
                            <h3>Datos fiscales y notas</h3>
                            <p>Información complementaria y observaciones internas.</p>
                        </div>

                        <div class="form-grid bottom-grid">
                            <div class="form-group full-width">
                                <label for="tax_address">Dirección fiscal</label>
                                <textarea
                                    id="tax_address"
                                    v-model="form.tax_address"
                                    placeholder="Notas administrativas sobre este usuario..."
                                    :disabled="!canEditFullProfile"
                                ></textarea>
                            </div>

                            <div class="form-group full-width">
                                <label for="message">Comentarios Internos</label>
                                <textarea
                                    id="message"
                                    v-model="form.message"
                                    placeholder="Notas administrativas sobre este usuario... o motivo de rechazo de verificacion."
                                    :disabled="!canEditFullProfile"
                                ></textarea>
                            </div>
                        </div>
                    </section>

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

<style scoped src="@/assets/css/components/edit-user-modal.css"></style>