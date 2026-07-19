/**
 * Sanity tests for placeholder-email hiding on the public site.
 * Run: npx tsx scripts/test-placeholder-email.ts
 */
import { isPlaceholderEmail, pickPublicBusinessEmail } from '../lib/placeholderEmail';
import { mapBusinessRecord } from '../lib/businessMapping';

let passed = 0;
let failed = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`  FAIL  ${name}`, detail ?? '');
  }
}

console.log('helpers');
check('placeholder detected', isPlaceholderEmail('momo-27@finderb.com'));
check('case-insensitive', isPlaceholderEmail('X@FINDERB.COM'));
check('real email not placeholder', !isPlaceholderEmail('owner@gmail.com'));
check(
  'pick skips placeholder, falls to workEmail',
  pickPublicBusinessEmail('a@finderb.com', 'real@gmail.com') === 'real@gmail.com',
);
check(
  'pick undefined when all placeholders/empty',
  pickPublicBusinessEmail('a@finderb.com', '') === undefined,
);
check(
  'pick prefers first real email',
  pickPublicBusinessEmail('owner@gmail.com', 'other@x.com') === 'owner@gmail.com',
);

const baseRecord = {
  id: 'b1',
  businessName: 'Momo 27',
  displayName: 'Momo 27',
  status: 'Active',
  publicPhone: '9812345678',
  mobile: '9812345678',
};

console.log('\nmapBusinessRecord');
{
  const mapped = mapBusinessRecord({
    ...baseRecord,
    email: 'momo-27@finderb.com',
    workEmail: '',
  });
  check('placeholder profile → email undefined', mapped.email === undefined, mapped.email);
}
{
  const mapped = mapBusinessRecord({
    ...baseRecord,
    email: 'owner@gmail.com',
    workEmail: 'owner@gmail.com',
  });
  check('real profile → email kept', mapped.email === 'owner@gmail.com', mapped.email);
}
{
  const mapped = mapBusinessRecord({
    ...baseRecord,
    email: 'login-placeholder@finderb.com',
    workEmail: 'contact@business.in',
  });
  check(
    'placeholder login but real workEmail → workEmail shown',
    mapped.email === 'contact@business.in',
    mapped.email,
  );
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
