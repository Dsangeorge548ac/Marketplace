<script setup>
import { ref } from 'vue'
import axios from '@/services/axiosInstance'
import Swal from 'sweetalert2'
import { optimizeImage } from '@/services/imageOptimizer';

const props = defineProps({
  openModal: Boolean
})

const emit = defineEmits(['close', 'created'])

const title = ref('')
const description = ref('')
const news_Url = ref('')
const imageFile = ref(null)
const isLoading = ref(false)

const isSubmitting = ref(false);
const isCompressing = ref(false); // Estado para la compresión

// 3. Manejo de Archivos con Compresión
const handleFileUpload = async (event) => {
    let file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
    }

    isCompressing.value = true; // Bloqueamos el botón

    try {
        file = await optimizeImage(file);
        imageFile.value = file;
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
    description.value = ''
    news_Url.value = ''
    imageFile.value = null
}

async function createNotice() {
    if (!title.value || !description.value || !news_Url.value || !imageFile.value) {
        Swal.fire('Error', 'Por favor completa título, descripción corta, URL e imagen', 'error')
        return
    }

    isLoading.value = true

    try {
        const formData = new FormData()
        formData.append('title', title.value)
        formData.append('description', description.value)
        formData.append('news_url', news_Url.value)
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
                    <label>URL de la noticia *</label>
                    <input type="url" v-model="news_Url" placeholder="https://sitio.com/noticia" required>
                </div>

                <div class="form-group full-width">
                    <label>Descripción corta *</label>
                    <textarea v-model="description" rows="4" placeholder="Resumen breve de la noticia" required></textarea>
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
