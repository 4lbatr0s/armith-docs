import { defineConfig } from 'vitepress';

const HOSTNAME = 'https://armith-docs-standalone.onrender.com';
const SITE_TITLE = 'Armith Docs';
const SITE_DESCRIPTION = 'Verify ID documents and selfies via REST, hosted capture, or the React Native SDK. HMAC webhooks, sandbox keys, tenant isolation.';

/** Public URL of a page: cleanUrls, and index pages map to their folder. */
export const pageUrl = (relativePath) => {
  const path = relativePath.replace(/\.md$/, '');
  if (path === 'index') return `${HOSTNAME}/`;
  if (path.endsWith('/index')) return `${HOSTNAME}/${path.slice(0, -'index'.length)}`;
  return `${HOSTNAME}/${path}`;
};

export default defineConfig({
  lang: 'en-US',
  title: 'Armith Docs',
  description: 'Verify ID documents and selfies via REST, hosted capture, or the React Native SDK. HMAC webhooks, sandbox keys, tenant isolation.',
  transformHead({ pageData }) {
    const url = pageUrl(pageData.relativePath);
    const title = pageData.frontmatter?.title || pageData.title || SITE_TITLE;
    const description = pageData.frontmatter?.description || pageData.description || SITE_DESCRIPTION;
    const head = [
      ['link', { rel: 'canonical', href: url }],
      ['meta', { property: 'og:url', content: url }],
      ['meta', { property: 'og:title', content: title }],
      ['meta', { property: 'og:description', content: description }],
      ['meta', { name: 'twitter:title', content: title }],
      ['meta', { name: 'twitter:description', content: description }]
    ];
    if (/^(tr\/)?learn\//.test(pageData.relativePath) || pageData.relativePath === 'tr/tc-kimlik-dogrulama.md') {
      const article = {
        '@context': 'https://schema.org',
        '@type': 'TechArticle',
        headline: title,
        description,
        inLanguage: pageData.relativePath.startsWith('tr/') ? 'tr' : 'en',
        url,
        publisher: { '@type': 'Organization', name: 'Armith' }
      };
      if (pageData.lastUpdated) article.dateModified = new Date(pageData.lastUpdated).toISOString();
      head.push(['script', { type: 'application/ld+json' }, JSON.stringify(article)]);
    }
    return head;
  },
  appearance: true,
  cleanUrls: true,
  srcExclude: ['archive/**'],
  lastUpdated: true,
  sitemap: {
    hostname: 'https://armith-docs-standalone.onrender.com'
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#1B2A4A' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { name: 'twitter:card', content: 'summary' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;700&family=Inter:wght@400;500;600;700&family=Roboto+Mono:wght@400;500;600;700&display=swap'
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
          { text: 'Pricing and billing', link: '/pricing' },
          { text: 'Türkçe özet', link: '/tr/' },
          { text: 'Türkiye kurulum rehberi', link: '/tr/turkiye-kurulum' },
          { text: 'How It Works', link: '/concepts/how-it-works' },
          { text: 'Is Armith right for you?', link: '/concepts/is-armith-right-for-you' },
          { text: 'Feature status', link: '/concepts/feature-status' },
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
          { text: 'Web SDK', link: '/guides/hosted-capture/web-sdk' },
          { text: 'Mobile SDK', link: '/guides/mobile-sdk/get-started' },
          { text: 'Webhooks', link: '/guides/webhooks/get-started' },
          { text: 'Server SDKs', link: '/guides/sdks' },
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
          { text: 'CSCA certificates', link: '/advanced/csca-sources' },
          { text: 'Countries', link: '/advanced/countries' },
          { text: 'Video Ident', link: '/advanced/video-ident' },
          { text: 'Sovereign mode', link: '/advanced/sovereign-mode' },
          { text: 'KYB (Business)', link: '/advanced/kyb-verification' },
          { text: 'Manual Review', link: '/advanced/manual-review' },
          { text: 'Data Rights (GDPR)', link: '/advanced/data-subject-rights' },
          { text: 'Security and compliance', link: '/advanced/security-and-compliance' },
          { text: 'Audit and four-eyes', link: '/advanced/audit-and-review' },
          { text: 'Policy rules', link: '/advanced/policy-rules' }
        ]
      },
      {
        text: 'Learn',
        collapsed: true,
        items: [
          { text: 'TC Kimlik checksum', link: '/learn/tc-kimlik-checksum' },
          { text: 'TC Kimlik doğrulama (tr)', link: '/tr/tc-kimlik-dogrulama' },
          { text: 'MRZ check digits', link: '/learn/mrz-check-digits' },
          { text: 'NFC chip verification', link: '/learn/nfc-id-chip-verification' },
          { text: 'KYC cost per verification', link: '/learn/kyc-cost-per-verification' }
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
