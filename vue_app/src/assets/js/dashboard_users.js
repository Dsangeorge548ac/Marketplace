import { ref, computed, watch, onMounted } from 'vue' // Agregado watch
import Swal from 'sweetalert2'
import axios from 'axios'

// IMPORTACIONES DataTables ELIMINADAS

export function useDashboardUsers() {
    // ---------------------------------------------
    // ESTADO
    // ---------------------------------------------
    const currentUserRole = ref('Administrador')
    const isSidebarOpen = ref(true)

    // Estado de Datos
    const users = ref([])
    const totalCount = ref(0)
    const currentPage = ref(1)
    const itemsPerPage = 10
    const totalPages = ref(1)
    const isLoading = ref(false)

    // Filtros
    const search = ref('')
    const isManualSearch = ref(false)

    // Estado del Modal
    const isModalOpen = ref(false)
    const selectedUser = ref(null)

    // Auxiliar de Paginación
    const visiblePages = ref([1])

    const allRoles = ["Administrador", "Usuario", "Asociado", "Developer"]
    const availableRoles = computed(() => allRoles)

    // ---------------------------------------------
    // LOGICA DE DATOS
    // ---------------------------------------------
    async function loadAllUsers(page = 1) {
        isLoading.value = true
        currentPage.value = page
        users.value = []

        try {
            // Usando endpoint existente. Puede necesitar adaptación si el endpoint espera 'start/length' (estilo DataTables)
            // o 'page/limit' (Estilo moderno). 
            // El user_service actual parece soportar parámetros DataTables (start, length, search[value]).
            // Adaptaremos nuestros params "Modernos" a lo que el backend probablemente espera o actualizaremos el backend luego.
            // Asumamos que enviamos params estándar y el backend lo maneja, O imitamos params DataTables por ahora para evitar romper el backend.

            // Imitar params DataTables para estar seguros con backend existente
            const start = (page - 1) * itemsPerPage;

            const params = {
                draw: 1,
                start: start,
                length: itemsPerPage,
                "search[value]": search.value || ""
            }

            const { data } = await axios.get('/api/user_service/', {
                params: params,
                withCredentials: true
            });

            // Parsear formato de respuesta DataTables: { data: [], recordsFiltered: N, ... }
            if (data.data) {
                users.value = data.data;
                totalCount.value = data.recordsFiltered || data.recordsTotal || 0;
            } else if (Array.isArray(data)) {
                // Fallback si el backend cambió
                users.value = data;
                totalCount.value = data.length;
            }

            // Calcular Paginación
            totalPages.value = Math.ceil(totalCount.value / itemsPerPage) || 1;

            // Calc páginas visibles (ventana simple)
            const pages = [];
            // Mostrar hasta 5 páginas
            let startPage = Math.max(1, currentPage.value - 2);
            let endPage = Math.min(totalPages.value, startPage + 4);
            if (endPage - startPage < 4) startPage = Math.max(1, endPage - 4);

            for (let i = startPage; i <= endPage; i++) pages.push(i);
            visiblePages.value = pages;

        } catch (err) {
            console.error("Error loading users:", err)
            Swal.fire("Error", "No se pudieron cargar los usuarios", "error")
        } finally {
            isLoading.value = false
        }
    }

    // ---------------------------------------------
    // ACCIONES UI
    // ---------------------------------------------
    function toggleSidebar() {
        isSidebarOpen.value = !isSidebarOpen.value
    }

    function goToPage(page) {
        if (page < 1 || page > totalPages.value) return;
        loadAllUsers(page);
    }

    function searchUsers() {
        // Debounce puede agregarse en componente
        loadAllUsers(1);
    }

    // ---------------------------------------------
    // MODAL & CRUD
    // ---------------------------------------------
    async function openModal(user = null) {
        if (user) {
            try {
                // Obtener datos frescos
                const { data } = await axios.get(`/api/user_service/${user.id}`, { withCredentials: true });
                selectedUser.value = data.error ? { ...user } : data;
            } catch (e) {
                selectedUser.value = { ...user };
            }
        } else {
            selectedUser.value = null;
        }
        isModalOpen.value = true
    }

    function handleUserUpdated() {
        // Refresco suave: Recargar datos de página actual
        // SIN RECARGA DE PÁGINA
        loadAllUsers(currentPage.value);
    }

    async function deleteUser(user) {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: `Se eliminará a ${user.name}.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonText: 'Cancelar',
            confirmButtonText: 'Sí, eliminar'
        })

        if (result.isConfirmed) {
            try {
                const { data } = await axios.delete(`/api/user_service/${user.id}`, { withCredentials: true })

                if (data.success) {
                    Swal.fire('Eliminado', 'Usuario eliminado correctamente.', 'success')
                    loadAllUsers(currentPage.value); // Refresco suave
                } else {
                    Swal.fire('Error', data.message || 'No se pudo eliminar', 'error')
                }
            } catch (error) {
                const serverMessage = error.response && error.response.data
                    ? error.response.data.message
                    : 'No se pudo eliminar el usuario';

                Swal.fire('Error', serverMessage, 'error')
            }
        }
    }

    watch(search, (val) => {
        if (!val) loadAllUsers(1); // Auto reset al limpiar
    })

    onMounted(() => {
        loadAllUsers(1)
    })

    return {
        currentUserRole,
        isSidebarOpen,
        users,
        isLoading,
        totalCount,
        currentPage,
        totalPages,
        visiblePages,
        search,
        isModalOpen,
        selectedUser,
        availableRoles,
        toggleSidebar,
        loadAllUsers,
        goToPage,
        searchUsers,
        openModal,
        handleUserUpdated,
        deleteUser
    }
}
