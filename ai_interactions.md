# Registro de Uso de Herramientas de Inteligencia Artificial

En cumplimiento con la sección de transparencia del desafío técnico, este documento detalla qué herramientas de IA se utilizaron, en qué partes del proyecto apoyaron y qué decisiones de arquitectura, seguridad y UX fueron definidas y validadas manualmente.

---

## 1. Herramientas Utilizadas

- **Cursor IDE (Agente de código asistido por LLM):** Utilizado como asistente de par-programación para el scaffolding inicial del monorepo, generación de código repetitivo (boilerplate de configuración TypeScript/Vite/Mantine) y redacción de pruebas automatizadas con `vitest` y `supertest`.

---

## 2. Desglose de Apoyo por Módulo

| Módulo / Archivo | Contribución del Asistente de IA | Intervención, Revisión y Criterio Técnico Propio |
|---|---|---|
| **Configuración Monorepo** (`package.json`, `tsconfig.json`, `vite.config.ts`) | Generación de scripts de workspaces con `concurrently` y configuración de proxy en Vite (`/api` → `http://localhost:4000`). | Estructuración del repositorio para que el evaluador pueda ejecutar `npm install && npm run dev` desde la raíz en un solo paso. |
| **Utilidades de RUT Chileno** (`backend/src/utils/rut.ts`, `frontend/src/utils/rut.ts`) | Implementación base de funciones de limpieza, formateo con puntos/guion y dígito verificador Módulo 11. | Diseño del auto-formateador inteligente en el login (`smartFormatRutOrIdentifier`) para formatear entradas numéricas como RUT sin revelar en la UI pública que los administradores pueden autenticarse con identificador interno. |
| **Autenticación y Seguridad** (`backend/src/services/auth.ts`, `backend/src/middlewares/`) | Estructura inicial de `AuthService`, middlewares `authenticateJwt` / `authorizeRutAccess` y manejador centralizado de excepciones. | Revisión de seguridad: reemplazo de `scryptSync` por `crypto.scrypt` asíncrono (evitando bloquear el Event Loop de Node.js en peticiones concurrentes), comparación en tiempo constante (`crypto.timingSafeEqual`), hash señuelo contra enumeración de usuarios, cabeceras OWASP y resolución de CVEs en `npm audit`. |
| **Algoritmo Determinista de Score** (`backend/src/services/score.ts`) | Función de cálculo determinista basada en `SHA-256` (`uint32 % 101`) e ISO timestamp UTC. | Decisión de normalizar el RUT antes de aplicar el hash y antes de comparar permisos en el middleware RBAC, garantizando que `12.345.678-9` y `12345678-9` produzcan el mismo resultado y no generen falsos rechazos `403`. |
| **Interfaz SPA (React + Mantine v8)** (`frontend/src/components/`) | Maquetación inicial de `Shell`, `LoginView` y `ScoreConsultationView` usando Mantine v8 y `lucide-react`. | Iteración manual sobre la jerarquía visual, contraste de hover diferenciado entre tema claro y oscuro (`variantColorResolver`), tarjetas clicables unificadas entre login y consulta, tooltips contextuales, formato legible de fecha en UI (`DD/MM/YYYY - HH:mm:ss`) y tipografía `Montserrat` en el encabezado. |
| **Suite de Tests** (`backend/src/tests/`) | Generación de casos de prueba con `vitest` y `supertest`. | Definición de los escenarios críticos a cubrir: omisión estricta del campo `rut` en tokens de rol `admin`, inclusión en rol `user`, rechazo `401` (sin token, expirado, firma inválida), rechazo `403` al consultar RUT de terceros con rol `user`, y determinismo del score. |
