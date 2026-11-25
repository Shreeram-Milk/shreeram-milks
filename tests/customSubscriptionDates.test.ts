import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dateRange, toggleDate } from '../src/lib/customSubscriptionDates.ts';

test('selecting and deselecting individual dates preserves gaps and sorted order', () => {
  let dates = dateRange('2026-12-01', '2026-12-09');
  for (const day of ['06', '07', '08', '09']) dates = toggleDate(dates, `2026-12-${day}`);
  assert.deepEqual(dates, dateRange('2026-12-01', '2026-12-05'));
  dates = toggleDate(dates, '2026-12-09');
  assert.equal(dates.length, 6);
  assert.equal(dates.at(-1), '2026-12-09');
  assert.equal(dates.includes('2026-12-08'), false);
});
test('calendar selection spans year and leap-day boundaries without timezone offsets', () => {
  assert.deepEqual(dateRange('2028-02-28', '2028-03-01'), ['2028-02-28', '2028-02-29', '2028-03-01']);
  assert.deepEqual(dateRange('2026-12-31', '2027-01-01'), ['2026-12-31', '2027-01-01']);
  assert.deepEqual(toggleDate(['2026-12-01'], '2026-12-01'), []);
  assert.deepEqual(dateRange('2026-12-02', '2026-12-01'), []);
});
