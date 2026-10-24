# ProyectoDosMIA-SS-26
Sistema de gestión documental para almacenar, organizar, consultar y compartir archivos digitales en formatos .txt y .md entre diferentes usuarios. Desarrollado bajo una arquitectura cliente-servidor con Angular 21 para el frontend, Node.js para el backend y MongoDB como base de datos.

## Requisitos
- Node.js 22 o superior
- MongoDB en ejecución en `mongodb://localhost:27017`

## Configuración del backend
Dentro de `Proyecto/servidor-app`, instalar las dependencias y crear el archivo `.env` a partir del ejemplo:

```bash
cd Proyecto/servidor-app
npm install
cp .env.example .env
```

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del servidor (3001) |
| `MONGO_URI` | Conexión a la base de datos `gestor_archivos` |
| `JWT_SECRET` | Clave para firmar los tokens de sesión |
| `JWT_EXPIRA` | Duración de la sesión (8h) |
| `ESPACIO_PREDETERMINADO` | Espacio asignado a cada usuario nuevo, en bytes (1 GB) |

## Carga inicial
Desde `Proyecto/servidor-app`:

```bash
npm run db:cargar
```

Este comando **borra la base `gestor_archivos`** y la vuelve a crear con sus colecciones, validadores e índices. Después carga los datos de prueba usando la API, igual que un usuario real, por lo que todas las acciones quedan registradas en los logs con fechas entre agosto y octubre de 2026.

| Datos | Cantidad |
|---|---|
| Usuarios | 10 (3 administradores y 7 usuarios) |
| Carpetas | 30 ("Carpeta de prueba - N"), con subcarpetas |
| Archivos activos | 50 ("Archivo de prueba - N"): 30 .txt y 20 .md |
| Archivos en la papelera | 10 (uno por usuario) |
| Comparticiones | 40, con permisos de lectura, comentario y edición |

Usuarios cargados (la contraseña de todos es `1234`):

| Rol | Usuarios |
|---|---|
| Administrador | Javier, Admin, Marcelino |
| Usuario | Emilie, Danny, Bernny, Jacky, Bryan, Blanqui, Alejandra |

Para crear solo las colecciones, validadores e índices, sin borrar ni cargar datos:

```bash
npm run db:crear
```

## Levantar el backend
Desde `Proyecto/servidor-app`:

```bash
npm run dev
```

La API queda disponible en `http://localhost:3001/api`. También se puede usar `npm start` para ejecutarlo sin recarga automática.

## Levantar el frontend
En otra terminal, desde `Proyecto/gestor-archivos`:

```bash
cd Proyecto/gestor-archivos
npm install
ng serve
```

La aplicación queda disponible en `http://localhost:4200`. El backend debe estar en ejecución para poder iniciar sesión.
