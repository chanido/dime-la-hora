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
- Dice la hora en castellano natural, con formulas como `y cuarto`, `y media` y `menos cuarto`
- Ajusta la franja del dia con expresiones como `de la mañana`, `de la tarde` o `de la noche`

## Personalizacion rapida

- Invocation name: `skill-package/interactionModels/custom/es-ES.json`
- Textos del backend: `lambda/index.js`
- Zona horaria: la skill usa la configurada en el dispositivo desde el que se invoca
- Fallback: si Alexa no devuelve la zona horaria del dispositivo, cae a `TIME_ZONE` o `Europe/Madrid`
- Reglas de lenguaje natural: `lambda/timeFormatter.js`

## Pruebas locales

```bash
cd lambda
npm install
npm test
```

Los tests cubren casos representativos de habla natural en España, incluyendo `y cuarto`, `y media`, `menos veinte`, `menos cuarto`, mediodia y cambios de franja del dia.

## Ejemplos de uso

- "Alexa, abre hora en castellano"
- "Alexa, pregunta a hora en castellano qué hora es"
- "Alexa, dile a hora en castellano que me diga la hora bien"
