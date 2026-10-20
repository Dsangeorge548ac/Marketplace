<script setup>
// =============================================================
// components/dashboard/dashboard_backups.vue
//
// Componente principal del módulo de respaldos.
// Muestra: tarjeta hero + estadísticas + tabla de respaldos
// con acciones de descarga y eliminación.
// =============================================================

import { ref, computed } from 'vue'
import { useDashboardBackups } from '@/assets/js/dashboard_backups.js'
import dashboard_banner from '@/components/dashboard/dashboard_banner.vue'
import Swal from 'sweetalert2'

// Importa el CSS específico del módulo
import '@/assets/css/pages/dashboard/main.css'
import '@/assets/css/pages/dashboard/backups.css'

// Obtiene todo el estado y las funciones del composable
const {
    backups,
    isLoading,
    isCreating,
    isUploading,
    uploadProgress,
    search,
    filteredBackups,
    paginatedBackups,
    currentPage,
    totalPages,
    visiblePages,
    goToPage,
    loadBackups,
    createBackup,
    uploadBackup,
    downloadBackup,
    restoreBackup,
    deleteBackup,
    formatDate,
    formatSize
} = useDashboardBackups()

// ── Estadísticas calculadas en el cliente ─────────────────────

/** Total de respaldos disponibles */
const totalBackups = computed(() => backups.value.length)

/** Suma total en KB de todos los respaldos */
const totalSizeKb = computed(() =>
    backups.value.reduce((acc, b) => acc + (b.tamano_kb || 0), 0)
)

/** Fecha del respaldo más reciente */
const lastBackupDate = computed(() => {
    if (!backups.value.length) return null
    return backups.value[0]?.modificado || null // la lista ya viene ordenada desc
})

// ── Estado y lógica para el modal de subida de archivo SQL ───
const showUploadModal = ref(false)
const selectedFile = ref(null)
const restoreImmediately = ref(false)
const isDragging = ref(false)
const fileInputRef = ref(null)

function openUploadModal() {
    selectedFile.value = null
    restoreImmediately.value = false
    isDragging.value = false
    showUploadModal.value = true
}

function closeUploadModal() {
    if (isUploading.value) return
    showUploadModal.value = false
    selectedFile.value = null
    restoreImmediately.value = false
    isDragging.value = false
}

function triggerFileInput() {
    if (isUploading.value) return
    fileInputRef.value?.click()
}

function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (file) {
        processSelectedFile(file)
    }
}

function handleFileDrop(e) {
    if (isUploading.value) return
    isDragging.value = false
    const file = e.dataTransfer.files?.[0]
    if (file) {
        processSelectedFile(file)
    }
}

function processSelectedFile(file) {
    if (!file.name.toLowerCase().endsWith('.sql')) {
        Swal.fire('Formato incorrecto', 'Solo puedes subir archivos con formato .sql', 'error')
        return
    }
    selectedFile.value = file
}

function removeSelectedFile() {
    if (isUploading.value) return
    selectedFile.value = null
    if (fileInputRef.value) {
        fileInputRef.value.value = ''
    }
}

async function handleUploadSubmit() {
    if (!selectedFile.value || isUploading.value) return
    const success = await uploadBackup(selectedFile.value, restoreImmediately.value)
    if (success) {
        closeUploadModal()
    }
}
</script>

<template>
    <div>
        <div class="dashboard-content">

            <div class="table-container">

                <!-- ═══ HERO: título + botones de acción ═══════════════ -->
                <div class="backup-hero">
                    <div class="backup-hero-info">
                        <div class="backup-hero-icon">
                            <i class='bx bx-data'></i>
                        </div>
                        <div class="backup-hero-text">
                            <h3>Respaldos de Base de Datos</h3>
                            <p>Genera, descarga, sube y administra copias de seguridad del sistema</p>
                        </div>
                    </div>

                    <!-- Botones principales: Subir SQL y Crear Respaldo -->
                    <div class="backup-hero-actions">
                        <button
                            class="btn-upload-sql"
                            id="btn-open-upload-sql"
                            type="button"
                            :disabled="isCreating || isUploading"
                            @click="openUploadModal"
                        >
                            <i class='bx bx-cloud-upload'></i>
                            Subir Archivo SQL
                        </button>

                        <button
                            class="btn-create-backup"
                            id="btn-create-backup"
                            type="button"
                            :disabled="isCreating || isUploading"
                            @click="createBackup"
                        >
                            <!-- Spinner mientras se genera el respaldo -->
                            <span v-if="isCreating" class="spinner"></span>
                            <i v-else class='bx bx-plus-circle'></i>
                            {{ isCreating ? 'Generando…' : 'Nuevo Respaldo' }}
                        </button>
                    </div>
                </div>

                <!-- ═══ ESTADÍSTICAS RÁPIDAS ════════════════════════════ -->
                <div class="backup-stats">

                    <!-- Tarjeta: total de archivos -->
                    <div class="backup-stat-card">
                        <div class="backup-stat-icon total">
                            <i class='bx bx-file'></i>
                        </div>
                        <div class="backup-stat-data">
                            <span class="stat-value">{{ totalBackups }}</span>
                            <span class="stat-label">Respaldos disponibles</span>
                        </div>
                    </div>

                    <!-- Tarjeta: tamaño total en disco -->
                    <div class="backup-stat-card">
                        <div class="backup-stat-icon size">
                            <i class='bx bx-hdd'></i>
                        </div>
                        <div class="backup-stat-data">
                            <span class="stat-value">{{ formatSize(totalSizeKb) }}</span>
                            <span class="stat-label">Espacio utilizado</span>
                        </div>
                    </div>

                    <!-- Tarjeta: fecha del último respaldo -->
                    <div class="backup-stat-card">
                        <div class="backup-stat-icon last">
                            <i class='bx bx-time-five'></i>
                        </div>
                        <div class="backup-stat-data">
                            <span class="stat-value" style="font-size:0.85rem">
                                {{ lastBackupDate ? formatDate(lastBackupDate) : '—' }}
                            </span>
                            <span class="stat-label">Último respaldo</span>
                        </div>
                    </div>

                </div>

                <!-- ═══ CONTROLES: búsqueda + recarga ══════════════════ -->
                <div class="backup-controls">
                    <!-- Input para filtrar por nombre de archivo -->
                    <div class="search-box">
                        <i class='bx bx-search'></i>
                        <input
                            v-model="search"
                            type="text"
                            placeholder="Filtrar respaldos..."
                            id="backup-search"
                        />
                    </div>

                    <!-- Botón para recargar la lista desde el servidor -->
                    <button class="btn-reload" id="btn-reload-backups" @click="loadBackups">
                        <i class='bx bx-refresh'></i>
                        Actualizar
                    </button>
                </div>

                <!-- ═══ TABLA DE RESPALDOS ══════════════════════════════ -->
                <div class="backup-table-wrapper">

                    <!-- Tabla con datos reales -->
                    <table v-if="!isLoading" class="backup-table">
                        <thead>
                            <tr>
                                <th>Archivo</th>
                                <th>Tamaño</th>
                                <th class="col-date">Creado el</th>
                                <th class="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>

                            <!-- Fila por cada respaldo filtrado y paginado -->
                            <tr v-for="backup in paginatedBackups" :key="backup.archivo">

                                <!-- Nombre del archivo con icono SQL -->
                                <td>
                                    <div class="backup-filename">
                                        <i class='bx bxs-file-json'></i>
                                        <code>{{ backup.archivo }}</code>
                                    </div>
                                </td>

                                <!-- Tamaño formateado como badge verde -->
                                <td>
                                    <span class="size-badge">{{ formatSize(backup.tamano_kb) }}</span>
                                </td>

                                <!-- Fecha de creación (se oculta en móvil con col-date) -->
                                <td class="col-date">{{ formatDate(backup.creado_en) }}</td>

                                <!-- Botones de acción -->
                                <td>
                                    <div class="backup-actions" style="justify-content: center;">

                                        <!-- Descargar el archivo .sql -->
                                        <button
                                            class="btn-action download"
                                            :id="`btn-download-${backup.archivo}`"
                                            title="Descargar respaldo"
                                            @click="downloadBackup(backup.archivo)"
                                        >
                                            <i class='bx bx-download'></i>
                                        </button>

                                          <button
                                            class="btn-action restore"
                                            :id="`btn-restore-${backup.archivo}`"
                                            title="Restaurar respaldo"
                                            @click="restoreBackup(backup.archivo)"
                                        >
                                            <i class='bx bx-data'></i>
                                        </button>


                                        <!-- Eliminar el archivo del servidor -->
                                        <button
                                            class="btn-action delete"
                                            :id="`btn-delete-${backup.archivo}`"
                                            title="Eliminar respaldo"
                                            @click="deleteBackup(backup)"
                                        >
                                            <i class='bx bx-trash'></i>
                                        </button>

                                    </div>
                                </td>

                            </tr>

                            <!-- Estado vacío: sin respaldos o sin coincidencias de búsqueda -->
                            <tr v-if="filteredBackups.length === 0">
                                <td colspan="4">
                                    <div class="backup-empty">
                                        <i class='bx bx-folder-open'></i>
                                        <p v-if="search">No se encontraron respaldos con "{{ search }}"</p>
                                        <p v-else>Aún no hay respaldos. Haz clic en "Nuevo Respaldo" para crear el primero.</p>
                                    </div>
                                </td>
                            </tr>

                        </tbody>
                    </table>

                    <!-- Skeleton loading: se muestra mientras carga la lista -->
                    <table v-else class="backup-table">
                        <thead>
                            <tr>
                                <th>Archivo</th>
                                <th>Tamaño</th>
                                <th class="col-date">Creado el</th>
                                <th class="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- 4 filas fantasma animadas -->
                            <tr v-for="i in 4" :key="i">
                                <td><div class="skeleton-backup" style="width: 240px;"></div></td>
                                <td><div class="skeleton-backup" style="width: 70px; border-radius: 20px;"></div></td>
                                <td class="col-date"><div class="skeleton-backup" style="width: 130px;"></div></td>
                                <td><div class="skeleton-backup" style="width: 80px; margin: 0 auto;"></div></td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="pagination-container" v-if="backups.length > 0 || totalBackups > 0">
                         <div class="page-info">
                            Mostrando {{ paginatedBackups.length }} de {{ filteredBackups.length }}
                        </div>
                        <div class="pagination-buttons">
                             <button :disabled="currentPage===1" @click="goToPage(currentPage-1)">
                                <i class='bx bx-chevron-left'></i>
                            </button>
                            <button v-for="page in visiblePages" :key="page" 
                                :class="{ 'active': page===currentPage }" 
                                @click="goToPage(page)">
                                {{ page }}
                            </button>
                            <button :disabled="currentPage===totalPages" @click="goToPage(currentPage+1)">
                                <i class='bx bx-chevron-right'></i>
                            </button>
                        </div>
                    </div>

                </div>
                <!-- /backup-table-wrapper -->

            </div>
            <!-- /contenedor -->
        </div>

        <!-- ═══ MODAL PARA SUBIR ARCHIVO SQL ════════════════════════ -->
        <div v-if="showUploadModal" class="modal-overlay active" @click.self="closeUploadModal">
            <div class="modal-container-2 backup-upload-modal">
                
                <div class="modal-header-2">
                    <div class="modal-title-with-icon">
                        <i class='bx bx-cloud-upload upload-modal-header-icon'></i>
                        <h2>Subir Archivo SQL</h2>
                    </div>
                    <button
                        type="button"
                        class="close-button-2"
                        :disabled="isUploading"
                        @click="closeUploadModal"
                    >
                        &times;
                    </button>
                </div>

                <div class="modal-content-2">
                    <!-- Zona Drag & Drop / Selección de Archivo -->
                    <div
                        class="sql-dropzone"
                        :class="{ 'is-dragging': isDragging, 'has-file': !!selectedFile }"
                        @click="triggerFileInput"
                        @dragover.prevent="isDragging = true"
                        @dragleave.prevent="isDragging = false"
                        @drop.prevent="handleFileDrop"
                    >
                        <input
                            type="file"
                            ref="fileInputRef"
                            accept=".sql"
                            class="sql-file-input"
                            @change="handleFileSelect"
                        />

                        <div v-if="!selectedFile" class="dropzone-empty">
                            <div class="dropzone-icon">
                                <i class='bx bx-upload'></i>
                            </div>
                            <h4>Selecciona o arrastra tu archivo .sql</h4>
                            <p>Haz clic para buscar en tus archivos</p>
                            <span class="dropzone-hint">Admite volcados SQL de MySQL hasta 200 MB</span>
                        </div>

                        <div v-else class="dropzone-file-selected" @click.stop>
                            <div class="file-info-badge">
                                <i class='bx bxs-file-json file-icon-sql'></i>
                                <div class="file-details">
                                    <span class="file-name">{{ selectedFile.name }}</span>
                                    <span class="file-size">{{ formatSize(Math.round(selectedFile.size / 1024)) }}</span>
                                </div>
                            </div>
                            <button
                                type="button"
                                class="btn-remove-file"
                                :disabled="isUploading"
                                @click="removeSelectedFile"
                                title="Quitar archivo"
                            >
                                <i class='bx bx-x'></i>
                            </button>
                        </div>
                    </div>

                    <!-- Opción de restaurar inmediatamente tras subir -->
                    <div class="restore-option-card">
                        <label class="restore-checkbox-label">
                            <input
                                type="checkbox"
                                v-model="restoreImmediately"
                                :disabled="isUploading"
                                class="restore-checkbox"
                            />
                            <div class="restore-label-text">
                                <strong>¿Restaurar la base de datos de inmediato?</strong>
                                <p>Si activas esta opción, se reemplazará la base de datos actual con este archivo al finalizar la subida.</p>
                            </div>
                        </label>
                    </div>

                    <!-- Mensaje informativo -->
                    <div class="upload-modal-alert">
                        <i class='bx bx-info-circle'></i>
                        <span>El archivo se guardará en los respaldos y podrás descargarlo o restaurarlo en cualquier momento.</span>
                    </div>

                    <!-- Barra de progreso si está subiendo -->
                    <div v-if="isUploading && uploadProgress > 0" class="upload-progress-wrapper">
                        <div class="upload-progress-bar">
                            <div class="upload-progress-fill" :style="{ width: uploadProgress + '%' }"></div>
                        </div>
                        <span class="upload-progress-text">{{ uploadProgress }}% subido</span>
                    </div>

                    <!-- Botones de acción del Modal -->
                    <div class="form-actions" style="margin-top: 24px;">
                        <button
                            type="button"
                            class="cancel-button"
                            :disabled="isUploading"
                            @click="closeUploadModal"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            class="submit-button btn-confirm-upload"
                            :disabled="!selectedFile || isUploading"
                            @click="handleUploadSubmit"
                        >
                            <span v-if="isUploading" class="spinner"></span>
                            <i v-else class='bx bx-cloud-upload'></i>
                            {{ isUploading ? (restoreImmediately ? 'Subiendo y aplicando…' : 'Subiendo…') : (restoreImmediately ? 'Subir y Restaurar' : 'Subir Respaldo') }}
                        </button>
                    </div>
                </div>

            </div>
        </div>

    </div>
</template>

