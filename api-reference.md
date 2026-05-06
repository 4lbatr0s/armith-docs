---
outline: deep
---

# REST API Playground

Send real HTTP requests from this documentation site. Pick an endpoint below to load **method**, **path**, **request body**, and **documented responses** — similar to Postman collections or interactive API explorers.

> **Base URLs:** Sandbox — `https://armith-backend-live.onrender.com` · Production — `https://api.armith.com`  
> **OpenAPI:** [`/openapi.yaml`](/openapi.yaml)

### Authentication modes

| Mode | Headers | Used for |
|------|---------|-----------|
| **None** | — | `/health`, public KYC metadata |
| **API key + optional Clerk** | `x-api-key: ak_live_…` **or** `Authorization: Bearer ak_live_…` | `/kyc/*` protected routes |
| **Clerk JWT** | `Authorization: Bearer <dashboard session JWT>` | `/auth/profile`, `/admin/*`, `/config` (excluding `GET /config/presets`) |

Paste a JWT from browser devtools (dashboard `Fetch`/`XHR` Authorization header). API keys belong in **`x-api-key`** or Bearer `ak_live_…`.

Browsers enforce **CORS** — the backend must allow this docs origin (`Access-Control-Allow-Origin`) and **`x-api-key`** on preflight requests.

<script setup>
import { ref, computed, watch } from 'vue';
import { PLAYGROUND_ENDPOINTS, PLAYGROUND_TAG_ORDER } from './playground-endpoints.js';

const baseUrl = ref('https://armith-backend-live.onrender.com');
const apiKey = ref('');
const bearerToken = ref('');
const selectedId = ref(PLAYGROUND_ENDPOINTS[0].id);
const method = ref('GET');
const pathField = ref('/health');
const body = ref('');
const pathParamValues = ref({});
const loading = ref(false);
const liveResponse = ref('');
const selectedExampleIx = ref(0);

const byTag = computed(() => {
  const map = Object.fromEntries(PLAYGROUND_TAG_ORDER.map((t) => [t, []]));
  for (const ep of PLAYGROUND_ENDPOINTS) {
    if (!map[ep.tag]) map[ep.tag] = [];
    map[ep.tag].push(ep);
  }
  return map;
});

const selectedEndpoint = computed(() =>
  PLAYGROUND_ENDPOINTS.find((e) => e.id === selectedId.value)
);

function resolvePathFromParams(ep, params) {
  let pth = ep.path;
  for (const pr of ep.pathParams || []) {
    const raw = params[pr.name]?.trim?.() ?? '';
    if (raw) pth = pth.replace(`:${pr.name}`, encodeURIComponent(raw));
  }
  return pth;
}

function syncFromEndpoint() {
  const ep = selectedEndpoint.value;
  if (!ep) return;
  method.value = ep.method;
  const pv = {};
  for (const p of ep.pathParams || []) pv[p.name] = p.example ?? '';
  pathParamValues.value = pv;
  pathField.value = resolvePathFromParams(ep, pv);
  body.value = ep.body ?? '';
  selectedExampleIx.value = 0;
}

watch(selectedId, syncFromEndpoint, { immediate: true });

watch(
  pathParamValues,
  () => {
    const ep = selectedEndpoint.value;
    if (!ep) return;
    pathField.value = resolvePathFromParams(ep, pathParamValues.value);
  },
  { deep: true }
);

const activeExamples = computed(() => selectedEndpoint.value?.responseExamples ?? []);

const examplePreview = computed(() => {
  const list = activeExamples.value;
  const ex = list[selectedExampleIx.value];
  if (!ex || ex.body === undefined) return '—';
  return JSON.stringify(ex.body, null, 2);
});

function authNote(ep) {
  if (!ep) return '';
  if (ep.auth === 'none') return 'No authentication required.';
  if (ep.auth === 'clerk')
    return 'Requires a Clerk session JWT in Authorization Bearer. API keys are not accepted on this route.';
  return 'Use x-api-key (recommended) or Authorization Bearer ak_live_… for API keys. Use Bearer with a Clerk JWT for dashboard session.';
}

async function sendRequest() {
  const ep = selectedEndpoint.value;
  loading.value = true;
  liveResponse.value = '';

  try {
    if (pathField.value.includes(':')) {
      liveResponse.value =
        'Cannot send: URL still contains a path placeholder (:param). Fill all path parameter fields.';
      loading.value = false;
      return;
    }

    const base = baseUrl.value.replace(/\/+$/, '');
    const p = pathField.value.startsWith('/') ? pathField.value : `/${pathField.value}`;
    const url = `${base}${p}`;

    const headers = {};
    const m = method.value.toUpperCase();
    if (apiKey.value.trim()) headers['x-api-key'] = apiKey.value.trim();
    if (bearerToken.value.trim()) headers['Authorization'] = `Bearer ${bearerToken.value.trim()}`;
    const hasBody = !['GET', 'HEAD'].includes(m) && body.value.trim().length > 0;
    if (hasBody) headers['Content-Type'] = 'application/json';

    const init = { method: m, headers };
    if (hasBody) init.body = body.value;

    const res = await fetch(url, init);
    const text = await res.text();
    let formatted = text;
    try {
      formatted = JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      formatted = text;
    }
    liveResponse.value = `HTTP ${res.status} ${res.statusText}\n\n${formatted}`;
  } catch (error) {
    liveResponse.value = `Request failed: ${error.message}`;
  } finally {
    loading.value = false;
  }
}
</script>

<div class="api-playground-root">

<section class="api-playground-panel">
  <h3 class="api-playground-heading">Credentials</h3>
  <div class="api-playground-grid-2">
    <label class="api-playground-field">
      <span>API key (<code>x-api-key</code>)</span>
      <input v-model="apiKey" type="password" autocomplete="off" placeholder="ak_live_…" />
    </label>
    <label class="api-playground-field">
      <span>Bearer token</span>
      <input v-model="bearerToken" type="password" autocomplete="off" placeholder="Clerk JWT or ak_live_…" />
    </label>
  </div>
  <label class="api-playground-field">
    <span>Base URL</span>
    <input v-model="baseUrl" type="text" spellcheck="false" />
  </label>
</section>

<section class="api-playground-panel">
  <h3 class="api-playground-heading">Endpoint</h3>
  <label class="api-playground-field">
    <span>Select operation</span>
    <select v-model="selectedId" class="api-playground-select">
      <template v-for="tag in PLAYGROUND_TAG_ORDER" :key="tag">
        <optgroup v-if="(byTag[tag] || []).length" :label="tag">
          <option v-for="ep in byTag[tag]" :key="ep.id" :value="ep.id">
            {{ ep.method }} — {{ ep.title }}
          </option>
        </optgroup>
      </template>
    </select>
  </label>

  <p v-if="selectedEndpoint" class="api-playground-desc">{{ selectedEndpoint.description }}</p>
  <p v-if="selectedEndpoint" class="api-playground-auth-hint">{{ authNote(selectedEndpoint) }}</p>

  <div v-if="selectedEndpoint?.pathParams?.length" class="api-playground-path-params">
    <div v-for="p in selectedEndpoint.pathParams" :key="p.name" class="api-playground-field">
      <span>Path: <code>:{{ p.name }}</code>{{ p.description ? ' — ' + p.description : '' }}</span>
      <input v-model="pathParamValues[p.name]" type="text" spellcheck="false" />
    </div>
  </div>

  <div class="api-playground-method-row">
    <span class="api-playground-method-badge">{{ method }}</span>
    <label class="api-playground-field api-playground-path-grow">
      <span>Request URL (path + optional <code>?query</code>)</span>
      <input v-model="pathField" type="text" spellcheck="false" />
    </label>
  </div>

  <label v-if="!['GET', 'HEAD', 'DELETE'].includes(method) || body.trim()" class="api-playground-field">
    <span>JSON body</span>
    <textarea v-model="body" rows="12" spellcheck="false" class="api-playground-code"></textarea>
  </label>
  <label v-else class="api-playground-field">
    <span>JSON body (optional for DELETE)</span>
    <textarea v-model="body" rows="6" spellcheck="false" class="api-playground-code" placeholder="Usually empty for GET/DELETE"></textarea>
  </label>

  <button type="button" class="armith-btn-primary api-playground-send" :disabled="loading" @click="sendRequest">
    {{ loading ? 'Sending…' : 'Send request' }}
  </button>
</section>

<section class="api-playground-panel api-playground-panel-dark">
  <h3 class="api-playground-heading">Reference responses</h3>
  <p class="api-playground-desc">Illustrative payloads — actual messages and fields may vary slightly by version.</p>
  <div v-if="activeExamples.length" class="api-playground-tabs">
    <button
      v-for="(ex, i) in activeExamples"
      :key="i"
      type="button"
      class="api-playground-tab"
      :class="{ 'is-active': selectedExampleIx === i }"
      @click="selectedExampleIx = i"
    >
      {{ ex.status }} — {{ ex.label }}
    </button>
  </div>
  <pre class="api-playground-pre">{{ examplePreview }}</pre>
</section>

<section class="api-playground-panel">
  <h3 class="api-playground-heading">Live response</h3>
  <pre class="api-playground-pre api-playground-live">{{ liveResponse || '… Send a request to see status, headers (via browser), and body here.' }}</pre>
</section>

</div>
