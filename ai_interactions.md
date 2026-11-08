# Registro de Uso de Herramientas de Inteligencia Artificial

En cumplimiento con la sección de transparencia del desafío técnico, este documento detalla qué herramientas de IA se utilizaron, cómo se combinaron con código base propio de proyectos anteriores y qué decisiones de arquitectura, seguridad y UX fueron definidas y validadas manualmente.

---

## 1. Herramientas y Base Propia Utilizadas

- **Código y Templates Reciclados de Proyecto Bancario Propio:** Se entregó como contexto de referencia la arquitectura y componentes base de una plataforma productiva desarrollada previamente para un banco en Chile. De esa base propia se reciclaron y adaptaron:
  - El sistema de diseño en **Mantine v8** (`theme.ts`, paleta de colores corporativa, tipografía `Montserrat`), el layout principal (`Shell.tsx`, `ColorSchemeToggle.tsx`) y el patrón de contexto de sesión (`AuthContext` / `AuthProvider`) junto con la configuración del cliente `axios`.
  - La convención de arquitectura en capas del backend (`routers/`, `services/`, `middlewares/`, `models/`, `config/settings` y manejo centralizado en `exceptionHandler`).
- **Cursor IDE (Agente de código asistido por LLM):** Utilizado como asistente de par-programación para adaptar dichos templates propios al dominio de este desafío (Node.js/Express + Vite SPA), agilizar el scaffolding del monorepo y redactar la suite de pruebas automatizadas con `vitest` y `supertest`.

---

## 2. Desglose de Apoyo por Módulo

| Módulo / Archivo | Contribución del Asistente de IA | Código Propio Reciclado, Revisión y Criterio Técnico |
|---|---|---|
| **Configuración Monorepo** (`package.json`, `tsconfig.json`, `vite.config.ts`) | Generación de scripts de workspaces con `concurrently` y configuración de proxy en Vite (`/api` → `http://localhost:4000`). | Estructuración del repositorio para que el evaluador pueda ejecutar `npm install && npm run dev` desde la raíz en un solo paso. |
| **Utilidades de RUT Chileno** (`backend/src/utils/rut.ts`, `frontend/src/utils/rut.ts`) | Adaptación de funciones de limpieza, formateo con puntos/guion y cálculo de dígito verificador Módulo 11. | Diseño del auto-formateador inteligente en el login (`smartFormatRutOrIdentifier`) para formatear entradas numéricas como RUT sin revelar en la UI pública que los administradores pueden autenticarse con identificador interno. |
| **Autenticación y Seguridad** (`backend/src/services/auth.ts`, `backend/src/middlewares/`) | Adaptación de `AuthService`, middlewares `authenticateJwt` / `authorizeRutAccess` y manejador centralizado de excepciones a Express. | Patrón de autenticación/autorización reciclado de proyecto bancario previo, más endurecimiento de seguridad: uso de `crypto.scrypt` asíncrono no bloqueante, comparación en tiempo constante (`crypto.timingSafeEqual`), hash señuelo contra enumeración de usuarios, cabeceras OWASP y resolución de CVEs en `npm audit`. |
| **Algoritmo Determinista de Score** (`backend/src/services/score.ts`) | Función de cálculo determinista basada en `SHA-256` (`uint32 % 101`) e ISO timestamp UTC. | Decisión de normalizar el RUT al formato canónico antes de aplicar el hash y antes de comparar permisos en el middleware RBAC, garantizando que `12.345.678-9` y `12345678-9` produzcan el mismo resultado y no generen falsos rechazos `403`. |
| **Interfaz SPA (React + Mantine v8)** (`frontend/src/components/`, `theme.ts`) | Adaptación de las vistas `LoginView` y `ScoreConsultationView` sobre el `Shell` y `theme` base. | Reutilización directa del `Shell`, `AuthProvider`, `ColorSchemeToggle` y `theme` del proyecto bancario anterior, más iteración manual sobre la jerarquía visual, contraste de hover diferenciado entre tema claro y oscuro (`variantColorResolver`), tarjetas clicables unificadas, tooltips contextuales y formato legible de fecha en UI (`DD/MM/YYYY - HH:mm:ss`). |
| **Suite de Tests** (`backend/src/tests/`) | Generación de casos de prueba con `vitest` y `supertest`. | Definición de los escenarios críticos a cubrir: omisión estricta del campo `rut` en tokens de rol `admin`, inclusión en rol `user`, rechazo `401` (sin token, expirado, firma inválida), rechazo `403` al consultar RUT de terceros con rol `user`, y determinismo del score. |
