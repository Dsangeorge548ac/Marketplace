<script setup>
import { defineAsyncComponent } from 'vue'
// import sidebar from '@/components/sidebar/sidebar.vue' // Removed for Refactor

import { useDashboardUsers } from '@/assets/js/dashboard_users.js'
import { isSidebarOpen } from '@/assets/js/dashboardState.js'


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
    deleteUser
} = useDashboardUsers()

</script>

<template>
    <div>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
 <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">

    <div class="dashboard-content"> <!-- Optional wrapper for scoping if needed, or just flatten -->
            <div class="app-brand-container">
                    <!-- Botón hamburguesa al lado del título -->
                    <button v-if="!isSidebarOpen" class="btn-menu-toggle" @click="isSidebarOpen = true">
                        <i class='bx bx-menu'></i>
                    </button>
                    <div class="brand-icon" >
                        <i class='bx bxs-user-account'></i>
                    </div>
              
                    <h3 class="app-brand-title">Gestión de Usuarios</h3>
            </div>

            <div class="contenedor">
                
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
                                            <!-- <span class="user-sub">{{ user.username }}</span> -->
                                        </div>
                                    </div>
                                </td>
                                <td>{{ user.email }}</td>
                                <td class="text-center">
                                    <span :class="['badge-role', `role-${user.role ? user.role.toLowerCase() : ''}`]">{{ user.role }}</span>
                                </td>
                                <td>
                                    <div class="actions-flex">
                                        <button class="btn-icon edit" @click="openModal(user)">
                                            <i class='bx bx-edit-alt'></i>
                                        </button>
                                        <button class="btn-icon delete" @click="deleteUser(user)">
                                            <i class='bx bx-trash'></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="users.length === 0">
                                <td colspan="4" class="empty-state">
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
                <div v-else class="text-center p-5">
                    <p>Cargando usuarios...</p>
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