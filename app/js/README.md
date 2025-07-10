# Estructura Modular de JavaScript

## 📁 Organización de Archivos

```
app/js/
├── app.js                    # Archivo principal de la aplicación
├── components/               # Componentes Preact
│   ├── Header.js            # Componente del header usando Preact
│   └── Footer.js            # Componente del footer usando Preact
└── utils/                   # Utilidades
    ├── fetch-utils.js       # Utilidades de fetch
    └── general-utils.js     # Utilidades generales
```

## 🚀 Características

### **Modularidad**

- **Componentes Preact**: Componentes modernos y eficientes
- **Utilidades organizadas**: Funciones reutilizables agrupadas por propósito
- **Imports/Exports ES6**: Uso de módulos modernos de JavaScript

### **Rendimiento**

- **Renderizado directo**: Sin fetch, componentes se renderizan instantáneamente
- **Preact local**: Framework ligero (3KB) cargado localmente para mejor rendimiento
- **Sin dependencias externas**: Funciona offline

## 📦 Componentes

### **Header Component** (`components/header.js`)

```javascript
export const Header = ({ currentPage = '' }) => { ... };
export const renderHeader = (containerId, currentPage) => { ... };
```

### **Footer Component** (`components/footer.js`)

```javascript
export const Footer = () => { ... };
export const renderFooter = (containerId) => { ... };
```

## 🛠️ Utilidades

### **Fetch Utils** (`utils/fetch-utils.js`)

- `fetchWithTimeout()`: Fetch con timeout configurable
- `retryFetch()`: Fetch con reintentos automáticos

### **General Utils** (`utils/general-utils.js`)

- `getCurrentPage()`: Obtener página actual
- `debounce()`: Función debounce
- `throttle()`: Función throttle

## 🔧 Uso

### **Importación en app.js**

```javascript
import { renderHeader } from "./components/header.js";
import { renderFooter } from "./components/footer.js";
import { retryFetch } from "./utils/fetch-utils.js";
import { getCurrentPage, throttle } from "./utils/general-utils.js";
```

### **Renderizado de Componentes**

```javascript
// Renderizar header con página actual
renderHeader("header-component", getCurrentPage());

// Renderizar footer
renderFooter("footer-component");
```

## 🐛 Debugging

En desarrollo, usa la consola del navegador:

```javascript
// Ver configuración
window.debugApp.getConfig();

// Ver componentes cargados
window.debugApp.getLoadedComponents();

// Recargar componentes
window.debugApp.reloadComponents();
```

## 🔄 Flujo de Carga

1. **Carga de Preact**: Local en todas las páginas para mejor rendimiento
2. **Renderizado directo**: Componentes se renderizan instantáneamente
3. **Configuración**: Navegación, eventos, etc. se configuran automáticamente

## 📝 Agregar Nuevos Componentes

1. **Crear archivo**: `components/NuevoComponente.js`
2. **Usar Preact**: `const { h, render } = window.preact;`
3. **Exportar componente**: `export const NuevoComponente = () => { ... };`
4. **Exportar función de render**: `export const renderNuevoComponente = (containerId) => { ... };`
5. **Usar en app.js**: Importar y usar en ComponentManager

## ⚡ Beneficios

✅ **Mantenibilidad**: Código organizado y fácil de mantener
✅ **Reutilización**: Componentes independientes y reutilizables
✅ **Performance**: Renderizado instantáneo sin fetch
✅ **Escalabilidad**: Fácil agregar nuevos componentes
✅ **Debugging**: Herramientas integradas para desarrollo
✅ **Moderno**: Uso de Preact para componentes eficientes
✅ **Optimizado**: Preact cargado localmente para mejor rendimiento
