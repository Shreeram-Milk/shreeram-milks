import assert from 'node:assert/strict';
import { test } from 'node:test';
import { groupByDay, shownStatus } from '../src/lib/orderGroups.ts';
import type { Order, OrderStatus } from '../src/types/orders.ts';

const order = (id: string, deliveryDate: string, status: OrderStatus, slot: [string, string] | null = ['17:00', '20:00'], deliveryMethod: Order['deliveryMethod'] = 'local_delivery'): Order => ({
  id, orderNumber: id, status, deliveryMethod, deliveryDate, slot: slot ? { id: 's', name: 'Evening', startTime: slot[0], endTime: slot[1] } : null,
  recipientName: '', addressText: '', courierName: '', trackingUrl: '', pinCode: '', totalPaise: 0, discountPaise: 0, offerTitle: '', offerTitleGu: '',
  paymentMethod: 'online', paymentStatus: 'paid', placedAt: '', subscriptionId: null, cancelReason: '', canCancel: false, items: [],
});
const at = (indiaTime: string) => new Date(`${indiaTime}+05:30`);

test('groups by placement date in India, even when delivery is on a different day', () => {
  const later = { ...order('later', '2026-11-01', 'placed'), placedAt: '2026-10-28T18:31:00Z' };
  const earlier = { ...order('earlier', '2026-10-30', 'cancelled'), placedAt: '2026-10-28T18:29:00Z' };
  const days = groupByDay([earlier, later]);
  assert.deepEqual(days.map((day) => [day.date, day.orders[0]?.id]), [['2026-10-29', 'later'], ['2026-10-28', 'earlier']]);
});

test('orders inside a day run by newest placement time regardless of delivery slot', () => {
  const older = { ...order('evening', '2026-10-29', 'placed'), placedAt: '2026-10-29T05:00:00Z' };
  const newest = { ...order('morning', '2026-10-30', 'placed', ['06:00', '08:00']), placedAt: '2026-10-29T10:00:00Z' };
  const [day] = groupByDay([older, newest]);
  assert.deepEqual(day?.orders.map((item) => item.id), ['morning', 'evening']);
});

test('an open order is overdue once its window ends in India time', () => {
  const evening = order('e', '2026-10-28', 'placed');
  assert.equal(shownStatus(evening, at('2026-10-28T19:59:00')), 'placed');
  assert.equal(shownStatus(evening, at('2026-10-28T20:00:00')), 'overdue');
  assert.equal(shownStatus({ ...evening, status: 'out_for_delivery' }, at('2026-10-29T09:00:00')), 'overdue');
});

test('finished orders, courier parcels and orders without a window before midnight are never overdue', () => {
  assert.equal(shownStatus(order('d', '2026-10-28', 'delivered'), at('2026-10-29T09:00:00')), 'delivered');
  assert.equal(shownStatus(order('c', '2026-10-28', 'cancelled'), at('2026-10-29T09:00:00')), 'cancelled');
  assert.equal(shownStatus(order('s', '2026-10-28', 'placed', null, 'shipping'), at('2026-11-05T09:00:00')), 'placed');
  assert.equal(shownStatus(order('n', '2026-10-28', 'placed', null), at('2026-10-28T23:59:00')), 'placed');
  assert.equal(shownStatus(order('n', '2026-10-28', 'placed', null), at('2026-10-29T00:00:00')), 'overdue');
});


test('legacy orders without placement times fall back to their delivery dates', () => {
  const input = [order('old', '2026-10-20', 'delivered'), order('newer', '2026-10-28', 'delivered')];
  assert.deepEqual(groupByDay(input).map(day => day.date), ['2026-10-28', '2026-10-20']);
  assert.deepEqual(input.map(item => item.id), ['old', 'newer']);
  assert.deepEqual(groupByDay([]), []);
});
