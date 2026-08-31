# Ditalcar Colaboradores · Piloto Vespucio

## Alcance incluido

- Dashboard con KPI Red Ditalcar y KPI del local.
- Visibilidad de locales por rol: Marca Geely, Zonal excluye Geely/Stellantis, Gerencia Ventas/CX/Jefatura Comercial con vista red.
- Solicitudes con familias Unidades, Insumos y Showroom, Colaboradores y Otros.
- Flujo colaborador → Jefatura Local (SLA 24 h) → responsable del proceso.
- Solicitudes creadas por Jefatura Local pasan directamente a aprobación de proceso, si existe, o a `RECIBIDA` del gestor.
- Gestor debe tomar solicitudes `RECIBIDA` dentro de 24 h y luego quedan `EN_GESTION`.
- Bandeja unificada: Nuevas, Por aprobar, En gestión, Esperando información, Por confirmar y SLA.
- Experiencia de Clientes gestiona Credenciales, Zonas de experiencia, Mobiliario y equipamiento, e Instalaciones/Mantención.
- Bonificación y Traslado: Jefatura Operaciones Comerciales aprueba/gestiona.
- Pedido de insumos: Gerencia Administración aprueba y Administrativo ejecuta.
- Patentes: Administrativo en demo. En producción debe restringirse a los 2 correos definidos en `11_AsignacionesProceso`.
- Pie de firma: Jefatura Marketing en demo. En producción debe restringirse a los 2 correos específicos de Marketing.
- Aprobación de presupuesto desde la solicitud: Gerencia Comercial. El SLA de resolución queda pausado.
- Infraestructura: el gestor puede escalar a Gerencia General cuando corresponda. Esa instancia no tiene SLA.
- Resolución: solicitante o Jefatura Local pueden confirmar. `No resuelto` reabre sin reiniciar el SLA.
- Formularios: Ruta de Experiencia, Tour del Manager Stellantis y Auditoría Ruta.
- Resultado por ítem + brechas + Crear solicitud / Ver solicitud existente.
- Pedido inteligente de insumos con stock editable, objetivo inicial, sugerencia y cantidad final editable.

## KPI del piloto

Los valores incluidos en `src/data/pilotData.ts` son demostrativos y sirven para validar la experiencia de la aplicación. No deben interpretarse como medición oficial.

KPI considerados:
- Ruta realizada.
- Exactitud de revisión.
- Cumplimiento de estándares.
- Avance CONSULTA.
- Solicitudes / SLA a tiempo.
- Brechas abiertas.

## Lists preparadas

01_Sucursales
02_Usuarios
03_Modulos
04_Lecciones
05_Preguntas
06_Progreso
07_ResultadosEvaluacion
08_Estandares
09_Procesos
10_CamposProceso
11_AsignacionesProceso
12_Formularios
13_EjecucionesFormulario
14_BrechasFormulario
15_MapeoBrechaProceso
16_CatalogoInsumos
17_ParametrosInsumos
18_StockInsumosSucursal
19_HistoricoInsumos
20_ValoresSolicitud
21_SeguimientoSolicitudes
Tablero General Solicitudes

## Para pasar de piloto demo a operación real

1. Completar `02_Usuarios` con usuarios reales, rol, local, zona y marcas.
2. En `11_AsignacionesProceso`, activar los 2 correos reales de Patentes y los 2 de Pie de firma.
3. Confirmar responsables todavía pendientes de procesos no prioritarios.
4. Mantener `Tablero General Solicitudes` como lista maestra.
5. Conectar escrituras Graph/Power Automate después de validar permisos `Sites.ReadWrite.All` y nombres internos de columnas.
6. Mantener Forms → Power Automate → Lists para ejecuciones/brechas y correo detallado.

## Modo demo

Las solicitudes del piloto se guardan en `localStorage` para poder demostrar creación, aprobación, gestión, pausa por presupuesto, escalamiento y cierre sin depender todavía de permisos Graph de escritura.
