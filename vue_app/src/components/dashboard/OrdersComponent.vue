<template>
  <div class="orders-container">
    <h2>Mis Pedidos</h2>
    <div v-if="loading" class="loading">Cargando pedidos...</div>
    <div v-else>
      <DataTable 
        :value="orders" 
        paginator 
        :rows="10" 
        :rowsPerPageOptions="[5, 10, 20, 50]" 
        tableStyle="min-width: 50rem"
        class="p-datatable-sm"
      >
        <Column field="id" header="ID Pedido" sortable></Column>
        <Column field="machine_id" header="ID Maquina" sortable></Column>
        <Column field="status" header="Estado" sortable>
          <template #body="slotProps">
            <span :class="'status-badge status-' + slotProps.data.status.toLowerCase()">
              {{ slotProps.data.status }}
            </span>
          </template>
        </Column>
        <Column field="created_at" header="Fecha" sortable>
          <template #body="slotProps">
            {{ formatDate(slotProps.data.created_at) }}
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import axios from 'axios';

const orders = ref([]);
const loading = ref(true);

// Assuming user ID is stored in localStorage or available via a store
// For this example, I'll try to get it from localStorage, you might need to adjust this depending on your auth logic
const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user.id : null; 
};

const fetchOrders = async () => {
  const userId = getUserId();
  if (!userId) {
    console.error("User not found");
    loading.value = false;
    return;
  }

  try {
    // Determine API URL based on environment (similar to your imageHelper logic logic)
    // For local dev with Nginx gateway:
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888'}/api/orders_service/user/${userId}`;
    
    const response = await axios.get(apiUrl);
    
    // Check for paginated wrapper
    if (response.data && response.data.data) {
        orders.value = response.data.data;
    } else {
        orders.value = response.data || [];
    }
  } catch (error) {
    console.error("Error fetching orders:", error);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

onMounted(() => {
  fetchOrders();
});
</script>

<style scoped>
.orders-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

h2 {
  margin-bottom: 20px;
  color: #333;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: bold;
}

.status-pending {
  background-color: #fff3cd;
  color: #856404;
}

.status-completed {
  background-color: #d4edda;
  color: #155724;
}

.status-cancelled {
  background-color: #f8d7da;
  color: #721c24;
}
</style>
