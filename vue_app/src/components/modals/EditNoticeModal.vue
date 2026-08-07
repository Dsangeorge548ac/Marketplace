<script setup>
import { ref, watch } from 'vue'
import axios from '@/services/axiosInstance'
import Swal from 'sweetalert2'
import { optimizeImage } from '@/services/imageOptimizer';

const props = defineProps({
  openModal: Boolean,
  notice: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'updated'])

const title = ref('')
const description = ref('')
const news_Url = ref('')
const imageFile = ref(null)
const existingImage = ref('')
const isLoading = ref(false)
const isCompressing = ref(false)

watch(() => props.notice, (newNotice) => {
  if (newNotice) {
    title.value = newNotice.title || ''
    description.value = newNotice.description || ''
    news_Url.value = newNotice.news_url || ''
    existingImage.value = newNotice.image || ''
    imageFile.value = null
  } else {
    resetForm()
  }
}, { immediate: true })

const handleFileUpload = async (event) => {
  let file = event.target.files[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    Swal.fire('Error', 'Por favor selecciona un archivo de imagen válido', 'error')
    return
  }

  isCompressing.value = true

  try {
    file = await optimizeImage(file)
    imageFile.value = file
  } catch (error) {
    console.error('Error al comprimir:', error)
    Swal.fire('Error', 'No se pudo procesar la imagen.', 'error')
  } finally {
    isCompressing.value = false
  }
}

function closeModal() {
  emit('close')
  resetForm()
}

function resetForm() {
  title.value = ''
  description.value = ''
  news_Url.value = ''
  imageFile.value = null
  existingImage.value = ''
}

async function updateNotice() {
  if (!props.notice?.id) {
    Swal.fire('Error', 'No se pudo identificar la noticia a editar', 'error')
    return
  }

  if (!title.value || !description.value || !news_Url.value) {
    Swal.fire('Error', 'Por favor completa título, descripción corta y URL', 'error')
    return
  }

  isLoading.value = true

  try {
    const formData = new FormData()
    formData.append('title', title.value)
    formData.append('description', description.value)
    formData.append('news_url', news_Url.value)

    if (imageFile.value) {
      formData.append('image', imageFile.value)
    }

    if (existingImage.value) {
      formData.append('existing_image', existingImage.value)
    }

    const { data } = await axios.put(`/api/publications_service/notices/${props.notice.id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      withCredentials: true
    })

    if (data.success) {
      Swal.fire('Éxito', 'Noticia actualizada correctamente', 'success')
      emit('updated')
      closeModal()
    } else {
      Swal.fire('Error', data.message || 'Error al actualizar la noticia', 'error')
    }
  } catch (error) {
    console.error('Error updating notice:', error)
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
        <h2>Editar Noticia</h2>
        <button class="close-button-2" @click="closeModal">&times;</button>
      </div>

      <div class="modal-content-2">
        <form @submit.prevent="updateNotice" class="harvest-form">
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
              <label>Imagen</label>
              <input type="file" @change="handleFileUpload" accept="image/*">
              <small v-if="existingImage" class="word-counter">Si no eliges una nueva imagen, se conservará la actual.</small>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-button" @click="closeModal">Cancelar</button>
            <button type="submit" class="submit-button" :disabled="isLoading || isCompressing">
              {{ isLoading ? 'Guardando...' : 'Guardar cambios' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
