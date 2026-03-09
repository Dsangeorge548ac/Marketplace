import { ref, computed, onMounted, defineAsyncComponent, watch } from 'vue'
import axios from 'axios'
import Swal from 'sweetalert2'
import { checkSession } from '@/services/authService'
import { getImageUrl } from '@/assets/js/imageHelper'

export function useDashboardOrders() {
    // ---------------------------------------------
    // ESTADO Y VARIABLES
    // ---------------------------------------------
    const isSidebarOpen = ref(true)
    const orders = ref([]) // Todos los pedidos filtrados
    const allOrders = ref([]) // Datos crudos de la API
    const isLoading = ref(true)
    const isLoadingDetails = ref(false) // Estado para carga de modal
    const user = ref(null)
    const viewMode = ref('purchases') // 'purchases' | 'sales'

    // Estado de Paginación y Búsqueda
    const search = ref('')
    const currentPage = ref(1)
    const itemsPerPage = 10
    const totalCount = ref(0)

    // Estado del Modal
    const showModal = ref(false)
    const showListModal = ref(false)
    const selectedProduct = ref(null)
    const selectedOrderProducts = ref([])
    const currentOrder = ref(null)

    // Verificación Admin Computada
    const isAdmin = computed(() => {
        return user.value && ['administrador', 'developer'].includes(user.value.role.toLowerCase());
    })

    // ---------------------------------------------
    // PAGINACIÓN Y FILTRADO COMPUTADOS
    // ---------------------------------------------
    // Nota: La búsqueda es actualmente solo del lado del cliente en la página obtenida porque el backend aún no soporta búsqueda.
    const filteredOrders = computed(() => {
        let result = allOrders.value;
        if (search.value) {
            const q = search.value.toLowerCase();
            result = result.filter(order =>
                (order.buyerName && order.buyerName.toLowerCase().includes(q)) ||
                (order.buyerEmail && order.buyerEmail.toLowerCase().includes(q)) ||
                (order.id.toString().includes(q)) ||
                (order.status && order.status.toLowerCase().includes(q))
            );
        }
        return result;
    });

    const paginatedOrders = computed(() => {
        // Dado que el backend maneja la paginación, solo devolvemos la lista filtrada (o allOrders)
        // Si se aplica búsqueda del lado del cliente en la página, filtra esa página.
        return filteredOrders.value;
    });

    const totalPages = computed(() => {
        return Math.ceil(totalCount.value / itemsPerPage);
    });

    const visiblePages = computed(() => {
        let pages = [];
        let startPage = Math.max(1, currentPage.value - 2);
        let endPage = Math.min(totalPages.value, currentPage.value + 2);

        if (totalPages.value <= 5) {
            startPage = 1;
            endPage = totalPages.value;
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    });

    // Lógica de reset: ¿búsqueda explícita dispara recarga? No, se necesita búsqueda en backend.
    // Por ahora, observar cambio de página.
    watch(currentPage, () => {
        loadOrders();
    });

    // ---------------------------------------------
    // LÓGICA DE DATOS
    // ---------------------------------------------
    async function loadOrders() {
        isLoading.value = true;

        let currentUser = JSON.parse(localStorage.getItem('user'));
        if (!currentUser) {
            try {
                const sessionUser = await checkSession();
                if (sessionUser) {
                    currentUser = sessionUser;
                    localStorage.setItem('user', JSON.stringify(currentUser));
                }
            } catch (e) {
                console.error("No se pudo recuperar la sesión", e);
            }
        }

        if (!currentUser) {
            console.error("User not found");
            isLoading.value = false;
            return;
        }

        user.value = currentUser;

        try {
            let apiUrl = '';

            // Construir URL con paginación
            const params = `?page=${currentPage.value}&limit=${itemsPerPage}`;

            if (isAdmin.value) {
                apiUrl = `/api/orders_service/${params}`;
            } else {
                if (viewMode.value === 'sales') {
                    apiUrl = `/api/orders_service/seller/${currentUser.id}${params}`;
                } else {
                    apiUrl = `/api/orders_service/user/${currentUser.id}${params}`;
                }
            }

            const { data } = await axios.get(apiUrl);

            // Manejar Estructura de Paginación
            let ordersData = [];
            if (data && data.data) {
                ordersData = data.data;
                totalCount.value = data.total || 0;
            } else if (Array.isArray(data)) {
                // Fallback para respuesta de array heredada
                ordersData = data;
                totalCount.value = data.length;
            } else {
                ordersData = [];
                totalCount.value = 0;
            }

            if (ordersData.length > 0) {
                const userCache = {};
                const enrichedOrders = await Promise.all(ordersData.map(async (order) => {
                    let buyerName = 'N/A';
                    let buyerEmail = 'N/A';

                    if (viewMode.value === 'sales' || isAdmin.value) {
                        if (userCache[order.user_id]) {
                            const u = userCache[order.user_id];
                            buyerName = u.name || u.full_name || u.username;
                            buyerEmail = u.email;
                        } else {
                            try {
                                const uRes = await axios.get(`/api/user_service/${order.user_id}`);
                                if (uRes.data) {
                                    userCache[order.user_id] = uRes.data;
                                    buyerName = uRes.data.name || uRes.data.full_name || uRes.data.username;
                                    buyerEmail = uRes.data.email;
                                }
                            } catch (e) {
                                console.warn(`[Orders] Error fetching user ${order.user_id}:`, e.message);
                                buyerName = `Usuario ${order.user_id}`;
                                buyerEmail = 'No disponible';
                            }
                        }
                    } else {
                        buyerName = currentUser.name || currentUser.full_name || currentUser.username || 'Yo';
                        buyerEmail = currentUser.email;
                    }

                    return { ...order, buyerName, buyerEmail };
                }));

                // No es necesario ordenar si el backend ordena, pero mantengamos consistencia por si acaso
                // enrichedOrders.sort((a, b) => b.id - a.id); 
                allOrders.value = enrichedOrders;
            } else {
                allOrders.value = [];
            }

        } catch (err) {
            console.error('Error cargando pedidos:', err)
            allOrders.value = []
            totalCount.value = 0;
        } finally {
            isLoading.value = false;
        }
    }

    function switchMode(mode) {
        viewMode.value = mode;
        currentPage.value = 1;
        // ¿loadOrders llamado por watch(currentPage) si cambia, si no llamar manualmente?
        // si el modo cambia pero la página es 1, el watch no se disparará.
        loadOrders();
    }

    function goToPage(page) {
        if (page >= 1 && page <= totalPages.value) {
            currentPage.value = page;
        }
    }

    async function viewDetails(order) {
        if (!order || !order.items || order.items.length === 0) {
            Swal.fire('Info', 'Este pedido no tiene articulos (data legacy?)', 'info');
            return;
        }

        try {
            Swal.fire({
                title: 'Cargando productos...',
                didOpen: () => Swal.showLoading()
            });

            // Obtener detalles para todos los ítems
            const promises = order.items.map(async (item) => {
                const formData = new FormData();
                formData.append('id', item.machine_id);
                try {
                    const { data } = await axios.post('/api/publications_service/get-card', formData);
                    if (data && !data.error) {
                        // Procesar Imagen usando helper
                        let startImage = null;

                        if (data.image) {
                            startImage = getImageUrl(data.image);
                        } else if (data.main_image_url) {
                            startImage = getImageUrl(data.main_image_url);
                        } else if (data.images && data.images.length > 0) {
                            startImage = getImageUrl(data.images[0]);
                        }

                        return {
                            ...data,
                            quantity: item.quantity,
                            image: startImage // Propiedad normalizada para template
                        };
                    }
                } catch (postErr) {
                    // console.warn(`Item ${item.machine_id} not found.`);
                }
                return null;
            });

            const results = await Promise.all(promises);
            selectedOrderProducts.value = results.filter(p => p !== null);
            currentOrder.value = order;

            Swal.close();

            if (selectedOrderProducts.value.length === 0) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Aviso',
                    text: 'Los productos de este pedido ya no están disponibles.'
                });
                return;
            }

            showListModal.value = true;

        } catch (e) {
            console.error("viewDetails Error:", e);
            Swal.close();
            Swal.fire('Error', 'No se pudieron cargar los detalles', 'error');
        }
    }

    function openProductModal(product) {
        selectedProduct.value = product;
        showListModal.value = false; // Cerrar lista
        showModal.value = true; // Abrir detalle
    }

    function closeProductModal() {
        showModal.value = false;
        showListModal.value = true;
    }

    async function approveOrder(order) {
        try {
            const result = await Swal.fire({
                title: '¿Aprobar pedido?',
                text: `Vas a aprobar el pedido #${order.id}`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, aprobar',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                await axios.put(`/api/orders_service/${order.id}/status`, { status: 'approved' });

                Swal.fire('Aprobado', 'El pedido ha sido aprobado', 'success');
                loadOrders();
            }
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'No se pudo actualizar el pedido', 'error');
        }
    }

    async function cancelOrder(order) {
        try {
            const result = await Swal.fire({
                title: '¿Cancelar y Eliminar Pedido?',
                text: "Esta acción no se puede deshacer.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (result.isConfirmed) {
                await axios.delete(`/api/orders_service/${order.id}`);

                Swal.fire('Eliminado', 'El pedido ha sido eliminado.', 'success');
                showListModal.value = false;
                loadOrders();
            }
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'No se pudo eliminar el pedido', 'error');
        }
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    function formatPrice(value) {
        if (!value && value !== 0) return '$0.00';
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }

    // Total Computado
    const orderTotal = computed(() => {
        return selectedOrderProducts.value.reduce((acc, item) => {
            const price = parseFloat(item.price) || 0;
            const qty = parseInt(item.quantity) || 1;
            return acc + (price * qty);
        }, 0);
    });

    onMounted(() => {
        loadOrders()
    })

    return {
        isSidebarOpen,
        orders: paginatedOrders, // Devolver porción paginada a la vista
        isLoading,
        user,
        viewMode,
        showModal,
        showListModal,
        selectedProduct,
        selectedOrderProducts,
        currentOrder,
        isAdmin,

        // Paginación y Búsqueda
        search,
        currentPage,
        totalPages,
        visiblePages,
        totalCount: computed(() => filteredOrders.value.length),
        goToPage,

        loadOrders,
        switchMode,
        viewDetails,
        openProductModal,
        closeProductModal,
        approveOrder,
        cancelOrder,
        formatDate,
        formatPrice,
        orderTotal,
        isLoadingDetails
    }
}
