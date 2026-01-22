// src/tests/followupFlow.test.ts
// Run with: npx ts-node src/tests/followupFlow.test.ts
// Tests the complete follow-up conversation flow

import {
    setPendingFollowup,
    getPendingFollowup,
    clearPendingFollowup,
    updatePendingFollowup,
} from "../followup/followupStore";
import { resolveFollowup } from "../followup/followupResolver";
import { PendingFollowup } from "../followup/followupTypes";

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
        toContain(substring: string) {
            if (!actual.includes(substring)) {
                throw new Error(`Expected "${actual}" to contain "${substring}"`);
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

const TEST_USER = "test-user-123";

/* =========================
   FOLLOWUP STORE TESTS
========================= */

console.log("\n📦 FOLLOWUP STORE TESTS\n");

// Clean up before tests
clearPendingFollowup(TEST_USER);

test("setPendingFollowup → stores data correctly", () => {
    const data: PendingFollowup = {
        intentType: "meeting",
        title: "פגישה עם דני",
        missing: "DATE_TIME_RANGE",
        createdAt: Date.now(),
    };

    setPendingFollowup(TEST_USER, data);
    const result = getPendingFollowup(TEST_USER);

    expect(result?.title).toBe("פגישה עם דני");
    expect(result?.intentType).toBe("meeting");
    expect(result?.missing).toBe("DATE_TIME_RANGE");
});

test("updatePendingFollowup → merges partial data", () => {
    updatePendingFollowup(TEST_USER, {
        date: "2026-01-22",
        missing: "TIME",
    });

    const result = getPendingFollowup(TEST_USER);

    // Original data preserved
    expect(result?.title).toBe("פגישה עם דני");
    expect(result?.intentType).toBe("meeting");

    // New data added
    expect(result?.date).toBe("2026-01-22");
    expect(result?.missing).toBe("TIME");
});

test("clearPendingFollowup → removes data", () => {
    clearPendingFollowup(TEST_USER);
    const result = getPendingFollowup(TEST_USER);
    expect(result).toBeNull();
});

/* =========================
   FOLLOWUP RESOLVER TESTS
========================= */

console.log("\n🔄 FOLLOWUP RESOLVER TESTS\n");

test("Scenario 1: User provides date only → asks for time", () => {
    // Setup: pending with DATE_TIME_RANGE missing
    setPendingFollowup(TEST_USER, {
        intentType: "meeting",
        title: "פגישה עם דני",
        missing: "DATE_TIME_RANGE",
        createdAt: Date.now(),
    });

    // User says "מחר" (date only)
    const plan = resolveFollowup(
        getPendingFollowup(TEST_USER)!,
        "מחר",
        TEST_USER
    );

    // Should ask for time
    expect(plan.actions[0].type).toBe("SEND_WHATSAPP");
    expect((plan.actions[0] as any).message).toContain("שעה");

    // Pending should be updated with date
    const updated = getPendingFollowup(TEST_USER);
    expect(updated?.date).toBeTruthy();
    expect(updated?.missing).toBe("TIME");
});

test("Scenario 2: User provides time after date → creates meeting", () => {
    // User says "בשש בערב" (time only, date already saved)
    const plan = resolveFollowup(
        getPendingFollowup(TEST_USER)!,
        "בשש בערב",
        TEST_USER
    );

    // Should create meeting
    expect(plan.actions[0].type).toBe("CREATE_MEETING");
    expect((plan.actions[0] as any).title).toBe("פגישה עם דני");
    expect((plan.actions[0] as any).start).toBeTruthy();
    expect((plan.actions[0] as any).end).toBeTruthy();
});

// Clean up
clearPendingFollowup(TEST_USER);

test("Scenario 3: User provides time only first → asks for date", () => {
    // Setup: pending with DATE_TIME_RANGE missing
    setPendingFollowup(TEST_USER, {
        intentType: "task",
        title: "להתקשר לרופא",
        missing: "DATE_TIME_RANGE",
        createdAt: Date.now(),
    });

    // User says "בשתיים" (time only)
    const plan = resolveFollowup(
        getPendingFollowup(TEST_USER)!,
        "בשתיים",
        TEST_USER
    );

    // Should ask for date
    expect(plan.actions[0].type).toBe("SEND_WHATSAPP");
    expect((plan.actions[0] as any).message).toContain("יום");

    // Pending should be updated with time
    const updated = getPendingFollowup(TEST_USER);
    expect(updated?.startTime?.hours).toBe(14); // 2PM in 24h
    expect(updated?.missing).toBe("DATE");
});

test("Scenario 4: User provides date after time → creates task", () => {
    // User says "מחר" (date only, time already saved)
    const plan = resolveFollowup(
        getPendingFollowup(TEST_USER)!,
        "מחר",
        TEST_USER
    );

    // Should create task
    expect(plan.actions[0].type).toBe("CREATE_TASK");
    expect((plan.actions[0] as any).title).toBe("להתקשר לרופא");
    expect((plan.actions[0] as any).due).toBeTruthy();
});

// Clean up
clearPendingFollowup(TEST_USER);

test("Scenario 5: User provides both date and time at once → creates immediately", () => {
    // Setup
    setPendingFollowup(TEST_USER, {
        intentType: "meeting",
        title: "פגישת צוות",
        missing: "DATE_TIME_RANGE",
        createdAt: Date.now(),
    });

    // User says "מחר בעשר בבוקר"
    const plan = resolveFollowup(
        getPendingFollowup(TEST_USER)!,
        "מחר בעשר בבוקר",
        TEST_USER
    );

    // Should create meeting directly
    expect(plan.actions[0].type).toBe("CREATE_MEETING");
    expect((plan.actions[0] as any).title).toBe("פגישת צוות");
});

// Clean up
clearPendingFollowup(TEST_USER);

/* =========================
   SUMMARY
========================= */

console.log("\n" + "=".repeat(40));
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed`);
console.log("=".repeat(40) + "\n");

if (failed > 0) {
    process.exit(1);
}
