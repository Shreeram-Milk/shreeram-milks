import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cancelEffect } from '../src/lib/cancelEffect.ts';
import type { DayLine, DayState } from '../src/types/subscriptions.ts';

const line = (state: DayState, canChange: boolean, slotName = 'Evening', startTime = '17:00'): DayLine => ({ lineId: 'l', slotName, startTime, quantity: 1, state, skipReason: null, orderId: null, canChange });

test('lists the days that stop and the ones already being prepared, in day and window order', () => {
  const result = cancelEffect([
    { date: '2026-10-30', lines: [line('upcoming', true)] },
    { date: '2026-10-29', lines: [line('placed', true), line('out_for_delivery', false, 'Morning', '06:00')] },
  ], '2026-10-29', '2026-10-30');
  assert.deepEqual(result.stops, [{ date: '2026-10-29', slotName: 'Evening' }, { date: '2026-10-30', slotName: 'Evening' }]);
  assert.equal(result.complete, true);
  assert.deepEqual(result.stillComes, [{ date: '2026-10-29', slotName: 'Morning' }]);
});

test('a placed delivery past its cancel time still comes; skipped, paused, finished and past days are left out', () => {
  const result = cancelEffect([
    { date: '2026-10-28', lines: [line('placed', false)] },
    { date: '2026-10-29', lines: [line('placed', false), line('skipped', true, 'Morning', '06:00'), line('delivered', false, 'Noon', '12:00')] },
    { date: '2026-10-31', lines: [line('paused', false)] },
  ], '2026-10-29', '2026-10-29');
  assert.deepEqual(result.stops, []);
  assert.deepEqual(result.stillComes, [{ date: '2026-10-29', slotName: 'Evening' }]);
});

test('a plan that runs past the days the app can see, or has no end date, is not complete', () => {
  const days = [{ date: '2026-10-29', lines: [line('upcoming', true)] }];
  assert.equal(cancelEffect(days, '2026-10-29', '2026-12-31').complete, false);
  assert.equal(cancelEffect(days, '2026-10-29', null).complete, false);
});
