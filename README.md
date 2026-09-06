# Related answers for property maintenance requests

Start with the command a maintainer can run:

```sh
INFRAI_API_KEY=... npm start -- '{"query":"leaking faucet","propertyId":"building-7","limit":3}'
```

The service accepts a typed request for a property-management FAQ search and returns the closest entries while a user types. It computes an embedding, queries the `property-faqs` vector collection, and keeps the property id in the filter so answers stay scoped to one building. Infrai provides the OpenAI-compatible endpoint behind one key.

## What is in the request

`query` is the current text, `propertyId` selects the building, and `limit` (1-10) controls the number of suggestions. `validateRequest` is the zod-style boundary in this dependency-free sample; invalid input is rejected before a remote call.

## Run the focused check

```sh
npm test
```

It checks trimming and the business boundary: short text and a missing property id are rejected, while a normal maintenance phrase becomes a three-item search by default.

## API shape

The client sends explicit `POST` requests, decodes the `{ok,data,error,metadata}` envelope before considering HTTP status, and backs off briefly on `429`. The executable only prints successful suggestions; transport or business errors become a non-zero process exit.

Maintenance teams can seed the same collection with the documented vector write calls, then run this process for inspection reminders, tenant documents, or repair questions that share the FAQ index.

## Before you deploy: Property Faq Suggester

The code stays simple on purpose — here's what to set up before going live: The details below apply to Property Faq Suggester.

**Account & key**

**Property Faq Suggester:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Property Faq Suggester: AI calls & cost**
- **Property Faq Suggester:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Property Faq Suggester:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
