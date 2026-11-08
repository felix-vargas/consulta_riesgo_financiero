# Consulta de Riesgo Financiero (Score Financiero)

MVP full-stack para la evaluación determinista de score crediticio de personas y empresas chilenas según su RUT, con autenticación **JWT** y control de acceso basado en roles (**RBAC + pertenencia de recurso**).

---

## Arquitectura y Stack Tecnológico

El proyecto está organizado como un **monorepo con npm workspaces** (`backend` y `frontend`) para permitir instalar dependencias y levantar toda la solución con un único comando desde la raíz.

### Backend (`/backend`)
- **Runtime y Lenguaje:** Node.js + TypeScript estricto (`ES2022`, `NodeNext`).
- **Framework Web:** Express.js con separación en capas (`routers`, `services`, `middlewares`, `models`, `utils`, `config`).
- **Seguridad y Autenticación:**
  - `jsonwebtoken` (`HS256` explícito con validación de `iss`, `aud` y `exp`).
  - Hashing asíncrono no bloqueante con `crypto.scrypt` + comparación en tiempo constante (`crypto.timingSafeEqual`) y evaluación contra hash señuelo (`DUMMY_PASSWORD_HASH`) para mitigar enumeración de usuarios por *timing attacks*.
  - Cabeceras HTTP de seguridad OWASP (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Content-Security-Policy`, `Cache-Control: no-store`) y *rate limiting* en `/login`.
- **Validación:** `zod` (esquemas estrictos y cotas de longitud) + validador/normalizador de RUT chileno.
- **Testing:** `vitest` + `supertest` (13 pruebas unitarias y de integración HTTP).

### Frontend (`/frontend`)
- **Framework:** React 18 + TypeScript + Vite.
- **UI y Componentes:** Mantine v8 (`@mantine/core`, `@mantine/form`, `@mantine/hooks`) + `lucide-react`, con soporte nativo para tema claro y oscuro.
- **Cliente HTTP:** `axios` con manejo tipado de estados de error (`400`, `401`, `403`, `429`).

---

## Requisitos Previos

- **Node.js** `>= 20.x`
- **npm** `>= 10.x`

---

## Instalación y Ejecución en Local

1. **Instalar dependencias (raíz, backend y frontend):**
   ```bash
   npm install
   ```

2. **(Opcional) Variables de entorno del Backend:**
   El backend cuenta con valores por defecto seguros para ejecución local inmediata, pero puedes copiar el archivo de ejemplo si deseas personalizarlos:
   ```bash
   cp backend/.env.example backend/.env
   ```

3. **Iniciar Backend y Frontend simultáneamente en modo desarrollo:**
   ```bash
   npm run dev
   ```
   - **Frontend SPA:** `http://localhost:5173`
   - **Backend API REST:** `http://localhost:4000` (también accesible vía proxy en `http://localhost:5173/api`)

4. **Ejecutar pruebas automatizadas y compilación de producción:**
   ```bash
   npm test
   npm run build
   ```

---

## Ejecución con Docker (Contenedores Aislados)

Para mayor portabilidad y seguridad (imágenes *multi-stage* corriendo con usuarios sin privilegios `node` y `nginxinc/nginx-unprivileged`, healthchecks y reverse proxy Nginx integrado), puedes levantar toda la plataforma con Docker Compose:

```bash
docker compose up --build
```
*(O mediante el script de conveniencia `npm run docker:up`)*

- **Frontend SPA (Nginx unprivileged):** `http://localhost:5173`
- **Backend API REST (Node.js 22 Alpine):** `http://localhost:4000`
- Para detener los contenedores: `docker compose down` (o `npm run docker:down`).

---

## Credenciales Mock de Prueba

La interfaz de inicio de sesión incluye tarjetas de carga rápida para probar inmediatamente los distintos roles y reglas de autorización:

| Perfil | Rol | Identificador Login (`username` / RUT) | Contraseña | RUT en Payload JWT | Alcance de Consulta (`GET /score/:rut`) |
|---|---|---|---|---|---|
| **Ejecutivo** | `admin` | `admin` | `AdminPassword123!` | *(Omitido según especificación)* | Puede consultar **cualquier RUT** (`200 OK`) |
| **Juan Pérez** | `user` | `12.345.678-9` (o `usuario`) | `UserPassword123!` | `12.345.678-9` | Solo puede consultar `12.345.678-9` (otros RUTs retornan `403 Forbidden`) |
| **Comercial Pepito SpA** | `user` | `76.543.210-3` (o `empresa`) | `EmpresaPassword123!` | `76.543.210-3` | Solo puede consultar `76.543.210-3` (otros RUTs retornan `403 Forbidden`) |

---

## Especificación de Endpoints

### 1. `POST /login`
Autentica credenciales mock y retorna un token JWT firmado.

- **Request Body:**
  ```json
  {
    "username": "12.345.678-9",
    "password": "UserPassword123!"
  }
  ```
- **Claims del Payload JWT:**
  - `sub`: ID único del usuario (`usr-admin-01`, `usr-client-01`, etc.).
  - `role`: `'admin'` o `'user'`.
  - `rut`: Incluido **únicamente cuando `role === 'user'`**.

### 2. `GET /score/:rut`
Retorna el score financiero determinista (`0` a `100`) para el RUT consultado.

- **Headers:** `Authorization: Bearer <token>`
- **Middlewares aplicados en cadena:**
  1. `authenticateJwt`: Verifica presencia, firma (`HS256`) y vigencia (`exp`) del JWT (`401 Unauthorized`).
  2. `authorizeRutAccess`:
     - Si `role === 'admin'`: permite consultar cualquier RUT.
     - Si `role === 'user'`: normaliza el RUT solicitado y el RUT del token (ignorando puntos y mayúsculas/minúsculas de `K`) y exige coincidencia exacta; en caso contrario retorna `403 Forbidden`.
- **Regla determinista:** Se normaliza el RUT al formato canónico sin puntos (`XXXXXXXX-X`) y se calcula un digest criptográfico `SHA-256` proyectado al rango `[0, 100]` (`uint32 % 101`). Así, `12.345.678-9` y `12345678-9` entregan siempre el mismo score (`73`), variando uniformemente entre RUTs distintos.
- **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "rut": "12.345.678-9",
    "score": 73,
    "fecha": "2025-06-27T14:35:00Z"
  }
  ```

---

## Uso de Herramientas de IA

El detalle sobre las herramientas de inteligencia artificial utilizadas durante el desarrollo y las decisiones técnicas tomadas se encuentra documentado en [`ai_interactions.md`](./ai_interactions.md).
