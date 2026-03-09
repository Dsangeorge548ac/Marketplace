<script setup>
import { computed, ref } from 'vue';
const imageError = ref(false);

const props = defineProps({
    item: { type: Object, default: () => ({}) },
    title: { type: String, default: 'Product Name' },
    category: { type: String, default: 'Category' },
    image: { type: String, default: '' },
    quantity: { type: [String, Number], default: '0' },
    price: { type: [String, Number], default: '0.00' },
    tags: { type: Array, default: () => [] },
    rating: { type: [Number, String], default: 4.8 },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    city: { type: String, default: '' }
});

const emit = defineEmits(['click']);

const formattedPrice = computed(() => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(props.price));
});

// Precio promedio simulado (+16%)
const formattedAvgPrice = computed(() => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(props.price) * 1.16);
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

<style scoped>
/* ── Card wrapper ──────────────────────────────────────── */
.pc-card {
    background: #ffffff;
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    cursor: pointer;
    width: 100%;
    overflow: hidden;
    border: 1px solid #d4d4d4;
    transition: box-shadow 0.2s, transform 0.2s;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.pc-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

/* ── Área de imagen ────────────────────────────────────── */
.pc-img-area {
    position: relative;
    width: 100%;
    height: 220px;
    background-color: gainsboro;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.pc-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.pc-no-img {
    font-size: 3rem;
    color: #9ca3af;
}

/* Badge de categoría */
.pc-category-badge {
    position: absolute;
    top: 18px;
    left: 18px;
    background: #fff8e1; /* Fondo amarillo muy claro */
    color: #b45309; /* Texto amarillo ocre oscuro/marrón */
    font-size: 11px;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 20px;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.pc-category-dot {
    width: 6px;
    height: 6px;
    background-color: #f59e0b; /* Punto amarillo/naranja */
    border-radius: 50%;
}

/* ── Cuerpo de la card ─────────────────────────────────── */
.pc-body {
    padding: 16px 20px 20px;
    display: flex;
    flex-direction: column;
    flex: 1;
}

/* Título */
.pc-title {
    font-size: 18px;
    font-weight: 800;
    color: #1c223c;
    line-height: 1.3;
    margin: 0 0 10px 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

/* Ubicación */
.pc-location {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #8c939d;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 16px;
}

.pc-location i {
    font-size: 15px;
}

/* Divisor */
.pc-divider {
    height: 1px;
    background-color: #f4f5f7;
    margin-bottom: 16px;
    width: 100%;
}

/* Precios */
.pc-prices-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.pc-price-col {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.pc-price-col.right-align {
    text-align: right;
    align-items: flex-end;
}

.pc-price-label {
    font-size: 11px;
    color: #8c939d;
    font-weight: 600;
}

.pc-price-main {
    font-size: 16px;
    font-weight: 800;
    color: #172b4d;
}

.pc-price-avg {
    font-size: 16px;
    font-weight: 800;
    color: #10b981;
}
</style>
