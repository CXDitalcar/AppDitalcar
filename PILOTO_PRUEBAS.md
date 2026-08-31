# Guion de prueba · Piloto Ditalcar Colaboradores

## 1. Vendedor
1. Entrar en modo demo como `Vendedor Demo`.
2. Inicio: ver KPI generales de red y KPI de Vespucio.
3. Crear una solicitud de Colaboradores o Mobiliario.
4. La solicitud debe quedar `Pendiente de aprobación` de Jefatura Local.
5. Cambiar perfil.

## 2. Jefatura Local Vespucio
1. Entrar como `Jefatura Local Demo`.
2. Abrir `Gestión`.
3. Ver la solicitud del vendedor en `Por aprobar`.
4. Aprobar.
5. La solicitud debe avanzar al responsable del proceso.
6. Revisar `Formularios` → Ruta de Experiencia.
7. Abrir última revisión y crear solicitud desde una brecha.
8. Si una brecha ya tiene solicitud activa, debe aparecer `Ver solicitud` en vez de crear duplicado.

## 3. Experiencia de Clientes
1. Entrar como `Experiencia de Clientes`.
2. Inicio: ver KPI red y vista de locales.
3. `Gestión` → `Nuevas`.
4. Abrir Zona de experiencia / Mobiliario / Mantención / Credencial.
5. `Tomar y comenzar gestión`.
6. Desde En gestión probar `Solicitar aprobación de presupuesto`.
7. Cambiar a Gerencia Comercial.

## 4. Gerencia Comercial
1. Abrir `Gestión` → `Por aprobar`.
2. Aprobar presupuesto.
3. El caso vuelve a Experiencia de Clientes y el SLA deja de estar pausado.

## 5. Infraestructura
1. Como Experiencia de Clientes abrir una solicitud de Instalaciones y mantención.
2. En gestión usar `Escalar infraestructura a Gerencia General` cuando corresponda.
3. La instancia debe indicar `sin SLA`.
4. Como Gerencia General aprobar.
5. La solicitud vuelve al gestor original.

## 6. Pedido de insumos
1. Entrar como Jefatura Local.
2. Inicio → Insumos.
3. Modificar `Stock actual` y `Cantidad final`.
4. Enviar pedido.
5. Cambiar a Gerencia Administración → aprobar.
6. Cambiar a Administrativo → tomar y ejecutar.

## 7. Cierre
1. Gestor marca `Resuelta por confirmar`.
2. Cambiar a solicitante o Jefatura Local.
3. Confirmar `Resuelto` o `No resuelto`.
4. `No resuelto` reabre el caso sin reiniciar el SLA.

## Nota
El modo demo conserva las solicitudes entre perfiles usando `localStorage`. Cambiar de perfil no borra la operación y permite demostrar el flujo punta a punta.
