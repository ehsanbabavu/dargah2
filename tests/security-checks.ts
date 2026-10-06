import assert from "node:assert";
import { isSafePublicWebhookUrl } from "../server/woocommerce-service";
import { smsService } from "../server/sms-service";
import { MemStorage } from "../server/storage";

console.log("🔒 Starting Security Regression Test Suite...");

// 1. Test SSRF URL Validator
console.log("➡️ Testing SSRF Prevention...");
assert.strictEqual(isSafePublicWebhookUrl("https://example.com/webhook"), true);
assert.strictEqual(isSafePublicWebhookUrl("http://localhost:3000/webhook"), false);
assert.strictEqual(isSafePublicWebhookUrl("http://127.0.0.1/webhook"), false);
assert.strictEqual(isSafePublicWebhookUrl("http://169.254.169.254/latest/meta-data"), false);
assert.strictEqual(isSafePublicWebhookUrl("http://10.0.0.1/admin"), false);
assert.strictEqual(isSafePublicWebhookUrl("http://192.168.1.1/secret"), false);
assert.strictEqual(isSafePublicWebhookUrl("http://172.20.0.1/api"), false);
assert.strictEqual(isSafePublicWebhookUrl("http://metadata.google.internal/computeMetadata/v1"), false);
console.log("✅ SSRF Prevention: PASSED");

// 2. Test OTP Attempt Limiting and Expiration
console.log("➡️ Testing OTP Attempt Limiting & Rate Limiting...");
const testPhone = "09123456789";
const generatedCode = smsService.generateAndSaveOtp(testPhone, 60, 6);
assert.strictEqual(typeof generatedCode, "string");
assert.strictEqual(generatedCode.length, 6);

// Attempt wrong codes
for (let i = 0; i < 5; i++) {
  const result = smsService.verifyOtp(testPhone, "000000");
  assert.strictEqual(result.isValid, false);
}
// 6th attempt must be strictly locked out/deleted
const lockedResult = smsService.verifyOtp(testPhone, generatedCode);
assert.strictEqual(lockedResult.isValid, false);
console.log("✅ OTP Security & Brute-Force Limiting: PASSED");

// 3. Test MemStorage Transaction Balance Calculation
console.log("➡️ Testing Transaction Balance Calculation Consistency...");
async function testBalance() {
  const mem = new MemStorage();
  const userId = "test-user-sec";
  
  // Deposit 10,000 Tomans
  await mem.createTransaction({
    userId,
    type: "deposit",
    amount: "10000",
    status: "completed",
    transactionDate: "1403/01/01",
    transactionTime: "12:00",
    accountSource: "درگاه",
    referenceId: "DEP-1",
  });
  
  let balance = await mem.getUserBalance(userId);
  assert.strictEqual(balance, 10000, `Expected balance 10000, got ${balance}`);

  // Order payment for 4,000 Tomans
  await mem.createTransaction({
    userId,
    type: "order_payment",
    amount: "4000",
    status: "completed",
    transactionDate: "1403/01/01",
    transactionTime: "12:05",
    accountSource: "موجودی کل",
    referenceId: "OP-1",
  });

  balance = await mem.getUserBalance(userId);
  assert.strictEqual(balance, 6000, `Expected balance 6000 after purchase, got ${balance}`);
}

testBalance().then(() => {
  console.log("✅ Balance & Order Payment Calculation: PASSED");
  console.log("🎉 All Security Regression Checks Succeeded!");
  process.exit(0);
}).catch((err) => {
  console.error("❌ Security Test Failed:", err);
  process.exit(1);
});
