<script setup>
import { defineAsyncComponent } from 'vue'
import sidebar from '@/components/sidebar/sidebar.vue'
import { useDashboardPublications } from '@/assets/js/dashboard_publications.js'
import { isSidebarOpen } from '@/assets/js/dashboardState.js'
import ProductCard from '@/components/card/ProductCard.vue'

// 1. IMPORTAR COMPONENTES
const modalPost = defineAsyncComponent(() => import('@/components/modals/modal_post.vue'))
const createPostModal = defineAsyncComponent(() => import('@/components/modals/create_post_modal.vue'))
const EditPostModal = defineAsyncComponent(() => import('@/components/modals/EditPostModal.vue'))

const {
    user,
    products,
    totalCount,
    currentPage,
    totalPages,
    visiblePages,
    search,
    isManualSearch,
    showModal,
    showCreateModal,
    showEditModal,
    selectedHarvest,
    selectedForEdit,
    openCreateModal,
    showHarvestDetails,
    clearFilters,
    goToPage,
    handlePostCreated,
    deletePublication,
    editPublication,
    loadPage,
    getImageUrl
} = useDashboardPublications()

</script>

<template>
    <div>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
 <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">

    <div class="dashboard-content">

            <div class="app-brand-container">
                    <!-- Botón hamburguesa al lado del título -->
                    <button v-if="!isSidebarOpen" class="btn-menu-toggle" @click="isSidebarOpen = true">
                        <i class='bx bx-menu'></i>
                    </button>
                    <div class="brand-icon" >
                        <i class='bx bxs-component'></i>
                    </div>
              
                    <h3 class="app-brand-title">Publicaciones</h3>
            </div>

            <section class="products-section">
                <!-- ... content ... -->
                <div class="products-header">
                    <div class="results-info">
                        <span>{{ totalCount }} resultado{{ totalCount !== 1 ? 's' : '' }}</span>
                    </div>

                    <div class="button-beetwen">
                        <button class="publication-btn" @click="openCreateModal">
                            <i class='bx bx-plus'></i> Publicar producto
                        </button>
                    </div>
                </div>

                <div v-if="products.length === 0" class="no-results" style="text-align: center; padding: 40px; color: #666;">
                    <h3 v-if="search">No se encontraron resultados para "<span class="search-term">{{ search }}</span>"</h3>
                    <h3 v-else>No hay publicaciones disponibles</h3>
                </div>

                <div v-else class="products-grid">
                    <ProductCard
                        v-for="item in products" 
                        :key="item.id"
                        :item="item"
                        :title="item.name"
                        :price="item.price || 'Consultar'"
                        :quantity="item.quantity"
                        :category="item.category || 'N/A'"
                        :location="item.state || 'No especificada'"
                        :manufacturer="item.manufacturer || 'N/A'"
                        :image="getImageUrl(item.image)"
                        :rating="item.rating || 4.9"
                        @click="showHarvestDetails(item.id)"
                    >
                        <template #actions>
                            <div class="dashboard-card-actions">
                                <button class="action-btn delete-btn" @click.stop="deletePublication(item.id)">
                                    <i class='bx bx-trash'></i>
                                </button>
                                <button class="action-btn edit-btn" @click.stop="editPublication(item)">
                                    <i class='bx bx-edit'></i>
                                </button>
                            </div>
                        </template>
                    </ProductCard>
                </div>

                <div class="pagination-wrapper" v-if="products.length > 0">
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
                            <i class='bx bx-chevron-left'></i> Anterior
                        </button>
                        <button class="pagination-next" :disabled="currentPage===totalPages" @click="goToPage(currentPage+1)">
                            Siguiente <i class='bx bx-chevron-right'></i>
                        </button>
                    </div>
                </div>
                </section>
            
    </div>

  

    <modalPost 
        :isModalOpen="showModal"
        :selectedHarvest="selectedHarvest"
        @close="showModal = false"
    />

  <createPostModal
    :openModal="showCreateModal"
    @close="showCreateModal = false"
    @created="handlePostCreated"
  />

  <EditPostModal
    :openModal="showEditModal"
    :publication="selectedForEdit"
    @close="showEditModal = false"
    @updated="loadPage(currentPage)"
  />
  </div>
</template>

<style scoped>
.dashboard-card-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    width: 100%;
}

.action-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.2s;
}

.delete-btn {
    background-color: #fee2e2;
    color: #ef4444;
}

.delete-btn:hover {
    background-color: #fecaca;
    transform: scale(1.1);
}

.edit-btn {
    background-color: #e0f2fe;
    color: #0ea5e9;
}

.edit-btn:hover {
    background-color: #bae6fd;
    transform: scale(1.1);
}

/* Pagination Styles based on Design */
.pagination-wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin-top: 2rem;
}

.pagination-numbers {
    display: flex;
    align-items: center;
    background-color: #2a2d34; /* Dark pill background */
    border-radius: 24px;
    padding: 6px 12px;
    gap: 4px;
}

.pagination-num-btn {
    background: none;
    border: none;
    color: #9ca3af;
    min-width: 32px;
    height: 32px;
    border-radius: 50%; /* Make them perfect circles */
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    padding: 0;
}

.pagination-num-btn:hover {
    color: #fff;
}

.pagination-num-btn.active {
    background-color: #ffffff;
    color: #111827;
}

.pagination-ellipsis {
    color: #9ca3af;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none !important;
    min-width: 24px;
    cursor: default;
}

.pagination-controls {
    display: flex;
    gap: 12px;
}

.pagination-prev, .pagination-next {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 24px;
    border: none;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.pagination-prev {
    background-color: #374151; /* Dark gray */
    color: #fff;
}

.pagination-prev:hover {
    background-color: #4b5563;
}

.pagination-next {
    background-color: #f97316; /* Orange */
    color: #fff;
}

.pagination-next:hover {
    background-color: #ea580c;
}

.pagination-prev:disabled, .pagination-next:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

/* Media query to stack pagination on mobile */
@media (max-width: 768px) {
    .pagination-wrapper {
        flex-direction: column;
        gap: 1.5rem;
    }
}
</style>
