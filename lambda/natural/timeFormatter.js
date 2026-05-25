const {
    formatHourArticle,
    getCurrentTimeParts,
    normalizeTimeZone,
    resolveFallbackTimeZone
} = require('../shared/timeCore');

const FIVE_MINUTE_MARKS = {
    0: 'en punto',
    5: 'y cinco',
    10: 'y diez',
    15: 'y cuarto',
    20: 'y veinte',
    25: 'y veinticinco',
    30: 'y media',
    35: 'menos veinticinco',
    40: 'menos veinte',
    45: 'menos cuarto',
    50: 'menos diez',
    55: 'menos cinco'
};

function getHourForMark(hour24, minuteMark, isUpperMark) {
    if (isUpperMark && minuteMark === 0) {
        return (hour24 + 1) % 24;
    }

    return hour24;
}

function getSpokenHourForMark(hour24, minuteMark, isUpperMark) {
    const hourForMark = getHourForMark(hour24, minuteMark, isUpperMark);
    return minuteMark > 30 ? (hourForMark + 1) % 24 : hourForMark;
}

function buildBasePhrase(hour24, minuteMark, isUpperMark, options = {}) {
    const spokenHour24 = getSpokenHourForMark(hour24, minuteMark, isUpperMark);
    const article = formatHourArticle(spokenHour24);
    const minutePhrase = FIVE_MINUTE_MARKS[minuteMark];

    if (minuteMark === 0 && options.skipEnPunto) {
        return { phrase: article };
    }

    return { phrase: `${article} ${minutePhrase}` };
}

function buildExactPhrase(hour24, minuteMark) {
    const { phrase } = buildBasePhrase(hour24, minuteMark, false);
    return `Son ${phrase}.`;
}

function buildPastPhrase(hour24, minuteMark) {
    const { phrase } = buildBasePhrase(hour24, minuteMark, false);
    return `Son ${phrase} pasadas.`;
}

function buildAlmostPhrase(hour24, minuteMark) {
    const { phrase } = buildBasePhrase(hour24, minuteMark, true, {
        skipEnPunto: minuteMark === 0
    });
    return `Son casi ${phrase}.`;
}

function formatSpanishTime(hour24, minute) {
    const lowerMark = Math.floor(minute / 5) * 5;

    if (minute % 5 === 0) {
        return buildExactPhrase(hour24, lowerMark);
    }

    const upperMark = (lowerMark + 5) % 60;
    const distanceToLower = minute - lowerMark;
    const distanceToUpper = 5 - distanceToLower;

    if (distanceToLower <= 2) {
        return buildPastPhrase(hour24, lowerMark);
    }

    if (distanceToUpper <= 2) {
        return buildAlmostPhrase(hour24, upperMark);
    }

    return buildExactPhrase(hour24, lowerMark);
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