// src/tests/dateResolver.test.ts
// Run with: npx ts-node src/tests/dateResolver.test.ts

import { resolveDateFromText, resolveTimeFromText, buildDateTime } from "../followup/dateResolver";

/* =========================
   TEST HELPERS
========================= */

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (e: any) {
        console.log(`❌ ${name}`);
        console.log(`   Error: ${e.message}`);
        failed++;
    }
}

function expect(actual: any) {
    return {
        toBe(expected: any) {
            if (actual !== expected) {
                throw new Error(`Expected ${expected}, got ${actual}`);
            }
        },
        toEqual(expected: any) {
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
            }
        },
        toBeTruthy() {
            if (!actual) {
                throw new Error(`Expected truthy value, got ${actual}`);
            }
        },
        toBeNull() {
            if (actual !== null) {
                throw new Error(`Expected null, got ${actual}`);
            }
        },
    };
}

/* =========================
   DATE PARSING TESTS
========================= */

console.log("\n📅 DATE PARSING TESTS\n");

// Fixed reference date for consistent tests
const now = new Date("2026-01-21T12:00:00");

test("מחר → tomorrow", () => {
    const result = resolveDateFromText("מחר", now);
    expect(result?.getDate()).toBe(22);
    expect(result?.getMonth()).toBe(0); // January
});

test("היום → today", () => {
    const result = resolveDateFromText("היום", now);
    expect(result?.getDate()).toBe(21);
});

test("מחרתיים → day after tomorrow", () => {
    const result = resolveDateFromText("מחרתיים", now);
    expect(result?.getDate()).toBe(23);
});

test("1.2 → Feb 1st", () => {
    const result = resolveDateFromText("1.2", now);
    expect(result?.getDate()).toBe(1);
    expect(result?.getMonth()).toBe(1); // February
});

test("15/3 → March 15th", () => {
    const result = resolveDateFromText("15/3", now);
    expect(result?.getDate()).toBe(15);
    expect(result?.getMonth()).toBe(2); // March
});

test("1.2.26 → Feb 1st 2026", () => {
    const result = resolveDateFromText("1.2.26", now);
    expect(result?.getDate()).toBe(1);
    expect(result?.getMonth()).toBe(1);
    expect(result?.getFullYear()).toBe(2026);
});

test("1.2.2026 → Feb 1st 2026", () => {
    const result = resolveDateFromText("1.2.2026", now);
    expect(result?.getFullYear()).toBe(2026);
});

test("ביום ראשון → next Sunday", () => {
    const result = resolveDateFromText("ביום ראשון", now);
    expect(result?.getDay()).toBe(0); // Sunday
});

test("15 בפברואר → Feb 15th", () => {
    const result = resolveDateFromText("15 בפברואר", now);
    expect(result?.getDate()).toBe(15);
    expect(result?.getMonth()).toBe(1);
});

test("הראשון לינואר → Jan 1st (next year since passed)", () => {
    const result = resolveDateFromText("הראשון לינואר", now);
    expect(result?.getDate()).toBe(1);
    expect(result?.getMonth()).toBe(0);
    expect(result?.getFullYear()).toBe(2027); // Next year since Jan 1 2026 passed
});

test("עוד 3 ימים → 3 days from now", () => {
    const result = resolveDateFromText("עוד 3 ימים", now);
    expect(result?.getDate()).toBe(24);
});

test("שבוע הבא → next week", () => {
    const result = resolveDateFromText("שבוע הבא", now);
    expect(result?.getDate()).toBe(28);
});

/* =========================
   TIME PARSING TESTS
========================= */

console.log("\n⏰ TIME PARSING TESTS\n");

test("12 בצהריים → 12:00", () => {
    const result = resolveTimeFromText("12 בצהריים");
    expect(result.hour).toBe(12);
    expect(result.minute).toBe(0);
});

test("7 בערב → 19:00", () => {
    const result = resolveTimeFromText("7 בערב");
    expect(result.hour).toBe(19);
});

test("שש בערב → 18:00", () => {
    const result = resolveTimeFromText("שש בערב");
    expect(result.hour).toBe(18);
});

test("8:30 → 08:30", () => {
    const result = resolveTimeFromText("8:30");
    expect(result.hour).toBe(8);
    expect(result.minute).toBe(30);
});

test("שלוש וחצי → 03:30", () => {
    const result = resolveTimeFromText("שלוש וחצי");
    expect(result.hour).toBe(3);
    expect(result.minute).toBe(30);
});

test("1.2 (date only) → no time detected", () => {
    const result = resolveTimeFromText("1.2");
    expect(result.confidence).toBe(0);
});

test("מחר ב-12 → 12:00 (with time clue)", () => {
    const result = resolveTimeFromText("מחר ב-12");
    expect(result.hour).toBe(12);
});

/* =========================
   COMBINED DATE+TIME TESTS
========================= */

console.log("\n🔗 COMBINED DATE+TIME TESTS\n");

test("מחר בשש בערב → tomorrow 18:00", () => {
    const date = resolveDateFromText("מחר בשש בערב", now);
    const time = resolveTimeFromText("מחר בשש בערב");

    expect(date).toBeTruthy();
    expect(date?.getDate()).toBe(22);
    expect(time.hour).toBe(18);

    const iso = buildDateTime(date!, time);
    expect(iso).toBeTruthy();
});

test("ביום ראשון בשתיים בצהריים → Sunday 14:00", () => {
    const date = resolveDateFromText("ביום ראשון בשתיים בצהריים", now);
    const time = resolveTimeFromText("ביום ראשון בשתיים בצהריים");

    expect(date?.getDay()).toBe(0);
    expect(time.hour).toBe(14);
});

test("15.2 בשבע בערב → Feb 15 19:00", () => {
    const date = resolveDateFromText("15.2 בשבע בערב", now);
    const time = resolveTimeFromText("15.2 בשבע בערב");

    expect(date?.getDate()).toBe(15);
    expect(date?.getMonth()).toBe(1);
    expect(time.hour).toBe(19);
});

/* =========================
   SUMMARY
========================= */

console.log("\n" + "=".repeat(40));
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed`);
console.log("=".repeat(40) + "\n");

if (failed > 0) {
    process.exit(1);
}
