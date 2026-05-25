const test = require('node:test');
const assert = require('node:assert/strict');

const { formatSpanishTime } = require('./timeFormatter');

test('dice la una en singular', () => {
    assert.equal(formatSpanishTime(1, 0), 'Es la una en punto de la madrugada.');
});

test('usa y cuarto para los quince minutos', () => {
    assert.equal(formatSpanishTime(2, 15), 'Son las dos y cuarto de la madrugada.');
});

test('expresa la una de la tarde de forma natural', () => {
    assert.equal(formatSpanishTime(13, 5), 'Es la una y cinco de la tarde.');
});

test('usa menos veinte despues y media', () => {
    assert.equal(formatSpanishTime(17, 40), 'Son las seis menos veinte de la tarde.');
});

test('mantiene la mañana antes del mediodia aunque se hable de la hora siguiente', () => {
    assert.equal(formatSpanishTime(11, 45), 'Son las doce menos cuarto de la mañana.');
});

test('reconoce el mediodia', () => {
    assert.equal(formatSpanishTime(12, 0), 'Son las doce en punto del mediodía.');
});

test('mantiene la tarde a ultima hora de la tarde', () => {
    assert.equal(formatSpanishTime(19, 45), 'Son las ocho menos cuarto de la tarde.');
});

test('usa la noche al final del dia', () => {
    assert.equal(formatSpanishTime(23, 45), 'Son las doce menos cuarto de la noche.');
});