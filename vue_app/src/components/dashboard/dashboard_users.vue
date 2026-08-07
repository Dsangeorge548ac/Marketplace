<script setup>
import { defineAsyncComponent } from 'vue'
import { useDashboardUsers } from '@/assets/js/dashboard_users.js'
import { isSidebarOpen } from '@/assets/js/dashboardState.js'
import dashboard_banner from '@/components/dashboard/dashboard_banner.vue'
const EditUserModal = defineAsyncComponent(() => import('@/components/modals/EditUserModal.vue'))

const {
    currentUserRole,
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
    deleteUser,
    verifyUser,
    loadPage,
    revokeUserVerification
} = useDashboardUsers()
</script>

<template>
    <div>
    <div class="dashboard-content">
        <dashboard_banner />

            <div class="table-container">
                
                <!-- MODERN TABLE -->
                <div class="table-controls">
                    <div class="search-box">
                        <i class='bx bx-search'></i>
                        <input type="text" v-model="search" @input="searchUsers" placeholder="Buscar usuario...">
                    </div>
                </div>

                <div v-if="!isLoading" class="table-responsive">
                    <table class="modern-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Correo</th>
                                <th class="text-center">Rol</th>
                                <th class="text-center">Verificación</th>
                                <th class="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="user in users" :key="user.id">
                                <td>
                                    <div class="user-info">
                                        <div class="avatar-circle">{{ user.name ? user.name.charAt(0).toUpperCase() : 'U' }}</div>
                                        <div>
                                            <span class="user-name">{{ user.name }}</span>
                                        </div>
                                    </div>
                                </td>
                                <td>{{ user.email }}</td>
                                <td class="text-center">
                                    <span :class="['badge-role', `role-${user.role ? user.role.toLowerCase() : ''}`]">{{ user.role }}</span>
                                </td>
                                <td class="text-center">
                                    <span :class="['badge-verification', `verif-${(user.verification_status || 'no verificado').toLowerCase().replace(/\s+/g, '-')}`]">
                                        {{ user.verification_status || 'No verificado' }}
                                    </span>
                                </td>
                                <td>
                                    <div class="actions-flex">
                                        <button class="btn-icon edit" @click="openModal(user)" title="Editar">
                                            <i class='bx bx-edit-alt'></i>
                                        </button>
                                        <button 
                                            v-if="(user.verification_status || '').toLowerCase() !== 'verificado'"
                                            class="btn-icon verify" 
                                            @click="verifyUser(user)" 
                                            @updated="loadPage(currentPage)"
                                            title="Verificar">
                                            <i class='bx bx-check-shield'></i>
                                        </button>
                                        <button 
                                            v-if="(user.verification_status || '').toLowerCase() === 'verificado'"
                                            class="btn-icon revoke" 
                                            @click="revokeUserVerification(user)" 
                                            @updated="loadPage(currentPage)"
                                            title="Revocar verificación">
                                            <i class='bx bx-shield-x'></i>
                                        </button>
                                        <button class="btn-icon delete" @click="deleteUser(user)" title="Eliminar">
                                            <i class='bx bx-trash'></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="users.length === 0">
                                <td colspan="5" class="empty-state">
                                    <i class='bx bx-user-x'></i>
                                    <p>No se encontraron usuarios</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- PAGINATION -->
                    <div class="pagination-container" v-if="users.length > 0">
                         <div class="page-info">
                            Mostrando {{ users.length }} de {{ totalCount }}
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
                <div v-else class="table-responsive">
                    <table class="modern-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Correo</th>
                                <th class="text-center">Rol</th>
                                <th class="text-center">Verificación</th>
                                <th class="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="i in 5" :key="i">
                                <td>
                                    <div class="user-info">
                                        <div class="skeleton-circle" style="width: 40px; height: 40px; border-radius: 50%;"></div>
                                        <div><div class="skeleton-line" style="width: 120px; height: 16px;"></div></div>
                                    </div>
                                </td>
                                <td><div class="skeleton-line" style="width: 150px; height: 16px;"></div></td>
                                <td><div class="skeleton-line" style="width: 80px; height: 24px; margin: 0 auto; border-radius: 20px;"></div></td>
                                <td><div class="skeleton-line" style="width: 80px; height: 24px; margin: 0 auto; border-radius: 20px;"></div></td>
                                <td><div class="skeleton-line" style="width: 100px; height: 32px; margin: 0 auto;"></div></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
    </div>

  <EditUserModal 
    v-if="isModalOpen"
    :openModal="isModalOpen"
    :user="selectedUser"
    :roles="availableRoles"
    @close="isModalOpen = false"
    @updated="handleUserUpdated"
  />
    </div>
</template>