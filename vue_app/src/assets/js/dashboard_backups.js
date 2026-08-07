// =============================================================
// assets/js/dashboard_backups.js
//
// Composable que centraliza toda la lógica del módulo de
// respaldos de base de datos. Sigue el mismo patrón que el
// resto de composables del dashboard (dashboard_users.js, etc.)
// =============================================================

import { ref, computed, onMounted, watch } from 'vue'
import Swal from 'sweetalert2'
import axios from '@/services/axiosInstance'

// URL base del servicio de respaldos expuesta por el API Gateway
const BASE_URL = '/api/backup_service'

export function useDashboardBackups() {

    // ── Estado reactivo ────────────────────────────────────────

    /** Lista de respaldos obtenida del servidor */
    const backups = ref([])

    /** Indica si se está realizando una carga inicial de datos */
    const isLoading = ref(true)

    /** Indica si el proceso de creación de respaldo está en curso */
    const isCreating = ref(false)

    /** Texto de búsqueda para filtrar la lista de respaldos */
    const search = ref('')

    // ── Estado de paginación ───────────────────────────────────
    const currentPage = ref(1)
    const itemsPerPage = 10

    // ── Computed / Derivados ───────────────────────────────────

    /**
     * Lista filtrada de respaldos según el texto de búsqueda.
     * Se filtra en el cliente porque la lista de respaldos
     * raramente supera las pocas docenas de archivos.
     */
    const filteredBackups = computed(() => {
        if (!search.value) return backups.value
        const q = search.value.toLowerCase()
        return backups.value.filter(b => b.archivo.toLowerCase().includes(q))
    })

    const totalPages = computed(() => Math.ceil(filteredBackups.value.length / itemsPerPage) || 1)

    const visiblePages = computed(() => {
        let pages = []
        let startPage = Math.max(1, currentPage.value - 2)
        let endPage = Math.min(totalPages.value, currentPage.value + 2)
        
        if (totalPages.value <= 5) {
            startPage = 1
            endPage = totalPages.value
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i)
        }
        return pages
    })

    const paginatedBackups = computed(() => {
        const start = (currentPage.value - 1) * itemsPerPage
        const end = start + itemsPerPage
        return filteredBackups.value.slice(start, end)
    })

    function goToPage(page) {
        if (page >= 1 && page <= totalPages.value) {
            currentPage.value = page
        }
    }

    watch(search, () => {
        currentPage.value = 1
    })

    // ══════════════════════════════════════════════════════════
    // CARGAR LISTA DE RESPALDOS
    // Obtiene todos los archivos .sql disponibles en el servidor
    // ══════════════════════════════════════════════════════════
    async function loadBackups() {
        isLoading.value = true
        try {
            const { data } = await axios.get(`${BASE_URL}/backups`, {
                withCredentials: true
            })
            // La respuesta tiene forma: { total: N, backups: [...] }
            backups.value = data.backups || []
        } catch (err) {
            console.error('[Backups] Error al cargar lista:', err)
            Swal.fire('Error', 'No se pudo obtener la lista de respaldos', 'error')
        } finally {
            isLoading.value = false
        }
    }

    // ══════════════════════════════════════════════════════════
    // CREAR RESPALDO
    // Lanza el proceso de mysqldump en el servidor y recarga
    // la lista al finalizar
    // ══════════════════════════════════════════════════════════
    async function createBackup() {
        const confirm = await Swal.fire({
            title: '¿Crear respaldo?',
            text: 'Se generará un nuevo archivo .sql con el estado actual de la base de datos.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#fccd1e',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, respaldar',
            cancelButtonText: 'Cancelar'
        })

        if (!confirm.isConfirmed) return

        isCreating.value = true

        // Toast de progreso mientras se ejecuta mysqldump
        Swal.fire({
            title: 'Generando respaldo…',
            text: 'Esto puede tomar unos segundos.',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        })

        try {
            const { data } = await axios.post(`${BASE_URL}/backup`, {}, {
                withCredentials: true
            })

            Swal.fire({
                title: '¡Respaldo creado!',
                html: `Archivo: <strong>${data.archivo}</strong><br>Tamaño: ${data.tamano_kb} KB`,
                icon: 'success',
                confirmButtonColor: '#fccd1e'
            })

            // Recarga la lista para mostrar el nuevo archivo
            await loadBackups()

        } catch (err) {
            const msg = err.response?.data?.detalle || err.response?.data?.error || 'No se pudo crear el respaldo'
            Swal.fire('Error', msg, 'error')
        } finally {
            isCreating.value = false
        }
    }


    async function restoreBackup(filename) {
        const confirm = await Swal.fire({
            title: '¿Restaurar respaldo?',
            text: 'Esta acción reemplazará los datos actuales con los del respaldo seleccionado.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#fccd1e',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, restaurar',
            cancelButtonText: 'Cancelar'
        })

        if (!confirm.isConfirmed) return

        try {
            await axios.post(`${BASE_URL}/backups/restore/${encodeURIComponent(filename)}`, {}, {
                withCredentials: true
            })

            Swal.fire({
                title: '¡Respaldo restaurado!',
                text: 'Los datos han sido reemplazados con éxito.',
                icon: 'success',
                confirmButtonColor: '#fccd1e'
            })

            // Recarga la página para que la aplicación muestre los datos restaurados
            // Espera a que el usuario cierre el modal y luego recarga
            .then(() => {
                window.location.reload()
            })

        } catch (err) {
            const msg = err.response?.data?.detalle || err.response?.data?.error || 'No se pudo restaurar el respaldo'
            Swal.fire('Error', msg, 'error')
        }
    }


    // ══════════════════════════════════════════════════════════
    // DESCARGAR RESPALDO
    // Descarga el archivo .sql al dispositivo del usuario.
    // Se usa un <a> con el href del endpoint para que el
    // navegador maneje la descarga nativa.
    // ══════════════════════════════════════════════════════════
    async function downloadBackup(filename) {
        try {
            // Usamos axios con responseType 'blob' para recibir
            // los bytes del archivo y luego crear un link de descarga
            const response = await axios.get(
                `${BASE_URL}/backups/download/${encodeURIComponent(filename)}`,
                { responseType: 'blob', withCredentials: true }
            )

            // Crea una URL temporal para el blob descargado
            const url = window.URL.createObjectURL(new Blob([response.data]))

            // Crea un <a> invisible, lo clickea y lo destruye
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', filename) // nombre del archivo al guardar
            document.body.appendChild(link)
            link.click()
            link.remove()

            // Libera la memoria del objeto URL
            window.URL.revokeObjectURL(url)

        } catch (err) {
            console.error('[Backups] Error al descargar:', err)
            Swal.fire('Error', 'No se pudo descargar el archivo de respaldo', 'error')
        }
    }

    // ══════════════════════════════════════════════════════════
    // ELIMINAR RESPALDO
    // Pide confirmación y elimina el archivo del servidor
    // ══════════════════════════════════════════════════════════
    async function deleteBackup(backup) {
        const confirm = await Swal.fire({
            title: '¿Eliminar respaldo?',
            html: `<code style="font-size:0.85rem">${backup.archivo}</code><br><br>Esta acción no se puede deshacer.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        })

        if (!confirm.isConfirmed) return

        try {
            await axios.delete(
                `${BASE_URL}/backups/${encodeURIComponent(backup.archivo)}`,
                { withCredentials: true }
            )

            Swal.fire({
                title: 'Eliminado',
                text: 'El respaldo fue eliminado correctamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            })

            // Elimina el elemento de la lista local sin recargar
            backups.value = backups.value.filter(b => b.archivo !== backup.archivo)

        } catch (err) {
            const msg = err.response?.data?.error || 'No se pudo eliminar el respaldo'
            Swal.fire('Error', msg, 'error')
        }
    }

    // ── Helpers de formato ─────────────────────────────────────

    /**
     * Convierte un string ISO 8601 a formato legible
     * Ej: "2026-04-20T12:34:56.000Z" → "20/04/2026 08:34"
     */
    function formatDate(isoString) {
        if (!isoString) return '—'
        const d = new Date(isoString)
        return d.toLocaleString('es-VE', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    /**
     * Muestra el tamaño de forma amigable: KB o MB
     */
    function formatSize(kb) {
        if (kb >= 1024) return `${(kb / 1024).toFixed(2)} MB`
        return `${kb} KB`
    }

    // ── Ciclo de vida ──────────────────────────────────────────
    onMounted(() => {
        loadBackups()
    })

    // ── API pública del composable ─────────────────────────────
    return {
        backups,
        isLoading,
        isCreating,
        search,
        filteredBackups,
        paginatedBackups,
        currentPage,
        totalPages,
        visiblePages,
        goToPage,
        loadBackups,
        createBackup,
        downloadBackup,
        deleteBackup,
        restoreBackup,
        formatDate,
        formatSize
    }
}
