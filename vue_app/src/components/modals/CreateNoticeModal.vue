<script setup>
import { ref } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import imageCompression from 'browser-image-compression'; 

const props = defineProps({
  openModal: Boolean
})

const emit = defineEmits(['close', 'created'])

const title = ref('')
const subtitle = ref('')
const description = ref('')
const imageFile = ref(null)
const isLoading = ref(false)

const isSubmitting = ref(false);
const isCompressing = ref(false); // Estado para la compresión

// 3. Manejo de Archivos con Compresión
const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
    }

    isCompressing.value = true; // Bloqueamos el botón

    try {
        const options = {
            maxSizeMB: 1,           
            maxWidthOrHeight: 1920, 
            useWebWorker: true      
        };

        console.log(`Tamaño original: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

        const compressedFile = await imageCompression(file, options);
        
        console.log(`Tamaño comprimido: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

        imageFile.value = compressedFile;

    } catch (error) {
        console.error("Error al comprimir:", error);
        alert("No se pudo procesar la imagen.");
    } finally {
        isCompressing.value = false; // Desbloqueamos el botón
    }
};

function closeModal() {
  emit('close')
  resetForm()
}

function resetForm() {
    title.value = ''
    subtitle.value = ''
    description.value = ''
    imageFile.value = null
}

async function createNotice() {
    if (!title.value || !description.value || !imageFile.value) {
        Swal.fire('Error', 'Por favor completa título, descripción e imagen', 'error')
        return
    }

    isLoading.value = true

    try {
        const formData = new FormData()
        formData.append('title', title.value)
        formData.append('subtitle', subtitle.value)
        formData.append('description', description.value)
        formData.append('image', imageFile.value)

        const { data } = await axios.post('/api/publications_service/notices', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            withCredentials: true
        })

        if (data.success) {
            Swal.fire('Éxito', 'Noticia publicada correctamente', 'success')
            emit('created')
            closeModal()
        } else {
            Swal.fire('Error', data.message || 'Error al crear noticia', 'error')
        }
    } catch (error) {
        console.error("Error creating notice:", error)
        Swal.fire('Error', 'Error de conexión', 'error')
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
  <div v-if="openModal" class="modal-overlay active" @click.self="closeModal">
    <div class="modal-container-2">
      
      <div class="modal-header-2">
        <h2>Publicar Noticia</h2>
        <button class="close-button-2" @click="closeModal">&times;</button>
      </div>

      <div class="modal-content-2">
        <form @submit.prevent="createNotice" class="harvest-form">
            <div class="form-grid">
                
                <div class="form-group full-width">
                    <label>Título *</label>
                    <input type="text" v-model="title" placeholder="Título de la noticia" required>
                </div>

                <div class="form-group full-width">
                    <label>Subtítulo</label>
                    <input type="text" v-model="subtitle" placeholder="Subtítulo opcional">
                </div>

                <div class="form-group full-width">
                    <label>Descripción *</label>
                    <textarea v-model="description" rows="6" placeholder="Contenido de la noticia" required></textarea>
                    <small class="word-counter">{{ description.length }} caracteres</small>
                </div>

                <div class="form-group full-width">
                    <label>Imagen *</label>
                    <input type="file" @change="handleFileUpload" accept="image/*" required>
                </div>

            </div>

            <div class="form-actions">
                <button type="button" class="cancel-button" @click="closeModal">Cancelar</button>
                <button type="submit" class="submit-button" :disabled="isLoading">
                    {{ isLoading ? 'Publicando...' : 'Publicar Noticia' }}
                </button>
            </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Scoped styles removed because we are using global modal.css classes */
/* Ensure modal.css is imported in the parent component or globally */
</style>
