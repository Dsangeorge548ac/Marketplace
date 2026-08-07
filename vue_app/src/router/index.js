import { createRouter, createWebHashHistory } from 'vue-router';
import HomeView from '@/views/home.vue';
import LoginView from '@/views/auth.vue';
import MarketplaceView from '@/views/marketplace.vue';
import noticiasView from '@/views/noticias.vue';
import comoVenderView from '@/views/como-vender.vue';
import dashboardView from '@/views/dashboard.vue';
import usersView from '@/views/users.vue';
import services from '@/views/services.vue';
import ordersView from '@/views/orders.vue';
import publicationsView from '@/views/publications.vue';
import paymentMethodsView from '@/views/payment_methods.vue';
import accountView from '@/views/account.vue';
import dashboard_notices from '@/components/dashboard/dashboard_notices.vue';
import PublicationDetail from '@/views/PublicationDetail.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/auth',
      name: 'auth',
      component: LoginView
    },
    {
      path: '/marketplace',
      name: 'marketplace',
      component: MarketplaceView
    },
    {
      path: '/noticias',
      name: 'noticias',
      component: noticiasView
    },
    {
      path: '/como-vender',
      name: 'como-vender',
      component: comoVenderView
    },
    {
      path: '/services',
      name: 'services',
      component: services
    },
    {
      path: '/publication/:id',
      name: 'publication-detail',
      component: PublicationDetail
    },
    {
      // Grupo de Layout del Dashboard
      path: '/secure-layout',
      component: () => import('@/layouts/DashboardLayout.vue'),
      meta: { requiresAuth: true }, // Verificación de Auth en el padre
      children: [
        {
          path: '/dashboard/home',
          name: 'dashboard_Home',
          component: dashboardView,
          meta: { roles: ['Administrador', 'Developer', 'Usuario', 'Asociado'] }
        },
        {
          path: '/dashboard/users',
          name: 'dashboard_users',
          component: usersView,
          meta: { roles: ['Administrador', 'Developer'] }
        },
        {
          path: '/dashboard/notices',
          name: 'dashboard_notices',
          component: dashboard_notices,
          meta: { roles: ['Administrador', 'Developer', 'Usuario', 'Asociado'] }
        },
        {
          path: '/dashboard/publications',
          name: 'dashboard_publications',
          component: publicationsView,
          meta: { roles: ['Administrador', 'Developer', 'Usuario', 'Asociado'] }
        },
        {
          path: '/dashboard/orders',
          name: 'dashboard_orders',
          component: ordersView,
          meta: { roles: ['Administrador', 'Developer', 'Usuario', 'Asociado'] }
        },
        {
          path: '/dashboard/payment-methods',
          name: 'dashboard/payment-methods',
          component: paymentMethodsView,
          meta: { roles: ['Developer', 'Asociado'] }
        },
        {
          path: '/dashboard/account',
          name: 'dashboard_account',
          component: accountView,
          meta: { roles: ['Administrador', 'Developer', 'Usuario', 'Asociado'] }
        },
        {
          // Módulo de respaldos: solo accesible para el rol Developer
          path: '/dashboard/backups',
          name: 'dashboard/backups',
          component: () => import('@/components/dashboard/dashboard_backups.vue'),
          meta: { roles: ['Developer'] }
        }
      ]
    }
  ]
});

import { checkSession } from '@/services/authService';

router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    try {
      // Validar sesión con el backend
      const data = await checkSession();

      if (!data || data.error || !data.role) {
        // No autenticado
        return next({ name: 'auth' });
      }

      // Validar Rol
      if (to.meta.roles) {
        // Normalize role check (case-insensitive for robustness)
        const userRole = data.role;
        const allowedRoles = to.meta.roles;

        if (!allowedRoles.includes(userRole) && !allowedRoles.map(r => r.toLowerCase()).includes(userRole.toLowerCase())) {
          // Rol no autorizado
          return next({ name: 'home' });
        }
      }

      next(); // Permitir

    } catch (error) {
      console.error("Router Auth Check Error:", error);
      next({ name: 'auth' });
    }
  } else {
    next();
  }
});

export default router;

