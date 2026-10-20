import { createRouter, createWebHistory } from 'vue-router';
import NanpingHome from '../views/nanping/Home.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: NanpingHome,
    meta: {
      scaleScreen: true,
      title: '南平数智云',
    },
  },
  {
    path: '/1599',
    name: 'NanpingHome',
    component: NanpingHome,
    meta: {
      scaleScreen: true,
      title: '南平数智云',
    },
  },
  // {
  //   path: '/',
  //   name: 'Home',
  //   component: () => import('../views/widgets/MapPopup.vue'),
  // },
  {
    path: '/api-tester',
    name: 'ApiTester',
    component: () => import('../views/ApiTester.vue'),
  },
  {
    path: '/1599/billing-reports',
    name: 'NanpingBillingReports',
    component: () => import('../views/nanping/pages/BillingReports.vue'),
  },
  {
    path: '/billing-reports',
    name: 'BillingReports',
    component: () => import('../views/nanping/pages/BillingReports.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.afterEach((to) => {
  document.title = to.meta.title || '南平数智云';
});

export default router;
