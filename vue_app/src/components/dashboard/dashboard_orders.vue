<script setup>
import { defineAsyncComponent, onMounted } from 'vue'
import { ref, computed } from 'vue'
import { useDashboardOrders } from '@/assets/js/dashboard_orders.js'
import { isSidebarOpen } from '@/assets/js/dashboardState.js'
import dashboard_banner from '@/components/dashboard/dashboard_banner.vue'
import { has } from 'vuetify/lib/util/helpers.mjs'
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
    sellerPaymentMethods,
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
} = useDashboardOrders()

const userData = ref(null)
const normalizeRole = (role) => (role || '').toLowerCase()
const isVerified = computed(() => user.value?.status === 'Verificado')

const canChangeStatus = computed(() => {
    return isAdmin.value || viewMode.value === 'sales'
})

const canVerifyUser = computed(() => {
    const status = normalizeRole(user.value?.status)
    return ['verificado'].includes(status)
})


onMounted(() => {
    canVerifyUser.value
})

function canBuyerCancel(order) {
    return viewMode.value === 'purchases' && (order?.status || '').toLowerCase() === 'pendiente'
}

function deletableOrder(order) {
    return viewMode.value === 'sales' && (order?.status || '').toLowerCase() === 'pendiente'
}
</script>

<template>
    <div>

    <div class="dashboard-content">
            <dashboard_banner />
            
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

            <div class="table-container">
            
                <!-- Search -->
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
                                <td class="text-center">{{ order.order_number }}</td>
                                <td>{{ order.buyerName }}</td>
                                <td>{{ order.buyerEmail }}</td>
                                <td class="text-center">
                                    <span :class="['badge-status', `status-${order.status ? order.status.toLowerCase() : 'pending'}`]">
                                        {{ getStatusLabel(order.status) || order.status }}
                                    </span>
                                </td>
                                <td class="text-center">
                                    {{ formatDate(order.created_at) }}
                                </td>
                                <td>
                                    <div class="actions-flex">
                                        <button class="btn-icon edit" @click="viewDetails(order)" title="Ver detalles">
                                            <i class='bx bx-show'></i>
                                        </button>
                                        
                                        <button 
                                            v-if="canChangeStatus"
                                            class="btn-icon verify" 
                                            @click="openStatusModal(order)" 
                                            title="Cambiar estado">
                                            <i class='bx bx-transfer'></i>
                                        </button>

                                        <button 
                                            v-if="isVerified && (isAdmin || viewMode === 'sales' || viewMode === 'purchases')"
                                            class="btn-icon quote" 
                                            @click="generateOrderQuotation(order)" 
                                            title="Generar cotización PDF">
                                            <i class='bx bx-file'></i>
                                        </button>

                                         <button 
                                            v-if="canBuyerCancel(order)"
                                            class="btn-icon delete" 
                                            @click="cancelOrder(order)" 
                                            title="Cancelar Pedido">
                                            <i class='bx bx-x'></i>
                                        </button>

                                        <button 
                                            v-if="isAdmin || deletableOrder(order)"
                                            class="btn-icon delete" 
                                            @click.stop="deleteOrder(order)" 
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
                <div v-else class="table-responsive">
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
                            <tr v-for="i in 5" :key="i">
                                <td class="text-center"><div class="skeleton-line" style="width: 40px; height: 16px; margin: 0 auto;"></div></td>
                                <td><div class="skeleton-line" style="width: 120px; height: 16px;"></div></td>
                                <td><div class="skeleton-line" style="width: 150px; height: 16px;"></div></td>
                                <td class="text-center"><div class="skeleton-line" style="width: 80px; height: 24px; margin: 0 auto; border-radius: 20px;"></div></td>
                                <td class="text-center"><div class="skeleton-line" style="width: 100px; height: 16px; margin: 0 auto;"></div></td>
                                <td><div class="skeleton-line" style="width: 120px; height: 32px; margin: 0 auto;"></div></td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>
    </div>

  <!-- STATUS CHANGE MODAL -->
  <Teleport to="body">
      <div v-if="showStatusModal" class="modal-overlay active" @click.self="closeStatusModal">
          <div class="modal-container-2" style="max-width: 450px; height: auto; display: flex; flex-direction: column;" @click.stop>
              <div class="modal-header-2">
                  <h2>Cambiar Estado #{{ statusOrder?.id }}</h2>
                  <button @click="closeStatusModal" class="close-button-2">&times;</button>
              </div>
              
              <div class="modal-content-2">
                  <div style="margin-bottom: 20px; font-size: 14px; color: #444;">
                      <p style="margin-bottom: 8px;">Comprador: <strong>{{ statusOrder?.buyerName }}</strong></p>
                      <p>Estado actual: 
                          <span :class="['badge-status', `status-${statusOrder?.status || 'pending'}`]" style="display: inline-block; margin-left: 5px;">
                              {{ getStatusLabel(statusOrder?.status) }}
                          </span>
                      </p>
                  </div>
                  
                  <form @submit.prevent="changeOrderStatus" class="harvest-form">
                      <div class="form-grid" style="margin-bottom: 0;">
                          <div class="form-group full-width">
                              <label>Nuevo estado</label>
                              <select v-model="selectedStatus" required>
                                  <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                                      {{ opt.label }}
                                  </option>
                              </select>
                          </div>
                      </div>

                      <div class="form-actions" style="margin-top: 15px;">
                          <button type="button" class="cancel-button" @click="closeStatusModal">Cancelar</button>
                          <button type="submit" class="submit-button">Confirmar</button>
                      </div>
                  </form>
              </div>
          </div>
      </div>
  </Teleport>

  <!-- DETAIL MODAL -->
  <Teleport to="body">
      <div v-if="showListModal" class="modal-overlay active" style="z-index: 99999 !important;">
          <div class="modal-container-2" style="max-width: 100%; width: 100%; height: 100%; max-height: 100%; border-radius: 10px;">
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
                      <div class="info-group">
                          <label>Estado:</label>
                          <span :class="['badge-status', `status-${currentOrder.status || 'pending'}`]">
                              {{ getStatusLabel(currentOrder.status) }}
                          </span>
                      </div>
                  </div>

                  <div class="modal-body">
                      <div v-if="isLoadingDetails" class="text-center p-5">
                          <i class='bx bx-loader-alt bx-spin' style="font-size: 2rem; color: #4f46e5;"></i>
                          <p style="margin-top: 10px; color: #6b7280;">Cargando detalles...</p>
                      </div>

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

                  <div class="modal-footer invoice-footer" style="display: flex; flex-direction: column; gap: 15px;">
                       <div class="total-row" style="align-self: flex-end;">
                           <span class="total-label">Total:</span>
                           <span class="total-amount">{{ formatPrice(orderTotal) }}</span>
                       </div>

                       <!-- Payment Methods Display -->
                       <div v-if="viewMode === 'purchases'" class="payment-methods-section" style="width: 100%; border-top: 1px solid #eee; padding-top: 15px; text-align: left;">
                           <h4 style="margin-bottom: 15px; color: #333; display: flex; align-items: center; gap: 8px;">
                               <i class='bx bx-credit-card-alt' style="color: #4f46e5;"></i> Métodos de Pago del Vendedor
                           </h4>
                           <div v-if="sellerPaymentMethods && sellerPaymentMethods.length > 0" style="display: flex; flex-wrap: wrap; gap: 15px;">
                               <div v-for="method in sellerPaymentMethods" :key="method.id" style="background: #f8f9fa; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; min-width: 200px; flex: 1;">
                                   <strong style="display: block; color: #1f2937; font-size: 1.1em; margin-bottom: 8px; text-transform: capitalize;">{{ method.platform }}</strong>
                                   <div style="display: flex; flex-direction: column; gap: 4px;">
                                       <span style="font-size: 0.9em; color: #4b5563;"><i class='bx bx-user' style="margin-right: 5px; color: #6b7280;"></i>{{ method.account_holder }}</span>
                                       <span style="font-size: 0.9em; color: #4b5563;"><i class='bx bx-id-card' style="margin-right: 5px; color: #6b7280;"></i>{{ method.email_or_id }}</span>
                                   </div>
                               </div>
                           </div>
                           <div v-else style="padding: 15px; background: #fff3cd; border: 1px solid #ffe69c; border-radius: 8px; color: #856404;">
                               <i class='bx bx-info-circle'></i> El vendedor aún no ha configurado sus métodos de pago. Por favor, contáctelo directamente.
                           </div>
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

