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

## Personalizacion rapida

- Invocation name: `skill-package/interactionModels/custom/es-ES.json`
- Textos del backend: `lambda/index.js`
- Zona horaria: variable de entorno `TIME_ZONE`, por defecto `Europe/Madrid`
- Etiqueta hablada de la zona horaria: variable de entorno `TIME_ZONE_LABEL`, por defecto `España peninsular`

## Pruebas locales

```bash
cd lambda
npm install
npm test
```

## Ejemplos de uso

- "Alexa, abre hora castellana"
- "Alexa, pregunta a hora castellana que hora es"
- "Alexa, dile a hora castellana que me diga la hora"
