import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Armith Docs',
  description: 'API-first KYC documentation for Armith',
  appearance: true,
  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Syne:wght@600;700;800&display=swap'
      }
    ]
  ],
  themeConfig: {
    nav: [
      { text: 'Overview', link: '/' },
      { text: 'Quickstart', link: '/getting-started' },
      { text: 'REST API Playground', link: '/api-reference' }
    ],
    sidebar: [
      {
        text: 'Start Here',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Authentication', link: '/authentication' }
        ]
      },
      {
        text: 'Step-by-Step Journey',
        items: [
          { text: 'Flow Overview', link: '/kyc-flow-overview' },
          { text: 'Step-by-Step API Flow', link: '/kyc-api-flow' },
          { text: 'Statuses and Errors', link: '/errors-and-statuses' },
          { text: 'REST API Playground', link: '/api-reference' }
        ]
      },
      {
        text: 'Dashboard APIs',
        items: [
          { text: 'Admin and Config APIs', link: '/admin-and-config-apis' }
        ]
      }
    ]
  }
});
