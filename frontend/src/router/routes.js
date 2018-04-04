
export default [
  {
    path: '/',
    component: () => import('layouts/default'),
    children: [
      { path: '', component: () => import('pages/index') },
      { path: 'paperwallet', component: () => import('pages/PaperWallet.vue') },
      { path: 'chipCard', component: () => import('pages/chipCard') },
      { path: 'SMS', component: () => import('pages/SMS') },
      { path: 'NFC', component: () => import('pages/NFC') }
    ]
  },

  { // Always leave this as last one
    path: '*',
    component: () => import('pages/404')
  }
]
