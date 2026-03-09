<script setup>
import { ref, defineProps, defineEmits, watch, computed, onMounted, onUnmounted } from 'vue';

const props = defineProps({
    selectedLocations: {
        type: Array,
        default: () => []
    },
    availableLocations: {
        type: Array,
        default: () => []
    },
    selectedCategory: {
        type: Array,
        default: () => ['todas']
    }
});

const emit = defineEmits(['update:locations', 'filter-change', 'update:category', 'clear-all']);

// --- Local State ---
const localLocations = ref([...props.selectedLocations]);
const isCategoryOpen = ref(false);
const isLocationOpen = ref(false);

const checkClickOutside = (e) => {
    if (!e.target.closest('.filter-pill-container')) {
        isCategoryOpen.value = false;
        isLocationOpen.value = false;
    }
}

onMounted(() => {
    document.addEventListener('click', checkClickOutside);
});
onUnmounted(() => {
    document.removeEventListener('click', checkClickOutside);
});

watch(() => props.selectedLocations, (newVal) => {
    localLocations.value = [...newVal];
});

// --- Categories ---
const categories = [
    { key: 'Mineria', label: 'Mineria'},
    { key: 'Construccion', label: 'Construcción'},
    { key: 'Transporte', label: 'Transporte'},
    { key: 'Procesamiento', label: 'Procesamiento'},
];

const currentCategoryLabel = computed(() => {
    if (!props.selectedCategory || props.selectedCategory.length === 0) return 'Category';
    const cat = categories.find(c => c.key === props.selectedCategory[0]);
    return cat ? cat.label : 'Category';
});

const selectCategory = (catKey) => {
    emit('update:category', [catKey]);
    emit('filter-change', { category: catKey });
    isCategoryOpen.value = false;
};

// --- Locations ---
const toggleLocation = (loc) => {
    const idx = localLocations.value.indexOf(loc);
    if (idx === -1) {
        localLocations.value.push(loc);
    } else {
        localLocations.value.splice(idx, 1);
    }
    emit('update:locations', localLocations.value);
    emit('filter-change', { location: localLocations.value });
};

</script>

<template>
    <div class="kaizen-filters-wrapper kaizen-filter-container">
        <div class="filters-header-title">
            <h2>Filtros</h2>
            <div class="title-underline"></div>
        </div>
        
        <div>
            <!-- Filters Grid Container -->
            <div class="filters-grid">
                <!-- Location Pill (functioning as dropdown) -->
                <div class="filter-box location-box" @click.stop="isLocationOpen = !isLocationOpen; isCategoryOpen = false">
                     <span>{{ localLocations.length > 0 ? `${localLocations.length} ubicaciones` : 'Ubicación' }}</span>
                     <i class='bx bx-chevron-down'></i>
                     
                     <transition name="fade">
                        <div class="dropdown-menu location-menu" v-if="isLocationOpen" @click.stop>
                            <div class="dropdown-scroll">
                                <div 
                                    v-for="loc in availableLocations" 
                                    :key="loc"
                                    class="dropdown-item checkbox-item dark-item"
                                    @click.stop="toggleLocation(loc)"
                                >
                                    <div class="checkbox dark-checkbox" :class="{ 'checked': localLocations.includes(loc) }">
                                        <i class='bx bx-check' v-if="localLocations.includes(loc)"></i>
                                    </div>
                                    <span>{{ loc }}</span>
                                </div>
                            </div>
                        </div>
                    </transition>
                </div>
                
                <!-- Category Pill (functioning as dropdown) -->
                <div class="filter-box category-box" @click.stop="isCategoryOpen = !isCategoryOpen; isLocationOpen = false">
                    <span>{{ currentCategoryLabel === 'Category' ? 'Categoría' : currentCategoryLabel }}</span>
                    <i class='bx bx-chevron-down'></i>
                    
                    <transition name="fade">
                        <div class="dropdown-menu" v-if="isCategoryOpen" @click.stop>
                             <div 
                                class="dropdown-item dark-item" 
                                @click.stop="selectCategory('todas')">
                                Todas
                            </div>
                            <div 
                                v-for="cat in categories" 
                                :key="cat.key" 
                                class="dropdown-item dark-item"
                                :class="{ 'active': selectedCategory.includes(cat.key) }"
                                @click.stop="selectCategory(cat.key)"
                            >
                                {{ cat.label }}
                                <i class='bx bx-check' v-if="selectedCategory.includes(cat.key)"></i>
                            </div>
                        </div>
                    </transition>
                </div>

                <div class="filter-box">
                    <span>Marca</span>
                    <i class='bx bx-chevron-down'></i>
                </div>

                <div class="filter-box">
                    <span>Tipo</span>
                    <i class='bx bx-chevron-down'></i>
                </div>
            </div>

            <div class="filter-actions-row">
                <button class="reset-all-btn" @click.stop="localLocations = []; emit('update:locations', []); selectCategory('todas'); emit('clear-all');">
                    Limpiar filtros
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Contenedor Principal Header - Ajuste al layout general */
.kaizen-filters-wrapper {
    font-family: 'Inter', sans-serif;
    width: 100%;
}

/* Título de Filtros */
.filters-header-title {
    margin-bottom: 24px;
    padding-left: 0;
}

.filters-header-title h2 {
    font-size: 1.1rem;
    font-weight: 700;
    color: #111827; /* Light theme text */
    margin: 0 0 8px 0;
}

/* Linea debajo del titulo */
.title-underline {
    height: 2px;
    width: 45px;
    background-color: #111827; /* Dark line to match light theme */
    border-radius: 2px;
}

/* Contenedor principal del filtro */
.kaizen-filter-container {
    background-color: #ffffff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 24px;
    display: flex;
    width: 100%;
    flex-direction: column;
    gap: 16px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.08); /* A slightly more pronounced shadow to lift it */
}

/* Filas de filtros */
.filters-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
}

@media (max-width: 1024px) {
    .filters-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 600px) {
    .filters-grid {
        grid-template-columns: 1fr;
    }
}

/* Cajas individuales (Dropdowns visuales) */
.filter-box {
    background-color: #f8f9fa; /* Lighter box inside */
    border: 1px solid #e5e7eb; 
    border-radius: 24px; /* Less round, more pill-like */
    padding: 10px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: #4b5563; /* Dark gray text */
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    flex: 1;
    min-width: 200px;
    position: relative;
    transition: all 0.2s ease;
}

.filter-box:hover {
    background-color: #e5e7eb; /* Hover slightly darker */
}

.filter-box i {
    color: #6b7280;
    font-size: 1.1rem;
}

/* Caja de Rango Combinada (Ej. Precio) */
.combined-box {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    min-width: 300px;
}

.combined-box .label, .combined-box .separator {
    color: #6b7280;
    font-size: 0.85rem;
}

.invisible-input {
    background: transparent;
    border: none;
    color: #111827; /* Dark text */
    font-size: 0.9rem;
    width: 80px;
    outline: none;
    font-family: inherit;
    text-align: right;
}

.invisible-input::placeholder {
    color: #9ca3af;
}

.reset-all-btn {
    background-color: #ffd700; /* Gold button */
    color: #111827; 
    border: none;
    padding: 12px 32px;
    border-radius: 50px; /* Completely rounded */
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.reset-all-btn:hover {
    background-color: black; /* Darker gold */
    color: white;
}

/* Info debajo de los filtros */
.filters-bottom-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24px;
}

.lots-text {
    background-color: #ffffff; /* Light background */
    color: #4b5563; /* Dark gray text */
    padding: 10px 20px;
    border-radius: 50px;
    font-size: 0.85rem;
    font-weight: 500;
    border: 1px solid #e5e7eb;
}

/* Sort dropdown */
.sort-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background-color: #ffffff; /* Light background */
    color: #4b5563; /* Dark gray text */
    padding: 10px 20px;
    border-radius: 50px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid #e5e7eb;
    transition: all 0.2s ease;
}

.sort-box:hover {
    background-color: #f3f4f6;
}

.sort-box i {
    color: #6b7280;
}

/* =========================================
   DROPDOWNS (Modificados para Tema Claro)
   ========================================= */

.dropdown-menu {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    min-width: 100%;
    background: #ffffff; /* Light dropdown background */
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); /* Subtle shadow for light theme */
    border: 1px solid #e5e7eb; /* Subtle border */
    z-index: 100;
    padding: 12px 0px 12px 12px;
    display: flex;
    flex-direction: column;
}

.dropdown-item.dark-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-radius: 8px;
    cursor: pointer;
    color: #4b5563; /* Dark gray text */
    font-size: 0.9rem;
    transition: background 0.2s;
}

.dropdown-item.dark-item:hover {
    background: #f3f4f6; /* Slightly gray on hover */
    color: #111827;
}

.dropdown-item.dark-item.active {
    background: #e5e7eb;
    color: #111827;
    font-weight: 600;
}

.dropdown-item.dark-item.active i {
    color: #daa520; /* Gold active check */
    font-size: 1.1rem;
}

/* Location Specific */
.location-menu {
    min-width: 100%;
}

.dropdown-scroll {
    max-height: 250px;
    overflow-y: auto;
    padding-right: 4px;
    border-radius: 50px;
}

.dropdown-scroll::-webkit-scrollbar {
    width: 6px;
    border-radius: 50px;
}
.dropdown-scroll::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 50px;
}

.checkbox-item {
    justify-content: flex-start;
    gap: 12px;
}

.checkbox.dark-checkbox {
    width: 20px;
    height: 20px;
    border-radius: 50%; /* Rounded checkboxes */
    border: 1px solid #d1d5db; /* Light border */
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    transition: all 0.2s;
}

.checkbox.dark-checkbox.checked {
    background: #ffd700; /* Gold */
    border-color: #ffd700;
}

.checkbox.dark-checkbox.checked i {
    color: #ffffff; /* White check icon */
    font-size: 1rem;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Actions Row for Reset and Search */
.filter-actions-row {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-top: 16px;
}

.show-offers-btn {
    background-color: #ffd700; /* Gold */
    color: #111827;
    border: none;
    border-radius: 24px;
    padding: 10px 24px;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.2s;
}

.show-offers-btn:hover {
    background-color: #daa520;
}
</style>
