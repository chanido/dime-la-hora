const test = require('node:test');
const assert = require('node:assert/strict');

const { formatSpanishTime } = require('./timeFormatter');

test('transicion 29 -> 30 -> 31', () => {
    assert.equal(formatSpanishTime(12, 29), 'Son casi las doce y media.');
    assert.equal(formatSpanishTime(12, 30), 'Son las doce y media.');
    assert.equal(formatSpanishTime(12, 31), 'Son las doce y media pasadas.');
});

test('transicion 44 -> 45 -> 46', () => {
    assert.equal(formatSpanishTime(17, 44), 'Son casi las seis menos cuarto.');
    assert.equal(formatSpanishTime(17, 45), 'Son las seis menos cuarto.');
    assert.equal(formatSpanishTime(17, 46), 'Son las seis menos cuarto pasadas.');
});

test('transicion 02 -> 03 -> 04', () => {
    assert.equal(formatSpanishTime(21, 2), 'Son las nueve en punto pasadas.');
    assert.equal(formatSpanishTime(21, 3), 'Son casi las nueve y cinco.');
    assert.equal(formatSpanishTime(21, 4), 'Son casi las nueve y cinco.');
});

test('transicion 57 -> 58 -> 59', () => {
    assert.equal(formatSpanishTime(23, 57), 'Son las doce menos cinco pasadas.');
    assert.equal(formatSpanishTime(23, 58), 'Son casi las doce.');
    assert.equal(formatSpanishTime(23, 59), 'Son casi las doce.');
});