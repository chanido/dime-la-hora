const AWS = require('aws-sdk');
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
const PERSISTENCE_TABLE = process.env.DYNAMODB_PERSISTENCE_TABLE_NAME;
const PERSISTENCE_REGION = process.env.DYNAMODB_PERSISTENCE_REGION || process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
const HAS_PERSISTENCE = Boolean(PERSISTENCE_TABLE && PERSISTENCE_REGION);
const SKILL_NAME = 'Hora Natural en Castellano';

const MODE_DESCRIPTION_NATURAL = 'La hora natural redondea los minutos para sonar como la diríamos en España. Por ejemplo: Son casi las doce.';
const MODE_DESCRIPTION_PRECISE = 'La hora precisa dice los minutos exactos y el momento del día. Por ejemplo: Son las doce menos un minuto de la mañana.';
const ROUTINE_VOICE_SETUP_EXAMPLE = `Alexa, crea una rutina. Cuando diga dime la hora, abre ${SKILL_NAME}.`;
const ROUTINE_VOICE_SETUP_FALLBACK = 'Si quieres, añade también la frase dime la hora bien. Si hace falta, termina de ajustar esa misma rutina en la app Alexa.';

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
            const speechOutput = `Bienvenido a ${SKILL_NAME}. Si quieres dejarlo listo para usar con una rutina, di configuración rápida y te explico cómo crearla con Alexa+.`;
            return handlerInput.responseBuilder
                .speak(speechOutput)
                .reprompt('Di configuración rápida y te lo explico en menos de un minuto.')
                .getResponse();
        }

        const mode = await getUserMode(handlerInput);
        const speechOutput = `<speak>Bienvenido a ${SKILL_NAME}. Ahora mismo tienes activado el modo ${getModeLabel(mode)}. ${await buildTimeSpeech(handlerInput)}</speak>`;

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
        const speechOutput = `Sí: ${SKILL_NAME}. Si quieres, te explico cómo dejarla en modo natural o en modo preciso.`;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt('Puedes decir: pon modo preciso, pon modo natural o ayuda con rutina.')
            .getResponse();
    }
};

const QuejaHoraIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'QuejaHoraIntent';
    },
    handle(handlerInput) {
        const speechOutput = 'Perdona. Puedo decirte la hora en modo natural o en modo preciso. Di: pon modo natural o pon modo preciso.';

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt('Di: pon modo natural o pon modo preciso.')
            .getResponse();
    }
};

const ConfigurarSkillIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ConfigurarSkillIntent';
    },
    handle(handlerInput) {
        const speechOutput = 'Puedo decir la hora de dos maneras: natural y precisa. Puedes decir: cómo suena el modo natural, cómo suena el modo preciso, pon modo natural o pon modo preciso.';

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt('Di: pon modo natural o pon modo preciso.')
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
        const speechOutput = `Hecho. A partir de ahora te la diré en modo natural. ${MODE_DESCRIPTION_NATURAL}`;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt('Si quieres probarlo, di: qué hora es.')
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
        const speechOutput = `Hecho. A partir de ahora te la diré en modo preciso. ${MODE_DESCRIPTION_PRECISE}`;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt('Si quieres probarlo, di: qué hora es.')
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
            .reprompt('Si quieres activarlo, di: pon modo natural.')
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
            .reprompt('Si quieres activarlo, di: pon modo preciso.')
            .getResponse();
    }
};

const ConfigurarRutinaIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ConfigurarRutinaIntent';
    },
    handle(handlerInput) {
        const speechOutput = `Lo más cómodo con Alexa+ es pedírselo por voz. Prueba con esta frase: ${ROUTINE_VOICE_SETUP_EXAMPLE} ${ROUTINE_VOICE_SETUP_FALLBACK}`;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt('Si quieres la guía rápida, di: configuración rápida.')
            .getResponse();
    }
};

const OnboardingRapidoIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'OnboardingRapidoIntent';
    },
    handle(handlerInput) {
        const speechOutput = `Muy fácil. Sal de la skill y di: ${ROUTINE_VOICE_SETUP_EXAMPLE} ${ROUTINE_VOICE_SETUP_FALLBACK} Cuando lo tengas, di: ya lo tengo.`;

        return handlerInput.responseBuilder
            .speak(speechOutput)
            .reprompt('Cuando lo tengas listo, di: ya lo tengo.')
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
            .speak('Perfecto. Ya lo tienes listo. A partir de ahora puedes pedirme la hora en modo natural o en modo preciso. Si quieres probarlo, di: qué hora es.')
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
        const speechOutput = 'Puedo decirte la hora en modo natural o preciso y ayudarte a dejar lista la rutina con Alexa+. Puedes decir: qué hora es, pon modo natural, pon modo preciso, cómo suena el modo natural, cómo suena el modo preciso, configuración rápida o ayuda con rutina.';

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
        const speechOutput = 'No te he entendido. Puedes decir: qué hora es, pon modo preciso o ayuda con rutina.';

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
            .speak('Ha habido un problema al decirte la hora. Inténtalo otra vez.')
            .reprompt('Puedes decir: qué hora es.')
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
            createTable: false,
            dynamoDBClient: new AWS.DynamoDB({
                apiVersion: 'latest',
                region: PERSISTENCE_REGION
            })
        })
    );
}

exports.handler = skillBuilder.lambda();
