import { ref } from 'vue';

export function useDashboardHome() {
    const isSidebarOpen = ref(true);

    return {
        isSidebarOpen
    }
}
