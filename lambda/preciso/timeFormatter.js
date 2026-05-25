const {
    formatHourArticle,
    getCurrentTimeParts,
    normalizeTimeZone,
    resolveFallbackTimeZone
} = require('../shared/timeCore');

const MINUTE_WORDS = {
    1: 'uno',
    2: 'dos',
    3: 'tres',
    4: 'cuatro',
    5: 'cinco',
    6: 'seis',
    7: 'siete',
    8: 'ocho',
    9: 'nueve',
    10: 'diez',
    11: 'once',
    12: 'doce',
    13: 'trece',
    14: 'catorce',
    15: 'quince',
    16: 'dieciséis',
    17: 'diecisiete',
    18: 'dieciocho',
    19: 'diecinueve',
    20: 'veinte',
    21: 'veintiuno',
    22: 'veintidós',
    23: 'veintitrés',
    24: 'veinticuatro',
    25: 'veinticinco',
    26: 'veintiséis',
    27: 'veintisiete',
    28: 'veintiocho',
    29: 'veintinueve'
};

function getDayPeriod(hour24, minute) {
    const totalMinutes = (hour24 * 60) + minute;

    if (totalMinutes < 30) {
        return 'de la noche';
    }

    if (totalMinutes < 360) {
        return 'de la madrugada';
    }

    if (totalMinutes < 720) {
        return 'de la mañana';
    }

    if (totalMinutes < 780) {
        return 'del mediodía';
    }

    if (totalMinutes < 1200) {
        return 'de la tarde';
    }

    return 'de la noche';
}

function formatMinutePhrase(minute) {
    if (minute === 0) {
        return 'en punto';
    }

    if (minute === 15) {
        return 'y cuarto';
    }

    if (minute === 30) {
        return 'y media';
    }

    if (minute < 30) {
        return `y ${MINUTE_WORDS[minute]}`;
    }

    const remainingMinutes = 60 - minute;

    if (remainingMinutes === 15) {
        return 'menos cuarto';
    }

    return `menos ${MINUTE_WORDS[remainingMinutes]}`;
}

function formatSpanishTime(hour24, minute) {
    const spokenHour24 = minute > 30 ? (hour24 + 1) % 24 : hour24;
    const hourArticle = formatHourArticle(spokenHour24);
    const lead = hourArticle === 'la una' ? 'Es' : 'Son';
    const minutePhrase = formatMinutePhrase(minute);
    const period = getDayPeriod(hour24, minute);

    return `${lead} ${hourArticle} ${minutePhrase} ${period}.`;
}

function formatSpanishTimeFromDate(date, timeZone) {
    const { hour, minute } = getCurrentTimeParts(timeZone, date);
    return formatSpanishTime(hour, minute);
}

module.exports = {
    formatSpanishTime,
    formatSpanishTimeFromDate,
    getCurrentTimeParts,
    normalizeTimeZone,
    resolveFallbackTimeZone
};