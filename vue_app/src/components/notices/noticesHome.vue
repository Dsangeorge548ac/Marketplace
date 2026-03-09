<script setup>
import { defineAsyncComponent } from 'vue'

import { useDashboardNotices } from '@/assets/js/dashboard_notices.js'
import { ref } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

// 1. IMPORTAR COMPONENTES
const CreateNoticeModal = defineAsyncComponent(() => import('@/components/modals/CreateNoticeModal.vue'))
const NoticeDetailModal = defineAsyncComponent(() => import('@/components/modals/NoticeDetailModal.vue'))
// const EditNoticeModal = defineAsyncComponent(() => import('@/components/modals/EditNoticeModal.vue'))

const {
    user,
    notices, // changed from products
    totalCount,
    currentPage,
    totalPages,
    visiblePages,
    search,
    // isManualSearch,
    showModal,
    showCreateModal,
    // showEditModal,
    selectedNotice,
    // selectedForEdit,
    // isSidebarOpen,
    // toggleSidebar,
    openCreateModal,
    showNoticeDetails, 
    clearFilters,
    goToPage,
    handleNoticeCreated,
    deleteNotice,
    // editNotice,
    // handleNoticeUpdated,
    // loadPage,
    getImageUrl
} = useDashboardNotices()


const tickers = ref([
    { id: 1, name: 'Trituradora', price: '450.00', change: '+2.4%', up: true },
    { id: 2, name: 'Molino de bolas', price: '1,200.00', change: '-0.5%', up: false },
    { id: 3, name: 'Cinta transportadora', price: '89.50', change: '+1.2%', up: true },
    { id: 4, name: 'Excavadora Hidráulica', price: '3,500.00', change: '+5.7%', up: true },
    { id: 5, name: 'Zaranda Vibratoria', price: '320.00', change: '-1.1%', up: false },
    { id: 6, name: 'Excavadora Hidráulica', price: '3,500.00', change: '+5.7%', up: true },
    { id: 7, name: 'Zaranda Vibratoria', price: '320.00', change: '-1.1%', up: false },
    { id: 8, name: 'Excavadora Hidráulica', price: '3,500.00', change: '+5.7%', up: true },
    { id: 9, name: 'Zaranda Vibratoria', price: '320.00', change: '-1.1%', up: false },
]);

const modules = [Autoplay, Pagination];

const swiperBreakpoints = {
    320: {
        slidesPerView: 1,
        spaceBetween: 10
    },
    550: {
        slidesPerView: 3,
        spaceBetween: 20
    },
    900: {
        slidesPerView: 4,
        spaceBetween: 20
    },
    1200: {
        slidesPerView: 7,
        spaceBetween: 30
    }
};
</script>

<template>
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">

    <div class="notices-container">

            <div v-if="notices.length === 0" class="no-results">
                <h3>No se encontraron noticias</h3>
                <p>Intenta cambiar los filtros o términos de búsqueda</p>
            </div>

            <section v-else class="notices-section">
            
                <div class="products-grid notices-grid">
                    <div v-for="item in notices" :key="item.id" class="notice-card" @click="showNoticeDetails(item.id)">
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
                            <div class="notice-date">
                                <i class='bx bx-calendar'></i> {{ new Date(item.created_at).toLocaleDateString() }}
                            </div>
                            <h3 class="notice-title">{{ item.title }}</h3>
                            <h4 class="notice-subtitle" v-if="item.subtitle">{{ item.subtitle }}</h4>
                            <p class="notice-description">{{ item.description }}</p>

                            <div class="notice-actions">
                                <button class="btn-action" @click="showNoticeDetails(item.id)">
                                    Mas información
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                

                <div class="pagination-container-post" v-if="notices.length > 0">
                    <button :disabled="currentPage===1" @click="goToPage(currentPage-1)">&laquo;</button>
                    <button v-for="page in visiblePages" :key="page" :class="{ 'active-page': page===currentPage }" @click="goToPage(page)">
                        {{ page }}
                    </button>
                    <button :disabled="currentPage===totalPages" @click="goToPage(currentPage+1)">&raquo;</button>
                    </div>
                </section>
            
    </div>

    <CreateNoticeModal
    :openModal="showCreateModal"
    @close="showCreateModal = false"
    @created="handleNoticeCreated"
  />

  <NoticeDetailModal
    :isOpen="showModal"
    :notice="selectedNotice"
    @close="showModal = false"
  />

</template>


<style scoped>
    .pagination-container-post {
        margin-bottom: 20px;
    }
</style>