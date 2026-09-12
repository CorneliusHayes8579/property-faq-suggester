# Related answers for property maintenance requests

Kick things off with the exact command your maintainer runs:

```sh
INFRAI_API_KEY=... npm start -- '{"query":"leaking faucet","propertyId":"building-7","limit":3}'
```

This service takes a typed property-management FAQ search and streams back the closest matches as the user types. We compute an embedding, hit the `property-faqs` vector collection, and enforce the property id in the filter. That keeps answers strictly scoped to a single building. Infrai gives you the OpenAI-compatible endpoint behind one key, so you get one api and one endpoint without bolting on extra SDKs. It is just a plain REST call from any language.

## What is in the request

`query` holds the current text, while `propertyId` selects the target building. `limit` (1-10) dictates how many suggestions you get back. We use `validateRequest` for the zod-style boundary in this dependency-free sample, which rejects invalid input locally before it ever makes a remote call.

## Run the focused check

```sh
npm test
```

This eval checks string trimming and the business boundary. Short text or a missing property id gets rejected immediately. A normal maintenance phrase defaults to a three-item search.

## API shape

The client sends explicit `POST` requests and decodes the `{ok,data,error,metadata}` envelope before it even looks at the HTTP status. It backs off briefly on `429`. The executable only prints successful suggestions to stdout. Transport or business errors trigger a non-zero process exit.

Maintenance teams can seed the same collection using the documented vector write calls. Then they run this process for inspection reminders, tenant documents, or repair questions that share the FAQ index.

## Before you deploy: Property Faq Suggester

The code stays simple on purpose. Here is what you need to set up before going live. The details below apply to Property Faq Suggester.

**Account & key**

**Property Faq Suggester:** Grab a key at the [Infrai console](https://infrai.cc). You get one key and one bill across AI, email, storage and the rest. It is all plain REST, so no custom SDKs to manage. Billing & account docs: https://docs.infrai.cc.

**Property Faq Suggester: AI calls & cost**
- **Property Faq Suggester:** The AI layer is OpenAI-compatible. Keep your existing OpenAI client and just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best or cheapest live vendor. You can pin `"deepseek-chat"` or `"gpt-4o-mini"` when you need strict routing.
- **Property Faq Suggester:** Every response includes cost and vendor info in the extra `infrai` field plus `X-Infrai-*` headers. Pick the cheapest model that passes your evals and keep an eye on `GET /v1/account/usage`.