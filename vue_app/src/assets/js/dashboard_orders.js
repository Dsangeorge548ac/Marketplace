import { ref, computed, onMounted, defineAsyncComponent, watch } from 'vue'
import axios from '@/services/axiosInstance'
import Swal from 'sweetalert2'
import { checkSession } from '@/services/authService'
import { getImageUrl } from '@/assets/js/imageHelper'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import logo from '@/assets/img/logo.png'

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
    const itemsPerPage = 9
    const totalCount = ref(0)

    // Estado del Modal
    const showModal = ref(false)
    const showListModal = ref(false)
    const selectedProduct = ref(null)
    const selectedOrderProducts = ref([])
    const currentOrder = ref(null)

    // Estado del Modal de Status
    const showStatusModal = ref(false)
    const statusOrder = ref(null)
    const selectedStatus = ref('')
    const sellerPaymentMethods = ref([])
    const statusOptions = [
        { value: 'pendiente', label: 'Pendiente' },
        { value: 'aprobado', label: 'Aprobado' },
        { value: 'en_fabricacion', label: 'En Fabricación' },
        { value: 'en_camino', label: 'En Camino' },
        { value: 'entregado', label: 'Entregado' },
        { value: 'cancelado', label: 'Cancelado' },
    ]

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
                (order.order_number && order.order_number.toLowerCase().includes(q)) ||
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
        let cacheKey = null;

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

            cacheKey = `cache_orders_${apiUrl}_${search.value}`;
            const cachedData = sessionStorage.getItem(cacheKey);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                allOrders.value = parsed.orders;

                totalCount.value = parsed.count;
                isLoading.value = false; // Stop loading since we have cached data
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
                const enrichedOrders = ordersData.map((order) => {
                    const fallbackName = currentUser.name || currentUser.full_name || currentUser.username || `Usuario ${order.user_id}`;
                    const fallbackEmail = currentUser.email || 'No disponible';

                    return {
                        ...order,
                        buyerName: order.buyer_name || fallbackName,
                        buyerEmail: order.buyer_email || fallbackEmail
                    };
                });

                // No es necesario ordenar si el backend ordena, pero mantengamos consistencia por si acaso
                // enrichedOrders.sort((a, b) => b.id - a.id); 
                allOrders.value = enrichedOrders;
                sessionStorage.setItem(cacheKey, JSON.stringify({ orders: enrichedOrders, count: totalCount.value }));
            } else {
                allOrders.value = [];
                sessionStorage.setItem(cacheKey, JSON.stringify({ orders: [], count: 0 }));
            }

        } catch (err) {
            console.error('Error cargando pedidos:', err)
            allOrders.value = []
            totalCount.value = 0;
            if (cacheKey) {
                sessionStorage.removeItem(cacheKey);
            }
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
                return {
                    id: item.machine_id,
                    name: `Producto Eliminado (ID: ${item.machine_id})`,
                    price: 0,
                    quantity: item.quantity,
                    image: null,
                    is_deleted: true
                };
            });

            const results = await Promise.all(promises);
            selectedOrderProducts.value = results.filter(p => p !== null);
            currentOrder.value = order;
            sellerPaymentMethods.value = [];

            if (order.items && order.items.length > 0) {
                const sellerId = order.items[0].seller_id;
                if (sellerId) {
                    try {
                        const { data } = await axios.get(`/api/user_service/payment-methods/public/${sellerId}`);
                        if (Array.isArray(data)) {
                            sellerPaymentMethods.value = data;
                        }
                    } catch (err) {
                        console.error('Error fetching seller payment methods', err);
                    }
                }
            }

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

    async function deleteOrder(order) {
        try {
            const result = await Swal.fire({
                title: '¿Eliminar Pedido?',
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

    async function cancelOrder(order) {
        try {
            const result = await Swal.fire({
                title: '¿Estas seguro de que deseas cancelar en pedido?',
                text: "Esta acción no se puede deshacer.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Sí, cancelar',
                cancelButtonText: 'No, cancelar'
            });

            if (result.isConfirmed) {
                await axios.put(`/api/orders_service/${order.id}/status`, {
                    status: 'cancelado'
                });

                Swal.fire('Cancelado', 'El pedido ha sido cancelado.', 'success');
                showListModal.value = false;
                loadOrders();
            }
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'No se pudo cancelar el pedido', 'error');
        }
    }


    // --- STATUS MODAL ---
    function openStatusModal(order) {
        statusOrder.value = order;
        selectedStatus.value = order.status || 'pending';
        showStatusModal.value = true;
    }

    function closeStatusModal() {
        showStatusModal.value = false;
        statusOrder.value = null;
    }

    async function changeOrderStatus() {
        if (!statusOrder.value || !selectedStatus.value) return;

        try {
            await axios.put(`/api/orders_service/${statusOrder.value.id}/status`, {
                status: selectedStatus.value
            });

            Swal.fire({
                icon: 'success',
                title: 'Estado actualizado',
                text: `Pedido #${statusOrder.value.id} actualizado a: ${getStatusLabel(selectedStatus.value)}`,
                timer: 2000,
                showConfirmButton: false
            });
            closeStatusModal();
            loadOrders();
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
        }
    }

    function getStatusLabel(status) {
        const found = statusOptions.find(o => o.value === status);
        return found ? found.label : status;
    }

    // --- QUOTATION PDF ---
    async function generateOrderQuotation(order) {
        // Validar que el usuario esté verificado
        if (!user.value || user.value.status !== 'Verificado') {
            Swal.fire({
                title: 'Acceso Restringido',
                text: 'Solo los usuarios verificados pueden generar cotizaciones. Completa el proceso de verificación en tu perfil.',
                icon: 'warning',
                confirmButtonColor: '#059669'
            });
            return;
        }

        if (!order || !order.items || order.items.length === 0) {
            Swal.fire('Info', 'Este pedido no tiene artículos para cotizar.', 'info');
            return;
        }

        try {
            Swal.fire({ title: 'Generando cotización...', didOpen: () => Swal.showLoading() });

            // Fetch product details
            const promises = order.items.map(async (item) => {
                const formData = new FormData();
                formData.append('id', item.machine_id);
                try {
                    const { data } = await axios.post('/api/publications_service/get-card', formData);
                    if (data && !data.error) {
                        return { ...data, quantity: item.quantity, unitPrice: item.price || data.price, city: data.city };
                    }
                } catch (e) { /* skip */ }
                return { name: `Producto #${item.machine_id}`, quantity: item.quantity, unitPrice: item.price || 0 };
            });

            const products = await Promise.all(promises);

            // Fetch buyer info
            let buyerInfo = { name: order.buyerName || 'N/A', email: order.buyerEmail || '', tax_id: '', phone: '', tax_address: '' };
            try {
                const { data: userData } = await axios.get(`/api/user_service/${order.user_id}`);
                if (userData) {
                    buyerInfo.name = userData.verification_business_name || userData.name || order.buyerName || 'N/A';
                    buyerInfo.tax_id = userData.verification_tax_id || '';
                    buyerInfo.phone = userData.verification_phone || userData.phone || '';
                    buyerInfo.tax_address = userData.verification_tax_address || '';
                }
            } catch (e) { /* use defaults */ }

            Swal.close();

            // Generate PDF
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 10;

            // Header
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(28);
            doc.setTextColor(255, 192, 0);

            doc.addImage(logo, 'PNG', 9, 10, 60, 25);

            doc.setFontSize(8);
            doc.setTextColor(255, 192, 0);
            doc.text('LIDERES EN FABRICACIÓN DE EQUIPOS Y PROYECTOS MINEROS', margin, 40);

            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');
            doc.text('Sector Unare 2, Calle Ipire 281-0201, Parroquia Unare, Municipio Caroni. Estado Bolivar', margin, 45);

            doc.setFontSize(30);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(200, 100, 50);
            doc.text('Cotización', pageWidth - margin - 55, 20);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(0, 0, 0);
            const orderNumDisplay = order.order_number ? String(order.order_number) : String(order.id);
            // En tu lógica de visualización
            const date = new Date(order.created_at);

            // Obtenemos día y mes, asegurando los 2 dígitos con padStart
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');

            const orderDateDisplay = `${day}/${month}`;
            doc.text(`N°: ${orderDateDisplay} ${orderNumDisplay}`, pageWidth - margin - 36, 45);

            // Customer Info
            const customerStartY = 50;
            autoTable(doc, {
                startY: customerStartY,
                margin: { left: margin, right: margin },
                theme: 'plain',
                styles: { fontSize: 9, cellPadding: 2, lineWidth: 0, textColor: [0, 0, 0] },
                columnStyles: {
                    0: { fillColor: [255, 192, 0], fontStyle: 'bold', cellWidth: 45 },
                    1: { fontStyle: 'normal' }
                },
                body: [
                    ['Nombre o Razón Social', buyerInfo.name],
                    ['Domicilio Fiscal', buyerInfo.tax_address],
                    ['RIF', buyerInfo.tax_id],
                    ['Teléfono', buyerInfo.phone],
                    ['Att:', buyerInfo.name],
                ]
            });

            doc.setLineWidth(0.1);
            doc.setDrawColor(0, 0, 0);
            doc.rect(margin, customerStartY, pageWidth - margin * 2, doc.lastAutoTable.finalY - customerStartY);

            // Subheader
            const subStartY = doc.lastAutoTable.finalY;
            const orderDateDisplayComplete = `${day}/${month}/${date.getFullYear()}`;
            const city = products[0].city || 'Sin indicar';
            autoTable(doc, {
                startY: subStartY,
                margin: { left: margin, right: margin },
                theme: 'plain',
                styles: { fontSize: 8, cellPadding: 1.1, lineColor: [0, 0, 0], lineWidth: 0.1, halign: 'center', textColor: [0, 0, 0] },
                headStyles: { fillColor: [255, 192, 0], fontStyle: 'bold' },
                columnStyles: {
                    0: { halign: 'left' },
                    1: { halign: 'center', cellWidth: 55 },
                    2: { halign: 'center', cellWidth: 45 },
                    3: { halign: 'center', cellWidth: 45 }
                },
                head: [['FECHA', 'LUGAR', 'CONDICIONES DE PAGO', 'TIEMPO DE EJECUCIÓN']],
                body: [
                    [orderDateDisplayComplete, city, '70% Anticipo', 'De seis (6) a ocho (8) semanas']
                ]
            });

            doc.setLineWidth(0.1);
            doc.rect(margin, subStartY, pageWidth - margin * 2, doc.lastAutoTable.finalY - subStartY);

            // Items Table
            const tableRows = [];
            let subtotalVal = 0;
            products.forEach(item => {
                const price = parseFloat(item.unitPrice || item.price) || 0;
                const qty = parseInt(item.quantity) || 1;
                const lineTotal = price * qty;
                subtotalVal += lineTotal;
                tableRows.push([
                    item.name || item.title || 'Producto',
                    qty,
                    price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                    lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                ]);
            });

            const itemsStartY = doc.lastAutoTable.finalY + 5;
            autoTable(doc, {
                startY: itemsStartY,
                margin: { left: margin, right: margin },
                theme: 'plain',
                styles: { fontSize: 8, cellPadding: 3, lineWidth: 0, textColor: [0, 0, 0] },
                headStyles: { fillColor: [255, 192, 0], fontStyle: 'bold', halign: 'center' },
                columnStyles: {
                    0: { halign: 'left' },
                    1: { halign: 'center', cellWidth: 21 },
                    2: { halign: 'right', cellWidth: 25, fontStyle: 'bold' },
                    3: { halign: 'right', cellWidth: 25, fontStyle: 'bold' }
                },
                head: [['DESCRIPCIÓN', 'CANTIDAD', 'VALOR UNIT.', 'TOTAL US']],
                body: tableRows
            });

            doc.setLineWidth(0.1);
            doc.rect(margin, itemsStartY, pageWidth - margin * 2, doc.lastAutoTable.finalY - itemsStartY);

            // Summary
            const mainFinalY = doc.lastAutoTable.finalY;
            const ivaVal = subtotalVal * 0.16;
            const totalVal = subtotalVal + ivaVal;
            const summaryWidth = 50;

            autoTable(doc, {
                startY: mainFinalY,
                margin: { left: pageWidth - margin - summaryWidth, right: margin },
                theme: 'plain',
                styles: { fontSize: 9, cellPadding: 2, lineWidth: 0, textColor: [0, 0, 0] },
                columnStyles: {
                    0: { fillColor: [255, 192, 0], fontStyle: 'bold', cellWidth: 25, halign: 'center' },
                    1: { halign: 'right', cellWidth: 25, fontStyle: 'bold' }
                },
                body: [
                    ['SUBTOTAL', subtotalVal.toLocaleString('en-US', { minimumFractionDigits: 2 })],
                    ['IVA 16%', ivaVal.toLocaleString('en-US', { minimumFractionDigits: 2 })],
                    ['TOTAL USD', totalVal.toLocaleString('en-US', { minimumFractionDigits: 2 })]
                ]
            });

            doc.setLineWidth(0.1);
            doc.rect(pageWidth - margin - summaryWidth, mainFinalY, summaryWidth, doc.lastAutoTable.finalY - mainFinalY);

            const summaryFinalY = doc.lastAutoTable.finalY;

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setFillColor(255, 192, 0);
            doc.rect(margin, mainFinalY + 10, 85, 4.5, 'F');
            doc.text('VALIDEZ DE LA OFERTA: 5 DÍAS', margin + 1, mainFinalY + 13.5);

            doc.setTextColor(0, 0, 0);
            doc.setFontSize(8);
            doc.text('Forma de pago: Efectivo o transferencia', margin, mainFinalY + 18);

            const yLine = Math.max(summaryFinalY, mainFinalY + 20) + 4;
            doc.setDrawColor(150);
            doc.setLineWidth(0.5);
            for (let i = margin; i < pageWidth - margin; i += 4) {
                doc.line(i, yLine, i + 2, yLine);
            }

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.text('Si desea discutir alguno de los elementos de este presupuesto o si necesita alguna otra información, no dude en llamarme personalmente: Carlos', margin, yLine + 4);
            doc.text('Zambrano a los, 0414 8755808, fabrimine.ca@gmail.com', margin, yLine + 7);

            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank');

        } catch (e) {
            console.error('Error generating quotation:', e);
            Swal.close();
            Swal.fire('Error', 'No se pudo generar la cotización', 'error');
        }
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
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
        orders: paginatedOrders,
        isLoading,
        user,
        viewMode,
        showModal,
        showListModal,
        selectedProduct,
        selectedOrderProducts,
        currentOrder,
        sellerPaymentMethods,
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
        deleteOrder,
        formatDate,
        formatPrice,
        orderTotal,
        isLoadingDetails,

        // Status Modal
        showStatusModal,
        statusOrder,
        selectedStatus,
        statusOptions,
        openStatusModal,
        closeStatusModal,
        changeOrderStatus,
        getStatusLabel,

        // Quotation
        generateOrderQuotation
    }
}
