import { ref, computed, onMounted, watch, onUnmounted, nextTick } from 'vue'
import { useRoute, onBeforeRouteUpdate } from 'vue-router'
import Swal from 'sweetalert2'
import axios from 'axios'
import { getImageUrl, handleImageError } from '@/assets/js/imageHelper';

// --- Variables Reactivas Globales (Shared via Composable) ---
const search = ref('')
const categories = ref(['todas'])
const subCategories = ref([]) // NEW
const locations = ref([])
const minPrice = ref('')
const maxPrice = ref('')
const priceRanges = ref([])
const products = ref([])
const totalCount = ref(0)
const currentPage = ref(1)
const itemsPerPage = 9
const loading = ref(false)
const showModal = ref(false)
const selectedHarvest = ref(null)
const isClearing = ref(false)

export function useMarketplace() {
    const route = useRoute()

    // --- Configuración Toast Segura ---
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    })

    // --- Carga de Datos ---
    let abortController = null;

    async function loadPage(page = 1, source = 'auto', customLimit = null) {
        if (abortController) abortController.abort();
        abortController = new AbortController();

        loading.value = true;
        currentPage.value = page;
        const currentLimit = customLimit || itemsPerPage;

        // 1. Gestión de Alertas Visuales
        if (source === 'search' && !Swal.isVisible()) {
            Swal.fire({
                title: 'Buscando...',
                text: `Procesando: "${search.value}"`,
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading() }
            });
        }

        const params = new URLSearchParams();
        params.append('limit', currentLimit.toString());
        params.append('page', page.toString());

        if (search.value && search.value.trim().length > 0) params.append('search', search.value.trim().substring(0, 100));
        if (categories.value.length > 0 && !categories.value.includes('todas')) params.append('categories', categories.value.join(','));
        if (subCategories.value.length > 0) params.append('sub_categories', subCategories.value.join(',')); // NEW
        if (locations.value.length) params.append('locations', locations.value.join(','));
        if (minPrice.value && !isNaN(minPrice.value)) params.append('minPrice', minPrice.value);
        if (maxPrice.value && !isNaN(maxPrice.value)) params.append('maxPrice', maxPrice.value);
        if (priceRanges.value.length) params.append('ranges', priceRanges.value.join(','));

        try {
            if (source === 'search') await new Promise(resolve => setTimeout(resolve, 800));

            const url = `/api/publications_service/?${params.toString()}`;
            const { data } = await axios.get(url, { signal: abortController.signal });

            if (!data || typeof data !== 'object') throw new Error('Respuesta del servidor inválida');

            const apiData = Array.isArray(data.data) ? data.data : [];

            products.value = apiData;
            totalCount.value = Number(data.totalCount) || 0;

            // 3. Manejo de Resultados (Feedback al usuario)
            if (products.value.length === 0) {
                if (source === 'search') {
                    Swal.fire({
                        icon: 'info',
                        title: 'Sin resultados',
                        text: `No se encontraron coincidencias para "${search.value}".`,
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else if (Swal.isVisible() && Swal.getTitle()?.textContent === 'Buscando...') {
                    Swal.close();
                }
            } else if (source === 'search') {
                Swal.fire({
                    icon: 'success',
                    title: '¡Encontrado!',
                    text: `${totalCount.value} coincidencias.`,
                    timer: 2000,
                    showConfirmButton: false
                });
            } else if (source === 'filter') {
                Toast.fire({ icon: 'success', title: `Filtros: ${totalCount.value} resultados` });
            } else {
                if (Swal.isVisible() && Swal.getTitle()?.textContent === 'Buscando...') {
                    Swal.close();
                }
            }

        } catch (err) {
            if (axios.isCancel(err)) return;

            console.error('Error cargando productos:', err);

            // On error we clear the list
            products.value = [];
            totalCount.value = 0;

            if (source !== 'auto') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Error de conexión',
                    text: 'No se pudieron cargar las publicaciones en este momento.'
                });
            }

        } finally {
            if (!abortController.signal.aborted) {
                loading.value = false;
            }
        }
    }

    function handleCategoryChange(val) {
        if (isClearing.value) return;

        if (val === 'todas') {
            if (categories.value.includes('todas')) {
                categories.value = ['todas'];
            } else {
                categories.value = ['todas'];
            }
        } else {
            if (categories.value.includes('todas')) {
                categories.value = categories.value.filter(c => c !== 'todas');
            }

            if (categories.value.length === 0) {
                categories.value = ['todas'];
            }
        }

        loadPage(1, 'filter');
    }

    function clearFilters() {
        isClearing.value = true;

        categories.value = ['todas'];
        subCategories.value = []; // NEW
        locations.value = [];
        minPrice.value = '';
        maxPrice.value = '';
        priceRanges.value = [];
        search.value = '';

        Toast.fire({ icon: 'success', title: 'Filtros reiniciados' });
        loadPage(1, 'auto');

        nextTick(() => {
            setTimeout(() => { isClearing.value = false; }, 300);
        });
    }

    function showHarvestDetails(id) {
        if (!id) return;
        const harvest = products.value.find(p => p.id === id);
        if (harvest) { selectedHarvest.value = harvest; showModal.value = true; }
    }

    const getCategoryName = (c) => {
        const map = { maquina: 'Maquinas', insumo: 'Insumos', vehiculos: 'Vehiculos' };
        return map[c] || c || 'Desconocido';
    }

    const getLocationName = (l) => {
        if (!l) return 'No especificada';
        const map = { norte: 'Norte', centro: 'Centro', sur: 'Sur' };
        const key = l.toString().toLowerCase();
        return map[key] || l;
    }

    const totalPages = computed(() => itemsPerPage > 0 ? Math.ceil(totalCount.value / itemsPerPage) : 0);

    const visiblePages = computed(() => {
        const current = currentPage.value;
        const total = totalPages.value;
        if (total <= 0) return [];

        if (total <= 9) {
            return Array.from({ length: total }, (_, i) => i + 1);
        }

        if (current <= 5) {
            return [1, 2, 3, 4, 5, 6, 7, '...', total];
        } else if (current >= total - 4) {
            return [1, '...', total - 6, total - 5, total - 4, total - 3, total - 2, total - 1, total];
        } else {
            return [1, '...', current - 2, current - 1, current, current + 1, current + 2, '...', total];
        }
    });

    function goToPage(p) {
        if (!loading.value && p >= 1 && p <= totalPages.value) {
            loadPage(p, 'pagination');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }


    watch(
        () => route.query.search,
        (newSearch) => {
            if (isClearing.value) return;
            search.value = newSearch || '';
            loadPage(1, 'search');
        }
    );

    onBeforeRouteUpdate((to, from, next) => {
        if (to.query.search === from.query.search) Swal.close();
        next();
    });

    watch([locations, priceRanges], () => {
        if (isClearing.value) return;
        Toast.fire({ icon: 'info', title: 'Aplicando filtros...' });
        loadPage(1, 'filter');
    });

    onMounted(() => {
        try {
            if (route.query.search) {
                search.value = route.query.search;
                const headerAlertIsOpen = Swal.isVisible();
                loadPage(1, headerAlertIsOpen ? 'search' : 'auto');
            } else {
                loadPage(1, 'auto');
            }
        } catch (e) {
            console.error('Error en montaje', e);
        }
    });

    onUnmounted(() => {
        if (abortController) abortController.abort();
        Swal.close();
    });

    return {
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
        showHarvestDetails,
        getCategoryName,
        getLocationName,
        goToPage,
        getImageUrl,
        handleImageError
    }
}
