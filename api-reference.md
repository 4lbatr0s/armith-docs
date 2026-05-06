# REST API Playground

Send real HTTP requests from this page. Use your API key from `Profile -> Security`.

> Base URLs
> - Sandbox: `https://armith-backend-live.onrender.com`
> - Production: `https://api.armith.com`

<script setup>
import { ref } from 'vue';

const baseUrl = ref('https://armith-backend-live.onrender.com');
const apiKey = ref('');
const method = ref('GET');
const path = ref('/health');
const body = ref('');
const responseText = ref('');
const loading = ref(false);

const sendRequest = async () => {
  loading.value = true;
  responseText.value = '';
  try {
    const headers = {};
    if (apiKey.value.trim()) headers['x-api-key'] = apiKey.value.trim();
    if (method.value !== 'GET') headers['Content-Type'] = 'application/json';

    const requestInit = { method: method.value, headers };
    if (method.value !== 'GET' && body.value.trim()) {
      requestInit.body = body.value;
    }

    const res = await fetch(`${baseUrl.value}${path.value}`, requestInit);
    const text = await res.text();
    responseText.value = `HTTP ${res.status}\n\n${text}`;
  } catch (error) {
    responseText.value = `Request failed: ${error.message}`;
  } finally {
    loading.value = false;
  }
};

const presets = [
  { label: 'Health', method: 'GET', path: '/health', body: '' },
  { label: 'Countries', method: 'GET', path: '/kyc/countries', body: '' },
  { label: 'Generate Upload URL', method: 'POST', path: '/kyc/upload-url', body: JSON.stringify({ fileType: 'image/jpeg', documentType: 'id-front' }, null, 2) },
  { label: 'ID Check', method: 'POST', path: '/kyc/id-check', body: JSON.stringify({ countryCode: 'TR', frontImageUrl: 'https://example.com/id-front.jpg' }, null, 2) }
];

const applyPreset = (preset) => {
  method.value = preset.method;
  path.value = preset.path;
  body.value = preset.body;
};
</script>

<div style="display:grid;gap:12px;margin-top:16px;">
  <label>Base URL</label>
  <input v-model="baseUrl" style="padding:8px;border:1px solid #888;border-radius:6px;" />

  <label>API Key (x-api-key)</label>
  <input v-model="apiKey" type="password" style="padding:8px;border:1px solid #888;border-radius:6px;" />

  <div style="display:flex;gap:8px;flex-wrap:wrap;">
    <button v-for="preset in presets" :key="preset.label" @click="applyPreset(preset)" style="padding:6px 10px;border:1px solid #888;border-radius:6px;">
      {{ preset.label }}
    </button>
  </div>

  <div style="display:flex;gap:8px;">
    <select v-model="method" style="padding:8px;border:1px solid #888;border-radius:6px;">
      <option>GET</option>
      <option>POST</option>
      <option>PUT</option>
      <option>PATCH</option>
      <option>DELETE</option>
    </select>
    <input v-model="path" style="flex:1;padding:8px;border:1px solid #888;border-radius:6px;" />
  </div>

  <textarea v-model="body" rows="10" style="padding:8px;border:1px solid #888;border-radius:6px;font-family:monospace;"></textarea>

  <button @click="sendRequest" :disabled="loading" style="padding:10px 14px;border:1px solid #888;border-radius:6px;">
    {{ loading ? 'Sending...' : 'Send Request' }}
  </button>

  <pre style="padding:12px;border:1px solid #888;border-radius:6px;white-space:pre-wrap;">{{ responseText || 'Response will appear here.' }}</pre>
</div>

OpenAPI source: [`/openapi.yaml`](/openapi.yaml)
