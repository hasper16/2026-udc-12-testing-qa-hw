// §4 — invalid input: request rejected with explanation (QuoteError)
// Expected values: docs/test-cases.md, docs/spec/tariffs.md:147-149
import test from "node:test";
import assert from "node:assert/strict";
import { quote, QuoteError } from "../../src/tariff.js";

const DAY_RIDE = { pickupAt: "2026-09-16T10:00:00+03:00", returnAt: "2026-09-16T10:30:00+03:00" };

// §4 — TC-81: return before pickup → rejected (spec:tariffs.md:147)
test("§4: TC-81 — return before pickup is rejected with QuoteError", () => {
  assert.throws(
    () => quote(
      { pickupAt: "2026-09-16T10:00:00+03:00", returnAt: "2026-09-16T09:59:59+03:00", bike: "classic", returnStation: "S01" },
      { type: "standard" },
    ),
    QuoteError,
    "TC-81",
  );
});

// §4 — TC-82, TC-83: unknown bike type or unknown rider category → rejected (spec:tariffs.md:148)
test("§4: TC-82 TC-83 — unknown bike type or rider category → QuoteError", () => {
  for (const { id, ride, rider } of [
    {
      id:   "TC-82",
      ride: { ...DAY_RIDE, bike: "cargo", returnStation: "S01" },
      rider: { type: "standard" },
    },
    {
      id:   "TC-83",
      ride: { ...DAY_RIDE, bike: "classic", returnStation: "S01" },
      rider: { type: "vip" },
    },
  ]) {
    assert.throws(() => quote(ride, rider), QuoteError, id);
  }
});

// §4 — TC-84 to TC-86: station not in appendix A → rejected (spec:tariffs.md:149)
test("§4: TC-84 to TC-86 — station absent from appendix A → QuoteError", () => {
  for (const { id, station } of [
    { id: "TC-84", station: "S09" }, // neighbour of S08, not listed
    { id: "TC-85", station: "X04" }, // neighbour of X03, not listed
    { id: "TC-86", station: ""    }, // empty string
  ]) {
    assert.throws(
      () => quote(
        { ...DAY_RIDE, bike: "classic", returnStation: station },
        { type: "standard" },
      ),
      QuoteError,
      id,
    );
  }
});
