import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Armith Docs',
  description: 'API-first KYC documentation for Armith — identity verification, hosted capture, mobile SDK',
  srcExclude: ['archive/**'],
  ignoreDeadLinks: false,
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
      { text: 'Quickstart', link: '/quickstart' },
      { text: 'Webhooks', link: '/guides/webhooks/get-started' },
      { text: 'REST API Playground', link: '/api-reference' }
    ],
    sidebar: [
      {
        text: 'Start Here',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'Quickstart (5 min)', link: '/quickstart' },
          { text: 'How It Works', link: '/concepts/how-it-works' },
          { text: 'Choose Your Path', link: '/concepts/integration-patterns' },
          { text: 'Glossary', link: '/concepts/terminology' }
        ]
      },
      {
        text: 'Guides',
        items: [
          { text: 'REST API — Get Started', link: '/guides/rest-api/get-started' },
          { text: 'REST API — Upload Images', link: '/guides/rest-api/upload-images' },
          { text: 'REST API — Verify ID', link: '/guides/rest-api/verify-id' },
          { text: 'REST API — Verify Selfie', link: '/guides/rest-api/verify-selfie' },
          { text: 'REST API — Check Status', link: '/guides/rest-api/check-status' },
          { text: 'REST API — Handle Results', link: '/guides/rest-api/handle-results' },
          { text: 'Hosted Capture', link: '/guides/hosted-capture/get-started' },
          { text: 'Mobile SDK', link: '/guides/mobile-sdk/get-started' },
          { text: 'Webhooks', link: '/guides/webhooks/get-started' },
          { text: 'Webhook Signatures & Events', link: '/guides/webhooks/verify-signatures' }
        ]
      },
      {
        text: 'Reference',
        items: [
          { text: 'Authentication', link: '/reference/authentication' },
          { text: 'Status Codes & Errors', link: '/reference/status-codes' },
          { text: 'Configuration', link: '/reference/configuration' },
          { text: 'Sandbox Testing', link: '/reference/sandbox-testing' },
          { text: 'Limits & Quotas', link: '/reference/limits-and-quotas' },
          { text: 'REST API Playground', link: '/api-reference' }
        ]
      },
      {
        text: 'Advanced',
        items: [
          { text: 'Threshold Tuning', link: '/advanced/threshold-tuning' },
          { text: 'Custom Workflows', link: '/advanced/custom-workflows' },
          { text: 'Async Verification', link: '/advanced/async-verification' },
          { text: 'Screening (AML/PEP)', link: '/advanced/screening' },
          { text: 'eID NFC', link: '/advanced/eid-nfc' },
          { text: 'KYB (Business)', link: '/advanced/kyb-verification' },
          { text: 'Manual Review', link: '/advanced/manual-review' },
          { text: 'Data Rights (GDPR)', link: '/advanced/data-subject-rights' }
        ]
      },
      {
        text: 'Troubleshooting',
        items: [
          { text: 'Common Errors', link: '/troubleshooting/common-errors' },
          { text: 'FAQ', link: '/troubleshooting/faq' },
          { text: 'Debugging Guide', link: '/troubleshooting/debugging-guide' }
        ]
      }
    ]
  }
});
