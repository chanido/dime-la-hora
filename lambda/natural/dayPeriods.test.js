const test = require('node:test');
const assert = require('node:assert/strict');

const { formatSpanishTime } = require('./timeFormatter');

const DAY_PERIOD_TERMS = [
    'de la mañana',
    'de la tarde',
    'de la noche',
    'de la madrugada',
    'del mediodía'
];

function assertWithoutDayPeriod(hour, minute) {
    const phrase = formatSpanishTime(hour, minute);

    DAY_PERIOD_TERMS.forEach((term) => {
        assert.equal(
            phrase.includes(term),
            false,
            `No se esperaba '${term}' en '${phrase}'`
        );
    });
}

test('no incluye parte del dia de madrugada', () => {
    assertWithoutDayPeriod(2, 10);
});

test('no incluye parte del dia por la mañana', () => {
    assertWithoutDayPeriod(9, 25);
});

test('no incluye parte del dia al mediodia', () => {
    assertWithoutDayPeriod(12, 0);
});

test('no incluye parte del dia por la tarde', () => {
    assertWithoutDayPeriod(17, 45);
});

test('no incluye parte del dia por la noche', () => {
    assertWithoutDayPeriod(23, 58);
});