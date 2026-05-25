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

    if (totalMinutes < 750) {
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
    const spokenHour = toTwelveHour(spokenHour24);
    const lead = spokenHour === 1 ? 'Es la una' : `Son las ${HOUR_WORDS[spokenHour]}`;
    const minutePhrase = formatMinutePhrase(minute);
    const period = getDayPeriod(hour24, minute);

    return `${lead} ${minutePhrase} ${period}.`;
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