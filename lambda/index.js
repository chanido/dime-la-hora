const Alexa = require('ask-sdk-core');

const LOCALE = 'es-ES';
const DEFAULT_TIME_ZONE = 'Europe/Madrid';
const DEFAULT_TIME_ZONE_LABEL = 'España peninsular';

function resolveTimeZone() {
    const configuredTimeZone = process.env.TIME_ZONE || DEFAULT_TIME_ZONE;

    try {
        new Intl.DateTimeFormat(LOCALE, { timeZone: configuredTimeZone });
        return configuredTimeZone;
    } catch {
        return DEFAULT_TIME_ZONE;
    }
}

function getCurrentTimeParts(date = new Date()) {
    const formatter = new Intl.DateTimeFormat(LOCALE, {
        timeZone: resolveTimeZone(),
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const formattedParts = formatter.formatToParts(date);
    const hour = formattedParts.find((part) => part.type === 'hour')?.value || '00';
    const minute = formattedParts.find((part) => part.type === 'minute')?.value || '00';

    return { hour, minute };
}

function getTimeZoneLabel() {
    return process.env.TIME_ZONE_LABEL || DEFAULT_TIME_ZONE_LABEL;
}

function buildTimeSpeech(date = new Date()) {
    const { hour, minute } = getCurrentTimeParts(date);
    return `La hora actual en ${getTimeZoneLabel()} es <say-as interpret-as="time">${hour}:${minute}</say-as>.`;
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechOutput = `<speak>Bienvenido a Dime la Hora. ${buildTimeSpeech()}</speak>`;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .withShouldEndSession(true)
            .getResponse();
    }
};

const HoraActualIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'HoraActualIntent';
    },
    handle(handlerInput) {
        const speechOutput = `<speak>${buildTimeSpeech()}</speak>`;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .withShouldEndSession(true)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechOutput = 'Puedes pedirme la hora diciendo: dime la hora, o bien: que hora es.';

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
                || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak('Hasta luego.')
            .withShouldEndSession(true)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        const speechOutput = 'No he entendido esa peticion. Puedes decir: dime la hora.';

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt(speechOutput)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        console.log(`Sesion finalizada: ${JSON.stringify(handlerInput.requestEnvelope)}`);
        return handlerInput.responseBuilder.getResponse();
    }
};

const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
        const speechOutput = `Has activado la intent ${intentName}.`;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`Error capturado: ${error.message}`);

        return handlerInput.responseBuilder
            .speak('Ha ocurrido un problema al consultar la hora. Intentalo otra vez.')
            .reprompt('Puedes decir: dime la hora.')
            .getResponse();
    }
};

exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HoraActualIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler
    )
    .addErrorHandlers(ErrorHandler)
    .withCustomUserAgent('dime-la-hora/v1.0')
    .lambda();
