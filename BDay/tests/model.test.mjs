import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  recipientName,
  welcomeUrl,
  dateValue,
  normalizeWish,
  filterWishes,
  validateWish,
} from '../public/js/model.js';
test('names round-trip once, including percent, apostrophes, emoji and markup', () => {
  for (const name of [
    "O'Connor",
    '100% joy',
    'A%20B',
    'Maya 🎂',
    '<img src=x onerror=alert(1)>',
  ]) {
    const url = welcomeUrl(name, 'https://example.com/sub/index.html');
    assert.equal(recipientName(url.search), name);
    assert.equal(url.pathname, '/sub/welcome.html');
  }
  assert.equal(recipientName('?name=%'), '%');
  assert.equal(recipientName('?name='), '');
  assert.equal(recipientName('?name=' + 'a'.repeat(150)).length, 120);
});
test('dates support Firebase timestamps and legacy dates without Invalid Date', () => {
  assert.equal(
    dateValue({ toDate: () => new Date('2025-01-01') }).getFullYear(),
    2025,
  );
  assert.equal(dateValue({ seconds: 0 }).getTime(), 0);
  assert.equal(dateValue('2025-01-01').getFullYear(), 2025);
  assert.equal(dateValue('bad'), null);
});
test('legacy fields normalize and search/status/newest sorting work together', () => {
  const wishes = [
    normalizeWish('old', {
      name: 'Lina',
      wish: 'A day out',
      gift: 'Coffee',
      timestamp: '2024-01-01',
    }),
    normalizeWish('new', {
      from: 'Maya',
      text: 'A lovely year',
      gift: 'Book',
      completed: true,
      createdAt: '2025-01-01',
    }),
  ];
  assert.equal(filterWishes(wishes, '', 'all')[0].id, 'new');
  assert.equal(filterWishes(wishes, 'DAY OUT', 'pending')[0].from, 'Lina');
  assert.equal(filterWishes(wishes, 'maya', 'pending').length, 0);
  assert.equal(filterWishes(wishes, 'book', 'completed').length, 1);
});
test('wish validation requires location and blocks blank or oversized fields', () => {
  const valid = {
    from: 'Maya',
    text: 'Happy days',
    gift: 'A book',
    address: 'Bengaluru',
  };
  assert.equal(validateWish(valid), '');
  assert.match(validateWish({ ...valid, address: '' }), /location/);
  assert.match(validateWish({ ...valid, address: '   ' }), /location/);
  assert.match(validateWish({ ...valid, text: '  ' }), /wish/);
  assert.match(validateWish({ ...valid, gift: '' }), /gift/);
  assert.match(validateWish({ ...valid, address: 'x'.repeat(501) }), /shorten/);
});
