<script setup>
import { computed, ref } from 'vue';
const imageError = ref(false);

const props = defineProps({
    item: { type: Object, default: () => ({}) },
    title: { type: String, default: 'Product Name' },
    category: { type: String, default: 'Category' },
    image: { type: String, default: '' },
    quantity: { type: [String, Number], default: '0' },
    sub_category: { type: String, default: 'Subcategory' },
    price: { type: [String, Number], default: '0.00' },
    tags: { type: Array, default: () => [] },
    rating: { type: [Number, String], default: 4.8 },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    city: { type: String, default: '' }
});

const emit = defineEmits(['click']);

const numericPrice = computed(() => {
    const parsed = Number(props.price);
    return Number.isFinite(parsed) ? parsed : null;
});

const formattedPrice = computed(() => {
    if (numericPrice.value === null) return 'Precio por consultar';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numericPrice.value);
});

// Precio promedio simulado (+16%)
const formattedAvgPrice = computed(() => {
    if (numericPrice.value === null) return 'Consultar';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(numericPrice.value * 1.16);
});

const stockNum = computed(() => Number(props.quantity));
</script>

<template>
    <div class="pc-card" @click="emit('click')">

        <!-- Imagen -->
        <div class="pc-img-area">
            <!-- Badge categoría -->
            <span class="pc-category-badge">
                <span class="pc-category-dot"></span>
                {{ category }}
            </span>
            
            <img
                v-if="image && !imageError"
                :src="image"
                :alt="title"
                class="pc-img"
                @error="imageError = true"
            />
        </div>

        <!-- Info -->
        <div class="pc-body">
            <!-- Título -->
            <h3 class="pc-title">{{ title }}</h3>
            
            <!-- Ubicación -->
            <div class="pc-location">
                <i class="bx bx-map"></i>
                <span>{{ country + ', Edo. ' + state + ', ' + city || 'Ubicación no disponible' }}</span>
            </div>

            <!-- Divider -->
            <div class="pc-divider"></div>

            <!-- Precios -->
            <div class="pc-prices-row">
                <div class="pc-price-col">
                    <span class="pc-price-label">Neto</span>
                    <span class="pc-price-main">{{ formattedPrice }}</span>
                </div>
                <div class="pc-price-col right-align">
                    <span class="pc-price-label">Con IVA</span>
                    <span class="pc-price-avg">{{ formattedAvgPrice }}</span>
                </div>
            </div>
        </div>

        <slot name="actions"></slot>
    </div>
</template>