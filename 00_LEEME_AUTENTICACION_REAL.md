# INSTALAR PRIMERO · Autenticación real Ditalcar

Este paquete reemplaza la autenticación visual/piloto de la versión 2109.

## GitHub

1. Sube/reemplaza todos los archivos conservando sus rutas.
2. La carpeta nueva `/api` es obligatoria.
3. El workflow ya viene modificado con `api_location: "api"`.
4. No subas secretos a archivos `.env` ni al repositorio.
5. Configura las variables indicadas en `04_AUTENTICACION_REAL_AZURE.md` dentro de Azure Static Web Apps.
6. Commit sugerido: `Autenticacion real Ditalcar - API sesiones y activacion`.

## Resultado esperado

- Ya NO existe selector de perfil para entrar.
- Correo + contraseña funcionan contra `/api/auth/*`.
- Primera vez envía activación por correo.
- Olvidé mi contraseña envía recuperación por correo.
- Cargo/local/permisos se obtienen de `02_Usuarios`.
- Experiencia conserva `Ver como` una vez autenticada.
- Solicitudes pueden seguir en datos piloto independientemente del login real.

## Antes del build productivo

Debes configurar Storage + credenciales Graph + casilla remitente. Sin esas variables, la pantalla existe pero la API no puede validar `02_Usuarios`, persistir hashes/sesiones ni enviar correos.
