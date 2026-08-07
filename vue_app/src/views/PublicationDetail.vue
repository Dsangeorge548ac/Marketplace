<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '@/services/axiosInstance';
import Swal from 'sweetalert2';
import HomeHeader from '@/components/header/Header.vue';
import MarketplaceFooter from '@/components/footer/footer.vue';
import MineralTicker from '@/components/MineralTicker.vue'
import { getImageUrl, handleImageError } from '@/assets/js/imageHelper';
import { useCart } from '@/assets/js/useCart';
import { checkSession } from '@/services/authService';

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

const fetchPaymentMethods = async (sellerId) => {
    try {
        if (!sellerId) return;
        const { data } = await axios.get(`/api/user_service/payment-methods/public/${sellerId}`);
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
        const { data } = await axios.get(`/api/publications_service/${productId}`);
        
        if (data && !data.error) {
            product.value = data;
            activeImage.value = data.image;
            fetchPaymentMethods(data.seller_id || data.user_id || data.id_user || data.merchant_id);
        } else {
            // Check legacy POST route as fallback if necessary, though GET should suffice
            const fallBackData = await axios.post('/api/publications_service/get-card', { id: productId }, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (fallBackData.data && !fallBackData.data.error) {
                 product.value = fallBackData.data;
                 activeImage.value = fallBackData.data.image;
                 fetchPaymentMethods(fallBackData.data.seller_id || fallBackData.data.user_id || fallBackData.data.id_user || fallBackData.data.merchant_id);
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
    return product.value.media_gallery.filter(m => m.image !== product.value.image);
});

const hasMultipleImages = computed(() => {
    return uniqueGalleryImages.value.length > 0;
});

const hasNumericPrice = computed(() => {
    const parsed = Number(product.value?.price);
    return Number.isFinite(parsed);
});

const totalWithTax = computed(() => {
    if (!hasNumericPrice.value) return 'Por consultar';
    const price = parseFloat(product.value.price);
    return (price * 1.16).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
});

const formattedPrice = computed(() => {
    if (!hasNumericPrice.value) return 'Precio por consultar';
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

const activeTab = ref('descripcion');


</script>

<template>
    <div class="publication-page modern-layout">
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

            <div v-else-if="product" class="modern-container">
                <div class="modern-breadcrumb">
                    <a href="#" @click.prevent="router.push('/')"><i class="fa-solid fa-house"></i> Inicio</a> 
                    <i class="fa-solid fa-chevron-right"></i> 
                    <a href="#" @click.prevent="router.push('/marketplace')">Productos</a> 
                    <i class="fa-solid fa-chevron-right"></i> 
                    <span>{{ product.name }}</span>
                </div>

                <div class="modern-grid-top">
                    <!-- Left: Gallery Section -->
                    <div class="gallery-section-wrapper">
                        <div class="gallery-thumbs" v-if="hasMultipleImages">
                            <i class="fa-solid fa-chevron-up nav-icon"></i>
                            <div class="thumb-list">
                                <div 
                                    class="thumb-img" 
                                    :class="{ active: activeImage === product.image }"
                                    @click="activeImage = product.image"
                                >
                                    <img :src="getImageUrl(product.image)" alt="Miniatura principal" @error="handleImageError" />
                                </div>
                                <div 
                                    v-for="media in uniqueGalleryImages" 
                                    :key="media.id" 
                                    class="thumb-img"
                                    :class="{ active: activeImage === media.image }"
                                    @click="activeImage = media.image"
                                >
                                    <img :src="getImageUrl(media.image)" alt="Miniatura" @error="handleImageError" />
                                </div>
                            </div>
                            <i class="fa-solid fa-chevron-down nav-icon"></i>
                        </div>
                        
                        <div class="modern-card gallery-main-card">
                            <img :src="getImageUrl(activeImage || product.image)" alt="Imagen Búsqueda" @error="handleImageError" />
                        </div>
                    </div>

                    <!-- Right: Info Card -->
                    <div class="modern-card info-card">
                        <h1 class="modern-title">{{ product.name }}</h1>
                        
                        <div class="modern-stock-badge">
                            <i class="fa-solid fa-circle-check"></i>{{ product.quantity }} En stock
                        </div>

                        <div class="modern-price">
                            <p v-if="hasNumericPrice.value > 0">{{ `US $${formattedPrice}` }}</p>
                            <p v-else>Precio no disponible</p>
                        </div>

                        <div class="modern-tax" v-if="hasNumericPrice.value > 0">Est. con impuestos: {{ hasNumericPrice ? `US $${totalWithTax}` : totalWithTax }}</div>
                        <div class="modern-tax" v-else>Precio total con impuestos no disponible</div>

                        <div class="modern-specs-grid">
                            <div class="spec-item">
                                <span class="spec-label">Categoría</span>
                                <span class="spec-value">{{ getCategoryName(product.category) }}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Subcategoría</span>
                                <span class="spec-value">{{ product.sub_category }}</span>
                            </div>
                            <div class="spec-item" v-if="product.manufacturer">
                                <span class="spec-label">Vendido por:</span>
                                <span class="spec-value">{{ product.manufacturer }}</span>
                            </div>
                            <div class="spec-item" v-if="product.model">
                                <span class="spec-label">Modelo</span>
                                <span class="spec-value">{{ product.model }}</span>
                            </div>
                            <div class="spec-item" v-if="product.type_product">
                                <span class="spec-label">Tipo</span>
                                <span class="spec-value">{{ product.type_product }}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Ubicación</span>
                                <span class="spec-value">{{ getLocationName(product.city) }}, Edo. {{ getLocationName(product.state) }}, {{ getLocationName(product.country) }}</span>
                            </div>
                            <div class="spec-item">
                                <span class="spec-label">Condición</span>
                                <span class="spec-value">{{ product.condition || 'Consulte al vendedor' }}</span>
                            </div>
                        </div>

                        <div class="modern-actions">
                            <button class="btn-modern-primary" @click="contactProducer">
                                Contactar al vendedor
                            </button>
                            <button 
                                class="btn-modern-secondary" 
                                @click="handleAddToCart"
                                :disabled="isInCart(product.id)"
                            >
                                <span v-if="isInCart(product.id)">En el carrito</span>
                                <span v-else>Añadir al carrito</span>
                            </button>
                            <button class="btn-modern-outline" v-if="product.document" @click="openDocument">
                                <i class="fa-solid fa-file-pdf"></i> Ver Documento
                            </button>
                        </div>
                        
                        <div class="payment-methods-modern" v-if="paymentMethods.length > 0" style="margin-top: 25px; padding-top: 25px; border-top: 1px dashed #e2e8f0;">
                            <h4>Métodos de Pago Aceptados</h4>
                            <div class="pm-pills">
                                <span v-for="pm in paymentMethods" :key="pm.id" class="pm-pill">
                                    <template v-if="pm.platform === 'Zinli'">
                                        <img src="@/assets/img/payment-methods/Zinli-logo.png" alt="Zinli" class="pm-logo" />
                                    </template>
                                    <template v-else-if="pm.platform === 'Zelle'">
                                        <img src="@/assets/img/payment-methods/Zelle-logo.png" alt="Zelle" class="pm-logo" />
                                    </template>
                                    <template v-else-if="pm.platform === 'Binance'">
                                        <img src="@/assets/img/payment-methods/Binance-logo.png" alt="Binance" class="pm-logo" />
                                    </template>
                                    <template v-else>
                                        <i class="bx bx-money"></i>
                                        {{ pm.platform || 'Otro' }}
                                    </template>
                                </span>
                            </div>
                        </div>

                    </div>
                </div>

                <!-- Bottom: Tabs Card -->
                <div class="modern-card tabs-card">
                    <div class="modern-tabs-header">
                        <div class="modern-tab" :class="{ active: activeTab === 'descripcion' }" @click="activeTab = 'descripcion'">Descripción</div>
                        <div class="modern-tab" :class="{ active: activeTab === 'caracteristicas' }" @click="activeTab = 'caracteristicas'" v-show="false">Características</div>
                        <div class="modern-tab" :class="{ active: activeTab === 'almacenamiento' }" @click="activeTab = 'almacenamiento'" v-show="false">Almacenamiento</div>
                        <div class="modern-tab" :class="{ active: activeTab === 'empaque' }" @click="activeTab = 'empaque'">Empaque</div>
                    </div>
                    
                    <div class="modern-tabs-body">
                        <div class="the-description" v-if="activeTab === 'descripcion'">
                            {{ product.description || product.short_desc || 'No hay descripción detallada provista por el vendedor. Por favor, póngase en contacto con el vendedor para obtener más información.' }}
                        </div>

                        <div class="the-description" v-if="activeTab === 'caracteristicas'">
                            <p><strong>Categoría:</strong> {{ getCategoryName(product.category) }}</p>
                            <p v-if="product.model"><strong>Modelo:</strong> {{ product.model }}</p>
                            <p v-if="product.manufacturer"><strong>Marca:</strong> {{ product.manufacturer }}</p>
                            <p><strong>Condición:</strong> Consulte al vendedor</p>
                        </div>
                        
                        <div class="the-description" v-if="activeTab === 'almacenamiento'">
                            <p>Consulte con el vendedor sobre los detalles de almacenamiento para este producto.</p>
                        </div>

                        <div class="the-description" v-if="activeTab === 'empaque'">
                            <p>El empaque estándar será coordinado al momento de finalizar la compra.</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
        
        <MarketplaceFooter />
    </div>
</template>
