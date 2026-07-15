import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Armith Docs',
  description: 'API-first KYC documentation for Armith — identity verification, hosted capture, mobile SDK',
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
      { text: 'Webhooks', link: '/webhooks' },
      { text: 'REST API Playground', link: '/api-reference' }
    ],
    sidebar: [
      {
        text: 'Start Here',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Authentication', link: '/authentication' },
          { text: 'Integrations Dashboard', link: '/integrations-dashboard' }
        ]
      },
      {
        text: 'Integration Guides',
        items: [
          { text: 'Step-by-Step API Flow', link: '/kyc-api-flow' },
          { text: 'Hosted Capture Flow', link: '/integrator-hosted-flow' },
          { text: 'Mobile SDK (React Native)', link: '/mobile-sdk' }
        ]
      },
      {
        text: 'Verification Pipeline',
        items: [
          { text: 'Flow Overview', link: '/kyc-flow-overview' },
          { text: 'Verification & Preflight', link: '/verification-and-preflight' },
          { text: 'eID NFC Verification', link: '/eid-nfc-verification' },
          { text: 'KYB (Business Verification)', link: '/kyb-verification' },
          { text: 'Screening (AML/PEP)', link: '/screening' },
          { text: 'Async Verification', link: '/async-verification' },
          { text: 'Sandbox Testing', link: '/sandbox-testing' }
        ]
      },
      {
        text: 'Events & Operations',
        items: [
          { text: 'Outbound Webhooks', link: '/webhooks' },
          { text: 'Admin & Config APIs', link: '/admin-and-config-apis' },
          { text: 'Verification Workflows', link: '/workflows' },
          { text: 'Admin Analytics', link: '/admin-analytics' },
          { text: 'Data Subject Rights (GDPR)', link: '/data-subject-rights' }
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'Statuses and Errors', link: '/errors-and-statuses' },
          { text: 'REST API Playground', link: '/api-reference' }
        ]
      }
    ]
  }
});
