import {test} from 'node:test';
import assert from 'node:assert/strict';
import {withOverride} from './priced.js';

const base = {slug: 'gst-registration', price: 999};

test('no override keeps the base price', () => assert.equal(withOverride(base, undefined).price, 999));
test('a new price wins', () => assert.equal(withOverride(base, {price: 1199, offSale: false}).price, 1199));
test('off sale has no price', () => assert.equal(withOverride(base, {price: 1199, offSale: true}).price, null));
test('unknown service stays null', () => assert.equal(withOverride(null, {price: 5}), null));
