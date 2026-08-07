<script setup>
import { defineAsyncComponent, ref } from 'vue'
import sidebar from '@/components/sidebar/sidebar.vue'
import { useDashboardNotices } from '@/assets/js/dashboard_notices.js'
import { isSidebarOpen } from '@/assets/js/dashboardState.js'
import dashboard_banner from '@/components/dashboard/dashboard_banner.vue'

// 1. IMPORTAR COMPONENTES
const CreateNoticeModal = defineAsyncComponent(() => import('@/components/modals/CreateNoticeModal.vue'))
const EditNoticeModal = defineAsyncComponent(() => import('@/components/modals/EditNoticeModal.vue'))

const selectedNoticeForEdit = ref(null)
const showEditModal = ref(false)

const {
    user,
    notices,
    totalCount,
    currentPage,
    totalPages,
    visiblePages,
    search,
    showModal,
    showCreateModal,
    selectedNotice,
    openCreateModal,
    showNoticeDetails,
    clearFilters,
    goToPage,
    handleNoticeCreated,
    deleteNotice,
    editNotice,
    handleNoticeUpdated,
    getImageUrl
} = useDashboardNotices()

function openNewsLink(url) {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
}

function openEditModal(item) {
    selectedNoticeForEdit.value = item
    showEditModal.value = true
}

function handleNoticeEdited() {
    showEditModal.value = false
    selectedNoticeForEdit.value = null
    handleNoticeUpdated()
}

</script>

<template>
    
    <div class="dashboard-content">

          <dashboard_banner />
    
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
                    <p>Crea una nueva publicacion para comenzar</p>
                </div>

                <div v-else class="products-grid notices-grid">
                    <div v-for="item in notices" :key="item.id" class="notice-card">
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

                            <div class="dashboard-card-actions-notices">
                                <button class="action-btn delete-btn" @click.stop.prevent="deleteNotice(item.id)">
                                    <i class='bx bx-trash'></i>
                                </button>
                                <button class="action-btn edit-btn" @click.stop.prevent="openEditModal(item)">
                                    <i class='bx bx-edit-alt'></i>
                                </button>
                                <button class="action-btn edit-btn" @click.stop.prevent="openNewsLink(item.news_url)">
                                    <i class='bx bx-link-external'></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

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
                </section>
            
    </div>

    <CreateNoticeModal
    :openModal="showCreateModal"
    @close="showCreateModal = false"
    @created="handleNoticeCreated"
  />

  <EditNoticeModal
    :openModal="showEditModal"
    :notice="selectedNoticeForEdit"
    @close="showEditModal = false"
    @updated="handleNoticeEdited"
  />

</template>

<style scoped>
.products-section {
    margin: 0 20px !important;
    padding: 5px !important;
}
</style>