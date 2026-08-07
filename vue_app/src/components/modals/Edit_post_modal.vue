<script setup>
import { reactive, ref, watch } from 'vue';
import axios from '@/services/axiosInstance';
import Swal from 'sweetalert2';
import { checkSession } from '@/services/authService';
import { optimizeMultipleImages } from '@/services/imageOptimizer';
import { miningCategories, categoryKeys } from '@/assets/js/categories';

const props = defineProps({
  openModal: {
    type: Boolean,
    required: true
  },
  publication: {
      type: Object,
      default: null
  }
});

const emit = defineEmits(['close', 'updated']);

// Datos del Formulario
const venezuelaStates = [
    'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar', 'Carabobo', 'Cojedes', 
    'Delta Amacuro', 'Dependencias Federales', 'Distrito Capital', 'Falcón', 'Guárico', 'Lara', 
    'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira', 
    'Trujillo', 'La Guaira', 'Yaracuy', 'Zulia'
];

const form = reactive({
    id: '',
    name: '',
    category: '',
    sub_category: '',
    type_product: '', 
    model: '',        
    price: '',
    price_on_request: false,
    quantity: '',
    country: 'Venezuela',
    state: 'Bolivar',
    city: 'Ciudad Guayana',
    manufacturer: 'Fabrimine, C.A.',
    contact: 'correo@ejemplo.com',
    description: '',
    images: [], // New images to upload
    existingImages: [], // Array of { id, image, item } from backend
    document: null,       // New document file to upload
    existingDocument: '', // Current document URL from backend
});

// To store local object URLs for preview of NEW images
const previewImages = ref([]);

const docFileName = ref('');

const isSubmitting = ref(false);
const isCompressing = ref(false);
const userArray = ref([]);

const buildContactOptions = (user, currentContact = '') => {
    const options = [];

    if (currentContact) {
        options.push({ label: 'Contacto actual', value: currentContact });
    }

    if (user?.email) {
        options.push({ label: 'Correo electronico', value: user.email });
    }

    if (user?.phone) {
        options.push({ label: 'Telefono', value: user.phone });
    }

    const unique = [];
    const seen = new Set();
    for (const option of options) {
        const normalized = String(option.value || '').trim();
        if (!normalized || seen.has(normalized)) continue;
        seen.add(normalized);
        unique.push({ ...option, value: normalized });
    }

    return unique;
};

const resetTransientState = () => {
    form.images = [];
    previewImages.value.forEach(url => URL.revokeObjectURL(url));
    previewImages.value = [];
};

// Cargar datos cuando cambia la publicación seleccionada
watch(() => props.publication, (newVal) => {
    if (newVal) {
        form.id = newVal.id;
        form.name = newVal.name;
        // Asumiendo que category viene en el objeto principal o hay que buscarlo
        // En publications-user.php el objeto tiene: category, type_product, model, etc.
        form.category = newVal.category || '';
        form.sub_category = newVal.sub_category || '';
        form.type_product = newVal.type_product || '';
        form.model = newVal.model || '';
        form.price = newVal.price ?? '';
        form.price_on_request = newVal.price === null || newVal.price === '';
        form.quantity = newVal.quantity || '';
        form.country = newVal.country || 'Venezuela';
        form.state = newVal.state || '';
        form.city = newVal.city || '';
        form.manufacturer = newVal.manufacturer || 'Fabrimine, C.A.';
        form.contact = newVal.contact || 'correo@ejemplo.com';
        form.description = newVal.description || '';
        form.document = null;          // Reset document for new upload
        docFileName.value = '';          // Reset doc file name
        form.existingDocument = newVal.document || ''; // Load existing document URL
        resetTransientState();
        
        // Populating existing images from backend
        // publication.image is the main image, but publication.media_gallery has all
        if (newVal.media_gallery && Array.isArray(newVal.media_gallery)) {
            // Usually MySQL JSON_ARRAYAGG returns an array of objects
            form.existingImages = [...newVal.media_gallery];
        } else if (newVal.image) {
            // Fallback if media_gallery is empty or backend hasn't been updated yet for this pub
            // But we treat it as an existing image
            form.existingImages = [{ id: 'main', image: newVal.image }];
        } else {
             form.existingImages = [];
        }

        userArray.value = buildContactOptions(null, form.contact);
    }
}, { immediate: true });

const closeModal = () => {
    emit('close');
};

watch(() => form.price_on_request, (enabled) => {
    if (enabled) {
        form.price = '';
    }
});

watch(() => props.openModal, async (newVal) => {
    if (newVal) {
        resetTransientState();
        const user = await checkSession();

        userArray.value = [
            { value: user?.email, label: user.email},
            { value: user?.phone, label: user.phone }
        ];

        if (user && !form.contact) {
            form.contact = user.email || user.phone || '';
        }

        if (user) {
            form.manufacturer = user.business_name || user.name;
        }
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
        console.error("Error al comprimir:", error);
        Swal.fire({ title: 'Error', text: 'No se pudo procesar alguna de las imágenes.', icon: 'error', confirmButtonColor: '#059669' });
    } finally {
        isCompressing.value = false;
        event.target.value = '';
    }
};

const docInputRef = ref(null);

const handleDocUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    form.document = file;
    docFileName.value = file.name;
};

const removeNewDoc = () => {
    form.document = null;
    docFileName.value = '';
    if (docInputRef.value) docInputRef.value.value = '';
};

const removeExistingDoc = () => {
    form.existingDocument = '';
};

const removeNewImage = (index) => {
    form.images.splice(index, 1);
    URL.revokeObjectURL(previewImages.value[index]);
    previewImages.value.splice(index, 1);
};

const removeExistingImage = (index) => {
    // Just remove it from the array. When submitting, we send what's left.
    form.existingImages.splice(index, 1);
};

const submitUpdate = async () => {
    if (isCompressing.value) return; 

    const hasValidPrice = form.price_on_request || form.price !== '';

    if (!form.name || !form.category || !hasValidPrice) {
        Swal.fire({ title: 'Atención', text: 'Por favor completa los campos obligatorios.', icon: 'warning', confirmButtonColor: '#059669' });
        return;
    }

    isSubmitting.value = true;

    try {
        const formData = new FormData();
        
        formData.append('id', form.id);
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
        
        // Add existing images to keep
        const keptImages = form.existingImages.map(img => img.image);
        formData.append('keptImages', JSON.stringify(keptImages));
        
        // Add new images
        form.images.forEach((img, index) => {
             const fileName = img.name || `update_${index}.jpg`;
             formData.append('images', img, fileName);
        });

        if (form.document) {
            formData.append('document', form.document, form.document.name);
        }

        const response = await axios.put(
            `/api/publications_service/${form.id}`, 
            formData, 
            {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            }
        );

        if (response.data.success) {
            Swal.fire({ title: '¡Éxito!', text: '¡Publicación actualizada exitosamente!', icon: 'success', confirmButtonColor: '#059669' });
            emit('updated');
            closeModal();
        } else {
            Swal.fire({ title: 'Error', text: 'Hubo un problema: ' + (response.data.message || 'Error desconocido'), icon: 'error', confirmButtonColor: '#059669' });
        }

    } catch (error) {
        console.error("Error al actualizar:", error);
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
                <h2>Editar producto</h2>
                <button class="close-button-2" @click="closeModal">&times;</button>
            </div>

            <div class="modal-content-2">
                <form @submit.prevent="submitUpdate" class="harvest-form" enctype="multipart/form-data">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="edit-name">Nombre del producto *</label>
                            <input type="text" id="edit-name" v-model="form.name" required>
                        </div>

                        <div class="form-group">
                            <label for="edit-quantity">Cantidad *</label>
                            <input type="text" id="edit-quantity" v-model="form.quantity" required>
                        </div>

                        <div class="form-group">
                            <label for="edit-category">Categoría *</label>
                            <select id="edit-category" v-model="form.category" @change="form.sub_category = ''" required>
                                <option value="">Selecciona una categoría</option>
                                <option v-for="cat in categoryKeys" :key="cat" :value="cat">
                                    {{ cat }}
                                </option>
                            </select>
                        </div>

                        <div class="form-group" v-if="form.category">
                            <label for="edit-sub_category">Subcategoría *</label>
                            <select id="edit-sub_category" v-model="form.sub_category" required>
                                <option value="">Selecciona una subcategoría</option>
                                <option v-for="sub in miningCategories[form.category]" :key="sub" :value="sub">
                                    {{ sub }}
                                </option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="edit-type_product">Tipo de Producto</label>
                            <input type="text" id="edit-type_product" v-model="form.type_product" placeholder="Ej: Excavadora" required>
                        </div>

                        <div class="form-group">
                            <label for="edit-model">Modelo</label>
                            <input type="text" id="edit-model" v-model="form.model" placeholder="Modelo / Año" required>
                        </div>
   
                                                
                        <div class="form-group">
                            <label for="price">Precio *</label>
                            <input type="number" id="edit-price" v-model="form.price" step="0.01" min="0" :required="!form.price_on_request" :disabled="form.price_on_request">

                            <div style="margin-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; justify-content: space-between;">
                                <label for="consultar">
                                precio a consultar
                                </label>
                                <input type="checkbox" id="consultar" style="width: 14px; height: 14px; align-items: center; display: flex; margin: auto;" v-model="form.price_on_request">
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="edit-manufacturer">Fabricante *</label>
                            <input type="text" id="edit-manufacturer" v-model="form.manufacturer" readonly>
                        </div>

                        <div class="form-group">
                            <label for="edit-country">País *</label>
                            <input type="text" id="edit-country" v-model="form.country" readonly>
                        </div>
                        <div class="form-group">
                            <label for="edit-state">Estado *</label>
                            <select id="edit-state" v-model="form.state" required>
                                <option value="">Selecciona un estado</option>
                                <option v-for="state in venezuelaStates" :key="state" :value="state">
                                    {{ state }}
                                </option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="edit-city">Ciudad *</label>
                            <input type="text" id="edit-city" v-model="form.city" required>
                        </div>

                        <div class="form-group full-width">
                            <label for="edit-contact">Medio de contacto *</label>
                            <select id="edit-contact" v-model="form.contact" required>
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
                            <label for="edit-images">Imágenes del producto</label>
                            
                            <div class="image-previews" v-if="form.existingImages.length > 0 || previewImages.length > 0">
                                <!-- Existing Images from DB -->
                                <div class="preview-item existing" v-for="(img, idx) in form.existingImages" :key="'ex-'+idx">
                                    <img :src="img.image.startsWith('blob:') ? img.image : `/api${img.image}`" alt="Existente">
                                    <button type="button" class="remove-image-btn" @click.prevent="removeExistingImage(idx)">&times;</button>
                                </div>
                                
                                <!-- New localized specific preview images -->
                                <div class="preview-item new" v-for="(src, idx) in previewImages" :key="'new-'+idx">
                                    <img :src="src" alt="Nueva">
                                    <button type="button" class="remove-image-btn" @click.prevent="removeNewImage(idx)">&times;</button>
                                </div>
                            </div>

                            <p style="font-size: 0.8rem; color: #666; margin-bottom: 5px;">Sube nuevas imágenes para añadirlas, o elimina las actuales con la "X"</p>
                            <input type="file" id="edit-images" accept="image/*" multiple @change="handleFileUpload">
                        </div>

                        <div class="form-group full-width">
                            <label>
                                <i class="fa-solid fa-file-arrow-up"></i>
                                Documento técnico (PDF o Word, opcional)
                            </label>

                            <!-- Documento existente en la publicación -->
                            <div v-if="form.existingDocument && !form.document" class="doc-preview existing-doc">
                                <i class="fa-solid fa-file-pdf doc-icon"></i>
                                <span class="doc-name">Documento actual</span>
                                <a :href="`/api${form.existingDocument}`" target="_blank" class="doc-view-btn" title="Ver documento">
                                    <i class="fa-solid fa-eye"></i>
                                </a>
                                <button type="button" class="remove-doc-btn" @click="removeExistingDoc" title="Eliminar documento">&times;</button>
                            </div>

                            <!-- Nuevo documento seleccionado (reemplazará al existente) -->
                            <div v-if="docFileName" class="doc-preview new-doc">
                                <i class="fa-solid fa-file-pdf doc-icon" v-if="form.document?.type === 'application/pdf'"></i>
                                <i class="fa-solid fa-file-word doc-icon" v-else></i>
                                <span class="doc-name">{{ docFileName }}</span>
                                <span v-if="form.existingDocument" class="doc-replace-badge">Reemplazará al actual</span>
                                <button type="button" class="remove-doc-btn" @click="removeNewDoc">&times;</button>
                            </div>

                            <div class="doc-upload-area">
                                <input
                                    ref="docInputRef"
                                    type="file"
                                    id="document-file"
                                    accept=".pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
                                    @change="handleDocUpload"
                                />
                                <small style="font-size: 0.78rem; color: #888; margin-top: 4px; display: block;">
                                    {{ form.existingDocument ? 'Sube un nuevo archivo para reemplazar el documento actual.' : 'Sube un documento técnico opcional.' }}
                                </small>
                            </div>
                        </div>


                        <div class="form-group full-width">
                            <label for="edit-description">Descripción del producto *</label>
                            <textarea id="edit-description" v-model="form.description" rows="4" required></textarea>
                            <small class="word-counter">{{ form.description.length }} caracteres</small>
                        </div>

                    </div>

                    <div class="form-actions">
                        <button type="button" class="cancel-button" @click="closeModal">Cancelar</button>
                        
                        <button type="submit" class="submit-button" :disabled="isSubmitting || isCompressing">
                            <span v-if="isCompressing">Procesando imagen...</span>
                            <span v-else-if="isSubmitting">Guardando...</span>
                            <span v-else>Guardar cambios</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped src="@/assets/css/components/edit-post-modal.css">

</style>
