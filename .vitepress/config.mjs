export default {
  title: 'Armith Docs',
  description: 'API-first KYC documentation for Armith',
  themeConfig: {
    nav: [
      { text: 'Overview', link: '/' },
      { text: 'Quickstart', link: '/getting-started' },
      { text: 'REST API', link: '/api-reference' }
    ],
    sidebar: [
      {
        text: 'Introduction',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Getting Started', link: '/getting-started' },
          { text: 'Authentication', link: '/authentication' }
        ]
      },
      {
        text: 'KYC API Flows',
        items: [
          { text: 'Flow Overview', link: '/kyc-flow-overview' },
          { text: 'Step-by-Step API Flow', link: '/kyc-api-flow' },
          { text: 'Statuses and Errors', link: '/errors-and-statuses' }
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'REST API Component', link: '/api-reference' },
          { text: 'Admin and Config APIs', link: '/admin-and-config-apis' }
        ]
      }
    ]
  }
};
