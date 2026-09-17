import { createRouter, createWebHistory } from 'vue-router';
import ZhangzhouHome from '../views/zhangzhou/Home.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: ZhangzhouHome,
    meta: {
      scaleScreen: true,
      title: '漳州数智云',
    },
  },
  {
    path: '/1591',
    name: 'ZhangzhouHome',
    component: ZhangzhouHome,
    meta: {
      scaleScreen: true,
      title: '漳州数智云',
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
    path: '/1591/billing-reports',
    name: 'ZhangzhouBillingReports',
    component: () => import('../views/zhangzhou/pages/BillingReports.vue'),
  },
  {
    path: '/billing-reports',
    name: 'BillingReports',
    component: () => import('../views/zhangzhou/pages/BillingReports.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.afterEach((to) => {
  document.title = to.meta.title || '漳州数智云';
});

export default router;
