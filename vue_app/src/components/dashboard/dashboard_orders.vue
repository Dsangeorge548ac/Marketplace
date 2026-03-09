<script setup>
import { defineAsyncComponent } from 'vue'
// import sidebar from '@/components/sidebar/sidebar.vue' // Removed for Refactor
import { useDashboardOrders } from '@/assets/js/dashboard_orders.js'
import { isSidebarOpen } from '@/assets/js/dashboardState.js'

// Modal Import
const ModalPost = defineAsyncComponent(() => import('@/components/modals/modal_post.vue'))

const {
    orders,
    isLoading,
    user,
    viewMode,
    showModal,
    showListModal,
    selectedProduct,
    selectedOrderProducts,
    currentOrder,
    isAdmin,
    
    // Pagination
    search,
    currentPage,
    totalPages,
    visiblePages,
    totalCount,
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
} = useDashboardOrders()

</script>

<template>
    <div>
 <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">

    <div class="dashboard-content">
            <div class="app-brand-container">
                    <!-- Botón hamburguesa al lado del título -->
                    <button v-if="!isSidebarOpen" class="btn-menu-toggle" @click="isSidebarOpen = true">
                        <i class='bx bx-menu'></i>
                    </button>
                    <div class="brand-icon" >
                        <i class='bx bx-shopping-bag'></i>
                    </div>
              
                    <h3 class="app-brand-title">Gestión de Pedidos</h3>
            </div>
            
            <div class="tabs-container" v-if="!isAdmin">
                <button 
                  :class="['tab-btn', { active: viewMode === 'purchases' }]" 
                  @click="switchMode('purchases')">
                  <i class='bx bx-cart'></i> Mis Compras
                </button>
                <button 
                  :class="['tab-btn', { active: viewMode === 'sales' }]" 
                  @click="switchMode('sales')">
                  <i class='bx bx-store'></i> Mis Ventas
                </button>
            </div>

            <div class="contenedor">
                
                <!-- MODERN TABLE -->
                <div class="table-controls">
                    <div class="search-box">
                        <i class='bx bx-search'></i>
                        <input type="text" v-model="search" placeholder="Buscar pedido...">
                    </div>
                </div>

                <div v-if="!isLoading" class="table-responsive">
                    <table class="modern-table">
                        <thead>
                            <tr>
                                <th class="text-center">ID</th>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th class="text-center">Estado</th>
                                <th class="text-center">Fecha</th>
                                <th class="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="order in orders" :key="order.id">
                                <td class="text-center">#{{ order.id }}</td>
                                <td>{{ order.buyerName }}</td>
                                <td>{{ order.buyerEmail }}</td>
                                <td class="text-center">
                                    <span :class="['badge-status', `status-${order.status ? order.status.toLowerCase() : 'pending'}`]">
                                        {{ order.status }}
                                    </span>
                                </td>
                                <td class="text-center">
                                    {{ formatDate(order.created_at) }}
                                </td>
                                <td>
                                    <div class="actions-flex">
                                        <button class="btn-icon view" @click="viewDetails(order)" title="Ver productos">
                                            <i class='bx bx-show'></i>
                                        </button>
                                        
                                        <button 
                                            v-if="(isAdmin || viewMode === 'sales') && order.status === 'pending' && order.user_id != user.id" 
                                            class="btn-icon approve" 
                                            @click="approveOrder(order)" 
                                            title="Aprobar pedido">
                                            <i class='bx bx-check'></i>
                                        </button>

                                        <button 
                                            class="btn-icon delete" 
                                            @click.stop="cancelOrder(order)" 
                                            title="Eliminar pedido">
                                            <i class='bx bx-trash'></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr v-if="orders.length === 0">
                                <td colspan="6" class="empty-state">
                                    <i class='bx bx-shopping-bag'></i>
                                    <p>No se encontraron pedidos</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>

                     <!-- PAGINATION -->
                    <div class="pagination-container" v-if="orders.length > 0 || totalCount > 0">
                         <div class="page-info">
                            Mostrando {{ orders.length }} de {{ totalCount }}
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
                    <p>Cargando pedidos...</p>
                </div>

            </div>
    </div>
  
  <Teleport to="body">
      <div v-if="showListModal" class="modal-overlay active" style="z-index: 99999 !important;">
          <div class="modal-container-2" style="max-width: 100%; width: 100%; height: 100%; max-height: 100%; border-radius: 0;">
              <div class="modal-header-2">
                  <h2>Detalle del Pedido #{{ currentOrder?.id }}</h2>
                  <button @click="showListModal = false" class="close-button-2">&times;</button>
              </div>
              
              <div class="modal-content-2">
                  <!-- Order Info -->
                  <div class="invoice-info" v-if="currentOrder">
                      <div class="info-group">
                          <label>Comprador:</label>
                          <span>{{ currentOrder.buyerName }}</span>
                      </div>
                      <div class="info-group">
                          <label>Email:</label>
                          <span>{{ currentOrder.buyerEmail }}</span>
                      </div>
                      <div class="info-group">
                          <label>Fecha:</label>
                          <span>{{ formatDate(currentOrder.created_at) }}</span>
                      </div>
                  </div>

                  <div class="modal-body">
                      <!-- Loading State -->
                      <div v-if="isLoadingDetails" class="text-center p-5">
                          <i class='bx bx-loader-alt bx-spin' style="font-size: 2rem; color: #4f46e5;"></i>
                          <p style="margin-top: 10px; color: #6b7280;">Cargando detalles...</p>
                      </div>

                      <!-- Table Content -->
                      <table v-else class="invoice-table">
                          <thead>
                              <tr>
                                  <th class="text-left">Producto</th>
                                  <th class="text-center">Precio</th>
                                  <th class="text-center">Cant.</th>
                                  <th class="text-right">Subtotal</th>
                              </tr>
                          </thead>
                          <tbody>
                              <div v-if="selectedOrderProducts.length === 0" class="no-data">
                                  No hay datos disponibles
                              </div>
                              <tr v-for="item in selectedOrderProducts" :key="item.id">
                                  <td class="product-cell">
                                      <div class="product-thumb">
                                          <img v-if="item.image" :src="item.image" alt="img" @error="$event.target.style.display='none'; $event.target.nextElementSibling.style.display='flex'">
                                          <div class="no-image-fallback" :style="{ display: item.image ? 'none' : 'flex' }">
                                              <i class='bx bx-image'></i>
                                          </div>
                                      </div>
                                      <div class="product-details-text">
                                          <span class="product-name" :title="item.name">{{ item.name }}</span>
                                          <button class="btn-link-sm" @click="openProductModal(item)">Ver detalle</button>
                                      </div>
                                  </td>
                                  <td class="text-center">{{ formatPrice(item.price) }}</td>
                                  <td class="text-center">{{ item.quantity }}</td>
                                  <td class="text-right font-bold">{{ formatPrice(item.price * item.quantity) }}</td>
                              </tr>
                          </tbody>
                      </table>
                  </div>

                  <div class="modal-footer invoice-footer" style="display: flex; justify-content: flex-end; align-items: center;">
                       <div class="total-row">
                           <span class="total-label">Total:</span>
                           <span class="total-amount">{{ formatPrice(orderTotal) }}</span>
                       </div>
                  </div>
              </div>
          </div>
      </div>
  </Teleport>

  <ModalPost 
    v-if="showModal"
    :isModalOpen="showModal"
    :selectedHarvest="selectedProduct"
    @close="closeProductModal"
  />
    </div>
</template>
