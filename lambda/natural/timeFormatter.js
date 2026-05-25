const LOCALE = 'es-ES';
const DEFAULT_TIME_ZONE = 'Europe/Madrid';

const HOUR_WORDS = {
    1: 'una',
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
    12: 'doce'
};

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

function resolveFallbackTimeZone() {
    const configuredTimeZone = process.env.TIME_ZONE || DEFAULT_TIME_ZONE;

    try {
        new Intl.DateTimeFormat(LOCALE, { timeZone: configuredTimeZone });
        return configuredTimeZone;
    } catch {
        return DEFAULT_TIME_ZONE;
    }
}

function normalizeTimeZone(timeZone) {
    if (!timeZone) {
        return resolveFallbackTimeZone();
    }

    try {
        new Intl.DateTimeFormat(LOCALE, { timeZone });
        return timeZone;
    } catch {
        return resolveFallbackTimeZone();
    }
}

function getCurrentTimeParts(timeZone, date = new Date()) {
    const formatter = new Intl.DateTimeFormat(LOCALE, {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const formattedParts = formatter.formatToParts(date);
    const hour = Number.parseInt(formattedParts.find((part) => part.type === 'hour')?.value || '0', 10);
    const minute = Number.parseInt(formattedParts.find((part) => part.type === 'minute')?.value || '0', 10);

    return { hour, minute };
}

function toTwelveHour(hour24) {
    const hour = hour24 % 12;
    return hour === 0 ? 12 : hour;
}

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
    const spokenHour12 = toTwelveHour(spokenHour24);
    const article = spokenHour12 === 1 ? 'la una' : `las ${HOUR_WORDS[spokenHour12]}`;
    const minutePhrase = FIVE_MINUTE_MARKS[minuteMark];

    if (minuteMark === 0 && options.skipEnPunto) {
        return { spokenHour12, phrase: article };
    }

    return { spokenHour12, phrase: `${article} ${minutePhrase}` };
}

function buildExactPhrase(hour24, minuteMark) {
    const { spokenHour12, phrase } = buildBasePhrase(hour24, minuteMark, false);
    const lead = spokenHour12 === 1 ? 'Es' : 'Son';
    return `${lead} ${phrase}.`;
}

function buildPastPhrase(hour24, minuteMark) {
    const { spokenHour12, phrase } = buildBasePhrase(hour24, minuteMark, false);
    const lead = spokenHour12 === 1 ? 'Es' : 'Son';
    return `${lead} ${phrase} pasadas.`;
}

function buildAlmostPhrase(hour24, minuteMark) {
    const { phrase } = buildBasePhrase(hour24, minuteMark, true, {
        skipEnPunto: minuteMark === 0
    });
    return `Casi ${phrase}.`;
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