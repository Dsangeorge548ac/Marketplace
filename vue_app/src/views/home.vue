<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

import HomeHeader from '@/components/header/Header.vue';
import MineralTicker from '@/components/MineralTicker.vue';
import MarketplaceFooter from '@/components/footer/footer.vue';
import ProductCard from '@/components/card/ProductCard.vue';
import { useMarketplace } from '@/assets/js/marketplace.js';
import { useRouter } from 'vue-router';
import axios from '@/services/axiosInstance';
import mineralOro from '@/assets/img/mineral_oro.png';
import mineralCassiterita from '@/assets/img/mineral_cassiterita.png';
import mineralColtan from '@/assets/img/mineral_coltan.png';
import mineralPlata from '@/assets/img/mineral_plata.png';
import mineralRodio from '@/assets/img/mineral_rodio.png';
import mineralZafiro from '@/assets/img/mineral_zafiro.png';
import mineralPlatino from '@/assets/img/mineral_platino.png';
import mineralCobalto from '@/assets/img/mineral_cobalto.jpg';

import bgh1 from '@/assets/img/img35.jpg';
import bgh2 from '@/assets/img/img36.jpg';
import bgh3 from '@/assets/img/img37.jpeg';
import bgh4 from '@/assets/img/mineral_cobalto.jpg';

import bg1 from '@/assets/img/img37.jpeg';
import bg2 from '@/assets/img/img38.jpeg';
import bg3 from '@/assets/img/img40.jpeg';
import bg4 from '@/assets/img/img44.jpg';
import bg5 from '@/assets/img/img45.jpg';

const modules = [Navigation];

// Per-swiper navigation refs
const mineralsTicPrev = ref(null);
const mineralsTicNext = ref(null);
const fabriminePrev  = ref(null);
const fabrimineNext  = ref(null);
const mineralsDispPrev = ref(null);
const mineralsDispNext = ref(null);

const { 
    products, 
    getCategoryName, 
    getLocationName, 
    getImageUrl
} = useMarketplace();

const router = useRouter();

const redirect = () => {
    router.push('/marketplace');
};

const redirectWSP = () => {
    window.open('https://api.whatsapp.com/send/?phone=0584148755808&text&type=phone_number&app_absent=0', '_blank');
};

const fabrimineProducts = computed(() => {
    return products.value.filter(item => 
        (item.manufacturer && item.manufacturer.includes('Fabrimine')) ||
        (item.brand && item.brand.includes('Fabrimine, C.A.')) ||
        (item.brand && item.brand.includes('Fabrimine'))
    );
});

const mineralsProducts = computed(() => {
    return products.value.filter(item => 
        (item.category && item.category.includes('Minerales'))
    );
});

const productsBreakpoints = {
    320: { slidesPerView: 1, spaceBetween: 15 },
    540: { slidesPerView: 2.2, spaceBetween: 15 },
    768: { slidesPerView: 3.2, spaceBetween: 15 },
    1024: { slidesPerView: 3, spaceBetween: 15 },
    1280: { slidesPerView: 5, spaceBetween: 15 },
};

const MineralsBreakpoints = {
    320: { slidesPerView: 2.5, spaceBetween: 25 },
    540: { slidesPerView: 3.5, spaceBetween: 25 },
    768: { slidesPerView: 5, spaceBetween: 25 },
    1280: { slidesPerView: 7, spaceBetween: 25  },
};

const minerals = ref([
    { id: 1, name: 'Oro', image: mineralOro },
    { id: 2, name: 'Cassiterita', image: mineralCassiterita },
    { id: 3, name: 'Coltán', image: mineralColtan },
    { id: 4, name: 'Plata', image: mineralPlata },
    { id: 5, name: 'Rodio', image: mineralRodio },
    { id: 6, name: 'Zafiro', image: mineralZafiro },
    { id: 7, name: 'Platino', image: mineralPlatino },
    { id: 8, name: 'Cobalto', image: mineralCobalto },
]);


const currentSlideIndex = ref(0);
const isPlaying = ref(true);
let slideInterval = null;

const staticSlides = ref([
    {
        id: 1,
        title: 'Ofrecemos un amplio catálogo de productos para la industria minera.',
        subtitle: 'Encuentra maquinaria pesada y equipos de extracción en nuestro marketplace B2B.',
        buttonText: 'Ver Equipos',
        buttonLink: '/marketplace',
        image: bgh1,
        bgColor: '#2c4a1e',
        textColor: '#FFFFFF',
    },
    {
        id: 2,
        title: 'Minerales de alta pureza',
        subtitle: 'Compra y vende minerales estratégicos como cobalto, litio, cobre y más en nuestra plataforma B2B especializada en minería.',
        buttonText: 'Ver minerales',
        buttonLink: '/marketplace',
        image: bgh4,
        bgColor: '#1a1a2e',
        textColor: '#FFFFFF',
    }
]);

const noticeSlides = ref([]);

const slides = computed(() => [...staticSlides.value, ...noticeSlides.value]);

const currentSlideData = computed(() => slides.value[currentSlideIndex.value]);

const openSlideLink = (slide) => {
    if (!slide || !slide.buttonLink) return;

    const isExternalLink = /^https?:\/\//i.test(slide.buttonLink);
    if (isExternalLink) {
        window.open(slide.buttonLink, '_blank', 'noopener,noreferrer');
        return;
    }

    router.push(slide.buttonLink);
};

const loadHeroNotices = async () => {
    try {
        const { data } = await axios.get('/api/publications_service/notices?page=1&limit=5');
        const noticesData = Array.isArray(data?.data) ? data.data : [];

        noticeSlides.value = noticesData
            .filter(item => item && item.news_url)
            .map((item, index) => ({
                id: `notice-${item.id}`,
                title: item.title || 'Noticia',
                subtitle: item.description || 'Lee la noticia completa en su fuente original.',
                buttonText: 'Ver noticia',
                buttonLink: item.news_url,
                image: item.image ? getImageUrl(item.image) : bgh3,
                bgColor: index % 2 === 0 ? '#1f2f46' : '#2f3b22',
                textColor: '#FFFFFF'
            }));
    } catch (error) {
        console.error('Error cargando noticias para el hero:', error);
        noticeSlides.value = [];
    }
};

const nextSlide = () => {
    currentSlideIndex.value = (currentSlideIndex.value + 1) % slides.value.length;
};

const prevSlide = () => {
    currentSlideIndex.value = (currentSlideIndex.value - 1 + slides.value.length) % slides.value.length;
};

const setSlide = (index) => {
    currentSlideIndex.value = index;
    resetInterval();
};

const togglePlay = () => {
    isPlaying.value = !isPlaying.value;
    if (isPlaying.value) {
        startInterval();
    } else {
        clearInterval(slideInterval);
    }
};

const startInterval = () => {
    slideInterval = setInterval(nextSlide, 5000);
};

const resetInterval = () => {
    if (isPlaying.value) {
        clearInterval(slideInterval);
        startInterval();
    }
};

// --- Projects Slider Logic ---
const currentProjectSlideIndex = ref(0);
const isProjectPlaying = ref(true);
let projectSlideInterval = null;

const projectsSlides = ref([
    { id: 1, image: bg1},
    { id: 2, image: bg2 },
    { id: 3, image: bg3 }
]);

const currentProjectSlideData = computed(() => projectsSlides.value[currentProjectSlideIndex.value]);

const nextProjectSlide = () => {
    currentProjectSlideIndex.value = (currentProjectSlideIndex.value + 1) % projectsSlides.value.length;
};

const toggleProjectPlay = () => {
    isProjectPlaying.value = !isProjectPlaying.value;
    if (isProjectPlaying.value) {
        startProjectInterval();
    } else {
        clearInterval(projectSlideInterval);
    }
};

const startProjectInterval = () => {
    projectSlideInterval = setInterval(nextProjectSlide, 5000);
};

// --- Services Slider Logic ---
const currentServiceSlideIndex = ref(0);
const isServicePlaying = ref(true);
let serviceSlideInterval = null;

const serviceSlides = ref([
    {
        id: 1,
        title: 'Mantenimiento y Montaje',
        subtitle: 'Especialistas en alineación, vulcanizado y reparación de sistemas hidráulicos para maquinaria pesada.',
        buttonText: 'Mas Información',
        buttonLink: '',
        bgColor: '#111820',
        textColor: '#FFFFFF',
    },
    {
        id: 2,
        title: 'Alquiler (Renting)',
        subtitle: 'Flota pesada certificada con contratos flexibles adaptados al ciclo de tu operación.',
        buttonText: 'Mas Información',
        buttonLink: '',
        bgColor: '#1f2f46',
        textColor: '#FFFFFF',
    },
    {
        id: 3,
        title: 'Geología y Prospección',
        subtitle: 'Desde la perforación diamantina hasta los estudios de mapeo geológico con análisis de laboratorio.',
        buttonText: 'Mas Información',
        buttonLink: '',
        bgColor: '#2f3b22',
        textColor: '#FFFFFF',
    },
    {
        id: 4,
        title: 'Logística Especializada',
        subtitle: 'Transporte de carga sobredimensionada y manejo de sustancias controladas hasta zonas remotas.',
        buttonText: 'Mas Información',
        buttonLink: '',
        bgColor: '#3b2f22',
        textColor: '#FFFFFF',
    }
]);

const currentServiceSlideData = computed(() => serviceSlides.value[currentServiceSlideIndex.value]);

const nextServiceSlide = () => {
    currentServiceSlideIndex.value = (currentServiceSlideIndex.value + 1) % serviceSlides.value.length;
};

const prevServiceSlide = () => {
    currentServiceSlideIndex.value = (currentServiceSlideIndex.value - 1 + serviceSlides.value.length) % serviceSlides.value.length;
};

const setServiceSlide = (index) => {
    currentServiceSlideIndex.value = index;
    resetServiceInterval();
};

const toggleServicePlay = () => {
    isServicePlaying.value = !isServicePlaying.value;
    if (isServicePlaying.value) {
        startServiceInterval();
    } else {
        clearInterval(serviceSlideInterval);
    }
};

const startServiceInterval = () => {
    serviceSlideInterval = setInterval(nextServiceSlide, 5000);
};

const resetServiceInterval = () => {
    if (isServicePlaying.value) {
        clearInterval(serviceSlideInterval);
        startServiceInterval();
    }
};

const openServiceLink = () => {
    window.open('https://api.whatsapp.com/send/?phone=0584148755808&text&type=phone_number&app_absent=0', '_blank');
};

onMounted(() => {
    loadHeroNotices();
    startInterval();
    startProjectInterval();
    startServiceInterval();
});

onUnmounted(() => {
    clearInterval(slideInterval);
    clearInterval(projectSlideInterval);
    clearInterval(serviceSlideInterval);
});

const benefits = [
    {
        icon: 'bx bx-globe',
        title: 'Alcance Nacional',
        description: 'Vendemos nuestra maquinaria a compradores de todo el país.'
    },
    {
        icon: 'bx bx-money',
        title: 'Mantenimiento y montaje',
        description: 'Somos especialistas en alineación, vulcanizado y reparación de sistemas hidráulicos para maquinaria pesada.'
    },
    {
        icon: 'bx bx-shield-quarter',
        title: 'Alquiler (Renting)',
        description: 'Flota pesada certificada con contratos flexibles adaptados al ciclo de tu operación.'
    },
    {
        icon: 'bx bx-trending-up',
        title: 'Geología y Prospección',
        description: 'Desde la perforación diamantina hasta los estudios de mapeo geológico con análisis de laboratorio.'
    },
    {
        icon: 'bx bx-support',
        title: 'Logística EspecializadaSoporte dedicado',
        description: 'Transporte de carga sobredimensionada y manejo de sustancias controladas hasta zonas remotas.'
    },
    {
        icon: 'bx bx-time',
        title: 'Marketplace B2B',
        description: 'Plataforma para compra y venta de maquinaria y equipos para la industria minera.'
    }
];


</script>

<template>
    <div class="home-wrapper">
        <HomeHeader />
        <MineralTicker />
        
        <main class="home-main">

             <!-- New Hero Banner Section (Dynamic Slider) -->
            <section class="mining-hero-section">

                <div class="mining-hero-container" :style="{ backgroundColor: currentSlideData.bgColor }">
                    <!-- Left Content -->
                    <div class="mining-hero-section-left" v-show="false">
                        <svg class="curve-svg curve-left" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M20 20C20 9 11 0 0 0H20V20Z"/>
                        </svg>
                        
                        <div class="sc-white-container"></div>

                        <svg class="curve-svg curve-right" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M20 20C20 9 11 0 0 0H20V20Z"/>
                        </svg>
                    </div>

                    <div class="hero-left-content">
                        <h1 class="hero-main-title" :style="{ color: currentSlideData.textColor }">{{ currentSlideData.title }}</h1>
                        <p class="hero-subtitle" :style="{ color: currentSlideData.textColor }">{{ currentSlideData.subtitle }}</p>
                        <button class="hero-action-btn" @click="openSlideLink(currentSlideData)">{{ currentSlideData.buttonText }}</button>
                    </div>

                    <!-- Right Image Content -->
                    <div class="hero-right-image">
                        <div class="overlay"></div>
                        <img :src="currentSlideData.image" alt="Banner Image">
                    </div>

                    <!-- Bottom Controls -->
                    <div class="hero-controls-wrapper">

                        <div class="hero-terms"></div>
                  
                        <div class="hero-dots">
                            <span 
                                v-for="(slide, index) in slides" 
                                :key="slide.id" 
                                class="dot" 
                                :class="{ active: currentSlideIndex === index }"
                                @click="setSlide(index)">
                            </span>
                        </div>
                        <div class="hero-actions">
                            <button class="control-btn" @click="prevSlide(); resetInterval()"><i class='bx bx-chevron-left'></i></button>
                            <button class="control-btn" @click="nextSlide(); resetInterval()"><i class='bx bx-chevron-right'></i></button>
                            <button class="control-btn" @click="togglePlay">
                                <i class='bx' :class="isPlaying ? 'bx-pause' : 'bx-play'"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ── Minerales Destacados ─────────────────────────────── -->
            <section class="minerals-section">
                <div class="minerals-container">
                    <div class="minerals-header">
                        <div class="minerals-header-left">
                            <h2>Minerales en el mercado</h2>
                            <p v-show="false">Compra y vende minerales en nuestra plataforma B2B especializada en minería.</p>
                        </div>
                        <div class="title-right">
                            <div class="custom-swiper-nav">
                                <button class="swiper-nav-btn" ref="mineralsTicPrev"><i class='bx bx-chevron-left'></i></button>
                                <button class="swiper-nav-btn" ref="mineralsTicNext"><i class='bx bx-chevron-right'></i></button>
                            </div>
                        </div>
                    </div>
                   
                    <div>
                        <div v-if="minerals.length > 0" class="swiper-products-wrapper">
                            <Swiper 
                                :modules="modules" 
                                :breakpoints="MineralsBreakpoints" 
                                :navigation="{ nextEl: mineralsTicNext, prevEl: mineralsTicPrev }"
                                class="products-swiper"
                            >
                                <SwiperSlide v-for="item in minerals" :key="item.id">
                                    <a href="#" class="mineral-card">
                                        <div class="mineral-img-wrap">
                                            <img :src="item.image" :alt="item.name" />
                                        </div>
                                        <span class="mineral-name">{{ item.name }}</span>
                                    </a>
                                </SwiperSlide>
                            </Swiper>
                        </div>
                        <div v-else class="loading-products">
                            <p>Cargando Minerales...</p>
                        </div>
                    </div>
                </div>
                
            </section>

            

            <!-- Productos Recientes Section -->
            <section class="productos-recientes-section">
                <div class="productos-recientes-container">
                    <div class="section-title">
                        <div class="section-title-left">
                            <h2>Productos De Fabrimine</h2>
                            <p v-show="false">Compra las mejores productos de Fabrimine en nuestra plataforma B2B especializada en minería.</p>
                        </div>
                        <div class="section-title-right">
                            <div class="custom-swiper-nav">
                                <button class="swiper-nav-btn" ref="fabriminePrev"><i class='bx bx-chevron-left'></i></button>
                                <button class="swiper-nav-btn" ref="fabrimineNext"><i class='bx bx-chevron-right'></i></button>
                            </div>
                        </div>
                    </div>
                    
                    <div v-if="fabrimineProducts.length > 0" class="swiper-products-wrapper">
                        <Swiper 
                            :modules="modules" 
                            :breakpoints="productsBreakpoints" 
                            :navigation="{ nextEl: fabrimineNext, prevEl: fabriminePrev }"
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
                                    :subcategory="item.subcategory"
                                    :image="getImageUrl(item.image)"
                                    @click="router.push('/publication/' + item.id)"
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
            <section class="productos-recientes-section" v-show="false">
                <div class="productos-recientes-container">
                    <div class="section-title">

                        <div class="section-title-left">

                            <h2>Minerales Disponibles</h2>
                            <p>Compra y vende minerales en nuestra plataforma B2B especializada en minería.</p>
                        </div>
                        <div class="title-right">
                            <div class="custom-swiper-nav">
                                <button class="swiper-nav-btn" ref="mineralsDispPrev"><i class='bx bx-chevron-left'></i></button>
                                <button class="swiper-nav-btn" ref="mineralsDispNext"><i class='bx bx-chevron-right'></i></button>
                            </div>
                        </div>
                    </div>
                    
                    <div v-if="mineralsProducts.length > 0  && mineralsProducts.filter(item => item.category == 'Minerales').length > 0" class="swiper-products-wrapper">
                        <Swiper 
                            :modules="modules" 
                            :breakpoints="productsBreakpoints" 
                            :navigation="{ nextEl: mineralsDispNext, prevEl: mineralsDispPrev }"
                            class="products-swiper"
                        >
                            <SwiperSlide v-for="item in mineralsProducts.filter(item => item.category == 'Minerales')" :key="item.id">
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
                                    @click="router.push('/publication/' + item.id)"
                                />
                            </SwiperSlide>
                        </Swiper>
                    </div>
                    <div v-else class="loading-products">
                        <p>Cargando publicaciones...</p>
                    </div>
                </div>
            </section>


             <!-- Benefits Section -->
            <section class="cv-benefits-section">
                <div class="cv-section-container">
                    <div class="cv-section-header">
                        <h2 class="cv-section-title">Nuestros servicios</h2>
                        <p class="cv-section-subtitle">Fabrimine ofrece una amplia gama de servicios para satisfacer las necesidades de nuestros clientes.</p>
                    </div>

                    <div class="cv-benefits-grid">
                        <div 
                            v-for="(benefit, index) in benefits" 
                            :key="index" 
                            class="cv-benefit-card"
                        >
                            <div class="cv-benefit-icon">
                                <i :class="benefit.icon"></i>
                            </div>
                            <h3 class="cv-benefit-title">{{ benefit.title }}</h3>
                            <p class="cv-benefit-description">{{ benefit.description }}</p>
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
                        <router-link to="/proyectos" class="cf-cta" style="text-decoration: none; display: inline-block;">Ver proyectos realizados</router-link>
                    </div>
                    <div class="cf-image-wrapper">
                           <div>
                                <svg class="curve-svg curve-left" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M20 20C20 9 11 0 0 0H20V20Z"/>
                                </svg>
                                <div class="sc-white-container">
                                      <div class="circle-dark" @click="toggleProjectPlay" style="cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 10;">
                                          <i class='bx' :class="isProjectPlaying ? 'bx-pause' : 'bx-play'" style="font-size: 32px; margin-left: 2px;"></i>
                                    </div>
                                </div>
                                <svg class="curve-svg curve-right" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path d="M20 20C20 9 11 0 0 0H20V20Z"/>
                                </svg>
                            </div>

                        <transition name="projects-fade" mode="out-in">
                            <img :key="currentProjectSlideData.id" :src="currentProjectSlideData.image" alt="Proyecto Minero de Fabrimine" class="cf-main-img" />
                        </transition>
                    </div>
                </div>
            </section>


        </main>
        
        <MarketplaceFooter />
    </div>
</template>

<style src="@/assets/css/pages/home-bento.css" scoped></style>
<style src="@/assets/css/pages/como-vender.css" scoped></style>

