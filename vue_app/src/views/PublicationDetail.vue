<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import Swal from 'sweetalert2';
import HomeHeader from '@/components/header/Header.vue';
import MarketplaceFooter from '@/components/footer/footer.vue';
import MineralTicker from '@/components/MineralTicker.vue'
import { getImageUrl, handleImageError } from '@/assets/js/imageHelper';
import { useCart } from '@/assets/js/useCart';

const route = useRoute();
const router = useRouter();
const { addToCart, isInCart } = useCart();

const productId = route.params.id;
const product = ref(null);
const loading = ref(true);
const error = ref(null);
const activeImage = ref('');
const quantity = ref(1);

const selectedPaymentMethod = ref(null);
const paymentMethods = ref([]);

const fetchPaymentMethods = async (userId) => {
    try {
        if (!userId) return;
        const { data } = await axios.get(`/api/user_service/payment-methods/public/${userId}`);
        paymentMethods.value = data || [];
    } catch (err) {
        console.error('Error fetching payment methods:', err);
        paymentMethods.value = [];
    }
};

function selectPaymentMethod(pm) {
    selectedPaymentMethod.value = selectedPaymentMethod.value?.id === pm.id ? null : pm;
}

// Configuración Toast Segura
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
});

const fetchProductDetails = async () => {
    loading.value = true;
    error.value = null;
    try {
        // Asumiendo que /api/publications_service/ puede devolver un solo producto si le pasamos buscar por id
        // O necesitamos fetchear toda la pagina y filtrarlo.
        // Lo ideal sería un endpoint /api/publications_service/:id pero usaremos el existente con un truco o asumiendo
        // que el backend lo soporta. Vamos a obtener la lista y filtrarlo por ahora si no hay endpoint individual.
        const { data } = await axios.get(`/api/publications_service/?limit=100`);
        const apiData = Array.isArray(data.data) ? data.data : [];
        const found = apiData.find(p => p.id == productId);
        
        if (found) {
            product.value = found;
            activeImage.value = found.image;
            fetchPaymentMethods(found.user_id || found.id_user || found.merchant_id);
        } else {
             // Fallback to fetch from publications generic context:
             const fallBackData = await axios.get('/api/publications_service/getById?id=' + productId)
             if(fallBackData.data && fallBackData.data.data) {
                 product.value = fallBackData.data.data;
                 activeImage.value = fallBackData.data.data.image;
                 fetchPaymentMethods(product.value.user_id || product.value.id_user || product.value.merchant_id);
             } else {
                 error.value = "Producto no encontrado";
             }
        }
    } catch (err) {
        console.error('Error fetching product:', err);
        error.value = "Error al cargar la publicación";
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchProductDetails();
});

const uniqueGalleryImages = computed(() => {
    if (!product.value?.media_gallery) return [];
    // Filter out the media image if it's the same as the main product image
    return product.value.media_gallery.filter(m => m.image !== product.value.image);
});

const hasMultipleImages = computed(() => {
    return uniqueGalleryImages.value.length > 0;
});

const totalWithTax = computed(() => {
    if (!product.value?.price) return '0.00';
    const price = parseFloat(product.value.price);
    return (price * 1.16).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
});

const formattedPrice = computed(() => {
    if (!product.value?.price) return '0.00';
    return parseFloat(product.value.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
});

function getCategoryName(c) {
    const cats = { maquina: 'Maquinaria', insumo: 'Insumos', herramienta: 'Herramientas', vehiculos: 'Vehículos' };
    return cats[c] || c || 'General';
}

function getLocationName(l) {
    const locs = { norte: 'Región Norte', centro: 'Región Centro', sur: 'Región Sur' };
    return locs[l] || l || 'No especificado';
}

function contactProducer() {
    Swal.fire({
        icon: 'info',
        title: `Contactar a ${product.value.manufacturer || 'el vendedor'}`,
        html: `Puedes escribirle o llamarle al siguiente contacto:<br><br><b style="font-size: 1.2rem; color: #3665f3">${product.value.contact || 'No disponible'}</b>`,
        confirmButtonColor: '#3665f3',
        confirmButtonText: 'Entendido'
    });
}

const openDocument = () => {
    if (product.value?.document) {
        window.open(getImageUrl(product.value.document), '_blank')
    }
};

function handleAddToCart() {
    if (!product.value) return;
    const added = addToCart(product.value);
    if (added) {
        Toast.fire({ icon: 'success', title: 'Agregado al carrito' });
    } else {
        Toast.fire({ icon: 'info', title: 'Ya está en el carrito' });
    }
}

function goBack() {
    router.back();
}
</script>

<template>
    <div class="publication-page">
        <HomeHeader />

        <MineralTicker />

        <main class="main-content">
            <div v-if="loading" class="loading-state">
                <div class="spinner"></div>
                <p>Cargando información del producto...</p>
            </div>

            <div v-else-if="error" class="error-state">
                <i class="fa-regular fa-face-frown-open error-icon"></i>
                <h2>Oops!</h2>
                <p>{{ error }}</p>
                <button class="btn-back" @click="goBack">Volver atrás</button>
            </div>

            <div v-else-if="product" class="product-container">
                <div class="breadcrumb">
                    <a href="#" @click.prevent="router.push('/')">Inicio</a> 
                    <i class="fa-solid fa-chevron-right"></i> 
                    <a href="#" @click.prevent="router.push('/marketplace')">Marketplace</a> 
                    <i class="fa-solid fa-chevron-right"></i> 
                    <span>{{ getCategoryName(product.category) }}</span>
                </div>

                <div class="product-grid">
                    <!-- Left: Gallery -->
                    <div class="gallery-section">
                        <div class="thumbnails" v-if="hasMultipleImages">
                            <div 
                                class="thumb" 
                                :class="{ active: activeImage === product.image }"
                                @click="activeImage = product.image"
                            >
                                <img :src="getImageUrl(product.image)" alt="Miniatura principal" @error="handleImageError" />
                            </div>
                            <!-- Show unique gallery items -->
                            <div 
                                v-for="media in uniqueGalleryImages" 
                                :key="media.id" 
                                class="thumb"
                                :class="{ active: activeImage === media.image }"
                                @click="activeImage = media.image"
                            >
                                <img :src="getImageUrl(media.image)" alt="Miniatura" @error="handleImageError" />
                            </div>
                        </div>
                        
                        <div class="main-image-wrapper">
                            <img :src="getImageUrl(activeImage || product.image)" alt="Imagen del producto" @error="handleImageError" />
                        </div>
                    </div>

                    <!-- Right: Info -->
                    <div class="info-section">
                        <h1 class="product-title">{{ product.name }}</h1>
                        <p class="product-category"><strong>Categoría:</strong> {{ product.category }}</p>
                        
                        <div class="seller-block">
                            <div class="seller-avatar">{{ product.manufacturer ? product.manufacturer.charAt(0).toUpperCase() : 'E' }}</div>
                            <div class="seller-details">
                                <div class="seller-name">{{ product.manufacturer || 'STARLIT PARTNER' }}</div>
                                <div class="seller-feedback">Vendedor verificado</div>
                            </div>
                        </div>

                        <div class="price-box">
                            <div class="price-main">US ${{ formattedPrice }}</div>
                            
                            <div class="tax-info">
                                Precio total con impuestos estimado: <strong>US ${{ totalWithTax }}</strong>
                            </div>
                        </div>

                       

                        <div class="purchase-actions">
                            <button class="btn-buy-now" @click="contactProducer">¡Cómpralo ahora!</button>
                            <button 
                                class="btn-add-cart" 
                                @click="handleAddToCart"
                                :disabled="isInCart(product.id)"
                            >
                                <span v-if="isInCart(product.id)">En el carrito</span>
                                <span v-else>Añadir al carrito</span>
                            </button>
                            <button class="btn-add-cart" v-if="product.document" @click="openDocument">
                                Documento
                            </button>
                        </div>
                        
                        <div class="shipping-returns">
                            <div class="sr-item">
                                <div class="sr-text">
                                    <strong>Envío:</strong> A coordinar con el vendedor.
                                </div>
                            </div>
                            <div class="sr-item">
                                <div class="sr-text">
                                    <strong>Ubicación:</strong> {{ getLocationName(product.city) }}, Edo. {{ getLocationName(product.state) }}, {{ getLocationName(product.country) }}
                                </div> 
                            </div>
                            <div class="sr-item">
                                <div class="sr-text">
                                    <strong>Devoluciones:</strong> El vendedor no acepta devoluciones para este artículo.
                                </div>
                            </div>
                        </div>

                        <div class="payments-section">
                            <div class="pm-row">
                                <div class="pm-label">Pagos:</div>
                                <div class="pm-icons dynamic-methods" v-if="paymentMethods.length > 0">
                                    <button 
                                        v-for="pm in paymentMethods" 
                                        :key="pm.id" 
                                        class="pm-icon-btn real-logo"
                                        :class="[pm.platform ? pm.platform.toLowerCase() : 'otros', { 'active': selectedPaymentMethod?.id === pm.id }]"
                                        @click="selectPaymentMethod(pm)"
                                    >
                                        <i class='bx bxl-paypal' v-if="pm.platform === 'Zinli'" style="margin-right:4px; font-size:16px;"></i>
                                        <i class='bx bx-mobile' v-else-if="pm.platform === 'Zelle'" style="margin-right:4px; font-size:16px;"></i>
                                        <i class='bx bxl-bitcoin' v-else-if="pm.platform === 'Binance'" style="margin-right:4px; font-size:16px;"></i>
                                        {{ pm.platform || 'Otro' }}
                                    </button>
                                </div>
                                <div v-else class="pm-icons dynamic-methods">
                                    <span style="font-size: 13px; color: #707070; padding-top: 4px;">No hay métodos de pago registrados.</span>
                                </div>
                            </div>
                            
                            <!-- Payment Method Details Box -->
                            <div class="pm-details-box" v-if="selectedPaymentMethod">
                                <h4>Datos para {{ selectedPaymentMethod.platform }}:</h4>
                                <div class="pm-detail-grid">
                                    <template v-if="selectedPaymentMethod.platform === 'Zelle' || selectedPaymentMethod.platform === 'Binance' || selectedPaymentMethod.platform === 'Zinli'">
                                        <div class="pm-d-label">Titular:</div><div class="pm-d-val">{{ selectedPaymentMethod.account_holder }}</div>
                                        <div class="pm-d-label">Email / ID:</div><div class="pm-d-val">{{ selectedPaymentMethod.email_or_id }}</div>
                                    </template>
                                    <template v-else>
                                        <div class="pm-d-label">Titular:</div><div class="pm-d-val">{{ selectedPaymentMethod.account_holder }}</div>
                                        <div class="pm-d-label">Info Adicional:</div><div class="pm-d-val">{{ selectedPaymentMethod.email_or_id }}</div>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Bottom Description Section -->
                <div class="description-section">
                    <div class="desc-tabs">
                        <div class="tab active">Acerca de este artículo</div>
                    </div>
                    <div class="desc-content-wrapper">
                        
                        <div class="features-list-side">
                            <h3>Detalles del Artículo</h3>
                            <div class="features-grid">
                                <div class="f-item">
                                    <span class="f-label">Categoría:</span>
                                    <span class="f-val">{{ getCategoryName(product.category) }}</span>
                                </div>
                                <div class="f-item">
                                    <span class="f-label">Modelo:</span>
                                    <span class="f-val">{{ getLocationName(product.model) || 'N/A' }}</span>
                                </div>
                                <div class="f-item" v-if="product.type_product">
                                    <span class="f-label">Tipo:</span>
                                    <span class="f-val">{{ getLocationName(product.type_product) }}</span>
                                </div>
                                <div class="f-item" v-if="product.manufacturer">
                                    <span class="f-label">Marca/Fabricante:</span>
                                    <span class="f-val">{{ product.manufacturer }}</span>
                                </div>
                                <div class="f-item">
                                    <span class="f-label">Condición:</span>
                                    <span class="f-val">Consulte al vendedor</span>
                                </div>
                            </div>
                        </div>

                        <div class="desc-text-side">
                            <h3>Descripción del Producto</h3>
                            <div class="the-description">
                                {{ product.description || product.short_desc || 'No hay descripción detallada provista por el vendedor. Por favor, póngase en contacto con el vendedor para obtener más información.' }}
                            </div>
                            
                            
                        </div>
                    </div>
                </div>
            </div>
        </main>
        
        <MarketplaceFooter />
    </div>
</template>

<style scoped>
.publication-page {
    background-color: #fff;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}

.main-content {
    max-width: 1540px;
    width: 100%;
    margin: 0 auto;
    padding: 20px 20px 60px;
    flex: 1;
}

.product-category {
    font-size: 14px;
    color: #666;
    margin-bottom: 10px;
}

/* Base states */
.loading-state, .error-state {
    text-align: center;
    padding: 100px 20px;
    background: #fff;
}
.spinner {
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3665f3;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin: 0 auto 20px;
}
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

.error-state .error-icon {
    font-size: 60px;
    color: #e53238;
    margin-bottom: 20px;
}
.btn-back {
    margin-top: 20px;
    padding: 10px 20px;
    background-color: #0654ba;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
}

/* Breadcrumb */
.breadcrumb {
    font-size: 13px;
    color: #555;
    margin-bottom: 30px;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
}
.breadcrumb a {
    color: #555;
    text-decoration: none;
}
.breadcrumb a:hover {
    text-decoration: underline;
}
.breadcrumb i {
    font-size: 10px;
    margin: 0 8px;
    color: #999;
}

/* Grid Layout */
.product-grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 480px;
    gap: 40px;
    background: #fff;
    margin-bottom: 40px;
    align-items: start;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
}

@media (max-width: 992px) {
    .product-grid {
        grid-template-columns: 1fr;
    }
}

/* Left: Gallery */
.gallery-section {
    display: flex;
    flex-direction: row;
    gap: 15px;
    width: 100%;
}

.thumbnails {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 70px;
    flex-shrink: 0;
}

.thumb {
    width: 70px;
    height: 70px;
    border: 1px solid #e5e5e5;
    border-radius: 6px;
    cursor: pointer;
    overflow: hidden;
    opacity: 0.6;
    transition: opacity 0.2s, border-color 0.2s;
    background: #fff;
}

.thumb:hover {
    opacity: 1;
}

.thumb.active {
    opacity: 1;
    border-width: 2px;
}

.thumb img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.main-image-wrapper {
    flex: 1;
    position: relative;
    background-color: #f8f8f8;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

.main-image-wrapper img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
}

.image-badges {
    position: absolute;
    top: 0;
    left: 0;
}
.badge-red {
    background-color: #dd1e31;
    color: white;
    font-size: 11px;
    font-weight: bold;
    padding: 6px 12px;
    border-bottom-right-radius: 8px;
    display: inline-block;
}
.image-actions {
    position: absolute;
    top: 15px;
    right: 15px;
    display: flex;
    gap: 10px;
}
.img-btn {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background-color: white;
    border: 1px solid #ccc;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    color: #111820;
}
.img-btn i {
    font-size: 16px;
}
.heart-btn {
    width: auto;
    padding: 0 15px;
    border-radius: 20px;
}
.heart-count {
    margin-left: 6px;
    font-size: 13px;
    font-weight: bold;
}

/* Right: Info */
.info-section {
    display: flex;
    flex-direction: column;
    color: #111820;
}

.condition-badge {
    color: #0654ba;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 5px;
}

.product-title {
    font-size: 22px;
    font-weight: bold;
    line-height: 1.25;
    margin: 0 0 15px 0;
    color: #111820;
}

.seller-block {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding-bottom: 15px;
    border-bottom: 1px solid #e5e5e5;
    margin-bottom: 15px;
}
.seller-avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background-color: #f5f5f5;
    border: 1px solid #ddd;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: bold;
    color: #555;
}
.seller-details {
    flex: 1;
}
.seller-name {
    font-weight: bold;
    font-size: 14px;
    margin-bottom: 2px;
}
.seller-score {
    font-weight: normal;
    color: #555;
    font-size: 12px;
}
.seller-feedback {
    font-size: 12px;
    color: #555;
}
.seller-feedback a {
    color: #555;
    text-decoration: underline;
}
.seller-feedback a:hover {
    color: #111820;
}

.price-box {
    margin-bottom: 20px;
}
.price-main {
    font-size: 34px;
    font-weight: bold;
    margin-bottom: 5px;
    color: #111820;
}
.price-list {
    font-size: 13px;
    color: #555;
    margin-bottom: 5px;
}
.strikethrough {
    text-decoration: line-through;
}
.financing {
    font-size: 13px;
    margin-bottom: 10px;
    color: #111820;
}
.financing a, .price-list a, .condition-desc a, .sr-text a {
    color: #555;
    text-decoration: underline;
}
.tax-info {
    font-size: 12px;
    color: #707070;
}

.form-grid {
    display: flex;
    flex-direction: column;
    gap: 15px;
    margin-bottom: 25px;
}
.form-row {
    display: flex;
    gap: 15px;
}
.form-row.align-center {
    align-items: center;
}
.form-label {
    width: 80px;
    font-size: 13px;
    color: #111820;
    text-align: right;
    flex-shrink: 0;
    line-height: 1.4;
    padding-top: 2px;
}
.form-content {
    font-size: 14px;
    flex: 1;
    color: #111820;
}
.attr-info {
    color: #555;
    margin-left: 5px;
    font-size: 12px;
}
.condition-desc {
    font-size: 12px;
    color: #555;
    margin-top: 4px;
    line-height: 1.4;
    font-style: italic;
}

.qty-content {
    display: flex;
    align-items: center;
    gap: 10px;
}
.qty-input {
    width: 60px;
    padding: 10px;
    border: 1px solid #8f8f8f;
    border-radius: 4px;
    text-align: center;
    font-size: 14px;
}
.qty-input:focus {
    outline: none;
    border-color: #3665f3;
}
.qty-sold {
    color: #dd1e31;
    font-size: 13px;
    font-weight: 500;
}

.purchase-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 20px;
}
.btn-buy-now, .btn-add-cart, .btn-watchlist {
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
}
.btn-buy-now {
    background-color: #3665f3;
    border: solid 1px #3665f3;
    color: white;
    border-radius: 24px;
    padding: 14px;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.2s;
}
.btn-buy-now:hover {
    background-color: #2b50c5;
}
.btn-add-cart, .btn-watchlist {
    background-color: white;
    color: #3665f3;
    border: 1px solid #3665f3;
    border-radius: 24px;
    padding: 14px;
    font-weight: bold;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    text-decoration: none;
}
.btn-add-cart:hover, .btn-watchlist:hover {
    background-color: #f0f4ff;
    border-color: #2b50c5;
}
.btn-watchlist i {
    margin-right: 5px;
}

.trending-banners {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
}
.trend-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 15px;
    background-color: #fcfcfc;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    font-size: 13px;
    color: #111820;
    font-weight: 500;
}
.trend-item i {
    font-size: 16px;
}
.trend-item .fa-fire {
    color: #dd1e31;
}
.trend-item .fa-bolt {
    color: #2b50c5;
}

.shipping-returns {
    border-top: 1px solid #e5e5e5;
    padding-top: 15px;
    display: flex;
    flex-direction: column;
    gap: 12px;
}
.sr-item {
    font-size: 13px;
    color: #111820;
}

/* Payments Section */
.payments-section {
    border-top: 1px solid #e5e5e5;
    padding-top: 15px;
    margin-top: 5px;
    display: flex;
    flex-direction: column;
    gap: 15px;
}
.pm-row {
    display: flex;
    align-items: flex-start;
    gap: 15px;
}
.pm-label {
    font-size: 13px;
    color: #111820;
    width: 65px;
    padding-top: 4px;
}
.pm-icons {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    flex: 1;
}
.pm-icons.dynamic-methods {
    gap: 8px;
}
.pm-icon-btn {
    height: 32px;
    border: 1px solid #d4d4d4;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
    background: #fff;
    font-size: 13px;
    font-weight: 600;
    color: #111820;
    cursor: pointer;
    transition: all 0.2s;
}
.pm-icon-btn:hover {
    background: #f8f8f8;
    border-color: #b0b0b0;
}
.pm-icon-btn.active {
    background: #eef2ff;
    border-color: #3665f3;
    color: #3665f3;
}
.pm-icon-btn.real-logo.zelle {
    color: #7113e3;
    border-color: #7113e3;
}
.pm-icon-btn.real-logo.zelle.active {
    background: #7113e3;
    color: white;
}
.pm-icon-btn.real-logo.binance {
    color: #f3ba2f;
    border-color: #f3ba2f;
}
.pm-icon-btn.real-logo.binance.active {
    background: #f3ba2f;
    color: #0b0e11;
}
.pm-icon-btn.real-logo.zinli {
    color: #ff4a5f;
    border-color: #ff4a5f;
}
.pm-icon-btn.real-logo.zinli.active {
    background: #ff4a5f;
    color: white;
}

.pm-details-box {
    margin-top: 10px;
    margin-left: 80px;
    background-color: #f7f9fa;
    border: 1px solid #e5e5e5;
    border-radius: 8px;
    padding: 15px;
    animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}

.pm-details-box h4 {
    margin: 0 0 10px 0;
    font-size: 14px;
    color: #111820;
}

.pm-detail-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 15px;
    row-gap: 8px;
    font-size: 13px;
}

.pm-d-label {
    color: #707070;
    font-weight: 500;
}

.pm-d-val {
    color: #111820;
    font-weight: 600;
}
.pm-d-full {
    grid-column: 1 / -1;
    color: #111820;
}

/* Description Section */
.description-section {
    background: #fff;
    padding-top: 30px;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
}

.desc-tabs {
    display: flex;
    border-bottom: 1px solid #e5e5e5;
    margin-bottom: 30px;
}

.desc-tabs .tab {
    padding: 15px 30px;
    font-size: 18px;
    font-weight: bold;
    color: #111820;
    border-bottom: 3px solid transparent;
    cursor: pointer;
}

.desc-tabs .tab.active {
    border-bottom-color: #3665f3;
}

.desc-content-wrapper {
    display: flex;
    flex-direction: column-reverse;
    gap: 20px;
}

@media (min-width: 900px) {
    .desc-content-wrapper {
        flex-direction: column;
    }
}

.desc-text-side h3, .features-list-side h3 {
    font-size: 18px;
    margin-top: 0;
    margin-bottom: 15px;
    color: #111820;
}

.the-description {
    font-size: 15px;
    line-height: 1.6;
    color: #333;
    margin-bottom: 30px;
    white-space: pre-wrap;
    max-width: 800px;
}

.features-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px 40px;
    margin-top: 20px;
    background: #f7f9fa;
    border-radius: 8px;
    max-width: 800px;
}

.f-item {
    display: flex;
    font-size: 14px;
    padding-bottom: 10px;
}

.f-label {
    width: 40%;
    color: #555;
}

.f-val {
    width: 60%;
    color: #111820;
    font-weight: 500;
}


</style>
