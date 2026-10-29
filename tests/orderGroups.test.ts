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

test('days read yesterday, today, tomorrow when yesterday is still open, whatever order the server sends', () => {
  const days = groupByDay([order('y', '2026-10-28', 'placed'), order('t2', '2026-10-30', 'cancelled'), order('t', '2026-10-29', 'cancelled')], '2026-10-29');
  assert.deepEqual(days.map((day) => [day.date, day.earlier]), [['2026-10-28', false], ['2026-10-29', false], ['2026-10-30', false]]);
});

test('finished past days come after the current ones, newest first', () => {
  const days = groupByDay([order('a', '2026-10-20', 'delivered'), order('b', '2026-10-30', 'placed'), order('c', '2026-10-26', 'delivered'), order('d', '2026-10-29', 'delivered')], '2026-10-29');
  assert.deepEqual(days.map((day) => [day.date, day.earlier]), [['2026-10-29', false], ['2026-10-30', false], ['2026-10-26', true], ['2026-10-20', true]]);
});

test('orders inside a day run by window, orders without a window last', () => {
  const [day] = groupByDay([order('evening', '2026-10-29', 'placed'), order('none', '2026-10-29', 'placed', null), order('morning', '2026-10-29', 'placed', ['06:00', '08:00'])], '2026-10-29');
  assert.deepEqual(day?.orders.map((item) => item.id), ['morning', 'evening', 'none']);
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
