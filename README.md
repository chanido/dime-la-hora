# Hora Natural en Castellano

Skill Alexa en castellano para escuchar la hora como la diríamos en España.

## Para usuarios

Si ya tienes la skill instalada:
- Di: **"Alexa, abre hora natural"** para que te diga la hora.
- Di: **"configuración rápida"** si es tu primera vez y quieres que te diga qué pedirle a Alexa+ para crear la rutina por voz.
- Di: **"ayuda con rutina"** si quieres la frase corta para crear la rutina o rematarla en la app.

Más detalles en los ejemplos de uso al final.

## Para desarrolladores

Este repositorio contiene una skill Alexa custom en formato Alexa-hosted, lista para importarse desde GitHub en la consola de Amazon.

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

### Importación en Alexa-hosted

1. En la **Alexa Developer Console** (https://developer.amazon.com/alexa/console/ask).
2. Crear skill nueva → Modelo: **Custom** → Hosting: **Alexa-Hosted (Node.js)**.
3. Pulsar **Import Skill**.
4. Pegar URL `.git` de tu repo público.
5. Esperar a que se construya e importe (2-3 minutos).
6. Usar idioma: **Spanish (ES)**.

### Desarrollo local

**Pruebas:**
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

### Personalización

- **Invocation name**: `skill-package/interactionModels/custom/es-ES.json` (línea `invocationName`).
- **Textos de respuesta**: `lambda/index.js` (handlers, `speechOutput`).
- **Reglas de formato**: `lambda/natural/timeFormatter.js` y `lambda/preciso/timeFormatter.js`.
- **Zona horaria por defecto**: `lambda/shared/timeCore.js` (`resolveFallbackTimeZone`).

### Ejemplos de uso

**Invocar y pedir hora:**
- "Alexa, abre hora natural"
- "Alexa, pregunta a hora natural qué hora es"
- "Alexa, dile a hora natural que me diga la hora"

**Cambiar modo:**
- "Alexa, dile a hora natural que ponga el modo preciso"
- "Alexa, dile a hora natural que ponga el modo natural"

**Describir modos:**
- "Alexa, dile a hora natural cómo suena el modo natural"
- "Alexa, dile a hora natural cómo suena el modo preciso"

**Onboarding y rutinas:**
- "Alexa, abre hora natural" → "configuración rápida"
- "Alexa, dile a hora natural ayuda con rutina"
- "Alexa, dile a hora natural que configura la aplicación"
- Fuera de la skill, prueba: "Alexa, crea una rutina. Cuando diga dime la hora, abre Hora Natural en Castellano"

### Pruebas y calidad

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
- La skill no puede crear rutinas por API ni ordenarle a Alexa+ que las cree por sí sola; el usuario tiene que pedírselo a Alexa+ o terminarlo en la app.
- Persistencia de preferencias requiere DynamoDB en entorno Alexa-hosted.

### Licencia

MIT (o ajusta según tus necesidades).

