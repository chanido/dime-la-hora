# Dime la Hora

Skill custom de Alexa en castellano para decir la hora actual.

La estructura del proyecto sigue el formato que Amazon acepta para importar una skill Alexa-hosted desde un repositorio publico de GitHub.

## Estructura

- `lambda/`: backend Node.js con el handler `index.js`
- `skill-package/`: manifest de la skill y modelo de interaccion

## Requisitos de importacion en Amazon

- El repositorio debe ser publico.
- El backend debe ser Node.js o Python.
- El handler debe llamarse `index.js` para Node.js.
- El repo debe incluir `skill-package/skill.json` y `skill-package/interactionModels/custom/<locale>.json`.

## Publicar en GitHub

Desde esta carpeta:

```bash
git init
git add .
git commit -m "Initial Alexa skill"
gh repo create dime-la-hora --public --source=. --remote=origin --push
```

Si prefieres crear el repo manualmente en GitHub, crea un repositorio publico vacio y luego ejecuta:

```bash
git init
git add .
git commit -m "Initial Alexa skill"
git remote add origin https://github.com/TU_USUARIO/dime-la-hora.git
git push -u origin main
```

## Importar en la consola de Alexa

1. Entra en la Alexa Developer Console.
2. Crea una skill nueva.
3. Elige `Custom` como modelo.
4. Elige `Alexa-Hosted (Node.js)` como hosting.
5. Pulsa `Import Skill`.
6. Pega la URL `.git` del repo publico.
7. Usa `Spanish (ES)` como idioma por defecto.

## Comportamiento actual

- Usa la zona horaria del dispositivo desde el que se invoca
- Modo por defecto: `natural` (redondea por bloques de 5 minutos con formulas como `casi` y `pasadas`)
- Modo opcional: `preciso` (dice los minutos exactos y la parte del dia)
- Puedes cambiar de modo por voz con: `activa modo natural` o `activa modo preciso`
- Puedes pedir descripcion por voz con: `describe la hora natural` o `describe la hora precisa`
- El modo queda guardado por usuario cuando hay persistencia de Alexa-hosted (DynamoDB); en local sin AWS se mantiene por sesion

Importante: una skill custom no puede interceptar de forma global frases como `Alexa, que hora es` si no se invoca la skill. Para esos casos hay que usar la forma con invocacion, por ejemplo: `Alexa, pregunta a dime la hora que hora es`.

## Uso con rutinas (recomendado)

Puedes lograr una experiencia casi global con dos rutinas en la app Alexa:

1. Frase: `dime la hora` -> accion: abrir skill `Dime la Hora`
2. Frase: `dime la hora bien` -> accion: abrir skill `Dime la Hora`

La skill puede guiar estos pasos si dices: `ayuda con rutina`.

## Onboarding por voz

En el primer arranque, la skill propone configuracion guiada.

- Di: `onboarding rapido` para oir los pasos cortos
- Cuando termines, di: `listo onboarding`

Esto marca el onboarding como completado y deja la experiencia normal de uso para las siguientes aperturas.

Nota: las skills custom no pueden crear rutinas automaticamente por API ni sustituir la respuesta nativa de Alexa para `que hora es`.

## Personalizacion rapida

- Invocation name: `skill-package/interactionModels/custom/es-ES.json`
- Textos del backend: `lambda/index.js`
- Zona horaria: la skill usa la configurada en el dispositivo desde el que se invoca
- Fallback: si Alexa no devuelve la zona horaria del dispositivo, cae a `TIME_ZONE` o `Europe/Madrid`
- Reglas de lenguaje natural activas: `lambda/natural/timeFormatter.js`
- Variante exacta anterior: `lambda/preciso/timeFormatter.js`

## Pruebas locales

```bash
cd lambda
npm install
npm test
```

Los tests cubren casos representativos de habla natural en España, incluyendo transiciones por bloques de 5 minutos, uso de `casi`/`pasadas` y casos exactos como `y cuarto`, `y media` y `menos cuarto`.

## Ejemplos de uso

- "Alexa, abre dime la hora"
- "Alexa, pregunta a dime la hora qué hora es"
- "Alexa, dile a dime la hora que configure la aplicación"
- "Alexa, dile a dime la hora que active modo preciso"
- "Alexa, dile a dime la hora que describe la hora natural"
