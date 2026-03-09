<script setup>
import { useCart } from '@/assets/js/useCart';
import { getImageUrl, handleImageError } from '@/assets/js/imageHelper';
import { useRouter } from 'vue-router';
import '@/assets/css/components/cart-sidebar.css';

const { 
    isSidebarOpen, 
    closeSidebar, 
    items, 
    count, 
    subtotal, 
    removeFromCart, 
    updateQuantity,
    generatePDFPreview,
    checkout 
} = useCart();

const router = useRouter();

const handleCheckout = () => {
    closeSidebar();
    checkout(router);
};

const handleGeneratePDF = () => {
    generatePDFPreview();
};

const formatPrice = (val) => {
    if(!val) return '0.00';
    return parseFloat(val).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
</script>

<template>
    <div class="cart-sidebar-wrapper">
        <!-- Backdrop -->
        <div 
            class="cart-sidebar-backdrop" 
            :class="{ 'open': isSidebarOpen }"
            @click="closeSidebar"
        ></div>

        <!-- Sidebar -->
        <div class="cart-sidebar" :class="{ 'open': isSidebarOpen }">
            
            <!-- Header -->
            <div class="cs-header">
                <div class="cs-title-row">
                    <h2 class="cs-title">Tu Carrito</h2>
                    <span class="cs-count-badge">{{ count }}</span>
                </div>
                <button class="cs-close-btn" @click="closeSidebar">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>

            <!-- Content -->
            <div class="cs-content">
                <div v-if="items.length === 0" class="cs-empty-state">
                    <i class='bx bx-cart cs-empty-icon'></i>
                    <p>Tu carrito está vacío.</p>
                </div>

                <div v-else class="cs-items-list">
                    <div v-for="item in items" :key="item.id" class="cs-item">
                        <div class="cs-item-img-container">
                             <img 
                                :src="getImageUrl(Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : item.image)" 
                                class="cs-item-img" 
                                loading="lazy"
                                :alt="item.name"
                                @error="handleImageError"
                            >
                        </div>
                        <div class="cs-item-details">
                            <div class="cs-item-top">
                                <div class="cs-item-header">
                                    <span class="cs-item-name">{{ item.name }}</span>
                                    <div class="cs-price-block">
                                        <span class="cs-item-price">${{ formatPrice(item.price) }}</span>
                                    </div>
                                </div>
                                <div class="cs-item-meta" v-if="item.color || item.category">
                                     {{ item.color || item.category }}
                                </div>
                            </div>
                            
                            <div class="cs-item-controls">
                                <div class="cs-qty-wrapper">
                                    <button class="cs-qty-btn" @click="updateQuantity(item.id, (item.quantity||1) - 1)">−</button>
                                    <span class="cs-qty-val" v-show="false">{{ item.quantity || 1 }}</span>
                                    <input type="number" class="cs-qty-val cs-input" v-model="item.quantity" @change="updateQuantity(item.id, item.quantity)">
                                    <button class="cs-qty-btn" @click="updateQuantity(item.id, (item.quantity||1) + 1)">+</button>
                                </div>
                                <button class="cs-remove-btn" @click="removeFromCart(item.id)">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        <!-- Footer -->
        <div class="cs-footer" v-if="items.length > 0">
            <div class="cs-summary-row">
                <span class="cs-summary-label">Subtotal</span>
                <span class="cs-summary-val">${{ formatPrice(subtotal) }}</span>
            </div>
            <div class="cs-footer-actions">
                <button class="cs-checkout-btn transparent" @click="handleGeneratePDF">
                    Generar Cotización
                </button>
                <button class="cs-checkout-btn" @click="handleCheckout">
                    Realizar Pedido
                </button>
            </div>
        </div>

    </div>
</div>
</template>
