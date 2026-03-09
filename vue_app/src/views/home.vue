<script setup>
import { ref, computed } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

import HomeHeader from '@/components/header/Header.vue';
import MineralTicker from '@/components/MineralTicker.vue';
import MarketplaceFooter from '@/components/footer/footer.vue';
import ProductCard from '@/components/card/ProductCard.vue';
import modalPost from '@/components/modals/modal_post.vue';
import { useMarketplace } from '@/assets/js/marketplace.js';

const modules = [Navigation];

const { 
    products, 
    showModal, 
    selectedHarvest, 
    showHarvestDetails, 
    getCategoryName, 
    getLocationName, 
    getImageUrl 
} = useMarketplace();

const fabrimineProducts = computed(() => {
    return products.value.filter(item => 
        (item.manufacturer && item.manufacturer.includes('Fabrimine')) ||
        (item.brand && item.brand.includes('Fabrimine'))
    );
});

const productsBreakpoints = {
    320: { slidesPerView: 1.2, spaceBetween: 15 },
    540: { slidesPerView: 2.2, spaceBetween: 15 },
    768: { slidesPerView: 3.2, spaceBetween: 15 },
    1024: { slidesPerView: 3, spaceBetween: 20 },
    1280: { slidesPerView: 4, spaceBetween: 20 },
};

// Categories & subcategories sourced from categories.js (12 items)
const miningCategories = ref([
    // --- Maquinaria Pesada ---
    { id: 1,  name: 'Maquinaria Pesada',              iconClass: 'fa-solid fa-truck-monster',   isCategory: true },
    { id: 2,  name: 'Excavadoras Hidráulicas',         iconClass: 'fa-solid fa-tractor',          isCategory: false },
    { id: 3,  name: 'Camiones Rígidos y Articulados',  iconClass: 'fa-solid fa-truck',            isCategory: false },
    { id: 4,  name: 'Tractores de Oruga (Dozers)',     iconClass: 'fa-solid fa-road-spikes',      isCategory: false },

    // --- Procesamiento de Minerales ---
    { id: 5,  name: 'Procesamiento de Minerales',     iconClass: 'fa-solid fa-gears',            isCategory: true },
    { id: 6,  name: 'Trituración / Chancado',          iconClass: 'fa-solid fa-circle-nodes',     isCategory: false },
    { id: 7,  name: 'Molienda',                        iconClass: 'fa-solid fa-rotate',           isCategory: false },
    { id: 8,  name: 'Concentración',                   iconClass: 'fa-solid fa-flask',            isCategory: false },

    // --- Equipos Auxiliares e Insumos ---
    { id: 9,  name: 'Equipos Auxiliares e Insumos',   iconClass: 'fa-solid fa-toolbox',          isCategory: true },
    { id: 10, name: 'Sistemas de Bombeo',              iconClass: 'fa-solid fa-water',            isCategory: false },
    { id: 11, name: 'Repuestos y Consumibles',         iconClass: 'fa-solid fa-wrench',           isCategory: false },
    { id: 12, name: 'Seguridad (EPP)',                 iconClass: 'fa-solid fa-hard-hat',         isCategory: false },
]);


</script>

<template>
    <div class="home-wrapper">
        <HomeHeader />
        <MineralTicker />
        
        <main class="home-main">

             <!-- New Hero Banner Section (eBay Style for Mining) -->
            <section class="mining-hero-section">
                <div class="mining-hero-container">
                    <div class="overlay"></div>
                    <!-- Left Content -->
                    <div class="hero-left-content">
                        <h2 class="hero-main-title">Optimiza tu operación</h2>
                        <p class="hero-subtitle">Encuentra la maquinaria y repuestos pesados para revolucionar tu mina.</p>
                        <button class="hero-action-btn">Comprar maquinaria</button>
                    </div>

                    
                </div>
            </section>
            

            <!-- ── Minerales Destacados ─────────────────────────────── -->
            <section class="minerals-section">
                <div class="minerals-container">
                    <div class="minerals-header">
                        <h2>Minerales en el mercado</h2>
                        <a href="#" class="minerals-see-all">Ver todos <i class='bx bx-chevron-right'></i></a>
                    </div>
                    <div class="minerals-scroll">
                        <a href="#" class="mineral-card">
                            <div class="mineral-img-wrap">
                                <img src="@/assets/img/mineral_oro.png" alt="Oro" />
                            </div>
                            <span class="mineral-name">Oro</span>
                        </a>
                        <a href="#" class="mineral-card">
                            <div class="mineral-img-wrap">
                                <img src="@/assets/img/mineral_cassiterita.png" alt="Cassiterita" />
                            </div>
                            <span class="mineral-name">Cassiterita</span>
                        </a>
                        <a href="#" class="mineral-card">
                            <div class="mineral-img-wrap">
                                <img src="@/assets/img/mineral_coltan.png" alt="Coltán" />
                            </div>
                            <span class="mineral-name">Coltán</span>
                        </a>
                        <a href="#" class="mineral-card">
                            <div class="mineral-img-wrap">
                                <img src="@/assets/img/mineral_plata.png" alt="Plata" />
                            </div>
                            <span class="mineral-name">Plata</span>
                        </a>
                        <a href="#" class="mineral-card">
                            <div class="mineral-img-wrap">
                                <img src="@/assets/img/mineral_rodio.png" alt="Rodio" />
                            </div>
                            <span class="mineral-name">Rodio</span>
                        </a>
                        <a href="#" class="mineral-card">
                            <div class="mineral-img-wrap">
                                <img src="@/assets/img/mineral_zafiro.png" alt="Zafiro" />
                            </div>
                            <span class="mineral-name">Zafiro</span>
                        </a>
                        <a href="#" class="mineral-card">
                            <div class="mineral-img-wrap">
                                <img src="@/assets/img/mineral_platino.png" alt="Platino" />
                            </div>
                            <span class="mineral-name">Platino</span>
                        </a>
                    </div>
                </div>
            </section>

            <!-- Productos Recientes Section -->
            <section class="productos-recientes-section">
                <div class="productos-recientes-container">
                    <div class="section-title">
                        <h2>Productos De Fabrimine</h2>
                        <div class="title-right">
                            <div class="custom-swiper-nav">
                                <button class="swiper-nav-btn custom-swiper-prev"><i class='bx bx-chevron-left'></i></button>
                                <button class="swiper-nav-btn custom-swiper-next"><i class='bx bx-chevron-right'></i></button>
                            </div>
                        </div>
                    </div>
                    
                    <div v-if="fabrimineProducts.length > 0" class="swiper-products-wrapper">
                        <Swiper 
                            :modules="modules" 
                            :breakpoints="productsBreakpoints" 
                            :navigation="{ nextEl: '.custom-swiper-next', prevEl: '.custom-swiper-prev' }"
                            class="products-swiper"
                        >
                            <SwiperSlide v-for="item in fabrimineProducts" :key="item.id">
                                <ProductCard
                                    :item="item"
                                    :title="item.name"
                                    :price="item.price || 'Consultar'"
                                    :quantity="item.quantity"
                                    :state="getLocationName(item.state)"
                                    :country="getLocationName(item.country)"
                                    :city="getLocationName(item.city)"
                                    :manufacturer="item.manufacturer || item.brand || 'N/A'"
                                    :category="getCategoryName(item.category)"
                                    :image="getImageUrl(item.image)"
                                    @click="showHarvestDetails(item.id)"
                                />
                            </SwiperSlide>
                        </Swiper>
                    </div>
                    <div v-else class="loading-products">
                        <p>Cargando publicaciones...</p>
                    </div>
                </div>
            </section>


            <!-- Productos Recientes Section -->
            <section class="productos-recientes-section">
                <div class="productos-recientes-container">
                    <div class="section-title">
                        <h2>Minerales Disponibles</h2>
                        <div class="title-right">
                            <div class="custom-swiper-nav">
                                <button class="swiper-nav-btn custom-swiper-prev"><i class='bx bx-chevron-left'></i></button>
                                <button class="swiper-nav-btn custom-swiper-next"><i class='bx bx-chevron-right'></i></button>
                            </div>
                        </div>
                    </div>
                    
                    <div v-if="fabrimineProducts.length > 0" class="swiper-products-wrapper">
                        <Swiper 
                            :modules="modules" 
                            :breakpoints="productsBreakpoints" 
                            :navigation="{ nextEl: '.custom-swiper-next', prevEl: '.custom-swiper-prev' }"
                            class="products-swiper"
                        >
                            <SwiperSlide v-for="item in fabrimineProducts" :key="item.id">
                                <ProductCard
                                    :item="item"
                                    :title="item.name"
                                    :price="item.price || 'Consultar'"
                                    :quantity="item.quantity"
                                    :state="getLocationName(item.state)"
                                    :country="getLocationName(item.country)"
                                    :city="getLocationName(item.city)"
                                    :manufacturer="item.manufacturer || item.brand || 'N/A'"
                                    :category="getCategoryName(item.category)"
                                    :image="getImageUrl(item.image)"
                                    @click="showHarvestDetails(item.id)"
                                />
                            </SwiperSlide>
                        </Swiper>
                    </div>
                    <div v-else class="loading-products">
                        <p>Cargando publicaciones...</p>
                    </div>
                </div>
            </section>


         
            
                <section class="new-categories-section">
                    <div class="nc-container">
                        <h2 class="nc-main-title">Categorías disponibles en nuestro Marketplace B2B</h2>
                        
                        <div class="nc-grid">
                            <div v-for="(cat, index) in miningCategories.filter(c => c.isCategory)" :key="cat.id" class="nc-card">
                                <i :class="cat.iconClass" class="nc-icon" :data-index="index"></i>
                                <span class="nc-name">{{ cat.name }}</span>
                            </div>
                        </div>

                        <button class="nc-cta">Explorar todas las categorías</button>
                    </div>
                </section>

            <!-- Servicios Mineros -->
            <section class="services-section">
                <div class="services-container">

                    <div class="services-header">
                        <div>
                            <h2 class="services-title">Servicios Mineros</h2>
                        </div>
                        <p class="services-subtitle">Servicios especializados para optimizar tu operación minera de principio a fin.</p>
                    </div>

                    <div class="services-grid">

                        <!-- Card 1 -->
                        <div class="service-card">

                            <div>
                                <svg class="curve-svg curve-left" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M20 20C20 9 11 0 0 0H20V20Z"/>
                                </svg>
                                <div class="sc-white-container">
                                      <div class="circle-dark">
                                        01
                                    </div>
                                </div>
                                <svg class="curve-svg curve-right" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M20 20C20 9 11 0 0 0H20V20Z"/>
                                </svg>
                            </div>

                            <div class="sc-accent"></div>
                            <div class="sc-icon-wrap">
                                <i class="fa-solid fa-screwdriver-wrench sc-icon"></i>
                            </div>
                            <div class="sc-body">
                                <h3 class="sc-title">Mantenimiento y Montaje</h3>
                                <p class="sc-desc">Especialistas en alineación, vulcanizado y reparación de sistemas hidráulicos para maquinaria pesada.</p>
                                <ul class="sc-list">
                                    <li><i class="fa-solid fa-check"></i> Alineación de equipos</li>
                                    <li><i class="fa-solid fa-check"></i> Vulcanizado de bandas</li>
                                    <li><i class="fa-solid fa-check"></i> Hidráulica industrial</li>
                                </ul>
                            </div>
                        </div>

                        <!-- Card 2 -->
                        <div class="service-card service-card-2">
                            <div>
                                <svg class="curve-svg curve-left" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M20 20C20 9 11 0 0 0H20V20Z"/>
                                </svg>
                                <div class="sc-white-container">
                                      <div class="circle-dark">
                                        02
                                    </div>
                                </div>
                                <svg class="curve-svg curve-right" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M20 20C20 9 11 0 0 0H20V20Z"/>
                                </svg>
                            </div>
                            <div class="sc-accent"></div>
                            <div class="sc-icon-wrap">
                                <i class="fa-solid fa-truck-ramp-box sc-icon"></i>
                            </div>
                            <div class="sc-body">
                                <h3 class="sc-title">Alquiler (Renting)</h3>
                                <p class="sc-desc">Flota pesada certificada con contratos flexibles adaptados al ciclo de tu operación.</p>
                                <ul class="sc-list">
                                    <li><i class="fa-solid fa-check"></i> Contratos a corto y largo plazo</li>
                                    <li><i class="fa-solid fa-check"></i> Equipos con mantenimiento</li>
                                    <li><i class="fa-solid fa-check"></i> Flota certificada</li>
                                </ul>
                            </div>
                        </div>

                        <!-- Card 3 -->
                        <div class="service-card">
                            <div>
                                <svg class="curve-svg curve-left" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M20 20C20 9 11 0 0 0H20V20Z"/>
                                </svg>
                                <div class="sc-white-container">
                                      <div class="circle-dark">
                                        03
                                    </div>
                                </div>
                                <svg class="curve-svg curve-right" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M20 20C20 9 11 0 0 0H20V20Z"/>
                                </svg>
                            </div>
                            <div class="sc-accent"></div>
                            <div class="sc-icon-wrap">
                                <i class="fa-solid fa-mountain sc-icon"></i>
                            </div>
                            <div class="sc-body">
                                <h3 class="sc-title">Geología y Prospección</h3>
                                <p class="sc-desc">Desde la perforación diamantina hasta los estudios de mapeo geológico con análisis de laboratorio.</p>
                                <ul class="sc-list">
                                    <li><i class="fa-solid fa-check"></i> Perforación diamantina</li>
                                    <li><i class="fa-solid fa-check"></i> Análisis de laboratorio</li>
                                    <li><i class="fa-solid fa-check"></i> Mapeo geológico</li>
                                </ul>
                            </div>
                        </div>

                        <!-- Card 4 -->
                        <div class="service-card service-card-4">
                            <div>
                                <svg class="curve-svg curve-left" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M20 20C20 9 11 0 0 0H20V20Z"/>
                                </svg>
                                <div class="sc-white-container">
                                    <div class="circle-dark">
                                        04
                                    </div>
                                </div>
                                <svg class="curve-svg curve-right" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M20 20C20 9 11 0 0 0H20V20Z"/>
                                </svg>
                            </div>
                            <div class="sc-accent"></div>
                            <div class="sc-icon-wrap">
                                <i class="fa-solid fa-ship sc-icon"></i>
                            </div>
                            <div class="sc-body">
                                <h3 class="sc-title">Logística Especializada</h3>
                                <p class="sc-desc">Transporte de carga sobredimensionada y manejo de sustancias controladas hasta zonas remotas.</p>
                                <ul class="sc-list">
                                    <li><i class="fa-solid fa-check"></i> Carga sobredimensionada</li>
                                    <li><i class="fa-solid fa-check"></i> Sustancias controladas</li>
                                    <li><i class="fa-solid fa-check"></i> Última milla minera</li>
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            <!-- Crowdfunding Section (Fabrimine Projects) -->
            <section class="crowdfunding-section">
                <div class="cf-container">
                    <div class="cf-header">
                        <h4 class="cf-eyebrow">Proyectos Mineros</h4>
                        <h2 class="cf-title">Conoce nuestra trayectoria impulsando el desarrollo minero</h2>
                        <p class="cf-subtitle">Descubre cómo Fabrimine ha diseñado, fabricado e implementado soluciones integrales para grandes proyectos en el sector de la minería, optimizando los recursos y garantizando el éxito operativo.</p>
                        <!-- For now this will just be an anchor tag link to where the projects would be -->
                        <a href="/proyectos" class="cf-cta" style="text-decoration: none; display: inline-block;">Ver proyectos realizados</a>
                    </div>
                    <div class="cf-image-wrapper">
                        <!-- Placeholder image for a mining operation replaced from assets -->
                        <img src="@/assets/img/mina.jpeg" alt="Proyecto Minero de Fabrimine" class="cf-main-img" />
                    </div>
                </div>
            </section>

        </main>
        
        <MarketplaceFooter />
        
        <modalPost 
            :isModalOpen="showModal"
            :selectedHarvest="selectedHarvest"
            @close="showModal = false"
        />
    </div>
</template>

<style scoped>
.home-wrapper {
    min-height: 100vh;
}

.home-main {
    width: 100%;
}

/* --- Cards Section --- */
.cards-section {
    max-width: 1440px; /* Matched the max width from the other files recently updated */
    margin: 40px auto 0;
    position: relative;
    z-index: 10;
    padding: 0 20px 40px;
}

.ml-card {
    background: #fff;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    border: 1px solid #ebebeb;
    height: 260px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    text-decoration: none;
    transition: box-shadow 0.2s;
    cursor: pointer;
}

.ml-card:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.card-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin: 0 0 15px 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
}

/* Product Card specific */
.type-product .card-img-wrapper {
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 15px;
    border-radius: 4px;
    overflow: hidden;
}

.type-product img {
    height: 100%;
    width: 100%;
    object-fit: cover;
}

.type-product .card-name {
    font-size: 13px;
    color: #666;
    line-height: 1.3;
    margin: 0 0 8px 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.type-product .card-price {
    font-size: 20px;
    font-weight: 400;
    color: #333;
    margin: auto 0 0 0;
}

/* Category Card specific */
.type-category {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    height: 100%;
}

.icon-circle {
    width: 65px;
    height: 65px;
    border-radius: 50%;
    border: 1px solid #ebebeb;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    background-color: #f7f7f7;
    color: #333;
    flex: 1;
}

.cat-icon {
    font-size: 36px;
    color: #333;
}

.type-category .card-desc {
    font-size: 13px;
    color: #666;
    line-height: 1.3;
    margin: 0;
}

/* Hide default swiper buttons in cards section only */
.cards-section :deep(.swiper-button-next),
.cards-section :deep(.swiper-button-prev) {
    display: none;
}

/* --- Productos Recientes Section --- */
.productos-recientes-section {
    max-width: 1540px;
    margin: 40px auto;
    padding: 0 20px 20px 20px;
}

.productos-recientes-container .section-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.productos-recientes-container .section-title h2 {
    font-size: 24px;
    color: #111820; /* Darker heading */
    font-weight: bold;
    margin: 20px 0;
}

.title-right {
    display: flex;
    align-items: center;
    gap: 24px;
}

.custom-swiper-nav {
    display: flex;
    gap: 8px;
}

.swiper-nav-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid #e5e7eb;
    background-color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #666;
    font-size: 18px;
    transition: all 0.2s;
    padding: 0;
}

.swiper-nav-btn:hover:not(.swiper-button-disabled) {
    border-color: #d1d5db;
    color: #3665f3;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.swiper-nav-btn.swiper-button-disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background-color: #fff;
    border-color: #e5e7eb;
}

/* Hide default swiper buttons in this section only */
.productos-recientes-container :deep(.swiper-button-next),
.productos-recientes-container :deep(.swiper-button-prev) {
    display: none;
}

.swiper-products-wrapper {
    position: relative;
    background-color: white;
    border-radius: 8px;
}

.loading-products {
    text-align: center;
    padding: 40px;
    color: #666;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

/* --- Categories Grid Section --- */
.categories-section {
    max-width: 1540px;
    margin: 40px auto;
    padding: 0 20px;
}

.categories-header {
    display: flex;
    align-items: baseline;
    gap: 16px;
    margin-bottom: 20px;
}

.categories-header h2 {
    font-size: 24px;
    color: #111820; /* Darker header */
    font-weight: bold;
    margin: 0;
}

.show-all-link {
    color: #3665f3;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
}

.show-all-link:hover {
    text-decoration: underline;
}

.categories-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    background-color: #fff;
    border-radius: 6px;
    box-shadow: 0 1px 2px rgba(0,0,0,0.1);
    border: 1px solid #e5e5e5;
}

.category-card {
    display: flex;
    align-items: center;
    border-right: 1px solid #e5e5e5;
    border-bottom: 1px solid #e5e5e5;
    text-decoration: none;
    color: #333;
    transition: background-color 0.2s, box-shadow 0.2s;
    height: 90px;
    overflow: hidden;
}

/* Remove right borders for the last item in a row (4 columns) */
.category-card:nth-child(4n) {
    border-right: none;
}

/* Remove bottom borders for the last row items */
.category-card:nth-last-child(-n+4) {
    border-bottom: none;
}

.category-card:hover {
    background-color: #fcfcfc;
    position: relative;
    z-index: 10;
    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
    color: #3665f3;
}

.category-img-area {
    width: 30%;
    min-width: 80px;
    height: 100%;
    background-color: #fbfbfb;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
}

.category-icon {
    font-size: 32px;
    color: #555;
    transition: color 0.2s;
}

.category-card:hover .category-icon {
    color: #3665f3;
}

.category-name-area {
    flex: 1;
    padding: 0 20px;
    font-size: 14px;
    font-weight: 500;
    line-height: 1.3;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

/* Top-level category highlight */
.category-card.is-parent {
    background-color: #f0f4ff;
    border-left: 3px solid #3665f3;
}

.category-card.is-parent .category-name-area span {
    font-weight: 700;
    color: #111820;
}

.category-card.is-parent .category-icon {
    color: #3665f3;
}

.category-card.is-parent:hover {
    background-color: #e8eeff;
}

.category-tag {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: #3665f3;
    opacity: 0.75;
}


/* --- eBay Style Mining Hero Section --- */
.mining-hero-section {
    max-width: 1540px;
    margin: 20px auto 40px;
    padding: 0 20px;
    position: relative;
}

.overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1;
}

.mining-hero-container {
    background-image: url(@/assets/img/img33.jpg);
    background-size: cover;
    background-position: center;
    border-radius: 15px; /* Slightly rounded corners */
    min-height: 440px;
    display: flex;
    align-items: stretch;
    position: relative;
    overflow: hidden;
    padding: 40px 60px;
}

.hero-left-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    padding-right: 40px;
    position: relative;
    z-index: 2;
}

.hero-main-title {
    color: #ffffff;
    font-size: 44px;
    font-weight: 700;
    margin: 0 0 16px 0;
    line-height: 1.1;
    font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
}

.hero-subtitle {
    color: #ffffff;
    font-size: 17px;
    font-weight: 400;
    margin: 0 0 32px 0;
    font-family: inherit;
}

.hero-action-btn {
    background-color: #ffffff; /* Deep brown matching reference */
    color: #000000;
    border: none;
    border-radius: 20px; /* Pill button styling */
    padding: 12px 24px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
}

.hero-action-btn:hover {
    background-color: rgba(255, 255, 255, 0.562);
}


@media (max-width: 1024px) {
    .mining-hero-container {
        flex-direction: column;
        padding: 40px 30px 80px;
    }
    
    .hero-left-content {
        padding-right: 0;
        text-align: center;
        align-items: center;
    }
}

@media (max-width: 768px) {
    .hero-main-title {
        font-size: 32px;
    }
    .hero-action-btn {
        padding: 10px 20px;
    }
}

/* --- Minerales Destacados Section --- */
.minerals-section {
    max-width: 1540px;
    margin: 0 auto 36px;
    padding: 0 20px;
}

.minerals-container {
    padding: 20px 0;
}

.minerals-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 22px;
}

.minerals-header h2 {
    font-size: 20px;
    font-weight: 700;
    color: #111820;
    margin: 0;
}

.minerals-see-all {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 14px;
    font-weight: 500;
    color: #3665f3;
    text-decoration: none;
    transition: opacity 0.2s;
}

.minerals-see-all:hover {
    opacity: 0.75;
}

.minerals-scroll {
    display: flex;
    gap: 16px;
    overflow-x: auto;
    padding-bottom: 6px;
    scrollbar-width: none;
    -ms-overflow-style: none;
}

.minerals-scroll::-webkit-scrollbar {
    display: none;
}

.mineral-card {
    display: flex;
    flex-direction: column;
    align-items: start;
    text-decoration: none;
    flex: 0 0 auto;
    width: 200px;
    gap: 10px;
    transition: transform 0.2s;
}


.mineral-img-wrap {
    width: 200px;
    height: 200px;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #ebebeb;
    background-color: gainsboro;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: box-shadow 0.2s, border-color 0.2s;
}

.mineral-card:hover .mineral-img-wrap {
    border-color: #d1d5db;
    box-shadow: 0 6px 20px rgba(0,0,0,0.09);
}

.mineral-img-wrap img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
}

.mineral-card:hover .mineral-img-wrap img {
    transform: scale(1.05);
}

.mineral-name {
    font-size: 14px;
    font-weight: 600;
    color: #111820;
    text-align: left;
}

/* --- Servicios Mineros --- */
.services-section {
    max-width: 1540px;
    margin: 0 auto 60px;
    padding: 0 20px;
}

.services-container {
    background: transparent;
}

.services-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 32px;
}

.services-eyebrow {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #e5b810;
    margin: 0 0 6px;
}

.services-title {
    font-size: 26px;
    font-weight: 700;
    color: black;
    margin: 0;
    line-height: 1.2;
}

.services-subtitle {
    font-size: 14px;
    color: #9ca3af;
    margin: 0;
    max-width: 340px;
    text-align: right;
    line-height: 1.6;
    align-self: flex-end;
}

.services-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
}

/* ── Service Card ────────────────────────────────────────── */
.service-card {
    background: gainsboro;
    border-radius: 16px;
    padding: 32px 32px;
    height: 600px;
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow: hidden;
    transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
    cursor: pointer;
    position: relative;
}

.service-card-2, .service-card-4{
    margin-top: 80px;
}

.service-card-4 {
    background: gainsboro;
    border-radius: 16px;
    padding: 32px 32px;
    height: 600px;
    display: flex;
    flex-direction: column;
    gap: 0;
    overflow: hidden;
    transition: transform 0.25s, box-shadow 0.25s, border-color 0.25s;
    cursor: pointer;
    position: relative;
}

.service-card:hover {
    box-shadow: 0 12px 30px rgba(16, 185, 129, 0.08); /* Green tinted shadow */
}

/* Barra inferior (reemplazo de la superior amarrila) */
.sc-accent {
    display: none; /* Eliminar la barra amarilla top */
}

.curve-left {
    height: 30px;
    width: 30px;
    position: absolute;
    top: 0;
    right: 100px;
    color: white;
}

.curve-right {
    height: 30px;
    width: 30px;
    position: absolute;
    top: 100px;
    right: 0;
    color: white;
}

.circle-dark {
    height: 80px;
    width: 80px;
    background-color: #545454;
    border-radius: 50%;
    position: absolute;
    top: 0;
    right: 0;
    text-align: center;
    font-size: 20px;
    font-weight: bold;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;

}

/* Ícono outline verde (estilo Token) */
.sc-icon-wrap {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: transparent;
    border: 1.5px solid #5e5e5e; /* Thin border like reference */
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin: 20px 0 40px 0; /* Space below icon */
    transition: background 0.3s, border-color 0.3s;
}

.service-card:hover .sc-icon-wrap {
    background: rgba(16, 185, 129, 0.06);
}

.sc-icon {
    font-size: 24px;
    color: black;
}

.sc-white-container {
    height: 100px;
    width: 100px;
    background-color: white;
    position: absolute;
    top: 0;
    right: 0;
    border-bottom-left-radius: 25px;
}

/* Cuerpo de la card */
.sc-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 0;
}

.sc-title {
    font-size: 19px;
    font-weight: 600;
    color: black;
    margin: 0;
    line-height: 1.3;
}

.sc-desc {
    font-size: 16px;
    color: #6b7280;
    line-height: 1.6;
    margin: 0;
}

.sc-list {
    list-style: none;
    padding: 0;
    margin: 8px 0 0;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.sc-list li {
    font-size: 16px;
    color: #4b5563;
    display: flex; /* Keep block alignment */
    align-items: flex-start;
    gap: 10px;
    line-height: 1.4;
}

.sc-list li i {
    font-size: 12px;
    color: #10b981;
    background: transparent;
    border: none;
    width: auto;
    height: auto;
    margin-top: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

/* CTA */
.sc-cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: #10b981;
    text-decoration: none;
    margin: 24px 0 0 0;
    padding-top: 0;
    border-top: none;
    transition: gap 0.2s, color 0.2s;
}

.sc-cta:hover {
    gap: 10px;
    color: #059669; /* Darker green element on hover */
}

.sc-cta i {
    font-size: 12px;
    transition: transform 0.2s;
}

.sc-cta:hover i {
    transform: translateX(2px);
}

@media (max-width: 1100px) {
    .services-grid { grid-template-columns: repeat(2, 1fr); }
    .services-subtitle { text-align: left; align-self: auto; }
    .service-card-2, .service-card-4{
        margin-top: 0px;
    }
}

@media (max-width: 600px) {
    .services-grid { grid-template-columns: 1fr; }
}

/* --- Crowdfunding Section --- */
.crowdfunding-section {
    max-width: 1540px;
    margin: 80px auto;
    padding: 0 20px;
    display: flex;
    justify-content: center;
}

.cf-container {
    background-color: transparent;
    width: 100%;
    max-width: 1540px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.cf-header {
    margin-bottom: 60px;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.cf-eyebrow {
    color: #fac819;
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 16px 0;
}

.cf-title {
    color: #1a4231;
    font-size: 38px;
    font-weight: 700;
    line-height: 1.15;
    margin: 0 0 24px 0;
    max-width: 700px;
}

.cf-subtitle {
    color: #8c939d;
    font-size: 15px;
    line-height: 1.6;
    margin: 0 0 32px 0;
    max-width: 600px;
}

.cf-cta {
    background-color: #fac819;
    color: #111820;
    font-weight: 700;
    font-size: 15px;
    padding: 30px 60px;
    border: none;
    border-radius: 40px;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
}

.cf-cta:hover {
    background-color: #eab308;
}

.cf-image-wrapper {
    width: 100%;
    background-color: #ededed;
    padding: 100px;
    border-radius: 24px;
    display: flex;
    justify-content: center;
    box-sizing: border-box;
    margin-top: 10px;
}

.cf-main-img {
    width: 100%;
    height: 600px;
    object-fit: cover;
    border-radius: 16px;
    display: block;
}

@media (max-width: 768px) {
    .cf-title { font-size: 28px; }
    .cf-image-wrapper { padding: 20px 20px 0 20px; border-radius: 16px 16px 0 0; }
    .cf-main-img { height: 250px; border-radius: 12px 12px 0 0; }
    .cf-cta { padding: 12px 30px; }
}

@media (max-width: 768px) {
    .mg-title { font-size: 28px; }
    .mg-main-img { border-radius: 12px; }
    .mg-cta { padding: 16px 40px; }
}

/* --- New Categories Grid Section --- */
.new-categories-section {
    max-width: 1200px;
    margin: 80px auto;
    padding: 0 20px;
    display: flex;
    justify-content: center;
}

.nc-container {
    width: 100%;
    max-width: 1540px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
}

.nc-main-title {
    color: #1a4231;
    font-size: 32px;
    font-weight: 700;
    line-height: 1.25;
    margin: 0 0 50px 0;
    max-width: 500px;
}

.nc-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    width: 100%;
    margin-bottom: 60px;
}

.nc-card {
    background: #ffffff;
    border: 1px solid gainsboro;
    border-radius: 16px;
    padding: 60px 40px;
    display: flex;
    height: 600px;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    transition: transform 0.2s, box-shadow 0.2s;
    cursor: pointer;
}

.nc-card:first-child, .nc-card:last-child {
    margin-top: 80px;
}

.nc-card:hover {
    box-shadow: 0 8px 20px rgba(0,0,0,0.06);
}

.nc-icon {
    font-size: 54px;
}

/* Icon colors mapping */
.nc-icon[data-index="0"] { color: #bc9f62; } /* Gold-ish */
.nc-icon[data-index="1"] { color: #f43f5e; } /* Pink/Red-ish */
.nc-icon[data-index="2"] { color: #22c55e; } /* Bright Green */
.nc-icon[data-index="3"] { color: #475569; } /* Slate/Gray Backup */

.nc-name {
    font-size: 14px;
    font-weight: 500;
    color: #4b5563;
    text-align: center;
}

.nc-cta {
    background-color: #fac819;
    color: #111820;
    font-weight: 700;
    font-size: 15px;
    padding: 30px 60px;
    border: none;
    border-radius: 40px;
    cursor: pointer;
    transition: background-color 0.2s;
}

.nc-cta:hover {
    background-color: #eab308;
}

@media (max-width: 768px) {
    .nc-grid {
        grid-template-columns: 1fr;
    }
    .nc-main-title {
        font-size: 26px;
        margin-bottom: 30px;
    }
}
</style>
