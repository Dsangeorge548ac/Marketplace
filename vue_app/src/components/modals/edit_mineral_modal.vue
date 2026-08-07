<script setup>
import { reactive, ref, watch } from 'vue';
import axios from '@/services/axiosInstance';
import Swal from 'sweetalert2';
import { optimizeMultipleImages } from '@/services/imageOptimizer';
import { mineralNames, mineralUnits } from '@/assets/js/categories';

const props = defineProps({
    openModal: { type: Boolean, required: true },
    publication: { type: Object, default: null }
});

const emit = defineEmits(['close', 'updated']);

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
    id:            '',
    mineral_name:  '',
    sub_category:  '',
    purity:        '',
    unit:          '',
    price:         '',
    price_on_request: false,
    quantity:      '',
    country:       'Venezuela',
    state:         '',
    city:          '',
    manufacturer:  '',
    contact:       '',
    description:   '',
    images:        [],
    existingImages:[]
});

const previewImages  = ref([]);
const isSubmitting   = ref(false);
const isCompressing  = ref(false);

// Pre-fill form when publication prop changes
watch(() => props.publication, (newVal) => {
    if (!newVal) return;
    form.id           = newVal.id;
    form.mineral_name = newVal.mineral_name || newVal.name || '';
    form.sub_category = newVal.sub_category || '';
    form.purity       = newVal.purity || '';
    form.unit         = newVal.unit || '';
    form.price        = newVal.price ?? '';
    form.price_on_request = newVal.price === null || newVal.price === '';
    form.quantity     = newVal.quantity || '';
    form.country      = newVal.country || 'Venezuela';
    form.state        = newVal.state || '';
    form.city         = newVal.city || '';
    form.manufacturer = newVal.manufacturer || '';
    form.contact      = newVal.contact || '';
    form.description  = newVal.description || '';
    form.images       = [];
    previewImages.value.forEach(url => URL.revokeObjectURL(url));
    previewImages.value = [];

    if (newVal.media_gallery && Array.isArray(newVal.media_gallery)) {
        form.existingImages = [...newVal.media_gallery];
    } else if (newVal.image) {
        form.existingImages = [{ id: 'main', image: newVal.image }];
    } else {
        form.existingImages = [];
    }
}, { immediate: true });

const closeModal = () => emit('close');

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
    } catch (err) {
        console.error('Error al comprimir imagen:', err);
        Swal.fire({ title: 'Error', text: 'No se pudo procesar alguna de las imágenes.', icon: 'error', confirmButtonColor: '#059669' });
    } finally {
        isCompressing.value = false;
        event.target.value = '';
    }
};

const removeNewImage      = (i) => { form.images.splice(i,1); URL.revokeObjectURL(previewImages.value[i]); previewImages.value.splice(i,1); };
const removeExistingImage = (i) => { form.existingImages.splice(i,1); };

const submitUpdate = async () => {
    if (isCompressing.value) return;
    const hasValidPrice = form.price_on_request || form.price !== '';

    if (!form.mineral_name || !form.sub_category || !form.unit || !hasValidPrice) {
        Swal.fire({ title: 'Atención', text: 'Por favor completa los campos obligatorios.', icon: 'warning', confirmButtonColor: '#059669' });
        return;
    }

    isSubmitting.value = true;
    try {
        const fd = new FormData();
        fd.append('id',           form.id);
        fd.append('mineral_name', form.mineral_name);
        fd.append('name',         `${form.mineral_name}`);
        fd.append('sub_category', form.sub_category);
        fd.append('purity',       form.purity);
        fd.append('unit',         form.unit);
        fd.append('price',        form.price_on_request ? '' : form.price);
        fd.append('price_on_request', String(form.price_on_request));
        fd.append('quantity',     form.quantity);
        fd.append('country',      form.country);
        fd.append('state',        form.state);
        fd.append('city',         form.city);
        fd.append('manufacturer', form.manufacturer);
        fd.append('contact',      form.contact);
        fd.append('description',  form.description);
        fd.append('keptImages',   JSON.stringify(form.existingImages.map(img => img.image)));
        form.images.forEach((img, idx) => fd.append('images', img, img.name || `mineral_edit_${idx}.jpg`));

        const { data } = await axios.put(
            `/api/publications_service/minerals/${form.id}`,
            fd,
            { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } }
        );

        if (data.success) {
            Swal.fire({ title: '¡Éxito!', text: '¡Publicación de mineral actualizada exitosamente!', icon: 'success', confirmButtonColor: '#059669' });
            emit('updated');
            closeModal();
        } else {
            Swal.fire({ title: 'Error', text: 'Hubo un problema: ' + (data.message || 'Error desconocido'), icon: 'error', confirmButtonColor: '#059669' });
        }
    } catch (err) {
        console.error('Error al actualizar mineral:', err);
        Swal.fire({ title: 'Error', text: err.response ? `Error del servidor: ${err.response.data?.message}` : 'Error al procesar la solicitud.', icon: 'error', confirmButtonColor: '#059669' });
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <div class="modal-overlay" v-if="openModal" @click="closeModal">
        <div class="modal-container-2" @click.stop>

            <div class="modal-header-2">
                <h2>Editar Mineral</h2>
                <button class="close-button-2" @click="closeModal">&times;</button>
            </div>

            <div class="modal-content-2">
                <form @submit.prevent="submitUpdate" class="harvest-form" enctype="multipart/form-data">
                    <div class="form-grid">

                        <!-- Mineral -->
                        <div class="form-group">
                            <label for="em-mineral-name">Mineral *</label>
                            <select id="em-mineral-name" v-model="form.mineral_name" required>
                                <option value="">Seleccionar mineral</option>
                                <option v-for="m in mineralNames" :key="m" :value="m">{{ m }}</option>
                            </select>
                        </div>

                        <!-- Subcategoría -->
                        <div class="form-group">
                            <label for="em-sub-category">Subcategoría *</label>
                            <select id="em-sub-category" v-model="form.sub_category" required>
                                <option value="">Selecciona una subcategoría</option>
                                <option v-for="sub in mineralSubCategories" :key="sub" :value="sub">{{ sub }}</option>
                            </select>
                        </div>

                        <!-- Pureza -->
                        <div class="form-group">
                            <label for="em-purity">Pureza / Calidad (opcional)</label>
                            <input type="text" id="em-purity" v-model="form.purity" placeholder="Ej: 22K, 99.9%, VS1">
                        </div>

                        <!-- Unidad -->
                        <div class="form-group">
                            <label for="em-unit">Unidad de medida *</label>
                            <select id="em-unit" v-model="form.unit" required>
                                <option value="">Selecciona la unidad</option>
                                <option v-for="u in mineralUnits" :key="u" :value="u">{{ u }}</option>
                            </select>
                        </div>

                        <!-- Cantidad -->
                        <div class="form-group">
                            <label for="em-quantity">Cantidad *</label>
                            <input type="number" id="em-quantity" v-model="form.quantity" min="0" step="0.001" required>
                        </div>

                        <!-- Precio -->
                        <div class="form-group">
                            <label for="em-price">Precio por unidad (USD) *</label>
                            <input type="number" id="em-price" v-model="form.price" step="0.01" min="0" :required="!form.price_on_request" :disabled="form.price_on_request">
                            <label style="margin-top: 8px; display: flex; align-items: center; gap: 8px; font-size: 0.9rem;">
                                <input type="checkbox" v-model="form.price_on_request">
                                Precio por consultar
                            </label>
                        </div>

                        <!-- Vendedor -->
                        <div class="form-group">
                            <label for="em-manufacturer">Vendedor / Empresa *</label>
                            <input type="text" id="em-manufacturer" v-model="form.manufacturer" placeholder="Nombre del vendedor o empresa" required>
                        </div>

                        <!-- País -->
                        <div class="form-group">
                            <label for="em-country">País *</label>
                            <input type="text" id="em-country" v-model="form.country" readonly>
                        </div>

                        <!-- Estado -->
                        <div class="form-group">
                            <label for="em-state">Estado *</label>
                            <select id="em-state" v-model="form.state" required>
                                <option value="">Selecciona un estado</option>
                                <option v-for="s in venezuelaStates" :key="s" :value="s">{{ s }}</option>
                            </select>
                        </div>

                        <!-- Ciudad -->
                        <div class="form-group">
                            <label for="em-city">Ciudad *</label>
                            <input type="text" id="em-city" v-model="form.city" required>
                        </div>

                        <!-- Contacto -->
                        <div class="form-group full-width">
                            <label for="em-contact">Correo de contacto *</label>
                            <input type="email" id="em-contact" v-model="form.contact" readonly>
                        </div>

                        <!-- Imágenes -->
                        <div class="form-group full-width">
                            <label for="em-images">Imágenes del mineral</label>

                            <div class="image-previews" v-if="form.existingImages.length > 0 || previewImages.length > 0">
                                <div class="preview-item existing" v-for="(img, idx) in form.existingImages" :key="'ex-'+idx">
                                    <img :src="img.image && img.image.startsWith('blob:') ? img.image : `/api${img.image}`" alt="Existente">
                                    <button type="button" class="remove-image-btn" @click.prevent="removeExistingImage(idx)">&times;</button>
                                </div>
                                <div class="preview-item new" v-for="(src, idx) in previewImages" :key="'new-'+idx">
                                    <img :src="src" alt="Nueva">
                                    <button type="button" class="remove-image-btn" @click.prevent="removeNewImage(idx)">&times;</button>
                                </div>
                            </div>

                            <p style="font-size: 0.8rem; color: #666; margin-bottom: 5px;">
                                Sube nuevas imágenes para añadirlas, o elimina las actuales con la "X"
                            </p>
                            <input type="file" id="em-images" accept="image/*" multiple @change="handleFileUpload">
                        </div>

                        <!-- Descripción -->
                        <div class="form-group full-width">
                            <label for="em-description">Descripción del mineral *</label>
                            <textarea id="em-description" v-model="form.description" rows="4" required></textarea>
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

<style scoped src="@/assets/css/components/edit-mineral-modal.css"></style>
