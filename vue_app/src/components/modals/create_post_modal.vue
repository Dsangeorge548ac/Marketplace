<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import axios from '@/services/axiosInstance';
import Swal from 'sweetalert2';

import { checkSession } from '@/services/authService';
import { miningCategories, categoryKeys } from '@/assets/js/categories';

import { optimizeMultipleImages } from '@/services/imageOptimizer';
import Users from '@/views/users.vue';

const props = defineProps({
  openModal: {
    type: Boolean,
    required: true
  }
});

const emit = defineEmits(['close', 'created']);
// 2. Datos del Formulario
const venezuelaStates = [
    'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar', 'Carabobo', 'Cojedes', 
    'Delta Amacuro', 'Dependencias Federales', 'Distrito Capital', 'Falcón', 'Guárico', 'Lara', 
    'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira', 
    'Trujillo', 'La Guaira', 'Yaracuy', 'Zulia'
];

const form = reactive({
    name: '',
    category: '',
    sub_category: '', // NEW
    type_product: '', 
    model: '',        
    // quantity eliminado como acordamos
    price: '',
    price_on_request: false,
    quantity: '', // NUEVO campo de cantidad
    country: 'Venezuela',
    state: '',
    city: '',
    manufacturer: '',
    contact: '',
    description: '',
    images: [],   // Array para imágenes
    document: null // Archivo PDF o Word opcional
});

// To store local object URLs for preview
const previewImages = ref([]);
const docFileName = ref(''); // Name of the selected document file

const isSubmitting = ref(false);
const isCompressing = ref(false); // Estado para la compresión

const closeModal = () => {
    emit('close');
};

const resetForm = () => {
    Object.assign(form, {
        name: '',
        category: '',
        sub_category: '',
        type_product: '', 
        model: '',        
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
    
    // Clear file inputs
    const fileInput = document.getElementById('images');
    if (fileInput) fileInput.value = '';
    const docInput = document.getElementById('document-file');
    if (docInput) docInput.value = '';
};


const userArray = ref([]);
    
watch(() => props.openModal, async (newVal) => {
    if (newVal) {
        resetForm();
        const user = await checkSession();

        if (user) {
            form.manufacturer = user.business_name || user.name;

            // Creamos el array base
            const rawArray = [
                { value: user.email },
                { value: user.phone }
            ];

            // Filtramos con una validación más segura
            userArray.value = rawArray.filter(item => {
                // 1. Verificamos que item.value no sea null/undefined
                // 2. Verificamos que después del trim no esté vacío
                return item.value && String(item.value).trim() !== '';
            });
        }   
    }
});
watch(() => form.category, () => {
    // Cuando la categoría cambia, limpiamos la subcategoría seleccionada
    // porque las opciones de subcategoría cambiarán.
    form.sub_category = '';
});

watch(() => form.price_on_request, (enabled) => {
    if (enabled) {
        form.price = '';
    }
});

// 3. Manejo de Archivos con Compresión
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
        console.error("Error al comprimir:", error);
        Swal.fire({ title: 'Error', text: 'No se pudo procesar alguna de las imágenes.', icon: 'error', confirmButtonColor: '#059669' });
    } finally {
        isCompressing.value = false;
        event.target.value = '';
    }
};

// Document upload handler (PDF / Word)
const handleDocUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowed = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ];
    if (!allowed.includes(file.type)) {
        Swal.fire({ title: 'Error', text: 'Formato no permitido. Solo se aceptan archivos PDF o Word (.docx).', icon: 'error', confirmButtonColor: '#059669' });
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

// 4. Enviar Formulario
const submitPublication = async () => {
    // Validación extra
    if (isCompressing.value) return; 

    const hasValidPrice = form.price_on_request || form.price !== '';

    if (!form.name || !form.category || !hasValidPrice || form.images.length === 0) {
        Swal.fire({ title: 'Atención', text: 'Por favor completa los campos obligatorios y selecciona al menos una imagen.', icon: 'warning', confirmButtonColor: '#059669' });
        return;
    }

    isSubmitting.value = true;

    try {
        const formData = new FormData();
        
        formData.append('name', form.name);
        formData.append('category', form.category);
        formData.append('sub_category', form.sub_category);
        formData.append('type_product', form.type_product);
        formData.append('model', form.model);
        formData.append('price', form.price_on_request ? '' : form.price);
        formData.append('price_on_request', String(form.price_on_request));
        formData.append('quantity', form.quantity);
        formData.append('country', form.country);
        formData.append('state', form.state);
        formData.append('city', form.city);
        formData.append('manufacturer', form.manufacturer);
        formData.append('contact', form.contact);
        formData.append('description', form.description);
        
        // --- Añadir múltiples imágenes ---
        form.images.forEach((img, index) => {
             const fileName = img.name || `upload_${index}.jpg`;
             formData.append('images', img, fileName);
        });

        // --- Añadir documento si existe ---
        if (form.document) {
            formData.append('document', form.document, form.document.name);
        }
        // -----------------------------

        const response = await axios.post(
            '/api/publications_service/', 
            formData, 
            {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            }
        );

        if (response.data.success) {
            Swal.fire({ title: '¡Éxito!', text: '¡Publicación creada exitosamente!', icon: 'success', confirmButtonColor: '#059669' });
            emit('created');
            closeModal();
        } else {
            Swal.fire({ title: 'Error', text: 'Hubo un problema: ' + (response.data.message || 'Error desconocido'), icon: 'error', confirmButtonColor: '#059669' });
        }

    } catch (error) {
        console.error("Error al publicar:", error);
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
                <h2>Publicar producto</h2>
                <button class="close-button-2" @click="closeModal">&times;</button>
            </div>
            <div class="modal-content-2">
                <form @submit.prevent="submitPublication" class="harvest-form" enctype="multipart/form-data">
                    <div class="form-grid">
                  
                        <div class="form-group">
                            <label for="name">Nombre del producto *</label>
                            <input type="text" id="name" v-model="form.name" placeholder="Nombre del producto" required>
                        </div>

                        <div class="form-group">
                            <label for="quantity">Cantidad *</label>
                            <input type="number" min="0" id="quantity" v-model="form.quantity" placeholder="Cantidad disponible" required>
                        </div>

                        <div class="form-group">
                            <label for="category">Categoría *</label>
                            <select id="category" v-model="form.category" required>
                                <option value="">Selecciona una categoría</option>
                                <option v-for="cat in categoryKeys" :key="cat" :value="cat">
                                    {{ cat }}
                                </option>
                            </select>
                        </div>

                        <div class="form-group" v-if="form.category">
                            <label for="sub_category">Subcategoría *</label>
                            <select id="sub_category" v-model="form.sub_category" required>
                                <option value="">Selecciona una subcategoría</option>
                                <option v-for="sub in miningCategories[form.category]" :key="sub" :value="sub">
                                    {{ sub }}
                                </option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="type_product">Tipo de Producto</label>
                            <input type="text" id="type_product" v-model="form.type_product" placeholder="Ej: Excavadora" required>
                        </div>

                        <div class="form-group">
                            <label for="model">Modelo</label>
                            <input type="text" id="model" v-model="form.model" placeholder="Modelo / Año" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="price">Precio *</label>
                            <input type="number" id="price" v-model="form.price" step="0.01" min="0" placeholder="0.00" :required="!form.price_on_request" :disabled="form.price_on_request">

                            <div style="margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; justify-content: space-between;">
                                <label for="consultar">
                                precio a consultar
                                </label>
                                <input type="checkbox" id="consultar" style="width: 14px; height: 14px; align-items: center; display: flex; margin: auto;" v-model="form.price_on_request">
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="manufacturer">Vendedor / Empresa *</label>
            
                            <input type="text" id="manufacturer" v-model="form.manufacturer" placeholder="Nombre del vendedor o empresa" required>
                        </div>

                        <div class="form-group">
                            <label for="country">País *</label>
                            <input type="text" value="Venezuela" id="country" v-model="form.country" readonly>
                        </div>
                        <div class="form-group">
                            <label for="state">Estado *</label>
                            <select id="state" v-model="form.state" required>
                                <option value="">Selecciona un estado</option>
                                <option v-for="state in venezuelaStates" :key="state" :value="state">
                                    {{ state }}
                                </option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="city">Ciudad *</label>
                            <input type="text" id="city" v-model="form.city" placeholder="Ciudad" required>
                        </div>

                        <div class="form-group full-width">
                            <label for="contact">Medio de contacto *</label>

                            <select id="contact" v-model="form.contact" required>
                                <option value="">Selecciona tu medio de contacto</option>
                                <option
                                    v-for="item in userArray"
                                    :key="item.value"
                                    :label="item.label"
                                    :value="item.value"
        
                                    >
                                    {{ item.value }}
                                </option>
                            </select>
                        </div>

                        <div class="form-group full-width">
                            <label for="images">Imágenes del producto (Máx 10) *</label>
                            
                            <div v-if="previewImages.length > 0" class="image-previews">
                                <div class="preview-item" v-for="(src, idx) in previewImages" :key="idx">
                                    <img :src="src" alt="Preview" />
                                    <button type="button" class="remove-image-btn" @click.prevent="removeLocalImage(idx)">&times;</button>
                                </div>
                            </div>
                            
                            <input type="file" id="images" accept="image/*" multiple @change="handleFileUpload" :required="form.images.length === 0">
                        </div>

                        <!-- Document Upload -->
                        <div class="form-group full-width">
                            <label for="document-file">
                                <i class="fa-solid fa-file-arrow-up"></i>
                                Documento técnico (PDF o Word, opcional)
                            </label>
                            <div class="doc-upload-area">
                                <input
                                    type="file"
                                    id="document-file"
                                    accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                                    @change="handleDocUpload"
                                />
                                <div v-if="docFileName" class="doc-preview">
                                    <i class="fa-solid fa-file-pdf doc-icon" v-if="form.document?.type === 'application/pdf'"></i>
                                    <i class="fa-solid fa-file-word doc-icon" v-else></i>
                                    <span class="doc-name">{{ docFileName }}</span>
                                    <button type="button" class="remove-doc-btn" @click="form.document = null; docFileName = ''; $el.querySelector('#document-file').value = ''">&times;</button>
                                </div>
                            </div>
                        </div>

                        <div class="form-group full-width">
                            <label for="description">Descripción del producto *</label>
                            <textarea id="description" v-model="form.description" rows="4" required></textarea>
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