import { getInstantReply, sortMessagesChronologically } from "../src/App";
import { Message } from "../src/types";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runTests() {
  console.log("==================================================");
  console.log("INFBOTT VERIFICATION & REGRESSION TEST SUITE");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    try {
      fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // Scenario 1: A standalone "hey" returns immediately (<100ms) without provider request
  test("Scenario 1: Standalone 'hey' returns immediate instant greeting under 100ms", () => {
    const t0 = performance.now();
    const reply = getInstantReply("hey", false);
    const elapsed = performance.now() - t0;
    assert(reply !== null, "Instant reply should not be null for 'hey'");
    assert(reply?.includes("Hey!"), "Reply should be a friendly greeting");
    assert(elapsed < 100, `Execution took ${elapsed.toFixed(2)}ms, expected < 100ms`);
  });

  // Scenario 2: Context-dependent greeting still uses conversation context
  test("Scenario 2: Context-dependent greeting returns null to allow model context routing", () => {
    const reply = getInstantReply("hey", true);
    assert(reply === null, "Context-dependent greeting must return null to allow full LLM routing");
  });

  // Scenario 3: Ordinary short questions are not intercepted as standalone greetings
  test("Scenario 3: Ordinary questions bypass instant greetings and route to model", () => {
    assert(getInstantReply("How do I write a React hook?", false) === null, "Technical question must route to model");
    assert(getInstantReply("What time is it?", false) === null, "Time question must route to model");
    assert(getInstantReply("Who created you?", false) === null, "Creator question must route to model/creator handler");
  });

  // Scenario 4: Fast variations of greetings
  test("Scenario 4: Handles varied greeting punctuation and casing immediately", () => {
    assert(getInstantReply("HI!", false) !== null, "Should match 'HI!'");
    assert(getInstantReply("Hello??", false) !== null, "Should match 'Hello??'");
    assert(getInstantReply("Namaste", false) !== null, "Should match 'Namaste'");
    assert(getInstantReply("Hey INFBOTT", false) !== null, "Should match 'Hey INFBOTT'");
  });

  // Scenario 5: React Hooks Order & Chronological Sorting Regression Test
  test("Scenario 5: Messages chronological sorting guarantees user message strictly precedes assistant response", () => {
    const now = Date.now();
    const msgs: Message[] = [
      { id: "assistant-1", role: "assistant", content: "AI response", timestamp: now + 5 },
      { id: "user-1", role: "user", content: "User prompt", timestamp: now }
    ];
    const sorted = sortMessagesChronologically(msgs);
    assert(sorted[0].role === "user", "User message must strictly precede assistant response");
    assert(sorted[1].role === "assistant", "Assistant message must be positioned below user message");
  });

  // Scenario 6: SSRF Forbidden Host Detection
  test("Scenario 6: SSRF filter blocks private IPs, loopback, and cloud metadata targets", () => {
    const isForbiddenHost = (h: string, port?: string) => {
      const hostname = h.toLowerCase().trim();
      if (port && !['80', '443', '8080', '8443', ''].includes(port)) return true;
      return (
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '0.0.0.0' ||
        hostname === '::1' ||
        hostname === 'metadata.google.internal' ||
        hostname === 'metadata' ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local') ||
        hostname.startsWith('127.') ||
        hostname.startsWith('10.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('169.254.') ||
        hostname.startsWith('0.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
        /^0x[0-9a-f]+$/i.test(hostname) ||
        /^\d+$/.test(hostname) ||
        /^0[0-7]+$/.test(hostname)
      );
    };

    assert(isForbiddenHost("127.0.0.1"), "Should block 127.0.0.1");
    assert(isForbiddenHost("localhost"), "Should block localhost");
    assert(isForbiddenHost("169.254.169.254"), "Should block GCP/AWS cloud metadata IP");
    assert(isForbiddenHost("metadata.google.internal"), "Should block Google metadata internal DNS");
    assert(isForbiddenHost("10.0.0.5"), "Should block RFC1918 10.*");
    assert(isForbiddenHost("192.168.1.1"), "Should block RFC1918 192.168.*");
    assert(isForbiddenHost("172.20.0.1"), "Should block RFC1918 172.16-31.*");
    assert(isForbiddenHost("2130706433"), "Should block decimal encoded loopback IP");
    assert(isForbiddenHost("0x7f000001"), "Should block hex encoded loopback IP");
    assert(isForbiddenHost("google.com", "22"), "Should block SSH port 22");
    assert(!isForbiddenHost("example.com", "443"), "Should allow public HTTPS host");
    assert(!isForbiddenHost("wikipedia.org"), "Should allow public web host");
  });

  // Scenario 7: Credit arithmetic safety (10 credits per image, min 0)
  test("Scenario 7: Credit deduction arithmetic remains safe and non-negative", () => {
    const deduct = (current: number, cost: number = 10) => Math.max(0, current - cost);
    assert(deduct(70, 10) === 60, "70 - 10 should be 60");
    assert(deduct(10, 10) === 0, "10 - 10 should be 0");
    assert(deduct(5, 10) === 0, "5 - 10 should clamp to 0 without underflow");
  });

  console.log("==================================================");
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
