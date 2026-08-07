<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import MarketplaceHeader from '@/components/header/Header.vue';
import MineralTicker from '@/components/MineralTicker.vue';
import FooterComponent from '@/components/footer/footer.vue';
import axios from '@/services/axiosInstance';
import { getImageUrl } from '@/assets/js/imageHelper.js';
import ProductCard from '@/components/card/ProductCard.vue'

const route = useRoute();

// State
const notices = ref([]);
const totalCount = ref(0);
const currentPage = ref(1);
const itemsPerPage = 9;
const totalPages = ref(1);
const loading = ref(false);
const search = ref('');

// Visible pages for pagination
const visiblePages = computed(() => {
    const pages = [];
    const total = totalPages.value;
    const current = currentPage.value;

    if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i);
    } else {
        pages.push(1);
        if (current > 3) pages.push('...');

        const start = Math.max(2, current - 1);
        const end = Math.min(total - 1, current + 1);

        for (let i = start; i <= end; i++) pages.push(i);

        if (current < total - 2) pages.push('...');
        pages.push(total);
    }
    return pages;
});

// Load notices from API
async function loadPage(page = 1) {
    loading.value = true;
    currentPage.value = page;

    try {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', itemsPerPage);
        if (search.value) params.append('search', search.value);

        const { data } = await axios.get(`/api/publications_service/notices?${params.toString()}`, {
            withCredentials: true
        });

        let fetchedNotices = [];
        let fetchedTotal = 0;

        if (data && Array.isArray(data.data)) {
            fetchedNotices = data.data;
            fetchedTotal = data.totalCount;
        } else if (Array.isArray(data)) {
            fetchedNotices = data;
            fetchedTotal = data.length;
        }

        notices.value = fetchedNotices;
        totalCount.value = Number(fetchedTotal) || 0;
        totalPages.value = Math.ceil(totalCount.value / itemsPerPage) || 1;
    } catch (err) {
        console.error('Error cargando noticias:', err);
        notices.value = [];
        totalCount.value = 0;
    } finally {
        loading.value = false;
    }
}

function goToPage(page) {
    if (page === '...' || page < 1 || page > totalPages.value) return;
    loadPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openNewsLink(url) {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

watch(() => route.query.search, (newSearch) => {
    search.value = newSearch || '';
    loadPage(1);
});

onMounted(() => {
    if (route.query.search) {
        search.value = route.query.search;
    }
    loadPage(1);
});
</script>

<template>
    <div class="noticias-page-wrapper">
        <MarketplaceHeader />
        <MineralTicker />

        <main class="noticias-main">
            <div class="noticias-container">

                <!-- Page Header -->
                <div class="noticias-page-header">
                    <div class="noticias-page-header-left" v-show="false">
                        <h1 class="noticias-page-title">Noticias del Sector Minero</h1>
                        <p class="noticias-page-subtitle">Mantente informado con las últimas noticias, novedades y tendencias de la industria minera.</p>
                    </div>
                    <div class="noticias-results-count">
                        <span>{{ totalCount }} noticia{{ totalCount !== 1 ? 's' : '' }}</span>
                    </div>
                </div>

                <!-- Loading State -->
                <div v-if="loading" class="noticias-loading">
                    <div class="noticias-skeleton-grid">
                        <div v-for="n in 6" :key="n" class="noticias-skeleton-card">
                            <div class="skeleton-image shimmer"></div>
                            <div class="skeleton-content">
                                <div class="skeleton-line short shimmer"></div>
                                <div class="skeleton-line shimmer"></div>
                                <div class="skeleton-line medium shimmer"></div>
                            </div>
                        </div>
                    </div>
                </div>

                 <div v-else class="products-grid notices-grid">
                    <div v-for="item in notices" :key="item.id" class="notice-card"  @click.stop.prevent="openNewsLink(item.news_url)">
                        <div class="notice-image-container">
                            <img 
                                :src="getImageUrl(item.image)" 
                                class="notice-img" 
                                loading="lazy"
                                :alt="item.title"
                                @error="$event.target.src = '/placeholder.jpg'"
                            >
                        </div>

                        <div class="notice-content">
                            <h3 class="notice-title">{{ item.title }}</h3>
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                 <div class="pagination-wrapper-dashboard" v-if="notices.length > 0">
                    <div class="pagination-numbers">
                        <button 
                            v-for="(item, index) in visiblePages" 
                            :key="index"
                            :class="['pagination-num-btn', { active: item === currentPage, 'pagination-ellipsis': item === '...' }]"
                            @click="item !== '...' && goToPage(item)"
                            :disabled="item === '...'"
                        >
                            {{ item }}
                        </button>
                    </div>
                    <div class="pagination-controls">
                        <button class="pagination-prev" :disabled="currentPage===1" @click="goToPage(currentPage-1)">
                            Anterior
                        </button>
                        <button class="pagination-next" :disabled="currentPage===totalPages" @click="goToPage(currentPage+1)">
                            Siguiente
                        </button>
                    </div>
                </div>

            </div>
        </main>

        <FooterComponent />
    </div>
</template>

<style scoped>
.noticias-main {
    max-width: 1440px;
    margin: auto;
    padding: 20px;
}
</style>

