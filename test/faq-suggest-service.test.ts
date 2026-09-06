import assert from "node:assert/strict";
import { validateRequest } from "../src/faq-suggest-service";

const parsed = validateRequest({ query: "  broken heater ", propertyId: "building-7" });
assert.deepEqual(parsed, { query: "broken heater", propertyId: "building-7", limit: 3 });
assert.throws(() => validateRequest({ query: "x", propertyId: "building-7" }), /at least 2/);
assert.throws(() => validateRequest({ query: "leak", propertyId: "", limit: 2 }), /propertyId/);
console.log("request boundary checks passed");
