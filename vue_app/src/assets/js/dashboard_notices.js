import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Swal from 'sweetalert2'
import axios from 'axios'
import { getImageUrl } from '@/assets/js/imageHelper.js';
import { checkSession } from '@/services/authService';

export function useDashboardNotices() {
    const route = useRoute()

    // ---------------------------------------------
    // ESTADO Y VARIABLES
    // ---------------------------------------------
    const user = ref(null)
    const notices = ref([])
    const totalCount = ref(0)
    const currentPage = ref(1)
    const itemsPerPage = 3
    const totalPages = ref(1)

    const search = ref('')
    const isManualSearch = ref(false)

    const showModal = ref(false)       // Para ver detalles (si aplica)
    const showCreateModal = ref(false) // Para crear nueva noticia
    const showEditModal = ref(false)   // Para editar
    const selectedNotice = ref(null)
    const selectedForEdit = ref(null)  // Noticia a editar
    const isSidebarOpen = ref(true)

    // Pagination Helper (Simple integration)
    const visiblePages = ref([1])

    // ---------------------------------------------
    // FUNCIONES UI
    // ---------------------------------------------

    function toggleSidebar() {
        isSidebarOpen.value = !isSidebarOpen.value
    }

    function openCreateModal() {
        showCreateModal.value = true;
    }

    function showNoticeDetails(id) {
        const notice = notices.value.find(n => n.id === id);
        if (notice) {
            selectedNotice.value = notice;
            showModal.value = true;
        }
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

    function handleNoticeCreated() {
        loadPage(1);
    }

    // ---------------------------------------------
    // LÓGICA DE DATOS
    // ---------------------------------------------

    async function loadPage(page = 1) {
        currentPage.value = page
        const endpoint = `/api/publications_service/notices`;

        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', itemsPerPage);

            if (search.value) {
                // Note: Notices controller might filter locally or via SQL in future. 
                // Currently controller doesn't filter by search text in SQL, 
                // so we might need to rely on what backend gives or update backend to filter.
                // For now, if backend returns filtered data, great. If not, thisparam does nothing.
                // Ideally backend should handle this, but let's pass it anyway.
                params.append('search', search.value);
            }

            const { data } = await axios.get(`${endpoint}?${params.toString()}`, {
                withCredentials: true
            })

            // Response structure change handling
            // New: { data: [], totalCount: N, ... }
            // Old: [ ... ]

            let fetchedNotices = [];
            let fetchedTotal = 0;

            if (data && Array.isArray(data.data)) {
                fetchedNotices = data.data;
                fetchedTotal = data.totalCount;
            } else if (Array.isArray(data)) {
                // Fallback for backward compatibility or if update failed
                fetchedNotices = data;
                fetchedTotal = data.length;
            }

            // If backend doesn't support search yet, we can't fully fix it here without backend changes.
            // But pagination relies on backend returning the correct slice.
            // Using backend response directly:
            notices.value = fetchedNotices;
            totalCount.value = Number(fetchedTotal) || 0;

            // Recalculate total pages
            totalPages.value = Math.ceil(totalCount.value / itemsPerPage) || 1;

            // Update visible pages
            const pages = [];
            let startPage = Math.max(1, currentPage.value - 2);
            let endPage = Math.min(totalPages.value, startPage + 4);
            if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

            for (let i = startPage; i <= endPage; i++) pages.push(i);
            visiblePages.value = pages;

        } catch (err) {
            console.error('Error cargando noticias:', err)
            notices.value = []
            totalCount.value = 0
        }
    }

    // ---------------------------------------------
    // 🔥 ACCIONES: ELIMINAR Y EDITAR
    // ---------------------------------------------

    async function deleteNotice(id) {
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
                const { data } = await axios.delete(`/api/publications_service/notices/${id}`, {
                    withCredentials: true
                })

                if (data.success) {
                    Swal.fire(
                        '¡Eliminado!',
                        'La noticia ha sido eliminada.',
                        'success'
                    )
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

    function editNotice(item) {
        selectedForEdit.value = item;
        showEditModal.value = true;
    }

    function handleNoticeUpdated() {
        loadPage(currentPage.value);
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
            }
        } catch (error) {
            console.error("Error checking session:", error);
        }

        await loadPage(1)
    })

    return {
        user,
        notices,
        totalCount,
        currentPage,
        totalPages,
        visiblePages,
        search,
        isManualSearch,
        showModal,
        showCreateModal,
        showEditModal,
        selectedNotice,
        selectedForEdit,
        isSidebarOpen,
        toggleSidebar,
        openCreateModal,
        showNoticeDetails,
        clearFilters,
        goToPage,
        handleNoticeCreated,
        deleteNotice,
        editNotice,
        handleNoticeUpdated,
        loadPage,
        getImageUrl
    }
}
