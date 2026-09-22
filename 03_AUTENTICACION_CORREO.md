# Ditalcar Colaboradores · Autenticación por correo

La autenticación de esta versión es funcional y se ejecuta mediante el backend `api/`.

## Flujo
1. El colaborador solicita activación con su correo corporativo.
2. El backend verifica que esté habilitado en `02_Usuarios`.
3. Se genera un token de un solo uso y con vencimiento.
4. El usuario crea su contraseña personal.
5. El login valida la contraseña en backend y crea una sesión segura.
6. La app carga el cargo, local y alcance del usuario.
7. Recuperación de contraseña usa un token independiente y temporal.

## Seguridad
- No guardar contraseñas en React ni en SharePoint.
- El backend almacena hash de contraseña en Azure Table Storage.
- Los tokens de activación/reset y las sesiones se almacenan con hash.
- La sesión viaja en cookie `HttpOnly`.
- Después de intentos fallidos consecutivos existe bloqueo temporal.

## Endpoints
- `GET /api/auth/me`
- `POST /api/auth/login`
- `POST /api/auth/request-activation`
- `POST /api/auth/activate`
- `POST /api/auth/request-reset`
- `POST /api/auth/reset-password`
- `POST /api/auth/logout`

Configuración completa: `04_AUTENTICACION_REAL_AZURE.md`.
