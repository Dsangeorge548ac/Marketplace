<script setup>
import FooterComponent from '@/components/footer/footer.vue'
import MarketplaceLeftSidebar from '@/components/marketplace/MarketplaceLeftSidebar.vue'
import ProductCard from '@/components/card/ProductCard.vue'
import MarketplaceHeader from '@/components/header/Header.vue'
import MineralTicker from '@/components/MineralTicker.vue'
import { useMarketplace } from '@/assets/js/marketplace.js'
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const showFilters = ref(false); // Can be kept for mobile toggle if needed, but not used in desktop flex layout
const router = useRouter();

const {
    search,
    categories,
    subCategories, // NEW
    locations,
    minPrice,
    maxPrice,
    priceRanges,
    products,
    totalCount,
    currentPage,
    loading,
    showModal,
    selectedHarvest,
    isClearing,
    totalPages,
    visiblePages,
    loadPage,
    handleCategoryChange,
    clearFilters,
    getCategoryName,
    getLocationName,
    goToPage,
    getImageUrl,
    handleImageError,
} = useMarketplace()

const venezuelaStates = [
    'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar', 'Carabobo', 'Cojedes', 
    'Delta Amacuro', 'Dependencias Federales', 'Distrito Capital', 'Falcón', 'Guárico', 'Lara', 
    'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira', 
    'Trujillo', 'La Guaira', 'Yaracuy', 'Zulia'
];

</script>
<template>
    <main>
      
        <MarketplaceHeader />

        <MineralTicker />

        <main class="main-content">
            <div class="container-place">
                
                <!-- Left Sidebar -->
                <MarketplaceLeftSidebar 
                    :selectedLocations="locations"
                    :availableLocations="venezuelaStates"
                    :selectedCategory="categories"
                    :selectedSubcategories="subCategories"
                    @update:locations="locations = $event"
                    @update:category="categories = $event"
                    @update:subcategories="subCategories = $event"
                    @filter-change="loadPage(1, true)" 
                    @clear-all="clearFilters()"
                />
                
                <section class="products-section" style="flex: 1;">

                    <div class="products-header" style="margin-bottom: 24px;">
                        <div class="results-info">
                            <span>{{ totalCount }} resultado{{ totalCount !== 1 ? 's' : '' }}</span>
                        </div>
                    </div>
    
                    <div v-if="products.length === 0" class="no-results" style="text-align: center; padding: 40px; color: #666;">
                        <h3>No se encontraron productos</h3>
                        <p>Intenta cambiar los filtros o términos de búsqueda</p>
                        <button @click="clearFilters" style="margin-top:10px; padding: 8px 16px; cursor:pointer;">
                            Limpiar filtros
                        </button>
                    </div>
    
                    <div v-else class="products-grid">
                        <ProductCard
                            v-for="item in products"
                            :key="item.id"
                            :title="item.name"
                            :price="item.price || 'Consultar'"
                            :state="getLocationName(item.state)"
                            :country="getLocationName(item.country)"
                            :city="getLocationName(item.city)"
                            :quantity="item.quantity"
                            :manufacturer="item.manufacturer || item.brand || 'N/A'"
                            :category="getCategoryName(item.category)"
                            :image="getImageUrl(item.image)"
                            @click="router.push('/publication/' + item.id)"
                        />
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
        </main>
        
        <FooterComponent />
    </main>
</template>

<style scoped>
.products-section {
    margin: 40px 0 !important;
    padding: 0 !important;
}

.scrollable-filter {
    max-height: 250px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding-right: 5px;
}

/* Floating filters container */
.floating-filters {
    position: absolute;
    top: 40px; /* Below the products header */
    right: 0;
    z-index: 100;
    width: 100%;
    padding: 14px;
    max-width: 1200px; /* Like the image width */
    background: transparent;
}

.filter-toggle-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #f3f4f6;
    border: 1px solid #e5e7eb;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: #4b5563;
    cursor: pointer;
    transition: all 0.2s;
}

.filter-toggle-btn:hover {
    background-color: #e5e7eb;
}

.filter-toggle-btn.active {
    background-color: gold;
    color: black;
    border-color: gold;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.scrollable-filter::-webkit-scrollbar {
    width: 6px;
}
.scrollable-filter::-webkit-scrollbar-track {
    background: #f1f1f1;
}
.scrollable-filter::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 3px;
}
.scrollable-filter::-webkit-scrollbar-thumb:hover {
    background: #aaa;
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
    background-color: gainsboro; /* Dark pill background */
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
    padding: 14px 25px 14px 35px;
    border-radius: 24px;
    border: none;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.pagination-prev {
    background-color: gainsboro; /* Dark gray */
    color: black;
}

.pagination-prev:hover {
    background-color: #4b5563;
}

.pagination-next {
    background-color: gold; /* Orange */
    color: black;
}

.pagination-next:hover {
    background-color: black;
    color: white;
}

.pagination-prev:disabled, .pagination-next:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}
</style>

