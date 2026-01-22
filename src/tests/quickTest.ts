// src/tests/quickTest.ts
// Quick sanity test: npx ts-node src/tests/quickTest.ts

import { resolveDateFromText, resolveTimeFromText, buildDateTime } from "../followup/dateResolver";
import { setPendingFollowup, getPendingFollowup, clearPendingFollowup } from "../followup/followupStore";
import { resolveFollowup } from "../followup/followupResolver";

const TEST_USER = "test-user";
const now = new Date("2026-01-21T12:00:00");

console.log("🧪 Quick Sanity Test\n");

// Date tests
console.log("📅 DATE PARSING:");
console.log("  מחר:", resolveDateFromText("מחר", now)?.toDateString());
console.log("  1.2:", resolveDateFromText("1.2", now)?.toDateString());
console.log("  15/3:", resolveDateFromText("15/3", now)?.toDateString());
console.log("  הראשון לינואר:", resolveDateFromText("הראשון לינואר", now)?.toDateString());
console.log("  ביום ראשון:", resolveDateFromText("ביום ראשון", now)?.toDateString());

// Time tests
console.log("\n⏰ TIME PARSING:");
console.log("  שש בערב:", resolveTimeFromText("שש בערב"));
console.log("  12 בצהריים:", resolveTimeFromText("12 בצהריים"));
console.log("  8:30:", resolveTimeFromText("8:30"));

// Follow-up flow test
console.log("\n🔄 FOLLOWUP FLOW TEST:");

// Clean state
clearPendingFollowup(TEST_USER);

// Step 1: Create pending
setPendingFollowup(TEST_USER, {
    intentType: "meeting",
    title: "פגישה עם דני",
    missing: "DATE_TIME_RANGE",
    createdAt: Date.now(),
});
console.log("  Step 1 - Created pending:", getPendingFollowup(TEST_USER)?.missing);

// Step 2: User says "מחר" (date only)
let plan = resolveFollowup(getPendingFollowup(TEST_USER)!, "מחר", TEST_USER);
console.log("  Step 2 - After 'מחר':", plan.actions[0].type);
console.log("    Saved date:", getPendingFollowup(TEST_USER)?.date);
console.log("    New missing:", getPendingFollowup(TEST_USER)?.missing);

// Step 3: User says "בשש בערב" (time)
plan = resolveFollowup(getPendingFollowup(TEST_USER)!, "בשש בערב", TEST_USER);
console.log("  Step 3 - After 'בשש בערב':", plan.actions[0].type);

if (plan.actions[0].type === "CREATE_MEETING") {
    console.log("    Meeting title:", (plan.actions[0] as any).title);
    console.log("    Meeting start:", (plan.actions[0] as any).start);
    console.log("\n✅ FOLLOW-UP FLOW WORKS CORRECTLY!");
} else {
    console.log("\n❌ Expected CREATE_MEETING but got:", plan.actions[0].type);
}

clearPendingFollowup(TEST_USER);
