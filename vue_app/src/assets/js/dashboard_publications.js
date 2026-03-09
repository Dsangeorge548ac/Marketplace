import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Swal from 'sweetalert2'
import axios from 'axios'
import { getImageUrl } from '@/assets/js/imageHelper.js';
import { checkSession } from '@/services/authService';

export function useDashboardPublications() {
    const route = useRoute()

    // ---------------------------------------------
    // ESTADO Y VARIABLES
    // ---------------------------------------------
    const user = ref(null)
    const products = ref([])
    const totalCount = ref(0)
    const currentPage = ref(1)
    const itemsPerPage = 9
    const totalPages = ref(1) // Necesario calcular dinámicamente usualmente, pero mantengamos estructura ref

    const search = ref('')
    const isManualSearch = ref(false)

    const showModal = ref(false)       // Para ver detalles
    const showCreateModal = ref(false) // Para crear nueva publicación
    const showEditModal = ref(false)   // Para editar
    const selectedHarvest = ref(null)
    const selectedForEdit = ref(null)  // Producto a editar
    const isSidebarOpen = ref(true)

    // Pagination Helper
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

    // ---------------------------------------------
    // FUNCIONES UI
    // ---------------------------------------------

    function toggleSidebar() {
        isSidebarOpen.value = !isSidebarOpen.value
    }

    function openCreateModal() {
        // Validación de rol: Solo 'asociado comercial' puede crear
        if (!user.value || (user.value.role && user.value.role.toLowerCase() !== 'asociado' && user.value.role.toLowerCase() !== 'developer')) {
            Swal.fire({
                title: 'Acceso Restringido',
                text: 'Solo los usuarios con el rol "Asociado Comercial" pueden publicar nuevos productos.',
                icon: 'warning',
                confirmButtonColor: '#059669'
            });
            return;
        }
        showCreateModal.value = true;
    }

    function showHarvestDetails(id) {
        const harvest = products.value.find(p => p.id === id)
        if (!harvest) return
        selectedHarvest.value = harvest
        showModal.value = true
    }

    function clearFilters() {
        search.value = ''
        isManualSearch.value = false
        loadPage(1)
    }

    function goToPage(page) {
        if (page < 1 || page > totalPages.value) return;
        loadPage(page);
    }

    function handlePostCreated() {
        loadPage(1);
    }

    // ---------------------------------------------
    // LÓGICA DE DATOS
    // ---------------------------------------------

    async function loadPage(page = 1) {
        currentPage.value = page

        // Si no hay usuario cargado, no intentamos fetch
        if (!user.value || !user.value.id) {
            console.warn("loadPage: Usuario no definido o sin ID");
            return;
        }

        const params = new URLSearchParams()
        params.append('limit', itemsPerPage)
        params.append('page', page)

        if (search.value) {
            params.append('search', search.value)
        }

        try {
            // SIEMPRE obtener solo las publicaciones del usuario actual para el dashboard
            const endpoint = `/api/publications_service/user/${user.value.id}`;
            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888'; // Acceder env aquí si es necesario, o el proxy lo maneja
            // En realidad, el proxy maneja /api, así que solo ruta relativa funciona o ruta completa
            const endpointFull = `/api/publications_service/user/${user.value.id}`;

            const { data } = await axios.get(`${endpointFull}?${params.toString()}`, {
                withCredentials: true
            })

            let fetchedProducts = data.data || [];
            let count = Number(data.totalCount) || 0;

            if (search.value) {
                const term = search.value.toLowerCase();
                fetchedProducts = fetchedProducts.filter(p =>
                    (p.name && p.name.toLowerCase().includes(term)) ||
                    (p.description && p.description.toLowerCase().includes(term)) ||
                    (p.model && p.model.toLowerCase().includes(term))
                );
                count = fetchedProducts.length;
            }

            products.value = fetchedProducts;
            totalCount.value = count;

            // Calcular total de páginas
            totalPages.value = Math.ceil(totalCount.value / itemsPerPage) || 1;



        } catch (err) {
            console.error('Error cargando publicaciones:', err)
            products.value = []
            totalCount.value = 0
        }
    }

    // ---------------------------------------------
    // 🔥 ACCIONES: ELIMINAR Y EDITAR
    // ---------------------------------------------

    async function deletePublication(id) {
        // 1. Confirmar con SweetAlert2
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "¡No podrás revertir esto!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        })

        if (result.isConfirmed) {
            try {
                // 2. Enviar petición al backend (API REST: DELETE /:id)
                const { data } = await axios.delete(`/api/publications_service/${id}`, {
                    withCredentials: true
                })

                if (data.success) {
                    Swal.fire(
                        '¡Eliminado!',
                        'Tu publicación ha sido eliminada.',
                        'success'
                    )
                    // 3. Recargar la lista
                    loadPage(currentPage.value)
                } else {
                    Swal.fire('Error', data.message || 'No se pudo eliminar', 'error')
                }
            } catch (error) {
                console.error(error)
                Swal.fire('Error', 'Hubo un problema al conectar con el servidor', 'error')
            }
        }
    }

    function editPublication(item) {
        selectedForEdit.value = item;
        showEditModal.value = true;
    }

    // ---------------------------------------------
    // OBSERVADORES Y CICLO DE VIDA
    // ---------------------------------------------

    watch(
        () => route.query.search,
        (newSearch) => {
            search.value = newSearch || ''
            if (newSearch) {
                isManualSearch.value = true
            }
            loadPage(1)
        }
    )

    onMounted(async () => {
        if (route.query.search) {
            search.value = route.query.search
            isManualSearch.value = true
        }

        try {
            const userData = await checkSession();
            if (userData && !userData.error) {
                user.value = userData;
            } else {
                user.value = null;
            }
        } catch (error) {
            console.error("Error obteniendo sesión del usuario:", error);
        }

        await loadPage(1)
    })

    return {
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
        isSidebarOpen,
        toggleSidebar,
        openCreateModal,
        showHarvestDetails,
        clearFilters,
        goToPage,
        handlePostCreated,
        deletePublication,
        editPublication,
        loadPage,
        getImageUrl
    }
}
