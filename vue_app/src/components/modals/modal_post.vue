<script setup>
import { computed, ref, watch } from 'vue'
import Swal from 'sweetalert2'


// Definición de Props
const props = defineProps({
  selectedHarvest: {
    type: Object,
    default: () => ({})
  },
  isModalOpen: {
    type: Boolean,
    default: false
  }
})

// Eventos
const emit = defineEmits(['close'])

const activeImage = ref('')

// Initialize active image when modal opens or selection changes
watch(
  () => props.selectedHarvest?.id,
  (newVal) => {
    if (newVal && props.selectedHarvest) {
      activeImage.value = props.selectedHarvest.image || '';
    }
  },
  { immediate: true }
)

const hasMultipleImages = computed(() => {
  return props.selectedHarvest?.media_gallery && props.selectedHarvest.media_gallery.length > 0;
})

function closeModal() {
  emit('close')
}

// Lógica de Precios
const totalWithTax = computed(() => {
  if (!props.selectedHarvest?.price) return '0.00'
  const price = parseFloat(props.selectedHarvest.price)
  return (price * 1.16).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
})

const formattedPrice = computed(() => {
  if (!props.selectedHarvest?.price) return '0.00'
  return parseFloat(props.selectedHarvest.price).toFixed(2)
})

const formattedQuantity = computed(() => {
   if (!props.selectedHarvest?.quantity) return '0'
   return Number(props.selectedHarvest.quantity).toLocaleString('es-ES')
})

// Helpers internos
function getCategoryName(c) {
  const cats = { maquina: 'Maquinaria', insumo: 'Insumos', herramienta: 'Herramientas' }
  return cats[c] || c || 'General'
}

function getLocationName(l) {
  const locs = { norte: 'Región Norte', centro: 'Región Centro', sur: 'Región Sur' }
  // Si existe en el mapa lo devuelve, si no, devuelve el texto original (útil para ciudades)
  return locs[l] || l || 'No especificado'
}

function contactProducer(contact, name) {
  Swal.fire({
    icon: 'info',
    title: `Contactar a ${name}`,
    html: `Puedes escribirle o llamarle a: <br><b>${contact}</b>`,
    confirmButtonText: 'Entendido'
  })
}

// Toast para notificaciones
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer)
    toast.addEventListener('mouseleave', Swal.resumeTimer)
  }
})

function handleAddToCart() {
    if (!props.selectedHarvest) return
    
    const added = addToCart(props.selectedHarvest)
    if (added) {
        Toast.fire({
            icon: 'success',
            title: 'Agregado al carrito'
        })
    } else {
        Toast.fire({
            icon: 'info',
            title: 'Ya está en el carrito'
        })
    }
}

// Logic de imagenes para el modal
import { getImageUrl, handleImageError } from '@/assets/js/imageHelper'

import { useCart } from '@/assets/js/useCart'
const { addToCart, isInCart } = useCart()
</script>

<template>
  <div id="harvestModal" class="modal" v-if="isModalOpen && selectedHarvest">
    <div class="modal-content">
      <div class="modal-header">
        <button class="close-button" @click="closeModal">
            cerrar
        </button>
      </div>
      <div class="modal-body-A">
        <div class="product-gallery">
          <div class="main-image-container">
            <img :src="getImageUrl(activeImage || selectedHarvest.image)" alt="Imagen del producto" @error="handleImageError" />
          </div>
          
          <div class="thumbnail-gallery" v-if="hasMultipleImages">
            <div 
              v-for="media in selectedHarvest.media_gallery" 
              :key="media.id" 
              class="thumbnail"
              :class="{ active: activeImage === media.image }"
              @click="activeImage = media.image"
            >
              <img :src="getImageUrl(media.image)" alt="Miniatura" @error="handleImageError" />
            </div>
          </div>
        </div>

        <div class="product-details">
          <div class="product-header">
            <h1 class="product-title">{{ selectedHarvest.name }}</h1>
            
            <div class="product-rating">
              <div class="stars" style="color: gold;">
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star"></i>
                <i class="fa-solid fa-star-half-stroke"></i>
              </div>
              <span class="rating-text">4.8 (127 reseñas)</span>
            </div>
            
            <div class="product-category">
              <span>Categoría: </span>
              <span class="category-link">{{ getCategoryName(selectedHarvest.category) }}</span>
            </div>
          </div>

          <div class="price-section">
            <div class="price-container">
              <span class="currency">$</span>
              <span class="price">{{ formattedPrice }}</span>
            </div>
            <div class="price-details">
              <div class="total-price">
                <span>Valor total con Impuestos: </span>
                <span class="total-amount">${{ totalWithTax}}</span>
              </div>
            </div>
          </div>

          <div class="product-info">
            <div class="info-section">
              <h3>Detalles del producto</h3>
              <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Tipo de Producto:</span>
                    <span class="info-value">{{ getLocationName(selectedHarvest.type_product) }}</span>
                </div>

                <div class="info-item">
                    <span class="info-label">Modelo:</span>
                    <span class="info-value">{{ getLocationName(selectedHarvest.model) }}</span>
                </div>
                          
                
                <div class="info-item">
                    <span class="info-label">País:</span>
                    <span class="info-value">{{ getLocationName(selectedHarvest.country) }}</span>
                </div>

                <div class="info-item">
                    <span class="info-label">Estado:</span>
                    <span class="info-value">{{ getLocationName(selectedHarvest.state) }}</span>
                </div>

                <div class="info-item">
                    <span class="info-label">Ciudad:</span>
                    <span class="info-value">{{ getLocationName(selectedHarvest.city) }}</span>
                </div>

                <div class="info-item">
                    <span class="info-label">Fabricante:</span>
                    {{selectedHarvest.manufacturer || 'Empresa Verificada' }}
                </div>

                <div class="info-item">
                    <span class="info-label">Cantidad:</span>
                    {{selectedHarvest.quantity || 'No disponible' }}
                </div>

                <div class="info-item">
                    <span class="info-label">Contacto:</span>
                    <span class="info-value">{{ selectedHarvest.contact }}</span>
                </div>

              </div>
            </div>

            <div class="description-section">
              <h3>Acerca de este producto</h3>
              <div class="description-content">
                {{ selectedHarvest.description || selectedHarvest.short_desc || 'Sin descripción detallada disponible.' }}
              </div>
            </div>

            <div class="features-section">
                <h3>Características destacadas</h3>
                  <ul class="features-list">
                      <li><i class="fa-solid fa-check-circle"></i> Garantía de motor extendida</li>
                      <li><i class="fa-solid fa-check-circle"></i> Documentación de importación completa</li>
                      <li><i class="fa-solid fa-check-circle"></i> Cabina con climatización premium</li>
                      <li><i class="fa-solid fa-check-circle"></i> Bajo kilometraje / horas de uso</li>
                  </ul>
              </div>




          </div>

          <div class="action-section">
            <button class="btn-primary-modal" @click="contactProducer(selectedHarvest.contact, selectedHarvest.name)">
               Contactar Propietario
            </button>
            <button 
                class="btn-secondary" 
                @click="handleAddToCart"
                :disabled="isInCart(selectedHarvest.id)"
                :style="isInCart(selectedHarvest.id) ? 'opacity: 0.6; cursor: not-allowed;' : ''"
            >
               {{ isInCart(selectedHarvest.id) ? 'En el carrito' : 'Agregar al carrito' }}
            </button>

            <!-- Document download button (only shown if document exists) -->
            <a
                v-if="selectedHarvest.document"
                :href="selectedHarvest.document"
                target="_blank"
                rel="noopener noreferrer"
                class="doc-download-btn"
            >
                <i class="fa-solid fa-file-arrow-down"></i>
                Ver / Descargar documento
            </a>
          </div>

          <div class="shipping-info">
            <div class="shipping-item">
              <i class="fa-solid fa-truck"></i>
              <div><strong>Entrega disponible:</strong> Coordina directamente con el Fabricante</div>
            </div>
            <div class="shipping-item">
              <i class="fa-solid fa-shield-halved"></i>
               <div><strong>Garantía de calidad:</strong> Productos farbicados con materiales de calidad</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: auto;
  display: flex;
  justify-content: center;
  align-items: end;
  overflow-y: auto;
}

.product-gallery {
  display: flex;
  flex-direction: row-reverse;
  gap: 10px;
}

.main-image-container {
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
  background-color: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: center;
}

.main-image-container img {
  width: 100%;
  height: auto;
  object-fit: contain;
}

.thumbnail-gallery {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 5px;
}

.thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.thumbnail.active {
  border-color: #4CAF50;
  opacity: 1;
}

.thumbnail:not(.active) {
  opacity: 0.6;
}

.thumbnail:hover {
  opacity: 1;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Document download button */
.doc-download-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    justify-content: center;
    padding: 11px 20px;
    border-radius: 6px;
    background-color: #f0f4ff;
    border: 1px solid #c7d5fc;
    color: #3665f3;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    transition: background-color 0.2s, border-color 0.2s;
    margin-top: 4px;
}
.doc-download-btn:hover {
    background-color: #e0e8ff;
    border-color: #3665f3;
}
</style>