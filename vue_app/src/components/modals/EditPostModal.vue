<script setup>
import { reactive, ref, watch } from 'vue';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
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
    quantity: '',
    country: 'Venezuela',
    state: 'Bolivar',
    city: 'Ciudad Guayana',
    manufacturer: 'Fabrimine, C.A.',
    contact: 'correo@ejemplo.com',
    contact: 'correo@ejemplo.com',
    description: '',
    images: [], // New images to upload
    existingImages: [] // Array of { id, image, item } from backend
});

// To store local object URLs for preview of NEW images
const previewImages = ref([]);

const isSubmitting = ref(false);
const isCompressing = ref(false);

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
        form.price = newVal.price;
        form.quantity = newVal.quantity || '';
        form.country = newVal.country || 'Venezuela';
        form.state = newVal.state || '';
        form.city = newVal.city || '';
        form.manufacturer = newVal.manufacturer || 'Fabrimine, C.A.';
        form.contact = newVal.contact || 'correo@ejemplo.com';
        form.description = newVal.description || '';
        form.images = [];
        previewImages.value.forEach(url => URL.revokeObjectURL(url));
        previewImages.value = [];
        
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
    }
}, { immediate: true });

const closeModal = () => {
    emit('close');
};

const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    isCompressing.value = true;

    try {
        const options = {
            maxSizeMB: 1,           
            maxWidthOrHeight: 1920, 
            useWebWorker: true      
        };

        const maxFiles = Math.min(files.length, 10);
        
        for (let i = 0; i < maxFiles; i++) {
            const file = files[i];
            if (!file.type.startsWith('image/')) continue;
            
            const compressedFile = await imageCompression(file, options);
            form.images.push(compressedFile);
            previewImages.value.push(URL.createObjectURL(compressedFile));
        }

    } catch (error) {
        console.error("Error al comprimir:", error);
        alert("No se pudo procesar alguna de las imágenes.");
    } finally {
        isCompressing.value = false;
        event.target.value = '';
    }
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

    if (!form.name || !form.category || !form.price) {
        alert('Por favor completa los campos obligatorios.');
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
        formData.append('price', form.price);
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

        const response = await axios.put(
            `/api/publications_service/${form.id}`, 
            formData, 
            {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            }
        );

        if (response.data.success) {
            alert('¡Publicación actualizada exitosamente!');
            emit('updated');
            closeModal();
        } else {
            alert('Hubo un problema: ' + (response.data.message || 'Error desconocido'));
        }

    } catch (error) {
        console.error("Error al actualizar:", error);
        if (error.response) {
            alert(`Error del servidor: ${error.response.data.message}`);
        } else {
            alert('Error al procesar la solicitud.');
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
                            <label for="edit-price">Precio *</label>
                            <input type="number" id="edit-price" v-model="form.price" step="0.01" required>
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
                            <label for="edit-contact">Correo de contacto *</label>
                            <input type="email" id="edit-contact" v-model="form.contact" readonly>
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
.preview-item.new {
    border-color: #4CAF50;
    box-shadow: 0 0 5px rgba(76, 175, 80, 0.5);
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
</style>
