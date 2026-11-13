import assert from 'node:assert/strict';
import { test } from 'node:test';
import { skippedDeliveryRanges } from '../src/lib/skippedDeliveryRanges.ts';
import type { DayLine } from '../src/types/subscriptions.ts';

const morning: DayLine = { lineId: 'morning', slotName: 'Morning', startTime: '07:00', quantity: 1, state: 'skipped', skipReason: 'customer', orderId: null, canChange: false };

test('merges consecutive skips for a slot without swallowing other slots, reasons or gaps', () => {
  const evening: DayLine = { ...morning, lineId: 'evening', slotName: 'Evening' };
  const result = skippedDeliveryRanges([
    { date: '2026-11-05', lines: [morning] },
    { date: '2026-11-01', lines: [morning, { ...evening, state: 'upcoming' }] },
    { date: '2026-11-02', lines: [morning, evening] },
    { date: '2026-11-03', lines: [{ ...morning, skipReason: 'order_cancelled' }] },
  ]);
  assert.deepEqual(result.map(({ from, to, line, count }) => [from, to, line.lineId, count]), [
    ['2026-11-01', '2026-11-02', 'morning', 2],
    ['2026-11-02', '2026-11-02', 'evening', 1],
    ['2026-11-03', '2026-11-03', 'morning', 1],
    ['2026-11-05', '2026-11-05', 'morning', 1],
  ]);
});
