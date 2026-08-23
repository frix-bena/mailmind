import {
  md5,
  getGravatarUrl,
  getClearbitLogoUrl,
  getSenderInitial,
  getSenderColor,
  getAvatarSources,
  isFreeEmailProvider,
  GMAIL_AVATAR_PALETTE,
} from './lib/avatar-utils.js';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

console.log('--- RUNNING EMAIL AVATAR TEST SUITE ---\n');

// 1. MD5 Verification
console.log('1. Testing MD5 Hashing Accuracy...');
const testStrings = [
  '',
  'a',
  'abc',
  'message digest',
  'abcdefghijklmnopqrstuvwxyz',
  'john.doe@example.com',
  'SARAH.CONNOR@SKYNET.ORG',
  '  alex+filter@stripe.com  ',
  'user+test_123@subdomain.company.co.uk',
];

for (const str of testStrings) {
  const customHash = md5(str);
  const nodeHash = crypto.createHash('md5').update(str).digest('hex');
  assert.equal(customHash, nodeHash, `MD5 mismatch for input: "${str}"`);
}
console.log('  ✓ Pure JS MD5 matches Node.js crypto across all inputs.\n');

// 2. Gravatar URL Generation
console.log('2. Testing Gravatar URL Generation...');
const gravatar1 = getGravatarUrl('  John.Doe@Example.com  ', 100);
const expectedHash1 = crypto.createHash('md5').update('john.doe@example.com').digest('hex');
assert.equal(
  gravatar1,
  `https://www.gravatar.com/avatar/${expectedHash1}?s=100&d=404`,
  'Gravatar URL should trim, lowercase, set size and d=404'
);

const gravatarFormatted = getGravatarUrl('Sarah Connor <sarah@skynet.org>', 120);
const expectedHashFormatted = crypto.createHash('md5').update('sarah@skynet.org').digest('hex');
assert.equal(
  gravatarFormatted,
  `https://www.gravatar.com/avatar/${expectedHashFormatted}?s=120&d=404`,
  'Gravatar should handle "Name <email>" formatting'
);

assert.equal(getGravatarUrl(''), null);
assert.equal(getGravatarUrl(null), null);
console.log('  ✓ Gravatar URLs accurately constructed with d=404 and normalized emails.\n');

// 3. Free Provider vs Custom Domain Logo Generation (Clearbit)
console.log('3. Testing Free Provider & Clearbit Domain Logo Generator...');
assert.equal(isFreeEmailProvider('john@gmail.com'), true);
assert.equal(isFreeEmailProvider('sarah@googlemail.com'), true);
assert.equal(isFreeEmailProvider('user@yahoo.co.uk'), true);
assert.equal(isFreeEmailProvider('person@proton.me'), true);
assert.equal(isFreeEmailProvider('alex@stripe.com'), false);
assert.equal(isFreeEmailProvider('dev@github.com'), false);

assert.equal(getClearbitLogoUrl('john@gmail.com'), null, 'Gmail should not attempt Clearbit lookup');
assert.equal(getClearbitLogoUrl('sarah@yahoo.com'), null, 'Yahoo should not attempt Clearbit lookup');
assert.equal(
  getClearbitLogoUrl('alex@stripe.com', 100),
  'https://logo.clearbit.com/stripe.com?size=100',
  'Custom domain should construct Clearbit logo URL'
);
assert.equal(
  getClearbitLogoUrl('support@github.com', 80),
  'https://logo.clearbit.com/github.com?size=80',
  'Custom domain should support custom size'
);
console.log('  ✓ Domain logic correctly suppresses consumer webmail and fetches brand logos.\n');

// 4. Sender Initials Extraction
console.log('4. Testing Gmail Sender Initials Extraction...');
assert.equal(getSenderInitial('John Doe', 'john@gmail.com'), 'J');
assert.equal(getSenderInitial('"Sarah Connor"', 'sarah@skynet.org'), 'S');
assert.equal(getSenderInitial('', 'alex@stripe.com'), 'A');
assert.equal(getSenderInitial(null, 'elizabeth@domain.com'), 'E');
assert.equal(getSenderInitial(null, '<test@domain.com>'), 'T');
assert.equal(getSenderInitial(null, null), '?');
console.log('  ✓ Initials extraction accurately handles names, fallback emails, quotes, and empty states.\n');

// 5. Deterministic Color Assignment
console.log('5. Testing Deterministic Gmail Color Mapping...');
const colorJohn1 = getSenderColor('john.doe@gmail.com');
const colorJohn2 = getSenderColor('JOHN.DOE@GMAIL.COM');
const colorSarah = getSenderColor('sarah@skynet.org');

assert.equal(colorJohn1.hex, colorJohn2.hex, 'Same email with different case must yield exact same color');
assert.ok(colorJohn1.hex.startsWith('#'), 'Color should have valid hex');
assert.ok(colorJohn1.bgClass.startsWith('bg-'), 'Color should have Tailwind bgClass');

// Test distribution across palette
const senders = [
  'alice@alpha.com',
  'bob@beta.org',
  'charlie@gamma.io',
  'david@delta.co',
  'emma@epsilon.net',
  'frank@zeta.dev',
  'grace@eta.ai',
  'helen@theta.app',
  'ivan@iota.tech',
  'jack@kappa.co',
];
const assignedColors = new Set(senders.map(s => getSenderColor(s).hex));
assert.ok(assignedColors.size >= 5, 'Colors should distribute well across senders');
console.log(`  ✓ Deterministic color mapping is stable and distributes across ${GMAIL_AVATAR_PALETTE.length} Material palette colors.\n`);

// 6. Progressive Avatar Sources Cascade
console.log('6. Testing Progressive Fallback Cascade (Brand SVG -> Google Favicon -> Gravatar -> Unavatar -> Clearbit)...');
const freeSources = getAvatarSources('john@gmail.com', 100);
assert.ok(freeSources.length >= 2, 'Free email should have Gravatar and Google profile sources');
assert.ok(freeSources.some(s => s.type === 'gravatar'), 'Should have gravatar source');
assert.ok(freeSources.some(s => s.type === 'google_profile'), 'Should have google_profile source');

const businessSources = getAvatarSources('dev@stripe.com', 100);
assert.ok(businessSources.length >= 3, 'Business email should have Brand SVG, Google Favicon, Gravatar, Clearbit');
assert.equal(businessSources[0].type, 'brand_svg');
assert.equal(businessSources[1].type, 'google_fav');
assert.ok(businessSources.some(s => s.type === 'gravatar'));
assert.ok(businessSources.some(s => s.type === 'clearbit'));

console.log('  ✓ Fallback source cascade configured correctly with brand vector SVGs and Google S2 CDN.\n');

console.log('=== ALL AVATAR UNIT TESTS PASSED SUCCESSFULLY! ===');
