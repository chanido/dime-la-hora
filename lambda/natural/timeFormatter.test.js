const test = require('node:test');
const assert = require('node:assert/strict');

const { formatSpanishTime } = require('./timeFormatter');

test('caso exacto y cuarto', () => {
    assert.equal(formatSpanishTime(15, 15), 'Son las tres y cuarto.');
});

test('caso exacto menos cuarto', () => {
    assert.equal(formatSpanishTime(17, 45), 'Son las seis menos cuarto.');
});

test('12:02 se dice en punto pasadas', () => {
    assert.equal(formatSpanishTime(12, 2), 'Son las doce en punto pasadas.');
});

test('21:03 se aproxima al y cinco', () => {
    assert.equal(formatSpanishTime(21, 3), 'Son casi las nueve y cinco.');
});

test('9:56 se dice menos cinco pasadas', () => {
    assert.equal(formatSpanishTime(9, 56), 'Son las diez menos cinco pasadas.');
});

test('23:58 se aproxima a la hora en punto siguiente', () => {
    assert.equal(formatSpanishTime(23, 58), 'Son casi las doce.');
});

test('y media pasadas', () => {
    assert.equal(formatSpanishTime(10, 32), 'Son las diez y media pasadas.');
});

test('casi y media', () => {
    assert.equal(formatSpanishTime(10, 28), 'Son casi las diez y media.');
});