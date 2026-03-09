
import { reactive, watch, computed } from 'vue'
import Swal from 'sweetalert2'
import axios from 'axios'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const CART_STORAGE_KEY = 'fabrimine_cart_v1'

// Estado reactivo global
const cartState = reactive({
    items: [],
    isSidebarOpen: false
})

// Cargar desde localStorage inicial
if (localStorage.getItem(CART_STORAGE_KEY)) {
    try {
        const saved = JSON.parse(localStorage.getItem(CART_STORAGE_KEY))
        if (Array.isArray(saved)) {
            cartState.items = saved
        }
    } catch (e) {
        console.error('Error cargando carrito', e)
        localStorage.removeItem(CART_STORAGE_KEY)
    }
}

// Watch para persistencia
watch(
    () => cartState.items,
    (newItems) => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems))
    },
    { deep: true }
)

export function useCart() {

    const items = computed(() => cartState.items)

    const count = computed(() => {
        return cartState.items.reduce((acc, item) => acc + (item.quantity || 1), 0)
    })

    // Calcular subtotal (suma de precios * cantidad)
    const subtotal = computed(() => {
        return cartState.items.reduce((acc, item) => {
            const price = parseFloat(item.price) || 0
            const qty = item.quantity || 1
            return acc + (price * qty)
        }, 0)
    })

    // Calcular total con impuestos (subtotal * 1.16)
    const total = computed(() => {
        return subtotal.value * 1.16
    })

    function addToCart(product) {
        // Buscar si ya existe
        const existingItem = cartState.items.find(i => i.id === product.id)

        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1
            return true
        }

        // Guardamos una copia limpia del producto
        cartState.items.push({
            id: product.id,
            name: product.name || product.title, // Handle title vs name
            price: product.price,
            image: product.image,
            images: product.images, // Preserve array
            category: product.category,
            location: product.location, // Preserve nested object
            city: product.city || product.location?.city,
            state: product.state || product.location?.state,
            country: product.country || product.location?.country,
            seller_id: product.id_user || product.userId || product.seller_id, // Handle userId vs id_user
            quantity: 1, // Inicializar en 1
            addedAt: new Date().toISOString()
        })
        return true
    }

    function updateQuantity(productId, newQuantity) {
        const item = cartState.items.find(i => i.id === productId)
        if (item) {
            if (newQuantity <= 0) {
                removeFromCart(productId)
            } else {
                item.quantity = newQuantity
            }
        }
    }

    function removeFromCart(productId) {
        const index = cartState.items.findIndex(i => i.id === productId)
        if (index > -1) {
            cartState.items.splice(index, 1)
        }
    }

    function clearCart() {
        cartState.items = []
    }

    function isInCart(productId) {
        return cartState.items.some(i => i.id === productId)
    }

    function generatePDFPreview() {
        if (cartState.items.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Carrito vacío',
                text: 'No hay productos en el carrito para generar un PDF.'
            });
            return;
        }

        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 10;

        // --- Header Section ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(28);
        doc.setTextColor(255, 192, 0); // Yellow
        doc.text("FABRI", margin, 20);
        doc.setTextColor(150, 150, 150); // Gray
        doc.text("mine", margin + 35, 20);

        doc.setFontSize(8);
        doc.setTextColor(255, 192, 0);
        doc.text("LIDERES EN FABRICACIÓN DE EQUIPOS Y PROYECTOS MINEROS", margin, 25);

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.text("Sector Unare 2, Calle Ipire 281-0201, Parroquia Unare, Municipio Caroni", margin, 30);
        doc.text(". Estado Bolívar", margin, 34);

        // Right side header (Title and Quote Num)
        doc.setFontSize(30);
        doc.setFont("times", "bolditalic");
        doc.setTextColor(200, 100, 50); // Brownish
        doc.text("Cotización", pageWidth - margin - 55, 20);

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        const quoteNo = `No 2302-003`; // Can be dynamic later
        doc.text(quoteNo, pageWidth - margin - 35, 30);

        // --- Customer Info Table ---
        autoTable(doc, {
            startY: 40,
            margin: { left: margin, right: margin },
            theme: 'plain',
            styles: {
                fontSize: 9,
                cellPadding: 2,
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                valign: 'middle',
                textColor: [0, 0, 0]
            },
            columnStyles: {
                0: { fillColor: [255, 192, 0], fontStyle: 'bold', cellWidth: 45 },
                1: { fontStyle: 'normal' }
            },
            body: [
                ['Nombre o Razón Social', 'HORIZONTE DEL FUTURO, C.A.'],
                ['Domicilio Fiscal', ''],
                ['RIF', 'J-50287372-9'],
                ['Teléfono', ''],
                ['Att:', 'HORIZONTE DEL FUTURO, C.A.'],
            ]
        });

        // --- Subheader Table ---
        autoTable(doc, {
            startY: doc.lastAutoTable.finalY + 2,
            margin: { left: margin, right: margin },
            theme: 'plain',
            styles: {
                fontSize: 8,
                cellPadding: 2,
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                halign: 'center',
                valign: 'middle',
                textColor: [0, 0, 0]
            },
            headStyles: {
                fillColor: [255, 192, 0], // Yellow
                fontStyle: 'bold'
            },
            head: [['FECHA', 'LUGAR', 'CONDICIONES DE PAGO', 'TIEMPO DE EJECUCIÓN']],
            body: [
                [new Date().toLocaleDateString('es-ES'), 'Puerto Ordaz', '70% Anticipo', 'De seis (6) a ocho (8) semanas']
            ]
        });

        // --- Main Items Table ---
        const tableColumn = ["DESCRIPCIÓN", "CANTIDAD", "VALOR UNIT.", "TOTAL US"];
        const tableRows = [];

        cartState.items.forEach(item => {
            const rowData = [
                item.name || item.title || 'Producto',
                item.quantity || 1,
                parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                (parseFloat(item.price) * (item.quantity || 1)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            startY: doc.lastAutoTable.finalY, // Attached to subheader
            margin: { left: margin, right: margin },
            theme: 'plain',
            styles: {
                fontSize: 8,
                cellPadding: 3,
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                textColor: [0, 0, 0]
            },
            headStyles: {
                fillColor: [255, 192, 0],
                fontStyle: 'bold',
                halign: 'center'
            },
            columnStyles: {
                0: { halign: 'left' },
                1: { halign: 'center', cellWidth: 20, fontStyle: 'bold' },
                2: { halign: 'right', cellWidth: 25, fontStyle: 'bold' },
                3: { halign: 'right', cellWidth: 25, fontStyle: 'bold' }
            },
            head: [tableColumn],
            body: tableRows
        });

        // --- Summary and Footer ---
        let mainTableFinalY = doc.lastAutoTable.finalY;

        const subtotalFormatted = subtotal.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const ivaValue = total.value - subtotal.value;
        const ivaFormatted = ivaValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const totalFormatted = total.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        autoTable(doc, {
            startY: mainTableFinalY,
            margin: { left: pageWidth - margin - 50, right: margin },
            theme: 'plain',
            styles: {
                fontSize: 9,
                cellPadding: 2,
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                textColor: [0, 0, 0]
            },
            columnStyles: {
                0: { fillColor: [255, 192, 0], fontStyle: 'bold', cellWidth: 20 },
                1: { halign: 'right', cellWidth: 30, fontStyle: 'bold' }
            },
            body: [
                ['SUBTOTAL', subtotalFormatted],
                ['IVA', ivaFormatted],
                ['TOTAL USD', totalFormatted]
            ]
        });

        const summaryFinalY = doc.lastAutoTable.finalY;

        // Validez and Payment Details on the left (overlap vertically with summary space)
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");

        doc.setFillColor(255, 192, 0); // Yellow box
        doc.rect(margin, mainTableFinalY + 10, 85, 4.5, 'F');
        doc.text("VALIDEZ DE LA OFERTA: 5 DÍAS", margin + 1, mainTableFinalY + 13.5);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(8);
        doc.text("Forma de pago: Efectivo o transferencia", margin, mainTableFinalY + 18);

        // Dashed line below everything
        const yLine = Math.max(summaryFinalY, mainTableFinalY + 20) + 4;
        doc.setDrawColor(150);
        doc.setLineWidth(0.5);
        for (let i = margin; i < pageWidth - margin; i += 4) {
            doc.line(i, yLine, i + 2, yLine);
        }

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text("Si desea discutir alguno de los elementos de este presupuesto o si necesita alguna otra información, no dude en llamarme personalmente: Carlos", margin, yLine + 4);
        doc.text("Zambrano a los, 0414 8755808, fabrimine.ca@gmail.com", margin, yLine + 7);

        // Open in new tab
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
    }

    async function checkout(router) {
        // 1. Check if logged in
        try {
            // Use static import if possible or dynamic if needed. Assuming static is fine or dynamic.
            const { checkSession } = await import('@/services/authService');
            const userData = await checkSession();

            if (!userData || userData.error || !userData.id) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Inicia Sesión',
                    text: 'Debes iniciar sesión para realizar un pedido.',
                });
                if (router) router.push('/auth');
                return;
            }

            // 2. Prepare Order Payload
            const orderPayload = {
                user_id: userData.id,
                items: cartState.items.map(item => ({
                    machine_id: item.id,
                    seller_id: item.seller_id || 0,
                    quantity: item.quantity || 1,
                    price: item.price
                }))
            };

            // 3. Send Order
            const { data: orderResponse } = await axios.post('/api/orders_service/', orderPayload);

            if (orderResponse.success === false) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Atención',
                    text: orderResponse.message || 'Límite de pedido alcanzado..'
                });
                return;
            }

            if (orderResponse.id || orderResponse.message) {
                await Swal.fire({
                    icon: 'success',
                    title: '¡Pedido Creado!',
                    text: 'Tu pedido ha sido realizado exitosamente.',
                    confirmButtonText: 'Ver mis pedidos',
                    confirmButtonColor: '#4f46e5'
                });
                clearCart();
                if (router) router.push('/orders');
            }

        } catch (error) {
            console.error("Checkout Error:", error);

            if (error.response && error.response.status === 401) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Session Expired',
                    text: 'Please sign in again.'
                });
                if (router) router.push('/auth');
            } else if (error.response && error.response.data && error.response.data.message) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: error.response.data.message
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Could not process the order.'
                });
            }
        }
    }


    function openSidebar() {
        cartState.isSidebarOpen = true
    }

    function closeSidebar() {
        cartState.isSidebarOpen = false
    }

    function toggleSidebar() {
        cartState.isSidebarOpen = !cartState.isSidebarOpen
    }

    // Add to return object
    return {
        items,
        count,
        subtotal,
        total,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isInCart,
        generatePDFPreview,
        checkout,
        // Sidebar controls
        isSidebarOpen: computed(() => cartState.isSidebarOpen),
        openSidebar,
        closeSidebar,
        toggleSidebar
    }
}
