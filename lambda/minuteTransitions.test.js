const test = require('node:test');
const assert = require('node:assert/strict');

const { formatSpanishTime } = require('./timeFormatter');

test('transicion 29 -> 30 -> 31', () => {
    assert.equal(formatSpanishTime(10, 29), 'Son las diez y veintinueve de la mañana.');
    assert.equal(formatSpanishTime(10, 30), 'Son las diez y media de la mañana.');
    assert.equal(formatSpanishTime(10, 31), 'Son las once menos veintinueve de la mañana.');
});

test('transicion 44 -> 45 -> 46', () => {
    assert.equal(formatSpanishTime(10, 44), 'Son las once menos dieciséis de la mañana.');
    assert.equal(formatSpanishTime(10, 45), 'Son las once menos cuarto de la mañana.');
    assert.equal(formatSpanishTime(10, 46), 'Son las once menos catorce de la mañana.');
});

test('transicion 14 -> 15 -> 16', () => {
    assert.equal(formatSpanishTime(10, 14), 'Son las diez y catorce de la mañana.');
    assert.equal(formatSpanishTime(10, 15), 'Son las diez y cuarto de la mañana.');
    assert.equal(formatSpanishTime(10, 16), 'Son las diez y dieciséis de la mañana.');
});

test('transicion 59 -> 00 -> 01', () => {
    assert.equal(formatSpanishTime(10, 59), 'Son las once menos uno de la mañana.');
    assert.equal(formatSpanishTime(11, 0), 'Son las once en punto de la mañana.');
    assert.equal(formatSpanishTime(11, 1), 'Son las once y uno de la mañana.');
});