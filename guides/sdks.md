# Server SDKs (Node and Python)

Thin server-side clients for the REST API. They add what every integration needs and often gets wrong: safe retries,
typed errors, and webhook signature verification. **Use them on your server only**: the API key is a secret.

| | Package | Notes |
|---|---|---|
| Node.js (TypeScript) | `@armith/node` | Request types generated from the OpenAPI contract |
| Python 3.9+ | `armith` | Standard library only |

```ts
import { Armith } from '@armith/node';
const armith = new Armith({ apiKey: process.env.ARMITH_API_KEY! }); // ak_test_… for the sandbox
const outcome = await armith.verifyId({ countryCode: 'DE', frontImageUrl, sandboxScenario: 'approved' });
```

```python
from armith import Armith
armith = Armith("ak_test_...")
outcome = armith.verify_id({"countryCode": "DE", "frontImageUrl": url, "sandboxScenario": "approved"})
```

## Retries that cannot run a check twice

Network errors, `429` and `502`-`504` are retried with jittered backoff, honouring `Retry-After`, but only when repeating
is safe: reads, and verification calls. Every verification call carries an `Idempotency-Key` (generated if you do
not pass one) that is **reused on each retry**, so the server recognises the repeat. A `POST` without an idempotency
key is never retried.

## Errors

`ArmithError` carries `status`, `code` (for example `BLURRY_IMAGE`), `request_id` and the response body.
`retryable` is true for `429`, `5xx` and connection failures.

## Webhooks

Verify the **raw** body before parsing; a re-serialised body will not match. Deliveries older than five minutes are refused.

```ts
const event = constructEvent(req.body, req.headers, process.env.ARMITH_WEBHOOK_KEY!); // throws WebhookSignatureError
```

```python
event = construct_event(request.get_data(), request.headers, os.environ["ARMITH_WEBHOOK_KEY"])
```

The algorithm is the one in [Verify signatures](/guides/webhooks/verify-signatures); both SDKs are tested against the
server's own signer.
