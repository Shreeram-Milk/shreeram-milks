import assert from 'node:assert/strict';
import { test } from 'node:test';
import { deliveryDetailsBody, emptyDeliveryDetails, fillMissingDeliveryDetails, needsDeliveryClarification, parseDeliveryDetails } from '../src/lib/deliveryDetails.ts';

test('legacy addresses need one clarification, while an explicitly confirmed address does not', () => {
  assert.equal(needsDeliveryClarification(undefined), false);
  assert.equal(needsDeliveryClarification({}), true);
  assert.equal(needsDeliveryClarification({ deliveryDetailsConfirmed: false }), true);
  assert.equal(needsDeliveryClarification({ deliveryDetailsConfirmed: true }), false);
});

test('unknown house and floor stay blank rather than being invented or numerically coerced', () => {
  assert.deepEqual(parseDeliveryDetails({ floor: 2, unit: null, lane: 'Temple lane' }), { ...emptyDeliveryDetails(), lane: 'Temple lane' });
});

test('delivery details preserve alphanumeric unit and textual floor, and confirmation defaults false', () => {
  assert.deepEqual(deliveryDetailsBody({ deliveryDetails: { building: '', towerWing: ' A ', floor: ' Ground ', unit: ' 12-B ', lane: '' } }), {
    deliveryDetails: { building: '', towerWing: 'A', floor: 'Ground', unit: '12-B', lane: '' }, deliveryDetailsConfirmed: false,
  });
});

test('a reviewed suggestion fills blanks without overwriting the customer’s existing details', () => {
  const result = fillMissingDeliveryDetails({ building: 'Customer building', towerWing: '', floor: ' Ground ', unit: '12-B', lane: '' }, { building: 'Suggested building', towerWing: 'A', floor: '5', unit: '99', lane: 'Temple lane' });
  assert.deepEqual(result, { building: 'Customer building', towerWing: 'A', floor: ' Ground ', unit: '12-B', lane: 'Temple lane' });
});
