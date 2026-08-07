<script setup>
import { ref, defineProps, defineEmits, watch, computed } from 'vue';
import { miningCategories, categoryKeys } from '@/assets/js/categories';

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
    },
    selectedSubcategories: {
        type: Array,
        default: () => []
    }
});

const emit = defineEmits(['update:locations', 'filter-change', 'update:category', 'update:subcategories', 'clear-all']);

// --- Local State ---
const localLocations = ref([...props.selectedLocations]);

watch(() => props.selectedLocations, (newVal) => {
    localLocations.value = [...newVal];
});

// --- Categories ---
const categories = [
    { key: 'todas', label: 'Todas' },
    ...categoryKeys.map(k => ({ key: k, label: k }))
];

const selectCategory = (catKey) => {
    emit('update:category', [catKey]);
    emit('update:subcategories', []);
    emit('filter-change');
};

// --- Subcategories ---
const currentSubs = computed(() => {
    const parent = props.selectedCategory[0];
    if (parent && parent !== 'todas') {
        return miningCategories[parent] || [];
    }
    return [];
});

const localSubcategories = ref([...props.selectedSubcategories]);

watch(() => props.selectedSubcategories, (newVal) => {
    localSubcategories.value = [...newVal];
});

const toggleSubcategory = (sub) => {
    const idx = localSubcategories.value.indexOf(sub);
    if (idx === -1) {
        localSubcategories.value.push(sub);
    } else {
        localSubcategories.value.splice(idx, 1);
    }
    emit('update:subcategories', localSubcategories.value);
    emit('filter-change');
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

// --- Collapsible Sections State ---
const openSections = ref({
    models: true,
    subcategorias: true,
    ubicacion: true
});

const toggleSection = (section) => {
    openSections.value[section] = !openSections.value[section];
};

</script>

<template>
    <aside class="sidebar-filters">
        <!-- Models section (Radio buttons style) -->
        <div class="filter-card">
            <div class="collapsible-section">
                <div class="collapsible-header" @click="toggleSection('models')">
                    <div class="header-title">
                        <i class='bx bx-grid-alt title-icon'></i>
                        <span>Categorías</span>
                    </div>
                    <i class='bx math-icon' :class="openSections.models ? 'bx-chevron-up' : 'bx-chevron-down'"></i>
                </div>
                <div class="collapsible-content filter-list" v-show="openSections.models">
                    <label 
                        v-for="cat in categories" 
                        :key="cat.key" 
                        class="radio-label"
                        :class="{ 'active-item': selectedCategory.includes(cat.key) }"
                    >
                        <input 
                            type="radio" 
                            name="category" 
                            :value="cat.key" 
                            :checked="selectedCategory.includes(cat.key)"
                            @change="selectCategory(cat.key)"
                        >
                        <span class="custom-radio"></span>
                        <span class="label-text">
                            {{ cat.label }} 
                        </span>
                    </label>
                </div>
            </div>
        </div>

        <!-- Subcategorías section -->
        <div class="filter-card">
            <div class="collapsible-section">
                <div class="collapsible-header" @click="toggleSection('subcategorias')">
                    <div class="header-title">
                        <i class='bx bx-list-ul title-icon'></i>
                        <span>Subcategorías</span>
                    </div>
                    <i class='bx math-icon' :class="openSections.subcategorias ? 'bx-chevron-up' : 'bx-chevron-down'"></i>
                </div>
                <div class="collapsible-content scrollable-list" v-show="openSections.subcategorias">
                    <template v-if="currentSubs.length > 0">
                        <label 
                            v-for="sub in currentSubs" 
                            :key="sub" 
                            class="checkbox-label"
                            :class="{ 'active-item': localSubcategories.includes(sub) }"
                        >
                            <input 
                                type="checkbox" 
                                :value="sub" 
                                :checked="localSubcategories.includes(sub)"
                                @change="toggleSubcategory(sub)"
                            >
                            <span class="custom-radio"></span>
                            <span class="label-text">{{ sub }}</span>
                        </label>
                    </template>
                    <div v-else class="empty-state-message">
                        <p class="placeholder-text">Selecciona una categoría primero</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Ubicación section -->
        <div class="filter-card">
            <div class="collapsible-section">
                <div class="collapsible-header" @click="toggleSection('ubicacion')">
                    <div class="header-title">
                        <i class='bx bx-map title-icon'></i>
                        <span>Ubicación</span>
                    </div>
                    <i class='bx math-icon' :class="openSections.ubicacion ? 'bx-chevron-up' : 'bx-chevron-down'"></i>
                </div>
                <div class="collapsible-content scrollable-list" v-show="openSections.ubicacion">
                    <label 
                        v-for="loc in availableLocations" 
                        :key="loc" 
                        class="checkbox-label"
                        :class="{ 'active-item': localLocations.includes(loc) }"
                    >
                        <input 
                            type="checkbox" 
                            :value="loc" 
                            :checked="localLocations.includes(loc)"
                            @change="toggleLocation(loc)"
                        >
                        <span class="custom-radio"></span>
                        <span class="label-text">{{ loc }}</span>
                    </label>
                </div>
            </div>
        </div>

        <button v-if="localLocations.length > 0 || localSubcategories.length > 0 || selectedCategory[0] !== 'todas'" 
                class="btn-clear-filters" 
                @click.prevent="emit('clear-all')">
            Limpiar filtros
        </button>
    </aside>
</template>
