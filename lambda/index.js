const Alexa = require('ask-sdk-core');
const ddbAdapter = require('ask-sdk-dynamodb-persistence-adapter');
const {
    formatSpanishTimeFromDate: formatNaturalTime,
    normalizeTimeZone,
    resolveFallbackTimeZone
} = require('./natural/timeFormatter');
const {
    formatSpanishTimeFromDate: formatPreciseTime
} = require('./preciso/timeFormatter');

const MODE_NATURAL = 'natural';
const MODE_PRECISE = 'preciso';
const ONBOARDING_DONE_KEY = 'onboardingDone';
const PERSISTENCE_TABLE = process.env.DYNAMODB_PERSISTENCE_TABLE_NAME || 'dime-la-hora-users';
const PERSISTENCE_REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
const HAS_PERSISTENCE = Boolean(PERSISTENCE_REGION);

const MODE_DESCRIPTION_NATURAL = 'La hora natural dice la hora aproximando los minutos, por ejemplo, Son casi las doce.';
const MODE_DESCRIPTION_PRECISE = 'La hora precisa dice exactamente los minutos y el momento del día en el que estamos, por ejemplo, Son las doce menos un minuto de la mañana.';

function getModeFormatter(mode) {
    if (mode === MODE_PRECISE) {
        return formatPreciseTime;
    }

    return formatNaturalTime;
}

async function getUserMode(handlerInput) {
    if (!HAS_PERSISTENCE) {
        const sessionAttrs = handlerInput.attributesManager.getSessionAttributes() || {};
        return sessionAttrs.mode === MODE_PRECISE ? MODE_PRECISE : MODE_NATURAL;
    }

    try {
        const attrs = await handlerInput.attributesManager.getPersistentAttributes();
        return attrs.mode === MODE_PRECISE ? MODE_PRECISE : MODE_NATURAL;
    } catch (error) {
        console.log(`No se pudo leer el modo del usuario: ${error.message}`);
        return MODE_NATURAL;
    }
}

async function setUserMode(handlerInput, mode) {
    const targetMode = mode === MODE_PRECISE ? MODE_PRECISE : MODE_NATURAL;

    if (!HAS_PERSISTENCE) {
        const sessionAttrs = handlerInput.attributesManager.getSessionAttributes() || {};
        sessionAttrs.mode = targetMode;
        handlerInput.attributesManager.setSessionAttributes(sessionAttrs);
        return targetMode;
    }

    try {
        const attrs = await handlerInput.attributesManager.getPersistentAttributes();
        attrs.mode = targetMode;
        handlerInput.attributesManager.setPersistentAttributes(attrs);
        await handlerInput.attributesManager.savePersistentAttributes();
    } catch (error) {
        console.log(`No se pudo guardar el modo del usuario: ${error.message}`);
    }

    return targetMode;
}

function getModeLabel(mode) {
    return mode === MODE_PRECISE ? 'preciso' : 'natural';
}

async function getUserAttributes(handlerInput) {
    if (!HAS_PERSISTENCE) {
        return handlerInput.attributesManager.getSessionAttributes() || {};
    }

    try {
        return await handlerInput.attributesManager.getPersistentAttributes();
    } catch (error) {
        console.log(`No se pudieron leer los atributos del usuario: ${error.message}`);
        return {};
    }
}

async function saveUserAttributes(handlerInput, attrs) {
    if (!HAS_PERSISTENCE) {
        handlerInput.attributesManager.setSessionAttributes(attrs);
        return;
    }

    try {
        handlerInput.attributesManager.setPersistentAttributes(attrs);
        await handlerInput.attributesManager.savePersistentAttributes();
    } catch (error) {
        console.log(`No se pudieron guardar los atributos del usuario: ${error.message}`);
    }
}

async function isOnboardingDone(handlerInput) {
    const attrs = await getUserAttributes(handlerInput);
    return Boolean(attrs[ONBOARDING_DONE_KEY]);
}

async function markOnboardingDone(handlerInput) {
    const attrs = await getUserAttributes(handlerInput);
    attrs[ONBOARDING_DONE_KEY] = true;
    await saveUserAttributes(handlerInput, attrs);
}

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
    const mode = await getUserMode(handlerInput);
    const timeZone = await getDeviceTimeZone(handlerInput);
    const formatter = getModeFormatter(mode);
    return formatter(date, timeZone);
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
    },
    async handle(handlerInput) {
        const onboardingDone = await isOnboardingDone(handlerInput);

        if (!onboardingDone) {
            const speechOutput = 'Bienvenido a Dime la Hora. Si quieres una configuración rápida para usar comandos como dime la hora, di onboarding rápido.';
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .reprompt('Di onboarding rápido y te guío en menos de un minuto.')
                .getResponse();
        }

        const mode = await getUserMode(handlerInput);
        const speechOutput = `<speak>Bienvenido a Dime la Hora. Ahora mismo estás en modo ${getModeLabel(mode)}. ${await buildTimeSpeech(handlerInput)}</speak>`;

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

const RecomendarSkillIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RecomendarSkillIntent';
    },
    handle(handlerInput) {
        const speechOutput = 'Sí, la skill Dime la Hora. Si quieres, te explico cómo configurarla en modo natural o preciso.';

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt('Puedes decir: configura modo preciso, o configura modo natural.')
            .getResponse();
    }
};

const QuejaHoraIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'QuejaHoraIntent';
    },
    handle(handlerInput) {
        const speechOutput = 'Perdona. Si quieres, puedo configurarme en modo natural o en modo preciso.';

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt('Di: activa modo natural, o activa modo preciso.')
            .getResponse();
    }
};

const ConfigurarSkillIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ConfigurarSkillIntent';
    },
    handle(handlerInput) {
        const speechOutput = 'Puedo usar dos modos. Modo natural y modo preciso. Di: describe hora natural, describe hora precisa, activa modo natural o activa modo preciso.';

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt('Di: activa modo natural, o activa modo preciso.')
            .getResponse();
    }
};

const ActivarModoNaturalIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ActivarModoNaturalIntent';
    },
    async handle(handlerInput) {
        await setUserMode(handlerInput, MODE_NATURAL);
        const speechOutput = `Perfecto, te dejo en modo natural. ${MODE_DESCRIPTION_NATURAL}`;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt('Si quieres, di: qué hora es.')
            .getResponse();
    }
};

const ActivarModoPrecisoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ActivarModoPrecisoIntent';
    },
    async handle(handlerInput) {
        await setUserMode(handlerInput, MODE_PRECISE);
        const speechOutput = `Perfecto, te dejo en modo preciso. ${MODE_DESCRIPTION_PRECISE}`;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt('Si quieres, di: qué hora es.')
            .getResponse();
    }
};

const DescribirModoNaturalIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DescribirModoNaturalIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(MODE_DESCRIPTION_NATURAL)
            .reprompt('Si quieres, di: activa modo natural.')
            .getResponse();
    }
};

const DescribirModoPrecisoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DescribirModoPrecisoIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(MODE_DESCRIPTION_PRECISE)
            .reprompt('Si quieres, di: activa modo preciso.')
            .getResponse();
    }
};

const ConfigurarRutinaIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ConfigurarRutinaIntent';
    },
    handle(handlerInput) {
        const speechOutput = 'Claro. Abre la app Alexa, ve a Más, Rutinas, y crea una nueva. En esa rutina, añade varias frases de activación: dime la hora, dime la hora bien, y cualquier otra que quieras. La acción es abrir Dime la Hora. Todo se hace en una sola rutina. Cuando lo tengas, puedes decirme listo onboarding.';

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt('Si lo necesitas, di onboarding rápido y te lo explico paso a paso.')
            .getResponse();
    }
};

const OnboardingRapidoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'OnboardingRapidoIntent';
    },
    handle(handlerInput) {
        const speechOutput = 'Vale, eso es fácil. Abre la app Alexa, ve a Más, Rutinas, y pulsa el más. Crea una rutina que lance Dime la Hora. Dentro de esa rutina puedes añadir varias frases: dime la hora, dime la hora bien, y las que quieras. Todo en una sola rutina. Cuando lo tengas, di listo onboarding.';

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt('Cuando acabes, di listo onboarding.')
            .getResponse();
    }
};

const OnboardingListoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'OnboardingListoIntent';
    },
    async handle(handlerInput) {
        await markOnboardingDone(handlerInput);

        return handlerInput.responseBuilder
            .speak('Genial. Onboarding completado. Desde ahora puedes pedirme la hora en natural o en preciso. Si quieres, prueba diciendo qué hora es.')
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
        const speechOutput = 'Puedo decirte la hora de forma natural o precisa. Di: qué hora es. También puedes decir: onboarding rápido, configura la aplicación, describe hora natural, describe hora precisa, o ayuda con rutina.';

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

const skillBuilder = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HoraActualIntentHandler,
        RecomendarSkillIntentHandler,
        QuejaHoraIntentHandler,
        ConfigurarSkillIntentHandler,
        ActivarModoNaturalIntentHandler,
        ActivarModoPrecisoIntentHandler,
        DescribirModoNaturalIntentHandler,
        DescribirModoPrecisoIntentHandler,
        ConfigurarRutinaIntentHandler,
        OnboardingRapidoIntentHandler,
        OnboardingListoIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler
    )
    .addErrorHandlers(ErrorHandler)
    .withApiClient(new Alexa.DefaultApiClient())
    .withCustomUserAgent('dime-la-hora/v1.0');

if (HAS_PERSISTENCE) {
    skillBuilder.withPersistenceAdapter(
        new ddbAdapter.DynamoDbPersistenceAdapter({
            tableName: PERSISTENCE_TABLE,
            createTable: true
        })
    );
}

exports.handler = skillBuilder.lambda();
