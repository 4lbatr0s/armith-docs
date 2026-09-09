import { defineConfig } from 'vitepress';

export default defineConfig({
  lang: 'en-US',
  title: 'Armith Docs',
  description: 'Verify ID documents and selfies via REST, hosted capture, or the React Native SDK. HMAC webhooks, sandbox keys, tenant isolation.',
  appearance: true,
  cleanUrls: true,
  srcExclude: ['archive/**'],
  lastUpdated: true,
  sitemap: {
    hostname: 'https://armith-docs-standalone.onrender.com'
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'canonical', href: 'https://armith-docs-standalone.onrender.com/' }],
    ['meta', { name: 'theme-color', content: '#059669' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: 'https://armith-docs-standalone.onrender.com/' }],
    ['meta', { property: 'og:title', content: 'Armith Docs — KYC API, hosted capture, React Native SDK' }],
    ['meta', {
      property: 'og:description',
      content: 'API-first KYC documentation for Armith — identity verification, hosted capture, mobile SDK'
    }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['meta', { name: 'twitter:title', content: 'Armith Docs' }],
    ['meta', {
      name: 'twitter:description',
      content: 'Verify ID documents and selfies via REST, hosted capture, or the React Native SDK.'
    }],
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
    logo: '/logo.svg',
    siteTitle: 'Armith Docs',
    nav: [
      { text: 'Overview', link: '/' },
      { text: 'Quickstart', link: '/quickstart' },
      { text: 'Trust', link: '/advanced/data-subject-rights' },
      { text: 'Webhooks', link: '/guides/webhooks/get-started' },
      { text: 'REST API Playground', link: '/api-reference' }
    ],
    search: {
      provider: 'local'
    },
    editLink: {
      pattern: 'https://github.com/4lbatr0s/armith-docs/edit/main/:path',
      text: 'Edit this page on GitHub'
    },
    lastUpdated: {
      text: 'Last updated'
    },
    outline: {
      level: [2, 3],
      label: 'On this page'
    },
    docFooter: {
      prev: 'Previous page',
      next: 'Next page'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/4lbatr0s/armith-docs' }
    ],
    footer: {
      message: 'Armith — API-first identity verification.',
      copyright: 'Copyright © 2026 Armith'
    },
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
        collapsed: true,
        items: [
          { text: 'REST API — Get Started', link: '/guides/rest-api/get-started' },
          { text: 'REST API — Upload Images', link: '/guides/rest-api/upload-images' },
          { text: 'REST API — Verify ID', link: '/guides/rest-api/verify-id' },
          { text: 'REST API — Verify Selfie', link: '/guides/rest-api/verify-selfie' },
          { text: 'REST API — Verify Video Ident', link: '/guides/rest-api/verify-videocall' },
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
        collapsed: true,
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
        collapsed: true,
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
        collapsed: true,
        items: [
          { text: 'Common Errors', link: '/troubleshooting/common-errors' },
          { text: 'FAQ', link: '/troubleshooting/faq' },
          { text: 'Debugging Guide', link: '/troubleshooting/debugging-guide' }
        ]
      }
    ]
  }
});
