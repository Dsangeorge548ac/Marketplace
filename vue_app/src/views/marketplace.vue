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

        <main class="main-content-marketplace">
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
                            <button class="mobile-filter-toggle" @click="showFilters = !showFilters">
                                <i class='bx' :class="showFilters ? 'bx-x' : 'bx-filter-alt'"></i>

                            </button>
                        </div>
                    </div>

                    <!-- Mobile Filters Overlay -->
                    <Transition name="filters-slide">
                        <div v-if="showFilters" class="mobile-filters-overlay">
                            <div class="mobile-filters-panel">
                                <div class="mobile-filters-header">
                                    <h3>Filtros</h3>
                                </div>
                                <MarketplaceLeftSidebar 
                                    :selectedLocations="locations"
                                    :availableLocations="venezuelaStates"
                                    :selectedCategory="categories"
                                    :selectedSubcategories="subCategories"
                                    @update:locations="locations = $event"
                                    @update:category="categories = $event"
                                    @update:subcategories="subCategories = $event"
                                    @filter-change="loadPage(1, true)" 
                                    @clear-all="clearFilters(); showFilters = false;"
                                />
                            </div>
                        </div>
                    </Transition>
    
                    <div v-if="products.length === 0" class="no-results" style="text-align: center; padding: 40px; color: #666;">
                        <h3>No se encontraron productos</h3>
                        <p>Intenta cambiar los filtros o términos de búsqueda</p>
                        <button @click="clearFilters" style="margin-top:10px; border-radius: 50px; border: none; background-color: gainsboro; padding: 12px 34px; cursor:pointer;">
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
                </section>
            </div>

            <div class="container-place align-pagination" v-if="products.length > 0">
                <div class="pagination-wrapper">
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
    </main>
</template>

