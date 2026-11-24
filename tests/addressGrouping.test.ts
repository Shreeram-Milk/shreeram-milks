import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addressGroupingBody, addressLines, parseAddressGrouping } from '../src/lib/addressGrouping.ts';

test('old addresses do not acquire a guessed society or locality', () => {
  assert.deepEqual(parseAddressGrouping({ line2: 'Behind temple, blue gate' }), {
    addressKind: 'unspecified', deliveryPlaceId: null, deliveryPlaceName: '', locality: '',
  });
});

test('manual independent-house directions survive formatting without a society or house number', () => {
  assert.equal(addressLines({ line1: 'Behind Hanuman Temple, blue gate', line2: '', landmark: '', locality: 'Vavol' }), 'Behind Hanuman Temple, blue gate, Vavol');
});

test('address presentation preserves original text plus saved society and locality', () => {
  assert.equal(addressLines({ line1: 'B-12', line2: 'Second lane', landmark: 'Behind school', deliveryPlaceName: 'Shreeji Heights', locality: 'Sargasan' }), 'B-12, Shreeji Heights, Second lane, Sargasan, Behind school');
});

test('exact repeated place labels are not printed twice, while different names remain distinct', () => {
  assert.equal(addressLines({ line1: 'House 2', line2: 'Shreeji Society', deliveryPlaceName: 'shreeji society', locality: 'Shreeji Residency', landmark: '' }), 'House 2, shreeji society, Shreeji Residency');
});

test('an unspecified legacy address never sends a stale place identity', () => {
  assert.deepEqual(addressGroupingBody({ addressKind: 'unspecified', deliveryPlaceId: 'old-selection', deliveryPlaceName: 'Old society', locality: ' Vavol ' }), {
    addressKind: 'unspecified', deliveryPlaceId: null, deliveryPlaceName: '', locality: 'Vavol',
  });
});

test('a confirmed new society is submitted without inventing a directory id', () => {
  assert.deepEqual(addressGroupingBody({ addressKind: 'society', deliveryPlaceId: null, deliveryPlaceName: ' New Heights ', locality: ' Sargasan ' }), {
    addressKind: 'society', deliveryPlaceId: null, deliveryPlaceName: 'New Heights', locality: 'Sargasan',
  });
});
