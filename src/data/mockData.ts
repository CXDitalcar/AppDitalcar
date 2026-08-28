import type {
  ProcessAssignment,
  ProcessDefinition,
  ProcessFieldDefinition,
  RequestItem,
  UserScope,
} from "../types"


// ======================================================
// USUARIOS DEMO
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
    email: "jefatura.marca.demo@ditalcar.cl",
    name: "Jefatura de Marca Demo",
    role: "JEFATURA_MARCA",
    active: true,
  },

  {
    email: "jefatura.zonal.demo@ditalcar.cl",
    name: "Jefatura Zonal Demo",
    role: "JEFATURA_ZONAL",
    zone: "Santiago",
    active: true,
  },

  {
    email: "gerencia.ventas.demo@ditalcar.cl",
    name: "Gerencia de Ventas",
    role: "GERENCIA_VENTAS",
    active: true,
  },

  {
    email: "jefatura.comercial.demo@ditalcar.cl",
    name: "Jefatura Comercial y Clientes",
    role: "JEFATURA_COMERCIAL_CLIENTES",
    active: true,
  },

  {
    email: "jefatura.operaciones.demo@ditalcar.cl",
    name: "Jefatura Operaciones Comerciales",
    role: "JEFATURA_OPERACIONES_COMERCIALES",
    active: true,
  },

  {
    email: "jefatura.administracion.demo@ditalcar.cl",
    name: "Jefatura de Administración",
    role: "JEFATURA_ADMINISTRACION",
    active: true,
  },

  {
    email: "gerencia.administracion.demo@ditalcar.cl",
    name: "Gerencia de Administración",
    role: "GERENCIA_ADMINISTRACION",
    active: true,
  },

  {
    email: "gerencia.comercial.demo@ditalcar.cl",
    name: "Gerencia Comercial",
    role: "GERENCIA_COMERCIAL",
    active: true,
  },

  {
    email: "marketing.demo@ditalcar.cl",
    name: "Jefatura de Marketing",
    role: "JEFATURA_MARKETING",
    active: true,
  },

  {
    email: "administrativo.demo@ditalcar.cl",
    name: "Administrativo Demo",
    role: "ADMINISTRATIVO",
    active: true,
  },

  {
    email: "equipo.comercial.demo@ditalcar.cl",
    name: "Equipo Comercial Demo",
    role: "EQUIPO_COMERCIAL",
    active: true,
  },

  {
    email: "gerencia.general.demo@ditalcar.cl",
    name: "Gerencia General",
    role: "GERENCIA_GENERAL",
    active: true,
  },
]


// ======================================================
// USUARIO DEMO ORIGINAL
//
// Lo mantenemos temporalmente porque algunas pantallas
// antiguas todavía lo usan directamente.
// ======================================================

export const mockCurrentUserEmail =
  "vendedor.demo@ditalcar.cl"


// ======================================================
// PROCESOS
// ======================================================

export const mockProcesses: ProcessDefinition[] = [
  {
    code: "UNI-BON-01",

    family: "UNIDADES",

    name: "Bonificación",

    description:
      "Solicitud de bonificación asociada a una negociación o venta.",

    active: true,

    order: 1,

    requesterRoles: [
      "VENDEDOR",
      "JEFATURA_LOCAL",
    ],

    requiresApproval: true,

    hasManagementStage: false,

    // Todavía no definimos SLA real
    approvalSLAHours: undefined,

    resolutionSLAHours: undefined,

    confirmationHours: 48,

    academyEnabled: true,
  },
]


// ======================================================
// CAMPOS POR PROCESO
// ======================================================

export const mockProcessFields: ProcessFieldDefinition[] = [
  {
    id: "bon-nv",

    processCode: "UNI-BON-01",

    label: "NV",

    type: "TEXT",

    required: true,

    adjustable: false,

    order: 1,

    placeholder: "Ej: 66337",

    active: true,
  },

  {
    id: "bon-vin",

    processCode: "UNI-BON-01",

    label: "VIN",

    type: "TEXT",

    required: false,

    adjustable: false,

    order: 2,

    placeholder:
      "Opcional · se automatizará más adelante",

    active: true,
  },

  {
    id: "bon-monto",

    processCode: "UNI-BON-01",

    label: "Monto solicitado",

    type: "CURRENCY",

    required: true,

    adjustable: true,

    order: 3,

    placeholder: "Ej: 500000",

    active: true,
  },

  {
    id: "bon-comentario",

    processCode: "UNI-BON-01",

    label: "Motivo / Comentario",

    type: "TEXTAREA",

    required: true,

    adjustable: false,

    order: 4,

    placeholder:
      "Explica brevemente la solicitud...",

    active: true,
  },
]


// ======================================================
// ASIGNACIONES DE PROCESO
// ======================================================

export const mockProcessAssignments: ProcessAssignment[] = [
  {
    id: "bon-approver",

    processCode: "UNI-BON-01",

    type: "APPROVER",

    role: "JEFATURA_COMERCIAL_CLIENTES",

    active: true,
  },

  {
    id: "bon-manager",

    processCode: "UNI-BON-01",

    type: "MANAGER",

    role: "JEFATURA_COMERCIAL_CLIENTES",

    active: true,
  },
]


// ======================================================
// SOLICITUDES DEMO
// ======================================================
//
// Usamos una conversión temporal a RequestItem[] porque
// esta es información simulada. Cuando conectemos las
// Lists de SharePoint desaparecerá esta capa mock.
// ======================================================

export const mockRequests = [
  {
    id: "SOL-0001",

    processCode: "UNI-BON-01",

    processName: "Bonificación",

    family: "UNIDADES",

    requesterEmail:
      "vendedor.demo@ditalcar.cl",

    requesterName:
      "Vendedor Demo",

    requesterRole:
      "VENDEDOR",

    local: "Vespucio",

    status:
      "PENDIENTE_APROBACION",

    currentResponsibleEmail:
      "jefatura.comercial.demo@ditalcar.cl",

    currentResponsibleName:
      "Jefatura Comercial y Clientes",

    fields: [
      {
        fieldId: "bon-nv",
        requestedValue: "66337",
      },

      {
        fieldId: "bon-vin",
        requestedValue: "",
      },

      {
        fieldId: "bon-monto",
        requestedValue: "500000",
      },

      {
        fieldId: "bon-comentario",
        requestedValue:
          "Bonificación solicitada para cierre de negocio.",
      },
    ],

    createdAt:
      new Date(
        Date.now() -
          6 * 60 * 60 * 1000
      ).toISOString(),

    approvalSLAHours:
      undefined,

    approvalSLAStartedAt:
      undefined,

    approvalSLAPausedMinutes:
      0,

    approvalSLAPausedAt:
      undefined,

    resolutionSLAHours:
      undefined,

    resolutionSLAStartedAt:
      undefined,

    resolutionConfirmationDeadline:
      undefined,

    reopened: false,

    autoClosed: false,

    internalCheckpoints: [],
  },
] as unknown as RequestItem[]
