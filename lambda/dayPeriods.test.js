const test = require('node:test');
const assert = require('node:assert/strict');

const { formatSpanishTime } = require('./timeFormatter');

function assertPeriod(hour, minute, expectedPeriodSuffix) {
    const spokenTime = formatSpanishTime(hour, minute);
    assert.ok(
        spokenTime.endsWith(expectedPeriodSuffix),
        `Esperaba ${expectedPeriodSuffix} para ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}, pero fue: ${spokenTime}`
    );
}

test('cambio de noche a madrugada: 00:29 -> 00:30', () => {
    assertPeriod(0, 29, 'de la noche.');
    assertPeriod(0, 30, 'de la madrugada.');
});

test('cambio de madrugada a mañana: 05:59 -> 06:00', () => {
    assertPeriod(5, 59, 'de la madrugada.');
    assertPeriod(6, 0, 'de la mañana.');
});

test('cambio de mañana a mediodía: 11:59 -> 12:00', () => {
    assertPeriod(11, 59, 'de la mañana.');
    assertPeriod(12, 0, 'del mediodía.');
});

test('cambio de mediodía a tarde: 12:59 -> 13:00', () => {
    assertPeriod(12, 59, 'del mediodía.');
    assertPeriod(13, 0, 'de la tarde.');
});

test('cambio de tarde a noche: 19:59 -> 20:00', () => {
    assertPeriod(19, 59, 'de la tarde.');
    assertPeriod(20, 0, 'de la noche.');
});