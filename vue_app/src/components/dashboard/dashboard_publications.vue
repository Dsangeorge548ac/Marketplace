<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router';
import { useDashboardPublications } from '@/assets/js/dashboard_publications.js'
import { isSidebarOpen } from '@/assets/js/dashboardState.js'
import ProductCard from '@/components/card/ProductCard.vue'
import dashboard_banner from '@/components/dashboard/dashboard_banner.vue'
// 1. IMPORTAR COMPONENTES
const modalPost = defineAsyncComponent(() => import('@/components/modals/modal_post.vue'))
const createPostModal = defineAsyncComponent(() => import('@/components/modals/create_post_modal.vue'))
const EditPostModal = defineAsyncComponent(() => import('@/components/modals/Edit_post_modal.vue'))
const EditMineralModal = defineAsyncComponent(() => import('@/components/modals/edit_mineral_modal.vue'))
const createMineralModal = defineAsyncComponent(() => import('@/components/modals/create_mineral_modal.vue'))
const router = useRouter();

const {
    user,
    products,
    isLoading,
    totalCount,
    currentPage,
    totalPages,
    visiblePages,
    search,
    isManualSearch,
    showModal,
    showCreateModal,
    showEditModal,
    showEditMineralModal,
    showCreateMineralModal,
    selectedHarvest,
    selectedForEdit,
    openCreateModal,
    openCreateMineralModal,
    showHarvestDetails,
    clearFilters,
    goToPage,
    handlePostCreated,
    deletePublication,
    editPublication,
    loadPage,
    getImageUrl
} = useDashboardPublications()

// computed para saber si el usuario actual está verificado
const isVerified = computed(() => user.value?.status === 'Verificado')

</script>

<template>
  <div class="dashboard-page-wrapper">
    <div class="dashboard-content">

           <dashboard_banner />

            <section class="products-section">
                <!-- ... content ... -->
                <div class="products-header">
                    <div class="results-info">
                        <span>{{ totalCount }} resultado{{ totalCount !== 1 ? 's' : '' }}</span>
                    </div>

                <div class="button-beetwen">
                        <button
                            class="publication-btn mineral-pub-btn"
                            :class="{ 'btn-disabled': !isVerified }"
                            :title="!isVerified ? 'Debes estar verificado para publicar' : ''"
                            @click="openCreateMineralModal"
                            v-show="false"
                        >
                            <i class='bx bx-plus'></i> Publicar Mineral
                        </button>
                        <button
                            class="publication-btn"
                            :class="{ 'btn-disabled': !isVerified }"
                            :title="!isVerified ? 'Debes estar verificado para publicar' : ''"
                            @click="openCreateModal"
                        >
                            <i class='bx bx-plus'></i> Publicar producto
                        </button>
                    </div>
                </div>

                <!-- Banner: usuario no verificado -->
                <div v-if="!isLoading && user && !isVerified" class="verification-banner">
                    <div class="verification-banner__icon">
                        <i class="bx bx-shield-x"></i>
                    </div>
                    <div class="verification-banner__body">
                        <strong>Cuenta no verificada</strong>
                        <p>Para crear publicaciones debes completar el proceso de verificación de cuenta. Ve a <router-link to="/account">Mi cuenta</router-link> y solicita la verificación.</p>
                    </div>
                </div>

                <div v-if="isLoading" class="products-grid loading-grid" style="padding-top: 20px;">
                    <div v-for="i in 6" :key="i" class="product-card skeleton-card">
                        <div class="skeleton-image" style="height: 180px; width: 100%; border-radius: 12px 12px 0 0;"></div>
                        <div class="skeleton-content" style="padding: 16px;">
                            <div class="skeleton-line" style="height: 20px; width: 80%; margin-bottom: 12px; border-radius: 4px;"></div>
                            <div class="skeleton-line" style="height: 16px; width: 60%; margin-bottom: 8px; border-radius: 4px;"></div>
                            <div class="skeleton-line" style="height: 16px; width: 40%; margin-bottom: 16px; border-radius: 4px;"></div>
                            <div class="skeleton-button" style="height: 36px; width: 100%; border-radius: 8px;"></div>
                        </div>
                    </div>
                </div>

                <div v-else-if="products.length === 0" class="no-results" style="text-align: center; padding: 40px; color: #666;">
                    <h3>No se encontraron publicaciones</h3>
                    <p>Crea una nueva publicacion para comenzar</p>
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
                        :state="item.state || 'No especificada'"
                        :country="item.country"
                        :city="item.city"
                        :manufacturer="item.manufacturer || 'N/A'"
                        :image="getImageUrl(item.image)"
                        :rating="item.rating || 4.9"
                        @click="router.push('/publication/' + item.id)"
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

                <div class="pagination-wrapper-dashboard" v-if="products.length > 0">
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

  <EditMineralModal
    :openModal="showEditMineralModal"
    :publication="selectedForEdit"
    @close="showEditMineralModal = false"
    @updated="loadPage(currentPage)"
  />

  <createMineralModal
    :openModal="showCreateMineralModal"
    @close="showCreateMineralModal = false"
    @created="handlePostCreated"
  />
  </div>
</template>

<style scoped>
.products-section {
    margin: 0 20px !important;
    padding: 5px !important;
}

/* ── Botón deshabilitado (usuario no verificado) ────────────────── */
.btn-disabled {
    opacity: 0.45;
    cursor: not-allowed;
    filter: grayscale(40%);
}

/* ── Banner de verificación ─────────────────────────────────────── */
.verification-banner {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
    border: 1.5px solid #f59e0b;
    border-radius: 12px;
    padding: 14px 18px;
    margin: 12px 0 18px;
    box-shadow: 0 2px 8px rgba(245, 158, 11, 0.12);
}

.verification-banner__icon {
    font-size: 28px;
    color: #d97706;
    flex-shrink: 0;
    line-height: 1;
    margin-top: 2px;
}

.verification-banner__body {
    flex: 1;
}

.verification-banner__body strong {
    display: block;
    font-size: 14px;
    font-weight: 700;
    color: #92400e;
    margin-bottom: 4px;
}

.verification-banner__body p {
    font-size: 13px;
    color: #78350f;
    margin: 0;
    line-height: 1.5;
}

.verification-banner__body a {
    color: #d97706;
    font-weight: 600;
    text-decoration: underline;
}

.verification-banner__body a:hover {
    color: #b45309;
}

.section-scroll-dasboard {
    display: flex;
    flex-direction:inherit !important;
}
</style>
