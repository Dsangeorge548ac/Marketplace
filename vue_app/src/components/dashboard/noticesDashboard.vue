<script setup>
import { defineAsyncComponent } from 'vue'
import sidebar from '@/components/sidebar/sidebar.vue'
import { useDashboardNotices } from '@/assets/js/dashboard_notices.js'
import { isSidebarOpen } from '@/assets/js/dashboardState.js'


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

</script>

<template>
    
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
 <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">

    <div class="dashboard-content">

            <div class="app-brand-container">
                    <!-- Botón hamburguesa al lado del título -->
                    <button v-if="!isSidebarOpen" class="btn-menu-toggle" @click="isSidebarOpen = true">
                        <i class='bx bx-menu'></i>
                    </button>
                    <div class="brand-icon" >
                        <i class='bx bx-layer'></i>
                    </div>
              
                    <h3 class="app-brand-title">Noticias</h3>
            </div>

            <section class="products-section">
                <!-- ... content ... -->
                <div class="products-header">
                    <div class="results-info">
                        <span>{{ totalCount }} resultado{{ totalCount !== 1 ? 's' : '' }}</span>
                    </div>

                    <div class="button-beetwen">
                        <button class="publication-btn" @click="openCreateModal">
                            <i class='bx bx-plus'></i> Publicar Noticia
                        </button>
                    </div>
                </div>

                <div v-if="notices.length === 0" class="no-results">
                    <h3>No se encontraron noticias</h3>
                    <p>Intenta cambiar los filtros o términos de búsqueda</p>
                </div>

                <div v-else class="products-grid notices-grid">
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
                                <button class="btn-action" @click.stop.prevent="deleteNotice(item.id)">
                                    <i class='bx bx-trash'></i> Eliminar
                                </button>
                                <!-- <button class="btn-action edit" @click.stop.prevent="editNotice(item)">
                                    <i class='bx bx-edit'></i> Editar
                                </button> -->
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