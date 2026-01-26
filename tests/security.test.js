/**
 * Security Tests for Daily Code Reminder Chrome Extension
 * Tests validate security controls are properly enforced
 * 
 * Run with: node tests/security.test.js
 */

// ============================================================================
// TEST UTILITIES
// ============================================================================

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`${message} Expected ${expected}, got ${actual}`);
  }
}

function assertTrue(value, message = '') {
  if (value !== true) {
    throw new Error(`${message} Expected true, got ${value}`);
  }
}

function assertFalse(value, message = '') {
  if (value !== false) {
    throw new Error(`${message} Expected false, got ${value}`);
  }
}

// ============================================================================
// SECURITY VALIDATION FUNCTIONS (copied from background.js for testing)
// ============================================================================

const VALID_PLATFORMS = Object.freeze(['leetcode', 'codeforces']);
const VALID_MESSAGE_TYPES = Object.freeze([
  'GET_STATUS',
  'MARK_COMPLETE', 
  'MARK_INCOMPLETE',
  'UPDATE_SETTINGS',
  'TRIGGER_CHECK'
]);

const ALLOWED_URLS = Object.freeze({
  leetcode: 'https://leetcode.com/problemset/',
  codeforces: 'https://codeforces.com/problemset'
});

function isValidPlatform(platform) {
  return typeof platform === 'string' && VALID_PLATFORMS.includes(platform);
}

function isValidMessageType(type) {
  return typeof type === 'string' && VALID_MESSAGE_TYPES.includes(type);
}

function sanitizeNumber(value, min, max, defaultValue) {
  const num = parseInt(value, 10);
  if (isNaN(num) || num < min || num > max) {
    return defaultValue;
  }
  return num;
}

function validateSettings(settings) {
  if (!settings || typeof settings !== 'object') {
    return null;
  }

  const sanitized = {
    reminderInterval: sanitizeNumber(settings.reminderInterval, 15, 120, 30),
    quietHoursStart: sanitizeNumber(settings.quietHoursStart, 0, 23, 23),
    quietHoursEnd: sanitizeNumber(settings.quietHoursEnd, 0, 23, 7),
    leetcodeEnabled: typeof settings.leetcodeEnabled === 'boolean' ? settings.leetcodeEnabled : true,
    codeforcesEnabled: typeof settings.codeforcesEnabled === 'boolean' ? settings.codeforcesEnabled : true,
    soundEnabled: typeof settings.soundEnabled === 'boolean' ? settings.soundEnabled : true
  };

  return sanitized;
}

// ============================================================================
// A03 - INJECTION PREVENTION TESTS
// ============================================================================

console.log('\n=== A03: Injection Prevention Tests ===\n');

test('isValidPlatform: accepts "leetcode"', () => {
  assertTrue(isValidPlatform('leetcode'));
});

test('isValidPlatform: accepts "codeforces"', () => {
  assertTrue(isValidPlatform('codeforces'));
});

test('isValidPlatform: rejects arbitrary string', () => {
  assertFalse(isValidPlatform('malicious'));
});

test('isValidPlatform: rejects SQL injection', () => {
  assertFalse(isValidPlatform("'; DROP TABLE users; --"));
});

test('isValidPlatform: rejects XSS', () => {
  assertFalse(isValidPlatform('<script>alert(1)</script>'));
});

test('isValidPlatform: rejects null', () => {
  assertFalse(isValidPlatform(null));
});

test('isValidPlatform: rejects undefined', () => {
  assertFalse(isValidPlatform(undefined));
});

test('isValidPlatform: rejects number', () => {
  assertFalse(isValidPlatform(123));
});

test('isValidPlatform: rejects object', () => {
  assertFalse(isValidPlatform({ platform: 'leetcode' }));
});

test('isValidPlatform: rejects array', () => {
  assertFalse(isValidPlatform(['leetcode']));
});

test('isValidMessageType: accepts valid types', () => {
  assertTrue(isValidMessageType('GET_STATUS'));
  assertTrue(isValidMessageType('MARK_COMPLETE'));
  assertTrue(isValidMessageType('UPDATE_SETTINGS'));
});

test('isValidMessageType: rejects invalid types', () => {
  assertFalse(isValidMessageType('EXECUTE_CODE'));
  assertFalse(isValidMessageType('eval'));
  assertFalse(isValidMessageType('__proto__'));
});

// ============================================================================
// A03 - INPUT SANITIZATION TESTS
// ============================================================================

console.log('\n=== A03: Input Sanitization Tests ===\n');

test('sanitizeNumber: valid number in range', () => {
  assertEqual(sanitizeNumber(30, 15, 120, 30), 30);
});

test('sanitizeNumber: below min returns default', () => {
  assertEqual(sanitizeNumber(5, 15, 120, 30), 30);
});

test('sanitizeNumber: above max returns default', () => {
  assertEqual(sanitizeNumber(200, 15, 120, 30), 30);
});

test('sanitizeNumber: string number works', () => {
  assertEqual(sanitizeNumber('45', 15, 120, 30), 45);
});

test('sanitizeNumber: invalid string returns default', () => {
  assertEqual(sanitizeNumber('abc', 15, 120, 30), 30);
});

test('sanitizeNumber: null returns default', () => {
  assertEqual(sanitizeNumber(null, 15, 120, 30), 30);
});

test('sanitizeNumber: NaN returns default', () => {
  assertEqual(sanitizeNumber(NaN, 15, 120, 30), 30);
});

test('validateSettings: rejects null', () => {
  assertEqual(validateSettings(null), null);
});

test('validateSettings: rejects non-object', () => {
  assertEqual(validateSettings('string'), null);
});

test('validateSettings: sanitizes out-of-range interval', () => {
  const result = validateSettings({ reminderInterval: 5 });
  assertEqual(result.reminderInterval, 30);
});

test('validateSettings: coerces non-boolean to default', () => {
  const result = validateSettings({ leetcodeEnabled: 'yes' });
  assertTrue(result.leetcodeEnabled);
});

// ============================================================================
// A10 - SSRF PREVENTION TESTS
// ============================================================================

console.log('\n=== A10: SSRF Prevention Tests ===\n');

test('ALLOWED_URLS: only expected domains', () => {
  assertEqual(Object.keys(ALLOWED_URLS).length, 2);
  assertTrue(ALLOWED_URLS.leetcode.startsWith('https://leetcode.com'));
  assertTrue(ALLOWED_URLS.codeforces.startsWith('https://codeforces.com'));
});

test('ALLOWED_URLS: no arbitrary URLs', () => {
  assertEqual(ALLOWED_URLS['evil'], undefined);
  assertEqual(ALLOWED_URLS['http://localhost'], undefined);
  assertEqual(ALLOWED_URLS['file:///etc/passwd'], undefined);
});

test('ALLOWED_URLS: is frozen (immutable)', () => {
  ALLOWED_URLS.evil = 'http://evil.com';
  assertEqual(ALLOWED_URLS.evil, undefined);
});

test('ALLOWED_URLS: uses HTTPS only', () => {
  assertTrue(ALLOWED_URLS.leetcode.startsWith('https://'));
  assertTrue(ALLOWED_URLS.codeforces.startsWith('https://'));
});

// ============================================================================
// A05 - SECURITY MISCONFIGURATION TESTS
// ============================================================================

console.log('\n=== A05: Security Misconfiguration Tests ===\n');

const fs = require('fs');
const path = require('path');

test('manifest.json: CSP configured', () => {
  const manifestPath = path.join(__dirname, '..', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assertTrue(manifest.content_security_policy !== undefined);
  assertTrue(manifest.content_security_policy.extension_pages.includes("script-src 'self'"));
});

test('manifest.json: no unsafe-inline/eval in CSP', () => {
  const manifestPath = path.join(__dirname, '..', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const csp = manifest.content_security_policy.extension_pages;
  assertFalse(csp.includes('unsafe-inline'));
  assertFalse(csp.includes('unsafe-eval'));
});

test('manifest.json: minimal permissions', () => {
  const manifestPath = path.join(__dirname, '..', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const allowed = ['alarms', 'tabs', 'storage'];
  manifest.permissions.forEach(perm => {
    assertTrue(allowed.includes(perm), `Unexpected permission: ${perm}`);
  });
  assertEqual(manifest.permissions.length, 3);
});

test('manifest.json: no host_permissions', () => {
  const manifestPath = path.join(__dirname, '..', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assertEqual(manifest.host_permissions, undefined);
});

test('manifest.json: no remote code execution', () => {
  const manifestPath = path.join(__dirname, '..', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assertEqual(manifest.content_scripts, undefined);
  assertEqual(manifest.externally_connectable, undefined);
});

// ============================================================================
// A09 - SECURITY LOGGING TESTS
// ============================================================================

console.log('\n=== A09: Security Logging Tests ===\n');

test('background.js: no sensitive data in logs', () => {
  const bgPath = path.join(__dirname, '..', 'background.js');
  const content = fs.readFileSync(bgPath, 'utf8');
  assertFalse(content.includes('password'));
  assertFalse(content.includes('secret'));
  assertFalse(content.includes('api_key'));
  assertFalse(content.includes('apiKey'));
});

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n=== Test Summary ===\n');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
