const Alexa = require('ask-sdk-core');
const {
    formatSpanishTimeFromDate,
    normalizeTimeZone,
    resolveFallbackTimeZone
} = require('./natural/timeFormatter');

async function getDeviceTimeZone(handlerInput) {
    const deviceId = handlerInput.requestEnvelope?.context?.System?.device?.deviceId;

    if (!deviceId || !handlerInput.serviceClientFactory) {
        return resolveFallbackTimeZone();
    }

    try {
        const upsServiceClient = handlerInput.serviceClientFactory.getUpsServiceClient();
        const deviceTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);
        return normalizeTimeZone(deviceTimeZone);
    } catch (error) {
        console.log(`No se pudo obtener la zona horaria del dispositivo: ${error.message}`);
        return resolveFallbackTimeZone();
    }
}

async function buildTimeSpeech(handlerInput, date = new Date()) {
    const timeZone = await getDeviceTimeZone(handlerInput);
    return formatSpanishTimeFromDate(date, timeZone);
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const speechOutput = `<speak>Bienvenido a Dime la Hora. ${await buildTimeSpeech(handlerInput)}</speak>`;

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
    async handle(handlerInput) {
        const speechOutput = `<speak>${await buildTimeSpeech(handlerInput)}</speak>`;

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
        const speechOutput = 'Puedo decirte la hora como la diría alguien en España. Por ejemplo: dime la hora, o: qué hora es.';

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
        const speechOutput = 'No he entendido esa petición. Puedes decir: dime la hora, o bien: dime la hora bien.';

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
            .speak('Ha ocurrido un problema al consultar la hora. Inténtalo otra vez.')
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
    .withApiClient(new Alexa.DefaultApiClient())
    .withCustomUserAgent('dime-la-hora/v1.0')
    .lambda();
