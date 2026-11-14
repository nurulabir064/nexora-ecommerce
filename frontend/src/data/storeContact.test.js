import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORE_PHONE_LOCAL,
  STORE_PHONE_INTERNATIONAL,
  STORE_TEL_URL,
  STORE_WHATSAPP_URL,
  buildOrderWhatsAppUrl
} from './storeContact.js';

test('NEXORA support phone is normalized for Bangladesh international dialing', () => {
  assert.equal(STORE_PHONE_LOCAL, '01304302201');
  assert.equal(STORE_PHONE_INTERNATIONAL, '8801304302201');
  assert.equal(STORE_TEL_URL, 'tel:+8801304302201');
  assert.equal(STORE_WHATSAPP_URL, 'https://wa.me/8801304302201');
});

test('order WhatsApp message safely encodes order data and does not auto-send', () => {
  const url = new URL(buildOrderWhatsAppUrl({ orderNumber: 'NX-20261114-ABC123', total: 1250 }));
  assert.equal(url.origin + url.pathname, 'https://wa.me/8801304302201');
  const message = url.searchParams.get('text');
  assert.match(message, /NX-20261114-ABC123/);
  assert.match(message, /BDT 1,250/);
  assert.match(message, /Cash on delivery/);
});
