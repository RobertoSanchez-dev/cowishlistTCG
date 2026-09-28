# Lista TCG para el evento

## Estructura
- `index.html`: la app.
- `netlify/functions/sync.mjs`: guarda la lista compartida en Netlify Blobs (`/api/sync`).
- `package.json` y `netlify.toml`: configuración para Netlify.

## Desplegar (opción A, con GitHub)
1. Sube esta carpeta a un repositorio de GitHub.
2. En app.netlify.com: Add new site → Import an existing project → elige el repo.
3. Deja la configuración por defecto (la lee de netlify.toml) y despliega.

## Desplegar (opción B, desde el ordenador)
```
npm install
npx netlify-cli login
npx netlify-cli deploy --prod
```

Nota: arrastrar la carpeta a Netlify Drop sube la web pero no la función,
así que la sincronización no funcionaría.

## Uso compartido
1. En un móvil: Ajustes → Crear lista compartida.
2. En el otro: Ajustes → escribir el mismo código → Unirme.
Las listas que ya tuvierais cada uno se juntan.
