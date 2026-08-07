<script setup>
// =============================================================
// components/dashboard/dashboard_backups.vue
//
// Componente principal del módulo de respaldos.
// Muestra: tarjeta hero + estadísticas + tabla de respaldos
// con acciones de descarga y eliminación.
// =============================================================

import { computed } from 'vue'
import { useDashboardBackups } from '@/assets/js/dashboard_backups.js'
import dashboard_banner from '@/components/dashboard/dashboard_banner.vue'

// Importa el CSS específico del módulo
import '@/assets/css/pages/dashboard/main.css'
import '@/assets/css/pages/dashboard/backups.css'

// Obtiene todo el estado y las funciones del composable
const {
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
</script>

<template>
    <div>
        <div class="dashboard-content">

            <div class="table-container">

                <!-- ═══ HERO: título + botón crear respaldo ════════════ -->
                <div class="backup-hero">
                    <div class="backup-hero-info">
                        <div class="backup-hero-icon">
                            <i class='bx bx-data'></i>
                        </div>
                        <div class="backup-hero-text">
                            <h3>Respaldos de Base de Datos</h3>
                            <p>Genera, descarga y administra copias de seguridad del sistema</p>
                        </div>
                    </div>

                    <!-- Botón principal: crea un nuevo respaldo -->
                    <button
                        class="btn-create-backup"
                        id="btn-create-backup"
                        :disabled="isCreating"
                        @click="createBackup"
                    >
                        <!-- Spinner mientras se genera el respaldo -->
                        <span v-if="isCreating" class="spinner"></span>
                        <i v-else class='bx bx-plus-circle'></i>
                        {{ isCreating ? 'Generando…' : 'Nuevo Respaldo' }}
                    </button>
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
    </div>
</template>
