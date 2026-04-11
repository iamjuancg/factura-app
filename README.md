# Generador de Facturas — GitHub Pages

App React 100% estática (sin backend). El PDF se genera directamente en el navegador con jsPDF.

## Instalación local

```bash
npm install
npm start
```

Abre http://localhost:3000

---

## Desplegar en GitHub Pages (paso a paso)

### 1. Crear el repositorio en GitHub

Ve a https://github.com/new y crea un repositorio llamado `factura-app` (público).

### 2. Sube el código

```bash
git init
git add .
git commit -m "primer commit"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/factura-app.git
git push -u origin main
```

### 3. Edita la homepage en package.json

Abre `package.json` y cambia esta línea con tu usuario real de GitHub:

```json
"homepage": "https://TU_USUARIO.github.io/factura-app"
```

Guarda y vuelve a hacer commit:

```bash
git add package.json
git commit -m "ajustar homepage"
git push
```

### 4. Despliega

```bash
npm run deploy
```

Esto construye la app y la publica en la rama `gh-pages` automáticamente.

### 5. Activa GitHub Pages

- Ve a tu repositorio en GitHub
- Entra en **Settings → Pages**
- En "Branch" selecciona `gh-pages` y carpeta `/ (root)`
- Guarda

En 1-2 minutos la app estará en:
**https://TU_USUARIO.github.io/factura-app**

---

## Actualizar la app

Cada vez que hagas cambios, basta con:

```bash
git add .
git commit -m "descripción del cambio"
git push
npm run deploy
```

---

## Estructura

```
src/
├── App.jsx                       # Layout principal y tabs
├── index.js / index.css          # Entrada y estilos globales
├── pdf.js                        # Generación PDF con jsPDF (sin servidor)
└── components/
    ├── Field.jsx                 # Componente de campo reutilizable
    ├── styles.js                 # Estilos compartidos
    ├── FacturaAutonomo.jsx       # Formulario autónomo → sociedad
    └── FacturaSociedad.jsx       # Formulario sociedad → cliente
```
# factura-app
