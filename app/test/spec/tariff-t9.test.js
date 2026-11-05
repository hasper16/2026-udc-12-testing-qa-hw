// T9 — amounts, rounding, receipt format
// Expected values: docs/test-cases.md, docs/spec/tariffs.md
import test from "node:test";
import assert from "node:assert/strict";
import { createDayCap } from "../../src/day-cap.js";
import { discount, quote } from "../../src/tariff.js";
import { formatReceipt } from "../../src/receipt.js";

const standard = { type: "standard" };
const reduced  = { type: "reduced" };

// T9 — TC-66: rounding down on fractional kopeck (spec:tariffs.md:137)
test("T9: TC-66 — discount rounds down (floor): 1235 × 70% = 864,5 → 864 due, 371 discounted", () => {
  const discounted = discount(1235, 30);
  assert.equal(discounted, 371, "TC-66: discount amount");
  assert.equal(1235 - discounted, 864, "TC-66: amount due");
});

// T9 — TC-67: receipt for 25-hour classic ride (TC-59) — "До сплати" with space-separated thousands
// spec:tariffs.md:133
test("T9: TC-67 — receipt for 25-hour ride shows '2 300,00 грн' with space separator", () => {
  const r = quote(
    { pickupAt: "2026-09-16T10:00:00+03:00", returnAt: "2026-09-17T11:00:00+03:00", bike: "classic", returnStation: "S01" },
    standard,
  );
  const lines = formatReceipt(r);
  assert.ok(lines.at(-1).includes("2 300,00 грн"), `TC-67: got "${lines.at(-1)}"`);
});

// T9 — TC-68: receipt for classic, reduced, X02, 20 min — reduced discount, full out-of-zone fee
// spec:tariffs.md:134
test("T9: TC-68 — receipt for reduced fare + out-of-zone: fee is 150,00 грн, total 162,50 грн", () => {
  const r = quote(
    { pickupAt: "2026-09-16T10:00:00+03:00", returnAt: "2026-09-16T10:20:00+03:00", bike: "classic", returnStation: "X02" },
    reduced,
  );
  const lines = formatReceipt(r);
  // duration line
  assert.ok(lines[0].includes("20 хв"), "TC-68: duration 20 хв");
  // time charge: 25,00 грн
  assert.ok(lines[1].includes("25,00 грн"), "TC-68: timeCharge 25,00 грн");
  // reduced discount: −12,50 грн
  assert.ok(lines.some((l) => l.startsWith("Знижка: пільговий") && l.includes("-12,50 грн")),
    "TC-68: reduced discount −12,50 грн");
  // out-of-zone fee: 150,00 грн (not discounted per T5)
  assert.ok(lines.some((l) => l.startsWith("Збір: повернення") && l.includes("150,00 грн")),
    "TC-68: out-of-zone fee 150,00 грн");
  // total
  assert.ok(lines.at(-1).includes("162,50 грн"), `TC-68: total 162,50 грн, got "${lines.at(-1)}"`);
});

// T9 — TC-69: receipt for 3rd ride of TC-41 — day-cap line present, total 60,00 грн
// spec:tariffs.md:135
test("T9: TC-69 — receipt for capped ride shows Денний ліміт line and total 60,00 грн", () => {
  // Set up cap: 240 грн already charged to simulate state after first two TC-41 rides
  const dayCap = createDayCap();
  const rider  = { id: "rider-tc69", type: "standard" };
  dayCap.record(rider.id, "2026-09-16T06:00:00Z", 24000); // 24000 = 240 грн already charged

  const r     = quote(
    { pickupAt: "2026-09-16T18:00:00+03:00", returnAt: "2026-09-16T19:20:00+03:00", bike: "ebike", returnStation: "S01" },
    rider,
    { dayCap },
  );
  const lines = formatReceipt(r);

  assert.ok(lines.some((l) => l.startsWith("Денний ліміт") && l.includes("-60,00 грн")),
    "TC-69: Денний ліміт −60,00 грн");
  assert.ok(lines.at(-1).endsWith("60,00 грн"), `TC-69: total 60,00 грн, got "${lines.at(-1)}"`);
});

// T9 — TC-70: receipt for false-start ride (50 s → 1 хв) — zero total (spec:tariffs.md:132)
test("T9: TC-70 — receipt for false start: duration 1 хв, total 0,00 грн", () => {
  const r     = quote(
    { pickupAt: "2026-09-16T10:00:00+03:00", returnAt: "2026-09-16T10:00:50+03:00", bike: "classic", returnStation: "S01" },
    standard,
  );
  const lines = formatReceipt(r);
  assert.ok(lines[0].includes("1 хв"), `TC-70: duration 1 хв, got "${lines[0]}"`);
  assert.ok(lines.at(-1).includes("0,00 грн"), `TC-70: total 0,00 грн, got "${lines.at(-1)}"`);
});

// T9 — TC-71: receipt for standard, X01, 20 min — total 175,00 грн (no thousands separator)
// spec:tariffs.md:132
test("T9: TC-71 — receipt for 20-min ride + out-of-zone: total 175,00 грн", () => {
  const r     = quote(
    { pickupAt: "2026-09-16T10:00:00+03:00", returnAt: "2026-09-16T10:20:00+03:00", bike: "classic", returnStation: "X01" },
    standard,
  );
  const lines = formatReceipt(r);
  assert.ok(lines.at(-1).includes("175,00 грн"), `TC-71: got "${lines.at(-1)}"`);
});
