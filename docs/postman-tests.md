# Postman Test Cases for Brain Dump API

## Pre-request Script (same for all tests)
This script generates the HMAC signature automatically.

```javascript
const CryptoJS = require('crypto-js');

const userId = 'daniel';
const text = pm.variables.get('testText');  // Set in each test
const secret = pm.environment.get('HMAC_SECRET');

const timestamp = Date.now();

const message = `${userId}.${timestamp}.${text}`;
const signature = CryptoJS
    .HmacSHA256(message, secret)
    .toString(CryptoJS.enc.Hex);

pm.variables.set('payload', JSON.stringify({
    userId,
    text,
    timestamp,
    signature
}));

console.log('message:', message);
console.log('signature:', signature);
```

---

## Test Cases

### Test 1: Simple Task with Date and Time
**Variable:** `testText = "תזכיר לי להתקשר לרופא מחר בעשר בבוקר"`

**Expected:** Creates task immediately (no follow-up needed)

---

### Test 2: Meeting Request - Triggers Follow-up
**Variable:** `testText = "לקבוע פגישה עם דני"`

**Expected:** Returns ok:true, but internally triggers REQUEST_FOLLOWUP asking for date/time

---

### Test 3: Follow-up Response - Date Only
**Prerequisite:** Run Test 2 first

**Variable:** `testText = "מחר"`

**Expected:** Returns ok:true, asks for time (partial progress saved)

---

### Test 4: Follow-up Response - Time Only
**Prerequisite:** Run Test 3 first

**Variable:** `testText = "בשש בערב"`

**Expected:** Returns ok:true, creates the meeting

---

### Test 5: Complete Date and Time at Once
**Variable:** `testText = "פגישה מחר בשתים בצהריים"`

**Expected:** Creates meeting immediately

---

### Test 6: Numeric Date Format
**Variable:** `testText = "להזמין מונית ל-15.2 בשמונה בבוקר"`

**Expected:** Creates task for Feb 15th at 08:00

---

### Test 7: Hebrew Month Format
**Variable:** `testText = "פגישה הראשון לפברואר בעשר"`

**Expected:** Creates meeting for Feb 1st at 10:00

---

### Test 8: Idea (No Date Needed)
**Variable:** `testText = "רעיון לאפליקציה חדשה"`

**Expected:** Saves idea immediately

---

## Full Pre-request Script with Test Selection

```javascript
const CryptoJS = require('crypto-js');

// ===== CHANGE THIS FOR EACH TEST =====
const testCase = 2;  // 1-8

const testTexts = {
    1: "תזכיר לי להתקשר לרופא מחר בעשר בבוקר",
    2: "לקבוע פגישה עם דני",
    3: "מחר",
    4: "בשש בערב",
    5: "פגישה מחר בשתים בצהריים",
    6: "להזמין מונית ל-15.2 בשמונה בבוקר",
    7: "פגישה הראשון לפברואר בעשר",
    8: "רעיון לאפליקציה חדשה"
};
// =====================================

const userId = 'daniel';
const text = testTexts[testCase];
const secret = pm.environment.get('HMAC_SECRET');

const timestamp = Date.now();

const message = `${userId}.${timestamp}.${text}`;
const signature = CryptoJS
    .HmacSHA256(message, secret)
    .toString(CryptoJS.enc.Hex);

pm.variables.set('payload', JSON.stringify({
    userId,
    text,
    timestamp,
    signature
}));

console.log('='.repeat(40));
console.log(`TEST CASE ${testCase}: "${text}"`);
console.log('='.repeat(40));
console.log('message:', message);
console.log('signature:', signature);
```

---

## Multi-Turn Follow-up Test Sequence

To test the complete follow-up flow:

1. **Request 1:** Set `testCase = 2` ("לקבוע פגישה עם דני") → Send
2. **Request 2:** Set `testCase = 3` ("מחר") → Send  
3. **Request 3:** Set `testCase = 4` ("בשש בערב") → Send

Check server console for:
```
🟡 PENDING FOLLOWUP: { intentType: 'meeting', title: '...', missing: 'DATE_TIME_RANGE' }
...
🟡 PENDING FOLLOWUP: { missing: 'TIME', date: '2026-01-22' }
...
⚙️ Action plan: { actions: [{ type: 'CREATE_MEETING', ... }] }
```
