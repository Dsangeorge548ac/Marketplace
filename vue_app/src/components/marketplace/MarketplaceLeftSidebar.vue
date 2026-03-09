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
    ubicacion: false,
    carroceria: false,
    asientos: false,
    propulsion: false,
    combustible: false
});

const toggleSection = (section) => {
    openSections.value[section] = !openSections.value[section];
};

</script>

<template>
    <aside class="sidebar-filters">
        <!-- Models section (Radio buttons style) -->
        <div class="collapsible-section">
            <div class="collapsible-header" @click="toggleSection('models')">
                <span>Categorías</span>
                <span class="math-icon">{{ openSections.models ? '−' : '+' }}</span>
            </div>
            <div class="collapsible-content filter-list" v-show="openSections.models">
                <label 
                    v-for="cat in categories" 
                    :key="cat.key" 
                    class="radio-label"
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

        <hr class="short-divider" />

        <!-- Subcategorías section -->
        <div class="collapsible-section" v-if="currentSubs.length > 0">
            <div class="collapsible-header" @click="toggleSection('subcategorias')">
                <span>Subcategorías</span>
                <span class="math-icon">{{ openSections.subcategorias ? '−' : '+' }}</span>
            </div>
            <div class="collapsible-content scrollable-list" v-show="openSections.subcategorias">
                <label 
                    v-for="sub in currentSubs" 
                    :key="sub" 
                    class="checkbox-label"
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
            </div>
        </div>
        
        <hr class="short-divider" v-if="currentSubs.length > 0"/>

        <!-- Ubicación section -->
        <div class="collapsible-section">
            <div class="collapsible-header" @click="toggleSection('ubicacion')">
                <span>Ubicación</span>
                <span class="math-icon">{{ openSections.ubicacion ? '−' : '+' }}</span>
            </div>
            <div class="collapsible-content scrollable-list" v-show="openSections.ubicacion">
                <label 
                    v-for="loc in availableLocations" 
                    :key="loc" 
                    class="checkbox-label"
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
        <hr class="full-divider" />

        <!-- Carrocería -->
        <div class="collapsible-section">
            <div class="collapsible-header" @click="toggleSection('carroceria')">
                <span>Carrocería</span>
                <span class="math-icon">{{ openSections.carroceria ? '−' : '+' }}</span>
            </div>
            <div class="collapsible-content" v-show="openSections.carroceria">
                <p class="placeholder-text">Opciones de carrocería</p>
            </div>
        </div>
        <hr class="full-divider" />

        <!-- Asientos -->
        <div class="collapsible-section">
            <div class="collapsible-header" @click="toggleSection('asientos')">
                <span>Asientos</span>
                <span class="math-icon">{{ openSections.asientos ? '−' : '+' }}</span>
            </div>
            <div class="collapsible-content" v-show="openSections.asientos">
                <p class="placeholder-text">Opciones de asientos</p>
            </div>
        </div>
        <hr class="full-divider" />

        <!-- Propulsión -->
        <div class="collapsible-section">
            <div class="collapsible-header" @click="toggleSection('propulsion')">
                <span>Propulsión</span>
                <span class="math-icon">{{ openSections.propulsion ? '−' : '+' }}</span>
            </div>
            <div class="collapsible-content" v-show="openSections.propulsion">
                <p class="placeholder-text">Opciones de propulsión</p>
            </div>
        </div>
        <hr class="full-divider" />

        <!-- Tipo de combustible -->
        <div class="collapsible-section">
            <div class="collapsible-header" @click="toggleSection('combustible')">
                <span>Tipo de combustible</span>
                <span class="math-icon">{{ openSections.combustible ? '−' : '+' }}</span>
            </div>
            <div class="collapsible-content" v-show="openSections.combustible">
                <p class="placeholder-text">Opciones de combustible</p>
            </div>
        </div>
        <hr class="full-divider" />

        <button v-show="false" class="btn-clear-filters" @click.prevent="emit('clear-all')">
            reajustar el filtro
        </button>
    </aside>
</template>

<style scoped>
.sidebar-filters {
    width: 300px;
    flex-shrink: 0;
    border-radius: 4px; 
    padding: 22px 10px;
    font-family: 'Inter', sans-serif;
    display: flex;
    flex-direction: column;
}

.filter-group-block {
    margin-bottom: 24px;
}

.filter-title {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    margin: 0 0 20px 0;
}

.filter-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

/* Radio / Checkbox Shared Styles */
.radio-label, .checkbox-label {
    display: flex;
    align-items: center;
    gap: 14px;
    cursor: pointer;
    font-size: 16px;
    color: #111827;
}

.radio-label input, .checkbox-label input {
    display: none;
}

.custom-radio {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid #c8c8c8;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    background-color: transparent;
    flex-shrink: 0;
}

/* Selected state for both */
.radio-label input:checked + .custom-radio,
.checkbox-label input:checked + .custom-radio {
    border: 6px solid #e6e6e6;
    background-color: #3483fa;
}

.label-text {
    flex: 1;
}

.count {
    color: #9ca3af;
    font-size: 14px;
}

/* Dividers */
.short-divider {
    border: 0;
    height: 1px;
    background-color: #e5e7eb;
    margin: 0;
    width: 45%;
}

.full-divider {
    border: 0;
    height: 1px;
    background-color: #e5e7eb;
    margin: 0;
    width: 100%;
}

/* Collapsible sections */
.collapsible-section {
    display: flex;
    flex-direction: column;
}

.collapsible-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    padding: 14px 0;
    font-size: 16px;
    font-weight: 600;
    color: #111827;
}

.math-icon {
    font-size: 20px;
    font-weight: 300;
    color: #6b7280;
}

.collapsible-content {
    padding-bottom: 16px;
}

.placeholder-text {
    font-size: 13px;
    color: #9ca3af;
    margin: 0;
}

/* Checkboxes Specific List */
.scrollable-list {
    max-height: 250px;
    overflow-y: auto;
    padding-right: 4px;
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.scrollable-list::-webkit-scrollbar {
    width: 4px;
}
.scrollable-list::-webkit-scrollbar-thumb {
    background-color: #d1d5db;
    border-radius: 4px;
}

/* Bottom clear button */
.btn-clear-filters {
    width: 100%;
    padding: 14px 0;
    background-color: transparent;
    border: 1px solid #111827;
    color: #111827;
    font-weight: 400;
    font-size: 14px;
    cursor: pointer;
    border-radius: 2px;
    transition: all 0.2s ease;
    margin-top: 32px;
    text-transform: lowercase;
}

.btn-clear-filters:hover {
    background-color: #e5e7eb;
}

@media (max-width: 768px) {
    .sidebar-filters {
        width: 100%;
        margin-bottom: 24px;
        padding: 30px 0;
    }
}
</style>
