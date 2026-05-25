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

function formatHourArticle(hour24) {
    const hour12 = toTwelveHour(hour24);
    return hour12 === 1 ? 'la una' : `las ${HOUR_WORDS[hour12]}`;
}

module.exports = {
    formatHourArticle,
    getCurrentTimeParts,
    normalizeTimeZone,
    resolveFallbackTimeZone,
    toTwelveHour
};