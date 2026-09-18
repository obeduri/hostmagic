# 🧙‍♂️ Hostmagic - Plan de Arquitectura e Implementación Técnica

**Versión:** 1.0.0  
**Autor:** Senior Software & CLI Architect  
**Estado:** Propuesta / En Planificación  

---

## 1. Resumen Ejecutivo y Visión del Producto

**Hostmagic** es una herramienta CLI distribuible globalmente vía `npm` / `npx` (`npx hostmagic init`, `npx hostmagic run`, `npx hostmagic clean`) cuyo objetivo es eliminar la fricción en el desarrollo local de arquitecturas fullstack y monorepos. 

Convierte la experiencia clásica de configurar manualmente puertos colisionados (`localhost:3000`, `localhost:3001`, `localhost:8080`) y editar archivos de sistema en un flujo automatizado de un solo comando:
1. **Detección automática** de frontend y backend en subdirectorios comunes.
2. **Resolución segura de dominios locales** (`<proyecto>.local` y `backend.<proyecto>.local`) en el archivo `hosts` del sistema operativo (con elevación de privilegios UAC transparente en Windows y `sudo` en Unix).
3. **Asignación dinámica de puertos efímeros libres** en tiempo de ejecución.
4. **Inyección en memoria de variables de entorno contextuales** (`PORT`, `NEXT_PUBLIC_API_URL`, `FRONTEND_URL`, etc.) sin ensuciar ni alterar archivos `.env` físicos.
5. **Orquestación concurrente de procesos** con logs estilizados por prefijo y cierre en cascada sin procesos huérfanos.

---

## 2. Análisis de Brechas, Casos Borde y Soluciones Arquitectónicas

Tras evaluar los requerimientos iniciales (PRD), se identificaron varias omisiones críticas y riesgos técnicos en entornos reales de desarrollo. A continuación se presentan las soluciones arquitectónicas diseñadas:

### 2.1. Gestión de `hosts` y Colisiones Multitrabajo
* **Problema:** Un bloque genérico `# BEGIN hostmagic` ... `# END hostmagic` destruiría las entradas de otros proyectos si un desarrollador trabaja en más de un proyecto con Hostmagic. Además, si el CLI falla a mitad de la escritura, el archivo `hosts` podría corromperse.
* **Solución Arquitectónica:**
  - **Delimitadores con Namespace por Proyecto:**
    ```text
    # BEGIN hostmagic:mi-proyecto
    127.0.0.1  mi-proyecto.local
    127.0.0.1  backend.mi-proyecto.local
    # END hostmagic:mi-proyecto
    ```
  - **Idempotencia y Escritura Atómica:** El motor de lectura/escritura busca si ya existe el bloque específico del proyecto. Si existe, lo actualiza; si no, lo añade al final. Si se invoca `clean`, solo se retira el bloque de dicho proyecto (a menos que se use `--all`).
  - **Backup preventivo:** Antes de aplicar cualquier modificación, se crea una copia de seguridad en el directorio temporal del sistema (`hosts.hostmagic.bak`).

### 2.2. Elevación UAC en Windows sin Fricción
* **Problema:** En Windows, el archivo `C:\Windows\System32\drivers\etc\hosts` está protegido contra escritura no elevada (`EPERM`/`EACCES`). Ejecutar un subproceso con `Start-Process -Verb RunAs` abre una ventana de PowerShell separada; si se pasan cadenas de texto complejas inline, fallan por problemas de escaping y comillas.
* **Solución Arquitectónica:**
  - **Detección previa de permisos de Administrador:** Evitar invocar UAC si la terminal actual ya cuenta con permisos elevados (`net session` o verificación de identidad de Windows).
  - **Ejecución vía script temporal firmado/aislado:** Hostmagic genera un script temporal en `%TEMP%\hostmagic-update-hosts.ps1` que realiza la inserción/eliminación del bloque de forma segura y controlada con verificación de hash o contenido.
  - **Invocación:** Se ejecuta `powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"<temp_script>\"' -Verb RunAs -Wait"`.
  - **Manejo de rechazo UAC:** Si el usuario pulsa "No" en el diálogo UAC de Windows, el proceso captura el código de salida y muestra un mensaje amigable explicándole cómo otorgar permisos o cómo añadir las 2 líneas manualmente.
  - **Soporte Unix (macOS / Linux):** Si no es root (`process.getuid() !== 0`), se invoca de forma interactiva `sudo` o se le solicita al usuario su contraseña mediante un prompt seguro antes de la escritura.

### 2.3. Caché de DNS del Sistema Operativo
* **Problema:** Los cambios en `hosts` pueden no surtir efecto inmediato si el resolver del sistema operativo o el navegador mantiene en caché la resolución de nombres previa.
* **Solución Arquitectónica:** Invocación automática no bloqueante de vaciado de caché DNS tras modificar `hosts`:
  - Windows: `ipconfig /flushdns`
  - macOS: `dscacheutil -flushcache; killall -HUP mDNSResponder`
  - Linux: `resolvectl flush-caches` o `systemd-resolve --flush-caches` (si el servicio está presente).

### 2.4. Dominios Limpios sin Puertos (Reverse Proxy Integrado en Puerto 80)
* **Requerimiento Clave:** Los dominios generados no deben requerir puertos al final. El usuario debe acceder directamente a `http://proyecto.local` y `http://backend.proyecto.local`.
* **Solución Arquitectónica:**
  - **Reverse Proxy HTTP/WebSocket Integrado:** Hostmagic incluye un servidor proxy inverso ligero en `src/core/proxy.ts` que escucha en el puerto 80 del sistema local (`0.0.0.0:80`).
  - **Enrutamiento por Cabecera `Host`:** Cuando una petición llega al puerto 80, el proxy inspecciona `req.headers.host`:
    - Si el host es `proyecto.local`, redirige transparentemente al puerto efímero interno del frontend (ej: `127.0.0.1:54321`).
    - Si el host es `backend.proyecto.local`, redirige al puerto efímero interno del backend (ej: `127.0.0.1:54322`).
  - **Soporte Completo de WebSockets:** Maneja el evento `upgrade` del servidor HTTP para túneles WebSocket, garantizando que el Hot Module Replacement (HMR) de herramientas como Vite, Next.js y Astro funcione sin latencia ni interrupciones.
  - **Variables de Entorno Limpias:** En memoria, las variables inyectadas no llevan puerto:
    - Frontend: `NEXT_PUBLIC_APP_URL=http://<proyecto>.local`, `NEXT_PUBLIC_API_URL=http://backend.<proyecto>.local`
    - Backend: `APP_URL=http://backend.<proyecto>.local`, `FRONTEND_URL=http://<proyecto>.local`, `CORS_ORIGIN=http://<proyecto>.local`
    - Internamente, cada servicio sigue recibiendo `PORT=<puerto_aleatorio>` para que levanten sus sockets sin colisionar entre sí.

### 2.5. Frameworks que ignoran la variable de entorno `PORT`
* **Problema:** Herramientas como Vite por defecto escuchan en el puerto `5173` y en ciertas versiones o configuraciones no leen automáticamente `process.env.PORT` a menos que se les pase el flag `--port <port>`.
* **Solución Arquitectónica:**
  - La inyección de entorno se realiza vía `env: { ...process.env, PORT: String(port) }`.
  - En la heurística de detección, si se detecta Vite (`vite` en `dependencies`/`devDependencies`), el comando por defecto sugerido en `init` es `npm run dev -- --port $PORT` o el comando script equivalente, garantizando compatibilidad total sin requerir alterar `vite.config.ts`.

### 2.6. Gestión de Árbol de Procesos y Señales de Terminación (Zombies)
* **Problema:** En Windows, presionar `Ctrl+C` (`SIGINT`) a menudo termina el proceso de Node padre pero deja los subprocesos de `bun dev`, `npm.cmd` o `vite` corriendo en segundo plano, reteniendo los puertos asignados.
* **Solución Arquitectónica:**
  - Se integra `tree-kill` o el mecanismo `cleanup: true` y terminación forzada en árbol de `execa`.
  - Se registran listeners para `SIGINT`, `SIGTERM`, `SIGHUP` y `uncaughtException` que garantizan el apagado ordenado de todos los subprocesos y la limpieza antes de salir del CLI.

---

## 3. Especificación de la Arquitectura del Sistema

### 3.1. Estructura de Directorios del Código Fuente

```text
hostmagic/
├── package.json               # Configuración ESM, dependencias, scripts y bin
├── tsconfig.json              # Configuración de compilación TypeScript estricta
├── tsup.config.ts             # Configuración de empaquetado CJS/ESM con shebang
├── README.md                  # Documentación de uso y publicación npm
├── plan.md                    # Este documento de planificación
├── src/
│   ├── cli.ts                 # Punto de entrada de Commander (definición de comandos)
│   ├── types.ts               # Definición de interfaces TypeScript (.hostmagic.json, etc.)
│   ├── core/
│   │   ├── hosts.ts           # Lectura/escritura en hosts, detección admin y scripts UAC/sudo
│   │   ├── detector.ts        # Escaneo heurístico de subdirectorios y frameworks
│   │   ├── port.ts            # Localizador seguro de puertos efímeros disponibles
│   │   ├── dns.ts             # Vaciado de caché DNS según el sistema operativo
│   │   └── process-manager.ts # Orquestador de procesos hijos, prefijos de logs y tree-kill
│   └── commands/
│       ├── init.ts            # Wizard interactivo con @clack/prompts y persistencia
│       ├── run.ts             # Resolución de puertos, inyección de envs y ejecución
│       └── clean.ts           # Eliminación de bloques del archivo hosts
└── dist/                      # Código transpilado y listo para ejecución (tsup)
    └── cli.js                 # Binario ejecutable con #!/usr/bin/env node
```

### 3.2. Stack Tecnológico y Dependencias

| Paquete | Versión sugerida | Rol en la Arquitectura |
| :--- | :--- | :--- |
| `typescript` | `^5.x` | Tipado estático y desarrollo |
| `tsup` | `^8.x` | Empaquetador zero-config ultrarrápido para Node CLIs con soporte Shebang |
| `commander` | `^12.x` | Parser de comandos, opciones y ayuda de CLI estándar de la industria |
| `@clack/prompts` | `^0.8.x` | Componentes interactivos modernos y elegantes para terminal (prompts) |
| `picocolors` | `^1.x` | Formateo y coloreado de texto liviano y sin dependencias |
| `execa` | `^9.x` | Ejecución robusta de comandos del sistema con soporte ESM nativo |
| `get-port` | `^7.x` | Asignación segura y concurrente de puertos efímeros disponibles |
| `tree-kill` | `^1.2.x` | Terminación de árbol de procesos segura multiplataforma (Windows/Unix) |

---

## 4. Diseño Detallado de Módulos

### 4.1. Módulo de Tipos (`src/types.ts`)

Definición del schema formal del archivo de configuración `.hostmagic.json` y los estados del escaneo heurístico:

```typescript
export type ServiceType = 'frontend' | 'backend' | 'custom';

export interface ServiceConfig {
  name: string;             // Ej: "frontend" o "web"
  path: string;             // Ruta relativa al root, ej: "frontend" o "apps/web"
  type: ServiceType;        // Clasificación
  domain: string;           // Ej: "mi-app.local" o "backend.mi-app.local"
  command: string;          // Ej: "bun dev" o "npm run dev"
  portEnvVar?: string;      // Variable para el puerto, default: "PORT"
  customEnv?: Record<string, string>; // Variables adicionales opcionales
}

export interface HostmagicConfig {
  $schema?: string;
  name: string;             // Nombre del proyecto (slug)
  tld?: string;             // Default: "local"
  services: ServiceConfig[];
}

export interface DetectedService {
  name: string;
  relativePath: string;
  type: ServiceType;
  framework?: string;
  detectedCommand: string;
  suggestedDomain: string;
}
```

### 4.2. Módulo de Hosts del Sistema (`src/core/hosts.ts`)

Responsable de la interacción atómica y segura con el archivo `hosts`.

1. **Rutas por Plataforma:**
   - Windows: `C:\Windows\System32\drivers\etc\hosts`
   - macOS / Linux: `/etc/hosts`
2. **Formato de Delimitadores con Namespace:**
   ```text
   # BEGIN hostmagic:<projectName>
   127.0.0.1  <dominio1>
   127.0.0.1  <dominio2>
   # END hostmagic:<projectName>
   ```
3. **Mecanismo de Elevación en Windows:**
   - Detecta si el proceso cuenta con privilegios de administrador mediante el comando de Windows `net session`.
   - Si no los tiene, genera un script temporal en `%TEMP%\hostmagic-uac.ps1` que:
     a) Realiza un backup de `hosts` si no existe uno reciente.
     b) Lee el contenido, remueve cualquier bloque antiguo con esa etiqueta y añade el nuevo bloque formateado.
     c) Escribe atómicamente el contenido con codificación UTF-8 sin BOM.
   - Ejecuta:
     ```powershell
     Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$tempScript`"" -Verb RunAs -Wait
     ```
   - Comprueba el resultado inspeccionando el archivo `hosts` o el código de retorno.
4. **Mecanismo de Elevación en macOS/Linux:**
   - Si `process.getuid() !== 0`, ejecuta un script helper temporal vía `sudo`.
5. **Limpieza (`clean`):**
   - Extrae el bloque específico `# BEGIN hostmagic:<projectName>` hasta `# END hostmagic:<projectName>`. Si se provee el flag `--all`, elimina cualquier bloque etiquetado con `hostmagic`.

### 4.3. Módulo Heurístico de Detección (`src/core/detector.ts`)

Analiza la estructura del proyecto en busca de subdirectorios y clasifica los servicios:

1. **Directorios de Búsqueda:**
   - Convencionales: `frontend`, `backend`, `client`, `server`.
   - Monorepos comunes: `apps/web`, `apps/api`, `apps/client`, `apps/server`, `packages/web`, `packages/api`.
   - Soporte para detección en la raíz (`./`) si no hay subdirectorios y el `package.json` principal contiene un frontend o backend.
2. **Clasificación por Dependencias:**
   - Inspecciona `package.json` en cada subcarpeta:
     - **Frontend:** Si contiene `next`, `vite`, `astro`, `nuxt`, `remix`, `@angular/core`, `vue`, `svelte`.
     - **Backend:** Si contiene `@nestjs/core`, `express`, `fastify`, `koa`, `hono`, `@adonisjs/core`.
3. **Inferencia de Gestor de Paquetes:**
   - Detecta presencia de `bun.lock` / `bun.lockb` -> `bun dev` / `bun run dev`
   - Detecta presencia de `pnpm-lock.yaml` -> `pnpm dev`
   - Detecta presencia de `yarn.lock` -> `yarn dev`
   - Por defecto: `npm run dev`.

### 4.4. Módulo del Wizard Interactivo (`src/commands/init.ts`)

Utiliza `@clack/prompts` para brindar una experiencia de usuario de primera clase:

1. **Bienvenida & Introducción:**
   - Saludo con estilo y spinner mientras se ejecuta el detector heurístico.
2. **Confirmación del Nombre del Proyecto:**
   - Sugiere el nombre de la carpeta raíz formateado como slug (ej. `mi-proyecto`).
3. **Revisión y Ajuste de Servicios:**
   - Muestra tarjetas con cada servicio detectado (ruta, framework identificado, comando sugerido y dominio).
   - Permite confirmar o editar rutas, comandos o dominios asignados.
4. **Persistencia y Aplicación:**
   - Escribe `.hostmagic.json` con formato legible e indentado.
   - Aplica los dominios al archivo `hosts` llamando a `hosts.ts` (manejando elevación UAC automáticamente).
   - Ejecuta vaciado de caché DNS.
   - Muestra confirmación de éxito con instrucciones para ejecutar `hostmagic run`.

### 4.5. Módulo de Ejecución Concurrente (`src/commands/run.ts` y `src/core/process-manager.ts`)

1. **Resolución de Puertos Efímeros:**
   - Por cada servicio configurado en `.hostmagic.json`, invoca `get-port` para garantizar un puerto TCP libre e independiente.
2. **Construcción Dinámica del Grafo de Entorno:**
   - Determina el puerto del frontend (`frontPort`) y del backend (`backPort`).
   - Construye variables cruzadas en memoria:
     - **Para el Frontend:**
       - `PORT`: `String(frontPort)`
       - `NEXT_PUBLIC_API_URL`: `http://${backendDomain}:${backPort}`
       - `NEXT_PUBLIC_APP_URL`: `http://${frontendDomain}:${frontPort}`
       - `VITE_API_URL`: `http://${backendDomain}:${backPort}`
     - **Para el Backend:**
       - `PORT`: `String(backPort)`
       - `APP_URL`: `http://${backendDomain}:${backPort}`
       - `FRONTEND_URL`: `http://${frontendDomain}:${frontPort}`
       - `CORS_ORIGIN`: `http://${frontendDomain}:${frontPort}`
3. **Lanzamiento Concurrente:**
   - Utiliza `execa` configurando `cwd: path.resolve(rootDir, service.path)`.
   - Conecta a `stdout` y `stderr` usando un transformador de streams que divide por líneas y antepone un prefijo coloreado:
     - `[FRONTEND]` en cian brillante.
     - `[BACKEND]` en magenta brillante.
     - `[CUSTOM]` en amarillo.
4. **Manejo de Señales de Terminación:**
   - Captura `SIGINT` (Ctrl+C), `SIGTERM` y el evento `exit`.
   - Realiza un apagado ordenado en árbol (`tree-kill`) para matar todos los PIDs de los subprocesos y liberar los sockets inmediatamente.

### 4.6. Módulo de Limpieza (`src/commands/clean.ts`)

1. Lee `.hostmagic.json` para obtener el nombre del proyecto actual (o acepta un flag `--all`).
2. Invoca la eliminación del bloque correspondiente en `hosts`.
3. Notifica al usuario de la desvinculación de dominios y ofrece la opción de eliminar o conservar `.hostmagic.json`.

---

## 5. Matriz de Validación y Pruebas

| Caso de Prueba | Escenario | Resultado Esperado |
| :--- | :--- | :--- |
| **Escaneo Heurístico** | Proyecto con `frontend/` (Next.js) y `backend/` (NestJS) | Detecta correctamente ambos frameworks y asigna `<nombre>.local` y `backend.<nombre>.local` |
| **Escaneo Monorepo** | Proyecto con `apps/web` (Vite) y `apps/api` (Express) | Detecta rutas relativas y sugiere comandos acordes |
| **UAC en Windows (No Admin)** | Ejecución de `hostmagic init` en terminal PowerShell estándar | Se abre ventana UAC pidiendo confirmación de elevación, aplica los cambios a `hosts` sin error `EPERM` |
| **UAC en Windows (Admin)** | Ejecución de `hostmagic init` en terminal como Administrador | Modifica `hosts` directamente sin mostrar ventana emergente |
| **Idempotencia de Hosts** | Ejecutar `hostmagic init` dos veces con el mismo nombre | No duplica entradas en `hosts`, actualiza el bloque existente |
| **Asignación de Puertos** | Dos ejecuciones simultáneas o puertos ocupados | `get-port` entrega puertos libres sin colisión |
| **Inyección de Entorno** | Verificar variables disponibles en el frontend | `process.env.NEXT_PUBLIC_API_URL` apunta a `http://backend.<nombre>.local:<puerto_back>` |
| **Terminación Ctrl+C** | Presionar Ctrl+C en `hostmagic run` | Todos los procesos hijos (Node/Bun/Vite) mueren de inmediato sin dejar puertos bloqueados |
| **Limpieza** | Ejecutar `hostmagic clean` | Remueve únicamente el bloque delimitado del proyecto y vacía la caché DNS |

---

## 6. Plan Paso a Paso de Implementación

1. **Fase 1: Configuración del Proyecto Base**
   - Inicializar `package.json` con `"type": "module"`, `"bin": { "hostmagic": "./dist/cli.js" }`.
   - Configurar `tsconfig.json` con target ES2022 / Node16 y strict mode.
   - Configurar `tsup.config.ts` para compilar `src/cli.ts` a `dist/cli.js` con shebang `#!/usr/bin/env node`.
   - Instalar dependencias de producción y desarrollo.

2. **Fase 2: Core de Hosts y Elevación Multiplataforma**
   - Implementar `src/types.ts`.
   - Implementar `src/core/hosts.ts` con lectura, formateo de bloques con namespace, backup preventivo y elevación UAC en Windows (vía PowerShell RunAs) y Unix (vía sudo).
   - Implementar `src/core/dns.ts` para el vaciado de caché DNS.

3. **Fase 3: Motor de Detección Heurística y Puertos**
   - Implementar `src/core/detector.ts` para escanear directorios y clasificar dependencias de `package.json`.
   - Implementar `src/core/port.ts` como wrapper seguro de `get-port`.

4. **Fase 4: Comandos de la CLI**
   - Implementar `src/commands/init.ts` con el wizard interactivo de `@clack/prompts`.
   - Implementar `src/commands/run.ts` y `src/core/process-manager.ts` con inyección de variables de entorno, streaming de logs con prefijo y `tree-kill`.
   - Implementar `src/commands/clean.ts` para eliminar entradas en `hosts`.
   - Ensamblar comandos en `src/cli.ts` con `commander`.

5. **Fase 5: Verificación, Build y Pruebas Locales**
   - Ejecutar `npm run build` con `tsup`.
   - Probar comando `--help`, `init`, `run` y `clean`.
   - Crear un proyecto de prueba fullstack simulado para validar la detección, la inyección de puertos y el cierre limpio.
