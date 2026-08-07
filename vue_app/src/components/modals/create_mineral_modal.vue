<script setup>
import { reactive, ref, watch } from 'vue';
import axios from '@/services/axiosInstance';
import Swal from 'sweetalert2';
import { checkSession } from '@/services/authService';
import { mineralNames, mineralUnits } from '@/assets/js/categories';
import { optimizeMultipleImages } from '@/services/imageOptimizer';

const props = defineProps({
    openModal: {
        type: Boolean,
        required: true
    }
});

const emit = defineEmits(['close', 'created']);

const venezuelaStates = [
    'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar', 'Carabobo', 'Cojedes',
    'Delta Amacuro', 'Dependencias Federales', 'Distrito Capital', 'Falcón', 'Guárico', 'Lara',
    'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira',
    'Trujillo', 'La Guaira', 'Yaracuy', 'Zulia'
];

const mineralSubCategories = [
    'Mineral Precioso',
    'Mineral No Precioso',
    'Gemas y Piedras Preciosas',
    'Minerales Industriales'
];

const form = reactive({
    mineral_name: '',
    custom_mineral_name: '',
    sub_category: '',
    purity: '',
    unit: '',
    price: '',
    price_on_request: false,
    quantity: '',
    country: 'Venezuela',
    state: '',
    city: '',
    manufacturer: '',   // Nombre del vendedor/empresa
    contact: '',        // Correo de contacto
    description: '',
    images: [],
    document: null
});

const previewImages = ref([]);
const docFileName = ref('');
const isSubmitting = ref(false);
const isCompressing = ref(false);

const resolvedMineralName = () =>
    form.mineral_name === 'Otro' ? form.custom_mineral_name : form.mineral_name;

const closeModal = () => emit('close');

const resetForm = () => {
    Object.assign(form, {
        mineral_name: '',
        custom_mineral_name: '',
        sub_category: '',
        purity: '',
        unit: '',
        price: '',
        price_on_request: false,
        quantity: '',
        country: 'Venezuela',
        state: '',
        city: '',
        manufacturer: '',
        contact: '',
        description: '',
        images: [],
        document: null
    });
    previewImages.value.forEach(url => URL.revokeObjectURL(url));
    previewImages.value = [];
    docFileName.value = '';
    const fileInput = document.getElementById('mineral-images');
    if (fileInput) fileInput.value = '';
    const docInput = document.getElementById('mineral-document-file');
    if (docInput) docInput.value = '';
};

watch(() => props.openModal, async (newVal) => {
    if (newVal) {
        resetForm();
        const user = await checkSession();
        if (user && user.email && user.business_name || user.name) {
            form.contact = user.email;
            form.manufacturer = user.business_name || user.name;
        }
    }
});

watch(() => form.price_on_request, (enabled) => {
    if (enabled) {
        form.price = '';
    }
});

const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    isCompressing.value = true;
    try {
        const optimizedFiles = await optimizeMultipleImages(files, 10);
        for (const file of optimizedFiles) {
            form.images.push(file);
            previewImages.value.push(URL.createObjectURL(file));
        }
    } catch (error) {
        console.error('Error al comprimir imagen:', error);
        Swal.fire({ title: 'Error', text: 'No se pudo procesar alguna de las imágenes.', icon: 'error', confirmButtonColor: '#059669' });
    } finally {
        isCompressing.value = false;
        event.target.value = '';
    }
};

const handleDocUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowed = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ];
    if (!allowed.includes(file.type)) {
        Swal.fire({ title: 'Error', text: 'Formato no permitido. Solo PDF o Word (.docx).', icon: 'error', confirmButtonColor: '#059669' });
        event.target.value = '';
        return;
    }
    if (file.size > 10 * 1024 * 1024) {
        Swal.fire({ title: 'Error', text: 'El archivo no puede superar los 10 MB.', icon: 'error', confirmButtonColor: '#059669' });
        event.target.value = '';
        return;
    }
    form.document = file;
    docFileName.value = file.name;
};

const removeLocalImage = (index) => {
    form.images.splice(index, 1);
    URL.revokeObjectURL(previewImages.value[index]);
    previewImages.value.splice(index, 1);
};

const submitPublication = async () => {
    if (isCompressing.value) return;

    const mineralNameFinal = resolvedMineralName();
    const hasValidPrice = form.price_on_request || form.price !== '';

    if (!mineralNameFinal || !form.sub_category || !form.unit || !hasValidPrice || form.images.length === 0) {
        Swal.fire({ title: 'Atención', text: 'Por favor completa los campos obligatorios y selecciona al menos una imagen.', icon: 'warning', confirmButtonColor: '#059669' });
        return;
    }

    isSubmitting.value = true;
    try {
        const formData = new FormData();
        formData.append('mineral_name', mineralNameFinal);
        formData.append('name', `${mineralNameFinal}`);
        formData.append('sub_category', form.sub_category);
        formData.append('purity', form.purity);
        formData.append('unit', form.unit);
        formData.append('price', form.price_on_request ? '' : form.price);
        formData.append('price_on_request', String(form.price_on_request));
        formData.append('quantity', form.quantity);
        formData.append('country', form.country);
        formData.append('state', form.state);
        formData.append('city', form.city);
        formData.append('manufacturer', form.manufacturer);
        formData.append('contact', form.contact);
        formData.append('description', form.description);

        form.images.forEach((img, index) => {
            formData.append('images', img, img.name || `mineral_${index}.jpg`);
        });

        if (form.document) {
            formData.append('document', form.document, form.document.name);
        }

        const response = await axios.post(
            '/api/publications_service/minerals',
            formData,
            { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
        );

        if (response.data.success) {
            Swal.fire({ title: '¡Éxito!', text: '¡Publicación de mineral creada exitosamente!', icon: 'success', confirmButtonColor: '#059669' });
            emit('created');
            closeModal();
        } else {
            Swal.fire({ title: 'Error', text: 'Hubo un problema: ' + (response.data.message || 'Error desconocido'), icon: 'error', confirmButtonColor: '#059669' });
        }
    } catch (error) {
        console.error('Error al publicar mineral:', error);
        if (error.response) {
            Swal.fire({ title: 'Error', text: `Error del servidor: ${error.response.data.message}`, icon: 'error', confirmButtonColor: '#059669' });
        } else {
            Swal.fire({ title: 'Error', text: 'Error al procesar la solicitud.', icon: 'error', confirmButtonColor: '#059669' });
        }
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <div class="modal-overlay" v-if="openModal" @click="closeModal">
        <div class="modal-container-2" @click.stop>
            <div class="modal-header-2">
                <h2>Publicar Mineral</h2>
                <button class="close-button-2" @click="closeModal">&times;</button>
            </div>
            <div class="modal-content-2">
                <form @submit.prevent="submitPublication" class="harvest-form" enctype="multipart/form-data">
                    <div class="form-grid">

                        <!-- Mineral -->
                        <div class="form-group">
                            <label for="mineral-name">Mineral *</label>
                            <select id="mineral-name" v-model="form.mineral_name" required>
                                <option value="">Seleccionar mineral</option>
                                <option v-for="m in mineralNames" :key="m" :value="m">{{ m }}</option>
                            </select>
                        </div>

                        <!-- Custom name when "Otro" is selected -->
                        <div class="form-group" v-if="form.mineral_name === 'Otro'">
                            <label for="mineral-custom-name">Nombre del mineral *</label>
                            <input
                                type="text"
                                id="mineral-custom-name"
                                v-model="form.custom_mineral_name"
                                placeholder="Escribe el nombre del mineral"
                                required
                            >
                        </div>

                        <!-- Subcategoría -->
                        <div class="form-group">
                            <label for="mineral-sub-category">Subcategoría *</label>
                            <select id="mineral-sub-category" v-model="form.sub_category" required>
                                <option value="">Selecciona una subcategoría</option>
                                <option v-for="sub in mineralSubCategories" :key="sub" :value="sub">{{ sub }}</option>
                            </select>
                        </div>

                        <!-- Pureza -->
                        <div class="form-group">
                            <label for="mineral-purity">Pureza / Calidad (opcional)</label>
                            <input
                                type="text"
                                id="mineral-purity"
                                v-model="form.purity"
                                placeholder="Ej: 22K, 99.9%, VS1, Grado A"
                            >
                        </div>

                        <!-- Unidad de medida -->
                        <div class="form-group">
                            <label for="mineral-unit">Unidad de medida *</label>
                            <select id="mineral-unit" v-model="form.unit" required>
                                <option value="">Selecciona la unidad</option>
                                <option v-for="u in mineralUnits" :key="u" :value="u">{{ u }}</option>
                            </select>
                        </div>

                        <!-- Cantidad -->
                        <div class="form-group">
                            <label for="mineral-quantity">Cantidad *</label>
                            <input
                                type="number"
                                id="mineral-quantity"
                                v-model="form.quantity"
                                min="0"
                                step="0.001"
                                placeholder="0.000"
                                required
                            >
                        </div>

                        <!-- Precio -->
                        <div class="form-group">
                            <label for="mineral-price">Precio por unidad (USD) *</label>
                            <input
                                type="number"
                                id="mineral-price"
                                v-model="form.price"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                :required="!form.price_on_request"
                                :disabled="form.price_on_request"
                            >
                            <label style="margin-top: 8px; display: flex; align-items: center; gap: 8px; font-size: 0.9rem;">
                                <input type="checkbox" v-model="form.price_on_request">
                                Precio por consultar
                            </label>
                        </div>

                        <!-- Vendedor / Empresa -->
                        <div class="form-group">
                            <label for="mineral-manufacturer">Vendedor / Empresa *</label>
                            <input
                                type="text"
                                id="mineral-manufacturer"
                                v-model="form.manufacturer"
                                placeholder="Nombre del vendedor o empresa"
                                required
                            >
                        </div>

                        <!-- País -->
                        <div class="form-group">
                            <label for="mineral-country">País *</label>
                            <input type="text" id="mineral-country" v-model="form.country" readonly>
                        </div>

                        <!-- Estado -->
                        <div class="form-group">
                            <label for="mineral-state">Estado *</label>
                            <select id="mineral-state" v-model="form.state" required>
                                <option value="">Selecciona un estado</option>
                                <option v-for="s in venezuelaStates" :key="s" :value="s">{{ s }}</option>
                            </select>
                        </div>

                        <!-- Ciudad -->
                        <div class="form-group">
                            <label for="mineral-city">Ciudad *</label>
                            <input
                                type="text"
                                id="mineral-city"
                                v-model="form.city"
                                placeholder="Ciudad de origen"
                                required
                            >
                        </div>

                        <!-- Correo de contacto -->
                        <div class="form-group full-width">
                            <label for="mineral-contact">Correo de contacto *</label>
                            <input type="email" id="mineral-contact" v-model="form.contact" readonly>
                        </div>

                        <!-- Imágenes -->
                        <div class="form-group full-width">
                            <label for="mineral-images">Imágenes del mineral (Máx 10) *</label>

                            <div v-if="previewImages.length > 0" class="image-previews">
                                <div class="preview-item" v-for="(src, idx) in previewImages" :key="idx">
                                    <img :src="src" alt="Preview" />
                                    <button type="button" class="remove-image-btn" @click.prevent="removeLocalImage(idx)">&times;</button>
                                </div>
                            </div>

                            <input
                                type="file"
                                id="mineral-images"
                                accept="image/*"
                                multiple
                                @change="handleFileUpload"
                                :required="form.images.length === 0"
                            >
                        </div>

                        <!-- Documento técnico -->
                        <div class="form-group full-width">
                            <label for="mineral-document-file">
                                <i class="fa-solid fa-file-arrow-up"></i>
                                Documento técnico (PDF o Word, opcional)
                            </label>
                            <div class="doc-upload-area">
                                <input
                                    type="file"
                                    id="mineral-document-file"
                                    accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                                    @change="handleDocUpload"
                                />
                                <div v-if="docFileName" class="doc-preview">
                                    <i class="fa-solid fa-file-pdf doc-icon" v-if="form.document?.type === 'application/pdf'"></i>
                                    <i class="fa-solid fa-file-word doc-icon" v-else></i>
                                    <span class="doc-name">{{ docFileName }}</span>
                                    <button
                                        type="button"
                                        class="remove-doc-btn"
                                        @click="form.document = null; docFileName = ''; $el.querySelector('#mineral-document-file').value = ''"
                                    >&times;</button>
                                </div>
                            </div>
                        </div>

                        <!-- Descripción -->
                        <div class="form-group full-width">
                            <label for="mineral-description">Descripción del mineral *</label>
                            <textarea
                                id="mineral-description"
                                v-model="form.description"
                                rows="4"
                                placeholder="Describe el mineral, su origen, condiciones, etc."
                                required
                            ></textarea>
                            <small class="word-counter">{{ form.description.length }} caracteres</small>
                        </div>

                    </div>

                    <div class="form-actions">
                        <button type="button" class="cancel-button" @click="closeModal">Cancelar</button>
                        <button type="submit" class="submit-button" :disabled="isSubmitting || isCompressing">
                            <span v-if="isCompressing">Procesando imagen...</span>
                            <span v-else-if="isSubmitting">Publicando...</span>
                            <span v-else>Guardar publicación</span>
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
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.image-previews {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 10px;
}
.preview-item {
    position: relative;
    width: 80px;
    height: 80px;
    border: 1px solid #ccc;
    border-radius: 5px;
    overflow: hidden;
}
.preview-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.remove-image-btn {
    position: absolute;
    top: 2px;
    right: 2px;
    background: rgba(255, 0, 0, 0.8);
    color: white;
    border: none;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    font-size: 14px;
    line-height: 14px;
    cursor: pointer;
    display: flex;
    justify-content: center;
    align-items: center;
}
.remove-image-btn:hover {
    background: red;
}

/* --- Document upload --- */
.doc-upload-area {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.doc-preview {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #f0f4ff;
    border: 1px solid #c7d5fc;
    border-radius: 6px;
    padding: 8px 12px;
}

.doc-icon {
    font-size: 20px;
    color: #3665f3;
    flex-shrink: 0;
}

.doc-icon.fa-file-pdf { color: #e53e3e; }
.doc-icon.fa-file-word { color: #2b6cb0; }

.doc-name {
    flex: 1;
    font-size: 13px;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.remove-doc-btn {
    background: rgba(255, 0, 0, 0.15);
    color: #c00;
    border: none;
    border-radius: 50%;
    width: 22px;
    height: 22px;
    font-size: 15px;
    line-height: 1;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: background 0.2s;
}
.remove-doc-btn:hover { background: rgba(255, 0, 0, 0.3); }
</style>
