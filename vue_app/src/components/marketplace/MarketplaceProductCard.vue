<script setup>
import '@/assets/css/modern-product-card.css';

defineProps({
    title: {
        type: String,
        default: 'Producto sin nombre'
    },
    image: {
        type: String,
        default: 'https://via.placeholder.com/300'
    },
    price: { // "Precio"
        type: String,
        default: '0.00'
    },
    evtValue: { // "Valor En EVT"
        type: String,
        default: '0.00 EVT'
    },
    quantity: { // "Cantidad"
        type: String,
        default: '1 Und'
    },
    location: { // "Ubicación"
        type: String,
        default: 'Chile'
    },
    manufacturer: { // "Fabricante"
        type: String,
        default: 'N/A'
    },
    category: { // "Categoría"
        type: String,
        default: 'General'
    },
    showDefaultButton: { // Control visibility of default button
        type: Boolean,
        default: true
    }
});

const emit = defineEmits(['click', 'image-error']);

function handleImageError(event) {
    event.target.src = 'https://via.placeholder.com/300x240?text=Sin+Imagen';
    emit('image-error', event);
}
</script>

<template>
    <div class="modern-card">
        <!-- Image Section (Full Bleed) -->
        <div class="mc-image-container">
            <img :src="image" :alt="title" class="mc-img" @error="handleImageError" />
        </div>

        <!-- Content Section -->
        <div class="mc-content">
            <h3 class="mc-title">{{ title }}</h3>

            <div class="mc-details-grid">
                <!-- Pair 1 -->
                <div class="mc-detail-group">
                    <span class="mc-label">Precio</span>
                    <span class="mc-value price">${{ price }} <span style="font-size:0.75em; font-weight:400; color:#6b7280;">USD</span></span>
                </div>
                <div class="mc-detail-group">
                    <span class="mc-label">Valor En EVT</span>
                    <span class="mc-value evt">{{ evtValue }}</span>
                </div>

                <!-- Pair 2 -->
                <div class="mc-detail-group">
                    <span class="mc-label">Cantidad</span>
                    <span class="mc-value">{{ quantity }}</span>
                </div>
                <div class="mc-detail-group">
                    <span class="mc-label">Ubicación</span>
                    <span class="mc-value">{{ location }}</span>
                </div>

                <!-- Pair 3 -->
                <div class="mc-detail-group">
                    <span class="mc-label">Fabricante</span>
                    <span class="mc-value">{{ manufacturer }}</span>
                </div>
                <div class="mc-detail-group">
                    <span class="mc-label">Categoría</span>
                    <span class="mc-value">{{ category }}</span>
                </div>
            </div>

            <!-- Actions: Use slot for custom actions, or default button -->
            <div class="mc-actions">
                <slot name="actions">
                    <button v-if="showDefaultButton" class="mc-btn" @click.stop="emit('click')">
                        MÁS INFORMACIÓN
                    </button>
                </slot>
            </div>
        </div>
    </div>
</template>
