import assert from 'node:assert/strict';
import { test } from 'node:test';
import { greetingPart } from '../src/lib/greeting.ts';

// 2026-10-24 in India is UTC+05:30, so 06:30 UTC is noon there.
const at = (indiaTime: string) => greetingPart(new Date(new Date(`2026-10-24T${indiaTime}:00+05:30`).getTime()));

test('greets by the hour in India, whatever the phone timezone', () => {
  assert.equal(at('04:59'), 'night');
  assert.equal(at('05:00'), 'morning');
  assert.equal(at('11:59'), 'morning');
  assert.equal(at('12:00'), 'afternoon');
  assert.equal(at('16:59'), 'afternoon');
  assert.equal(at('17:00'), 'evening');
  assert.equal(at('20:59'), 'evening');
  assert.equal(at('21:00'), 'night');
  assert.equal(at('00:30'), 'night');
});
