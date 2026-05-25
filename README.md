# Dime la Hora

Skill Alexa en castellano que dice la hora de forma natural, como se habla en España.

## Para usuarios

Si ya tienes la skill instalada:
- Di: **"Alexa, abre dime la hora"** para que te diga la hora.
- Di: **"onboarding rápido"** si es tu primera vez y quieres configurar rutinas.
- Di: **"ayuda con rutina"** para crear una rutina que lancé la skill con comandos como "dime la hora".

Más detalles en los ejemplos de uso al final.

## Para developers

Este repositorio contiene una skill Alexa custom en formato Alexa-hosted, lista para importar desde GitHub en la consola de Amazon.

### Estructura del proyecto

```
.
├── lambda/
│   ├── index.js                    # Handler principal de la skill
│   ├── package.json                # Dependencias (ask-sdk-core)
│   ├── natural/                    # Formatter de hora natural (bloques de 5 min)
│   ├── preciso/                    # Formatter de hora precisa (minutos exactos)
│   ├── shared/                     # Utilities compartidas (timezone, formato base)
│   └── *.test.js                   # Suites de tests (34 casos de cobertura)
└── skill-package/
    ├── skill.json                  # Manifest y metadata de la skill
    └── interactionModels/
        └── custom/
            └── es-ES.json          # Modelo de interacción (intents, utterances)
```

### Requisitos de importación

- Repositorio público en GitHub.
- Backend: Node.js o Python.
- Archivos requeridos:
  - `lambda/index.js` (handler)
  - `skill-package/skill.json` (manifest)
  - `skill-package/interactionModels/custom/es-ES.json` (modelo)

### Deployment en Alexa-hosted

1. En la **Alexa Developer Console** (https://developer.amazon.com/alexa/console/ask).
2. Crear skill nueva → Modelo: **Custom** → Hosting: **Alexa-Hosted (Node.js)**.
3. Pulsar **Import Skill**.
4. Pegar URL `.git` de tu repo público.
5. Esperar a que se construya e importe (2-3 minutos).
6. Usar idioma: **Spanish (ES)**.

### Desarrollo local

**Tests:**
```bash
cd lambda
npm install
npm test  # Ejecuta 34 tests de cobertura
```

**Validación:**
```bash
npm run check  # Verifica que el handler carga correctamente
```

### Arquitectura

**Modos de hora:**
- **Natural** (por defecto): "Son casi las doce", "Son las doce y cinco", "Son las doce menos cuarto".
- **Preciso**: "Son las once y cincuenta y dos minutos de la mañana".

**Configuración:**
- Detecta la zona horaria del dispositivo vía UPS Service Client (fallback: Europe/Madrid).
- Almacena preferencia de modo por usuario en DynamoDB (Alexa-hosted) o sesión (local).
- Marca onboarding completado para evitar repetir guía.

**Intents implementados:**
- `HoraActualIntent`: Decir la hora.
- `ActivarModoNaturalIntent`, `ActivarModoPrecisoIntent`: Cambiar modo.
- `DescribirModoNaturalIntent`, `DescribirModoPrecisoIntent`: Explicar modos.
- `ConfigurarSkillIntent`, `ConfigurarRutinaIntent`: Pedir ayuda de configuración.
- `OnboardingRapidoIntent`, `OnboardingListoIntent`: Flujo de onboarding guiado.
- `RecomendarSkillIntent`, `QuejaHoraIntent`: Respuestas contextuales.

### Customización

- **Invocation name**: `skill-package/interactionModels/custom/es-ES.json` (línea `invocationName`).
- **Textos de respuesta**: `lambda/index.js` (handlers, `speechOutput`).
- **Reglas de formato**: `lambda/natural/timeFormatter.js` y `lambda/preciso/timeFormatter.js`.
- **Zona horaria por defecto**: `lambda/shared/timeCore.js` (`resolveFallbackTimeZone`).

### Ejemplos de uso

**Invocar y pedir hora:**
- "Alexa, abre dime la hora"
- "Alexa, pregunta a dime la hora qué hora es"
- "Alexa, dile a dime la hora que me diga la hora"

**Cambiar modo:**
- "Alexa, dile a dime la hora que active modo preciso"
- "Alexa, dile a dime la hora que active modo natural"

**Describir modos:**
- "Alexa, dile a dime la hora que describe la hora natural"
- "Alexa, dile a dime la hora que describe la hora precisa"

**Onboarding y rutinas:**
- "Alexa, abre dime la hora" → "onboarding rápido"
- "Alexa, dile a dime la hora que ayuda con rutina"
- "Alexa, dile a dime la hora que configura la aplicación"

### Tests y calidad

La suite cubre:
- Transiciones de minuto (comportamiento por bloques de 5 min).
- Fronteras de parte del día (madrugada, mañana, mediodía, tarde, noche).
- Casos exactos (y cuarto, y media, menos cuarto).
- Restricciones de modo natural (sin parte del día repetida innecesariamente).

Ejecuta `npm test` para verificar:
```
✔ 34 tests passed
```

### Limitaciones conocidas

- Una skill custom no puede interceptar globalmente frases como "Alexa, qué hora es" (eso lo resuelve Alexa nativa).
- Las skills no tienen API para crear rutinas automáticamente; se recomienda usar rutinas manuales en Alexa+.
- Persistencia de preferencias requiere DynamoDB en entorno Alexa-hosted.

### Licencia

MIT (o ajusta según tus necesidades).

