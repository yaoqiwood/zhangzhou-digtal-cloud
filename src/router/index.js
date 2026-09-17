import { createRouter, createWebHistory } from 'vue-router';
import ZhangzhouHome from '../views/zhangzhou/Home.vue';
import PutianHome from '../views/putian/Home.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: PutianHome,
    meta: {
      scaleScreen: true,
      title: '莆田数智云',
    },
  },
  {
    path: '/1591',
    name: 'ZhangzhouHome',
    component: ZhangzhouHome,
    meta: {
      scaleScreen: true,
      title: '福州数智云',
    },
  },
  {
    path: '/putian',
    name: 'PutianHome',
    component: PutianHome,
    meta: {
      scaleScreen: true,
      title: '莆田数智云',
    },
  },
  {
    path: '/1594',
    name: 'PutianCodeHome',
    component: PutianHome,
    meta: {
      scaleScreen: true,
      title: '莆田数智云',
    },
  },
  // {
  //   path: '/',
  //   name: 'Home',
  //   component: () => import('../views/widgets/MapPopup.vue'),
  // },
  {
    path: '/putian-smart-cloud',
    name: 'PutianSmartCloud',
    component: () => import('../views/putian/PutianSmartCloud.vue'),
  },
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
  {
    path: '/putian/billing-reports',
    name: 'PutianBillingReports',
    component: () => import('../views/putian/pages/BillingReports.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.afterEach((to) => {
  document.title = to.path === '/1591' || to.path.startsWith('/1591/')
    ? '福州数智云'
    : to.meta.title || '莆田数智云';
});

export default router;
