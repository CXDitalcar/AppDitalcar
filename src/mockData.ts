import type {
  ProcessAssignment,
  ProcessDefinition,
  ProcessFieldDefinition,
  RequestItem,
  RequestTimelineItem,
  UserScope,
} from "../types"


// ======================================================
// USUARIOS DE PRUEBA
// ======================================================

export const mockUsers: UserScope[] = [
  {
    email: "vendedor.demo@ditalcar.cl",
    name: "Vendedor Demo",
    role: "VENDEDOR",
    local: "Vespucio",
    active: true,
  },

  {
    email: "jefatura.local.demo@ditalcar.cl",
    name: "Jefatura Local Demo",
    role: "JEFATURA_LOCAL",
    local: "Vespucio",
    active: true,
  },

  {
    email: "jefatura.comercial.demo@ditalcar.cl",
    name: "Jefatura Comercial y Clientes",
    role: "JEFATURA_COMERCIAL_CLIENTES",
    active: true,
  },

  {
    email: "gerencia.ventas.demo@ditalcar.cl",
    name: "Gerencia de Ventas",
    role: "GERENCIA_VENTAS",
    active: true,
  },

  {
    email: "marketing.demo@ditalcar.cl",
    name: "Jefatura de Marketing",
    role: "JEFATURA_MARKETING",
    active: true,
  },
]


// ======================================================
// PROCESOS
// ======================================================
//
// IMPORTANTE:
// Los SLA reales se cargarán después desde Lists.
// No estamos inventando tiempos para Bonificación todavía.
// ======================================================

export const mockProcesses: ProcessDefinition[] = [
  {
    code: "UNI-BON-01",

    family: "UNIDADES",

    name: "Bonificación",

    description:
      "Solicitud de bonificación asociada a una venta o unidad.",

    active: true,

    order: 1,

    requesterRoles: [
      "VENDEDOR",
      "JEFATURA_LOCAL",
    ],

    requiresApproval: true,

    // En Bonificación no forzamos una etapa pública
    // de gestión después de aprobar.
    hasManagementStage: false,

    // POR DEFINIR.
    approvalSLAHours: undefined,

    // No aplica por ahora porque Bonificación
    // no tendrá etapa de gestión separada.
    resolutionSLAHours: undefined,

    // Plazo estándar definido para confirmar
    // si efectivamente la gestión quedó resuelta.
    confirmationHours: 48,

    academyEnabled: true,

    internalCheckpoints: [
      {
        id: "bon-solicitada-marca",
        label: "Solicitud realizada a marca",
        order: 1,
      },

      {
        id: "bon-factura-recibida",
        label: "Factura recibida",
        order: 2,
      },
    ],
  },
]


// ======================================================
// CAMPOS DEL FORMULARIO BONIFICACIÓN
// ======================================================

export const mockProcessFields: ProcessFieldDefinition[] = [
  {
    id: "bon-nv",

    processCode: "UNI-BON-01",

    label: "N° de Venta (NV)",

    type: "TEXT",

    required: true,

    adjustable: false,

    order: 1,

    placeholder: "Ej. 66337",

    active: true,
  },

  {
    id: "bon-vin",

    processCode: "UNI-BON-01",

    label: "VIN",

    type: "TEXT",

    // No obligatorio por ahora.
    // Más adelante podrá completarse automáticamente
    // mediante integración.
    required: false,

    adjustable: false,

    order: 2,

    placeholder: "Opcional",

    active: true,
  },

  {
    id: "bon-monto",

    processCode: "UNI-BON-01",

    label: "Monto de bonificación solicitado",

    type: "CURRENCY",

    required: true,

    // Este es el campo que Jefatura Comercial
    // puede modificar al usar "Aprobar con ajuste".
    adjustable: true,

    order: 3,

    placeholder: "$0",

    active: true,
  },

  {
    id: "bon-comentario",

    processCode: "UNI-BON-01",

    label: "Motivo / comentario",

    type: "TEXTAREA",

    required: true,

    adjustable: false,

    order: 4,

    placeholder:
      "Explica brevemente el motivo de la solicitud.",

    active: true,
  },
]


// ======================================================
// RESPONSABLES DEL PROCESO
// ======================================================
//
// Para Bonificación:
//
// Aprobador = Jefatura Comercial y Clientes
// Gestor    = Jefatura Comercial y Clientes
//
// Aunque en este proceso sean la misma persona,
// mantenemos ambas asignaciones porque otros procesos
// sí podrán tener aprobador y gestor distintos.
// ======================================================

export const mockProcessAssignments: ProcessAssignment[] = [
  {
    id: "bon-approver-01",

    processCode: "UNI-BON-01",

    type: "APPROVER",

    role: "JEFATURA_COMERCIAL_CLIENTES",

    active: true,
  },

  {
    id: "bon-manager-01",

    processCode: "UNI-BON-01",

    type: "MANAGER",

    role: "JEFATURA_COMERCIAL_CLIENTES",

    active: true,
  },
]


// ======================================================
// SOLICITUDES DE PRUEBA
// ======================================================
//
// Estos registros son SOLO para construir las pantallas.
// Luego se reemplazarán por SharePoint.
// ======================================================

export const mockRequests: RequestItem[] = [
  {
    id: "SOL-0001",

    processCode: "UNI-BON-01",

    processName: "Bonificación",

    family: "UNIDADES",

    requesterName: "Vendedor Demo",

    requesterEmail: "vendedor.demo@ditalcar.cl",

    local: "Vespucio",

    createdAt: "2026-08-28T09:15:00-04:00",

    status: "PENDIENTE_APROBACION",

    currentResponsibleName:
      "Jefatura Comercial y Clientes",

    currentResponsibleEmail:
      "jefatura.comercial.demo@ditalcar.cl",

    fields: [
      {
        fieldId: "bon-nv",

        label: "N° de Venta (NV)",

        requestedValue: "66337",

        adjustable: false,
      },

      {
        fieldId: "bon-vin",

        label: "VIN",

        requestedValue: "",

        adjustable: false,
      },

      {
        fieldId: "bon-monto",

        label: "Monto de bonificación solicitado",

        requestedValue: "500000",

        adjustable: true,
      },

      {
        fieldId: "bon-comentario",

        label: "Motivo / comentario",

        requestedValue:
          "Bonificación solicitada para cierre de negocio.",

        adjustable: false,
      },
    ],

    // Todavía no definimos el SLA real de Bonificación.
    approvalSLAHours: undefined,

    resolutionSLAHours: undefined,

    confirmationHours: 48,

    approvalSLAStartedAt:
      "2026-08-28T09:15:00-04:00",

    approvalSLAPausedMinutes: 0,

    reopened: false,

    reopenedCount: 0,

    autoClosed: false,

    internalCheckpoints: [
      {
        checkpointId: "bon-solicitada-marca",

        label: "Solicitud realizada a marca",

        completed: false,
      },

      {
        checkpointId: "bon-factura-recibida",

        label: "Factura recibida",

        completed: false,
      },
    ],
  },
]


// ======================================================
// SEGUIMIENTO DE PRUEBA
// ======================================================
//
// La app lo mostrará del más reciente al más antiguo.
// ======================================================

export const mockTimeline: RequestTimelineItem[] = [
  {
    id: "TIM-0001",

    requestId: "SOL-0001",

    type: "SOLICITUD_CREADA",

    authorName: "Vendedor Demo",

    authorEmail: "vendedor.demo@ditalcar.cl",

    createdAt: "2026-08-28T09:15:00-04:00",

    comment:
      "Bonificación solicitada para cierre de negocio.",
  },
]


// ======================================================
// USUARIO TEMPORAL PARA DESARROLLO
// ======================================================
//
// Más adelante el usuario real vendrá de Microsoft Entra.
// Para probar distintas vistas basta cambiar este email.
// ======================================================

export const mockCurrentUserEmail =
  "vendedor.demo@ditalcar.cl"
