import type {
  ProcessAssignment,
  ProcessDefinition,
  ProcessFieldDefinition,
  RequestAttachment,
  RequestItem,
  RequestTimelineItem,
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
    brands: ["Chery", "Renault"],
    active: true,
  },

  {
    email: "jefatura.local@ditalcar.cl",
    name: "Jefatura Local Demo",
    role: "JEFATURA_LOCAL",
    local: "Vespucio",
    brands: ["Chery", "Renault"],
    active: true,
  },

  {
    email: "jefatura.marca@ditalcar.cl",
    name: "Jefatura Marca Demo",
    role: "JEFATURA_MARCA",
    brands: ["Chery"],
    active: true,
  },

  {
    email: "gerencia.marca@ditalcar.cl",
    name: "Gerencia Marca Demo",
    role: "GERENCIA_MARCA",
    scope: "MARCA",
    brands: ["Chery", "Renault"],
    assignedLocals: ["Vespucio", "Cantagallo"],
    localPrincipal: "Vespucio",
    active: true,
  },


  {
    email: "jefatura.zonal@ditalcar.cl",
    name: "Jefatura Zonal Demo",
    role: "JEFATURA_ZONAL",
    zone: "Santiago",
    active: true,
  },

  {
    email: "gerencia.ventas@ditalcar.cl",
    name: "Gerencia Ventas Demo",
    role: "GERENCIA_VENTAS",
    active: true,
  },

  {
    email: "comercial.clientes@ditalcar.cl",
    name: "Jefatura Comercial y Clientes",
    role: "JEFATURA_COMERCIAL_CLIENTES",
    active: true,
  },

  {
    email: "operaciones.comerciales@ditalcar.cl",
    name: "Jefatura Operaciones Comerciales",
    role: "JEFATURA_OPERACIONES_COMERCIALES",
    active: true,
  },

  {
    email: "jefatura.administracion@ditalcar.cl",
    name: "Jefatura Administración",
    role: "JEFATURA_ADMINISTRACION",
    active: true,
  },

  {
    email: "gerencia.administracion@ditalcar.cl",
    name: "Gerencia Administración",
    role: "GERENCIA_ADMINISTRACION",
    active: true,
  },

  {
    email: "gerencia.comercial@ditalcar.cl",
    name: "Gerencia Comercial",
    role: "GERENCIA_COMERCIAL",
    active: true,
  },

  {
    email: "marketing@ditalcar.cl",
    name: "Jefatura Marketing",
    role: "JEFATURA_MARKETING",
    active: true,
  },

  {
    email: "experiencia.clientes@ditalcar.cl",
    name: "Experiencia de Clientes",
    role: "EXPERIENCIA_CLIENTES",
    active: true,
  },

  {
    email: "administrativo@ditalcar.cl",
    name: "Administrativo Demo",
    role: "ADMINISTRATIVO",
    active: true,
  },

  {
    email: "junior.demo@ditalcar.cl",
    name: "Junior Demo",
    role: "ADMINISTRATIVO",
    local: "Vespucio",
    localPrincipal: "Vespucio",
    assignedLocals: ["Vespucio"],
    scope: "LOCAL",
    areaFunctional: "Junior / Operación",
    active: true,
  },

  {
    email: "equipo.comercial@ditalcar.cl",
    name: "Equipo Comercial Demo",
    role: "EQUIPO_COMERCIAL",
    active: true,
  },

  {
    email: "project.manager@ditalcar.cl",
    name: "Project Manager Demo",
    role: "EQUIPO_COMERCIAL",
    scope: "RED",
    areaFunctional: "Project Management",
    active: true,
  },

  {
    email: "gerencia.general@ditalcar.cl",
    name: "Gerencia General",
    role: "GERENCIA_GENERAL",
    active: true,
  },
]


// ======================================================
// PROCESOS
// ======================================================

export const mockProcesses: ProcessDefinition[] = [
  // ------------------------------------------------------
  // UNIDADES
  // ------------------------------------------------------

  {
    code: "UNI-BON-01",
    family: "UNIDADES",
    name: "Bonificación",
    description:
      "Solicitud de bonificación asociada a una operación comercial.",
    active: true,
    order: 1,

    requesterRoles: [
      "VENDEDOR",
      "JEFATURA_LOCAL",
      "JEFATURA_MARCA",
      "JEFATURA_ZONAL",
      "GERENCIA_VENTAS",
    ],

    requiresApproval: true,
    hasManagementStage: true,

    confirmationHours: 48,

    academyEnabled: false,

    internalCheckpoints: [
      {
        id: "BON_SOLICITUD_MARCA",
        label: "Solicitud realizada a marca",
        order: 1,
      },
      {
        id: "BON_FACTURA_RECIBIDA",
        label: "Factura recibida",
        order: 2,
      },
    ],
  },

  {
    code: "UNI-PED-01",
    family: "UNIDADES",
    name: "Creación / Notificación de pedido",
    description:
      "Solicitud asociada a creación o notificación de pedidos de unidades.",
    active: true,
    order: 2,

    requesterRoles: [
      "VENDEDOR",
      "JEFATURA_LOCAL",
      "JEFATURA_MARCA",
      "JEFATURA_ZONAL",
    ],

    requiresApproval: true,
    hasManagementStage: true,

    confirmationHours: 48,

    academyEnabled: false,
  },

  {
    code: "UNI-TRA-01",
    family: "UNIDADES",
    name: "Traslado de unidad",
    description:
      "Solicitud para gestionar el traslado de una unidad.",
    active: true,
    order: 3,

    requesterRoles: [
      "VENDEDOR",
      "JEFATURA_LOCAL",
      "JEFATURA_MARCA",
      "JEFATURA_ZONAL",
    ],

    requiresApproval: true,
    hasManagementStage: true,

    confirmationHours: 48,

    academyEnabled: false,
  },

  {
    code: "UNI-GES-01",
    family: "UNIDADES",
    name: "Gestión de unidad",
    description:
      "Otras gestiones operativas asociadas a una unidad.",
    active: false,
    order: 4,

    requesterRoles: [
      "JEFATURA_LOCAL",
    ],

    requiresApproval: false,
    hasManagementStage: true,

    confirmationHours: 48,

    academyEnabled: false,
  },

  {
    code: "UNI-DEV-WEB-01",
    family: "UNIDADES",
    name: "Devolución Web",
    description:
      "Solicitud de devolución asociada a una reserva o pago web.",
    active: false,
    order: 5,

    requesterRoles: [
      "JEFATURA_LOCAL",
    ],

    requiresApproval: true,
    hasManagementStage: true,

    confirmationHours: 48,

    academyEnabled: false,
  },

  {
    code: "UNI-VUEL-01",
    family: "UNIDADES",
    name: "Vuelto de negocio",
    description:
      "Solicitud de devolución por diferencia entre VPP y pie del negocio.",
    active: false,
    order: 6,

    requesterRoles: [
      "JEFATURA_LOCAL",
    ],

    requiresApproval: true,
    hasManagementStage: true,

    confirmationHours: 48,

    academyEnabled: false,
  },

  {
    code: "UNI-PAT-01",
    family: "UNIDADES",
    name: "Patentes",
    description:
      "Solicitud de patentes para unidades en exhibición o gestión comercial.",
    active: true,
    order: 7,

    requesterRoles: [
      "JEFATURA_LOCAL",
    ],

    requiresApproval: false,
    hasManagementStage: true,

    confirmationHours: 48,

    academyEnabled: false,
  },


  // ------------------------------------------------------
  // INSUMOS Y SHOWROOM
  // ------------------------------------------------------

  {
    code: "INS-PED-01",
    family: "INSUMOS_SHOWROOM",
    name: "Pedido de insumos",
    description:
      "Reposición de insumos operativos para el funcionamiento del local.",
    active: true,
    order: 1,

    requesterRoles: [
      "JEFATURA_LOCAL",
    ],

    requiresApproval: false,
    hasManagementStage: true,

    confirmationHours: 48,

    academyEnabled: false,
  },

  {
    code: "INS-ZEX-01",
    family: "INSUMOS_SHOWROOM",
    name: "Zonas de experiencia",
    description:
      "Necesidades asociadas a zona de café, zona de niños, espera y hospitalidad.",
    active: true,
    order: 2,

    requesterRoles: [
      "JEFATURA_LOCAL",
      "EXPERIENCIA_CLIENTES",
    ],

    requiresApproval: false,
    hasManagementStage: true,

    confirmationHours: 48,

    academyEnabled: false,
  },

  {
    code: "INS-MOB-01",
    family: "INSUMOS_SHOWROOM",
    name: "Mobiliario y equipamiento",
    description:
      "Reposición o necesidad de mobiliario y equipamiento del local.",
    active: true,
    order: 3,

    requesterRoles: [
      "JEFATURA_LOCAL",
      "EXPERIENCIA_CLIENTES",
    ],

    requiresApproval: false,
    hasManagementStage: true,

    confirmationHours: 48,

    academyEnabled: false,
  },

  {
    code: "INS-MAN-01",
    family: "INSUMOS_SHOWROOM",
    name: "Instalaciones y mantención",
    description:
      "Pintura, iluminación, enchufes, puertas, cerraduras, climatización y otras necesidades del local.",
    active: true,
    order: 4,

    requesterRoles: [
      "JEFATURA_LOCAL",
      "EXPERIENCIA_CLIENTES",
    ],

    requiresApproval: false,
    hasManagementStage: true,

    confirmationHours: 48,

    academyEnabled: false,
  },


  // ------------------------------------------------------
  // COLABORADORES
  // ------------------------------------------------------

  {
    code: "COL-CRE-01",
    family: "COLABORADORES",
    name: "Credencial",
    description:
      "Solicitud de creación o reposición de credencial de colaborador.",
    active: true,
    order: 1,

    requesterRoles: [
      "VENDEDOR",
      "JEFATURA_LOCAL",
      "JEFATURA_MARCA",
      "JEFATURA_ZONAL",
      "EXPERIENCIA_CLIENTES",
    ],

    requiresApproval: false,
    hasManagementStage: true,

    confirmationHours: 48,

    academyEnabled: false,
  },

  {
    code: "COL-FIR-01",
    family: "COLABORADORES",
    name: "Pie de firma",
    description:
      "Solicitud de creación o ajuste del pie de firma corporativo.",
    active: true,
    order: 2,

    requesterRoles: [
      "VENDEDOR",
      "JEFATURA_LOCAL",
      "JEFATURA_MARCA",
      "JEFATURA_ZONAL",
      "EXPERIENCIA_CLIENTES",
    ],

    requiresApproval: false,
    hasManagementStage: true,

    confirmationHours: 48,

    academyEnabled: false,
  },


  // ------------------------------------------------------
  // OTROS
  // ------------------------------------------------------

  {
    code: "OTR-GEN-01",
    family: "OTROS",
    name: "Otra solicitud",
    description:
      "Solicitud que no corresponde todavía a un proceso específico.",
    active: true,
    order: 1,

    requesterRoles: [
      "VENDEDOR",
      "JEFATURA_LOCAL",
      "JEFATURA_MARCA",
      "JEFATURA_ZONAL",
      "GERENCIA_VENTAS",
      "JEFATURA_COMERCIAL_CLIENTES",
      "JEFATURA_OPERACIONES_COMERCIALES",
      "JEFATURA_ADMINISTRACION",
      "GERENCIA_ADMINISTRACION",
      "GERENCIA_COMERCIAL",
      "JEFATURA_MARKETING",
      "EXPERIENCIA_CLIENTES",
      "ADMINISTRATIVO",
      "EQUIPO_COMERCIAL",
      "GERENCIA_GENERAL",
    ],

    requiresApproval: false,
    hasManagementStage: true,

    confirmationHours: 48,

    academyEnabled: false,
  },
]


// ======================================================
// CAMPOS DE PROCESO
// ======================================================

export const mockProcessFields: ProcessFieldDefinition[] = [
  // ------------------------------------------------------
  // BONIFICACIÓN
  // ------------------------------------------------------

  {
    id: "BON_NV",
    processCode: "UNI-BON-01",
    label: "Número de venta",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 1,
    placeholder: "Ej. 66534",
    active: true,
  },

  {
    id: "BON_CLIENTE",
    processCode: "UNI-BON-01",
    label: "Cliente",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 2,
    placeholder: "Nombre del cliente",
    active: true,
  },

  {
    id: "BON_MARCA",
    processCode: "UNI-BON-01",
    label: "Marca",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 3,
    placeholder: "Marca",
    active: true,
  },

  {
    id: "BON_MODELO",
    processCode: "UNI-BON-01",
    label: "Modelo",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 4,
    placeholder: "Modelo",
    active: true,
  },

  {
    id: "BON_MONTO",
    processCode: "UNI-BON-01",
    label: "Monto solicitado",
    type: "CURRENCY",
    required: true,
    adjustable: true,
    order: 5,
    placeholder: "Monto",
    active: true,
  },

  {
    id: "BON_MOTIVO",
    processCode: "UNI-BON-01",
    label: "Motivo",
    type: "TEXTAREA",
    required: true,
    adjustable: false,
    order: 6,
    placeholder:
      "Explica brevemente el motivo de la solicitud.",
    active: true,
  },


  // ------------------------------------------------------
  // CREACIÓN / NOTIFICACIÓN DE PEDIDO
  // ------------------------------------------------------

  {
    id: "PED_NV",
    processCode: "UNI-PED-01",
    label: "Número de venta",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 1,
    active: true,
  },

  {
    id: "PED_MARCA",
    processCode: "UNI-PED-01",
    label: "Marca",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 2,
    active: true,
  },

  {
    id: "PED_MODELO",
    processCode: "UNI-PED-01",
    label: "Modelo / versión",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 3,
    active: true,
  },

  {
    id: "PED_DETALLE",
    processCode: "UNI-PED-01",
    label: "Detalle",
    type: "TEXTAREA",
    required: true,
    adjustable: false,
    order: 4,
    active: true,
  },


  // ------------------------------------------------------
  // TRASLADO
  // ------------------------------------------------------

  {
    id: "TRA_VIN",
    processCode: "UNI-TRA-01",
    label: "VIN / Chasis",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 1,
    active: true,
  },

  {
    id: "TRA_MARCA",
    processCode: "UNI-TRA-01",
    label: "Marca",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 2,
    active: true,
  },

  {
    id: "TRA_MODELO",
    processCode: "UNI-TRA-01",
    label: "Modelo",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 3,
    active: true,
  },

  {
    id: "TRA_ORIGEN",
    processCode: "UNI-TRA-01",
    label: "Local de origen",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 4,
    active: true,
  },

  {
    id: "TRA_DESTINO",
    processCode: "UNI-TRA-01",
    label: "Local de destino",
    type: "TEXT",
    required: true,
    adjustable: true,
    order: 5,
    active: true,
  },

  {
    id: "TRA_MOTIVO",
    processCode: "UNI-TRA-01",
    label: "Motivo del traslado",
    type: "TEXTAREA",
    required: true,
    adjustable: false,
    order: 6,
    active: true,
  },


  // ------------------------------------------------------
  // PATENTES
  // ------------------------------------------------------

  {
    id: "PAT_MARCA",
    processCode: "UNI-PAT-01",
    label: "Marca",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 1,
    active: true,
  },

  {
    id: "PAT_CANTIDAD",
    processCode: "UNI-PAT-01",
    label: "Cantidad",
    type: "NUMBER",
    required: true,
    adjustable: true,
    order: 2,
    active: true,
  },

  {
    id: "PAT_MOTIVO",
    processCode: "UNI-PAT-01",
    label: "Motivo de reposición",
    type: "TEXTAREA",
    required: true,
    adjustable: false,
    order: 3,
    active: true,
  },


  // ------------------------------------------------------
  // PEDIDO DE INSUMOS
  // ------------------------------------------------------

  {
    id: "INS_OBSERVACION",
    processCode: "INS-PED-01",
    label: "Observaciones del pedido",
    type: "TEXTAREA",
    required: false,
    adjustable: false,
    order: 1,
    placeholder:
      "Agrega información relevante si es necesario.",
    active: true,
  },


  // ------------------------------------------------------
  // ZONAS DE EXPERIENCIA
  // ------------------------------------------------------

  {
    id: "ZEX_ZONA",
    processCode: "INS-ZEX-01",
    label: "Zona",
    type: "SELECT",
    required: true,
    adjustable: false,
    order: 1,
    options: [
      "Zona de café",
      "Zona de niños",
      "Zona de espera",
      "Otra",
    ],
    active: true,
  },

  {
    id: "ZEX_NECESIDAD",
    processCode: "INS-ZEX-01",
    label: "¿Qué se necesita?",
    type: "TEXTAREA",
    required: true,
    adjustable: false,
    order: 2,
    active: true,
  },


  // ------------------------------------------------------
  // MOBILIARIO
  // ------------------------------------------------------

  {
    id: "MOB_ELEMENTO",
    processCode: "INS-MOB-01",
    label: "Mobiliario o equipamiento",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 1,
    active: true,
  },

  {
    id: "MOB_DETALLE",
    processCode: "INS-MOB-01",
    label: "Detalle de la necesidad",
    type: "TEXTAREA",
    required: true,
    adjustable: false,
    order: 2,
    active: true,
  },


  // ------------------------------------------------------
  // INSTALACIONES Y MANTENCIÓN
  // ------------------------------------------------------

  {
    id: "MAN_TIPO",
    processCode: "INS-MAN-01",
    label: "Tipo de necesidad",
    type: "SELECT",
    required: true,
    adjustable: false,
    order: 1,
    options: [
      "Iluminación",
      "Pintura",
      "Puerta o cerradura",
      "Enchufe o electricidad",
      "Climatización",
      "Infraestructura",
      "Otra",
    ],
    active: true,
  },

  {
    id: "MAN_DETALLE",
    processCode: "INS-MAN-01",
    label: "Detalle",
    type: "TEXTAREA",
    required: true,
    adjustable: false,
    order: 2,
    active: true,
  },


  // ------------------------------------------------------
  // CREDENCIAL
  // ------------------------------------------------------

  {
    id: "CRE_NOMBRE",
    processCode: "COL-CRE-01",
    label: "Nombre del colaborador",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 1,
    active: true,
  },

  {
    id: "CRE_CARGO",
    processCode: "COL-CRE-01",
    label: "Cargo",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 2,
    active: true,
  },

  {
    id: "CRE_LOCAL",
    processCode: "COL-CRE-01",
    label: "Local",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 3,
    active: true,
  },

  {
    id: "CRE_TIPO",
    processCode: "COL-CRE-01",
    label: "Tipo de solicitud",
    type: "SELECT",
    required: true,
    adjustable: false,
    order: 4,
    options: [
      "Nueva",
      "Reposición",
      "Cambio de cargo",
      "Otro",
    ],
    active: true,
  },


  // ------------------------------------------------------
  // PIE DE FIRMA
  // ------------------------------------------------------

  {
    id: "FIR_NOMBRE",
    processCode: "COL-FIR-01",
    label: "Nombre del colaborador",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 1,
    active: true,
  },

  {
    id: "FIR_CARGO",
    processCode: "COL-FIR-01",
    label: "Cargo",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 2,
    active: true,
  },

  {
    id: "FIR_EMAIL",
    processCode: "COL-FIR-01",
    label: "Correo corporativo",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 3,
    active: true,
  },

  {
    id: "FIR_LOCAL",
    processCode: "COL-FIR-01",
    label: "Local / Área",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 4,
    active: true,
  },


  // ------------------------------------------------------
  // OTROS
  // ------------------------------------------------------

  {
    id: "OTR_ASUNTO",
    processCode: "OTR-GEN-01",
    label: "Asunto",
    type: "TEXT",
    required: true,
    adjustable: false,
    order: 1,
    active: true,
  },

  {
    id: "OTR_DETALLE",
    processCode: "OTR-GEN-01",
    label: "Detalle de la solicitud",
    type: "TEXTAREA",
    required: true,
    adjustable: false,
    order: 2,
    active: true,
  },
]


// ======================================================
// ASIGNACIONES DE PROCESO
// ======================================================

export const mockProcessAssignments: ProcessAssignment[] = [
  // ------------------------------------------------------
  // BONIFICACIÓN
  // APROBACIÓN Y GESTIÓN:
  // JEFATURA OPERACIONES COMERCIALES
  // ------------------------------------------------------

  {
    id: "BON-APP-OPS",
    processCode: "UNI-BON-01",
    type: "APPROVER",
    role: "JEFATURA_OPERACIONES_COMERCIALES",
    active: true,
  },

  {
    id: "BON-MAN-OPS",
    processCode: "UNI-BON-01",
    type: "MANAGER",
    role: "JEFATURA_OPERACIONES_COMERCIALES",
    active: true,
  },


  // VISIBILIDAD BONIFICACIÓN

  {
    id: "BON-VIEW-COMCLI",
    processCode: "UNI-BON-01",
    type: "VIEWER",
    role: "JEFATURA_COMERCIAL_CLIENTES",
    active: true,
  },

  {
    id: "BON-VIEW-MARCA",
    processCode: "UNI-BON-01",
    type: "VIEWER",
    role: "JEFATURA_MARCA",
    active: true,
  },

  {
    id: "BON-VIEW-ZONAL",
    processCode: "UNI-BON-01",
    type: "VIEWER",
    role: "JEFATURA_ZONAL",
    active: true,
  },

  {
    id: "BON-VIEW-GV",
    processCode: "UNI-BON-01",
    type: "VIEWER",
    role: "GERENCIA_VENTAS",
    active: true,
  },

  {
    id: "BON-VIEW-GC",
    processCode: "UNI-BON-01",
    type: "VIEWER",
    role: "GERENCIA_COMERCIAL",
    active: true,
  },


  // ------------------------------------------------------
  // TRASLADO
  // ------------------------------------------------------

  {
    id: "TRA-APP-OPS",
    processCode: "UNI-TRA-01",
    type: "APPROVER",
    role: "JEFATURA_OPERACIONES_COMERCIALES",
    active: true,
  },

  {
    id: "TRA-MAN-OPS",
    processCode: "UNI-TRA-01",
    type: "MANAGER",
    role: "JEFATURA_OPERACIONES_COMERCIALES",
    active: true,
  },


  // ------------------------------------------------------
  // CREDENCIAL
  // ------------------------------------------------------

  {
    id: "CRE-MAN-CX",
    processCode: "COL-CRE-01",
    type: "MANAGER",
    role: "EXPERIENCIA_CLIENTES",
    active: true,
  },


  // ------------------------------------------------------
  // PIE DE FIRMA
  //
  // Los 2 responsables específicos de Marketing
  // se configurarán por correo en Lists.
  // No inventamos esos correos en el mock.
  // ------------------------------------------------------

  {
    id: "FIR-VIEW-MKT",
    processCode: "COL-FIR-01",
    type: "VIEWER",
    role: "JEFATURA_MARKETING",
    active: true,
  },


  // ------------------------------------------------------
  // GERENCIA GENERAL
  // VISIÓN GENERAL
  // ------------------------------------------------------

  {
    id: "BON-VIEW-GG",
    processCode: "UNI-BON-01",
    type: "VIEWER",
    role: "GERENCIA_GENERAL",
    active: true,
  },

  {
    id: "TRA-VIEW-GG",
    processCode: "UNI-TRA-01",
    type: "VIEWER",
    role: "GERENCIA_GENERAL",
    active: true,
  },

  {
    id: "CRE-VIEW-GG",
    processCode: "COL-CRE-01",
    type: "VIEWER",
    role: "GERENCIA_GENERAL",
    active: true,
  },

  {
    id: "FIR-VIEW-GG",
    processCode: "COL-FIR-01",
    type: "VIEWER",
    role: "GERENCIA_GENERAL",
    active: true,
  },
]


// ======================================================
// SOLICITUDES DEMO
// ======================================================

export const mockRequests: RequestItem[] = [
  {
    id: "SOL-001",

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
      "operaciones.comerciales@ditalcar.cl",

    currentResponsibleName:
      "Jefatura Operaciones Comerciales",

    fields: [
      {
        fieldId: "BON_NV",
        requestedValue: "66534",
      },
      {
        fieldId: "BON_CLIENTE",
        requestedValue:
          "Cliente Demo",
      },
      {
        fieldId: "BON_MARCA",
        requestedValue:
          "Chery",
      },
      {
        fieldId: "BON_MODELO",
        requestedValue:
          "Tiggo 7",
      },
      {
        fieldId: "BON_MONTO",
        requestedValue:
          "350000",
      },
      {
        fieldId: "BON_MOTIVO",
        requestedValue:
          "Apoyo para cierre de negocio.",
      },
    ],

    createdAt:
      "2026-08-31T09:10:00-04:00",

    approvalSLAPausedMinutes: 0,

    reopened: false,
    autoClosed: false,

    internalCheckpoints: [
      {
        checkpointId:
          "BON_SOLICITUD_MARCA",
        completed: false,
      },
      {
        checkpointId:
          "BON_FACTURA_RECIBIDA",
        completed: false,
      },
    ],
  },

  {
    id: "SOL-002",

    processCode: "UNI-TRA-01",
    processName: "Traslado de unidad",
    family: "UNIDADES",

    requesterEmail:
      "jefatura.local@ditalcar.cl",
    requesterName:
      "Jefatura Local Demo",
    requesterRole:
      "JEFATURA_LOCAL",

    local: "Vespucio",

    status:
      "PENDIENTE_APROBACION",

    currentResponsibleEmail:
      "operaciones.comerciales@ditalcar.cl",

    currentResponsibleName:
      "Jefatura Operaciones Comerciales",

    fields: [
      {
        fieldId: "TRA_VIN",
        requestedValue:
          "VIN-DEMO-001",
      },
      {
        fieldId: "TRA_MARCA",
        requestedValue:
          "Chery",
      },
      {
        fieldId: "TRA_MODELO",
        requestedValue:
          "Tiggo 8",
      },
      {
        fieldId: "TRA_ORIGEN",
        requestedValue:
          "Cantagallo",
      },
      {
        fieldId: "TRA_DESTINO",
        requestedValue:
          "Vespucio",
      },
      {
        fieldId: "TRA_MOTIVO",
        requestedValue:
          "Unidad requerida para cliente.",
      },
    ],

    createdAt:
      "2026-08-31T08:30:00-04:00",

    approvalSLAPausedMinutes: 0,

    reopened: false,
    autoClosed: false,

    internalCheckpoints: [],
  },

  {
    id: "SOL-003",

    processCode: "COL-CRE-01",
    processName: "Credencial",
    family: "COLABORADORES",

    requesterEmail:
      "jefatura.local@ditalcar.cl",
    requesterName:
      "Jefatura Local Demo",
    requesterRole:
      "JEFATURA_LOCAL",

    local: "Vespucio",

    status:
      "EN_GESTION",

    currentResponsibleEmail:
      "experiencia.clientes@ditalcar.cl",

    currentResponsibleName:
      "Experiencia de Clientes",

    fields: [
      {
        fieldId: "CRE_NOMBRE",
        requestedValue:
          "Colaborador Demo",
      },
      {
        fieldId: "CRE_CARGO",
        requestedValue:
          "Vendedor",
      },
      {
        fieldId: "CRE_LOCAL",
        requestedValue:
          "Vespucio",
      },
      {
        fieldId: "CRE_TIPO",
        requestedValue:
          "Nueva",
      },
    ],

    createdAt:
      "2026-08-30T16:20:00-04:00",

    approvalSLAPausedMinutes: 0,

    reopened: false,
    autoClosed: false,

    internalCheckpoints: [],
  },
]


// ======================================================
// HISTORIAL DEMO
// ======================================================

export const mockRequestTimeline: RequestTimelineItem[] = [
  {
    id: "SEG-001",
    requestId: "SOL-001",
    type: "CREATED",

    authorEmail:
      "vendedor.demo@ditalcar.cl",
    authorName:
      "Vendedor Demo",

    createdAt:
      "2026-08-31T09:10:00-04:00",

    comment:
      "Solicitud creada.",
  },

  {
    id: "SEG-002",
    requestId: "SOL-002",
    type: "CREATED",

    authorEmail:
      "jefatura.local@ditalcar.cl",
    authorName:
      "Jefatura Local Demo",

    createdAt:
      "2026-08-31T08:30:00-04:00",

    comment:
      "Solicitud de traslado creada.",
  },

  {
    id: "SEG-003",
    requestId: "SOL-003",
    type: "CREATED",

    authorEmail:
      "jefatura.local@ditalcar.cl",
    authorName:
      "Jefatura Local Demo",

    createdAt:
      "2026-08-30T16:20:00-04:00",

    comment:
      "Solicitud de credencial registrada.",
  },

  {
    id: "SEG-004",
    requestId: "SOL-003",
    type: "MANAGEMENT",

    authorEmail:
      "experiencia.clientes@ditalcar.cl",
    authorName:
      "Experiencia de Clientes",

    createdAt:
      "2026-08-31T09:00:00-04:00",

    comment:
      "Solicitud recibida para gestión.",
  },
]


// ======================================================
// ADJUNTOS DEMO
// ======================================================

export const mockAttachments: RequestAttachment[] = [
  {
    id: "ADJ-001",
    requestId: "SOL-001",

    fileName:
      "respaldo-bonificacion.pdf",

    stage: "SOLICITUD",

    uploadedByEmail:
      "vendedor.demo@ditalcar.cl",

    uploadedByName:
      "Vendedor Demo",

    uploadedAt:
      "2026-08-31T09:10:00-04:00",
  },
]


// ======================================================
// FORMULARIOS
//
// Estos datos siguen siendo DEMO.
// Los links sí corresponden a los Forms que después
// leeremos desde 12_Formularios.
// ======================================================

export type MockFormDefinition = {
  code: string
  name: string
  description: string
  url: string

  frequency:
    | "SEMANAL"
    | "QUINCENAL"
    | "SEGUN_PLAN"

  roles: string[]

  stellantisOnly: boolean

  active: boolean
}


export const mockForms: MockFormDefinition[] = [
  {
    code: "FOR-RUTA-01",

    name:
      "Ruta de Experiencia",

    description:
      "Revisión semanal de estándares visuales, físicos y operacionales del local.",

    url:
      "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=hSzArnhODUilGQQSUxh3cWkTgPCss7NNnCuYtKwOFnpUOU9OTVQ4RzRQUjQ4UlhRVlQ0UlpCU09EUy4u",

    frequency:
      "SEMANAL",

    roles: [
      "JEFATURA_LOCAL",
    ],

    stellantisOnly:
      false,

    active:
      true,
  },

  {
    code: "FOR-TOUR-STL-01",

    name:
      "Tour del Manager VN · Stellantis",

    description:
      "Revisión quincenal correspondiente a locales Stellantis.",

    url:
      "https://forms.cloud.microsoft/r/nx2f9XGGLg",

    frequency:
      "QUINCENAL",

    roles: [
      "JEFATURA_LOCAL",
    ],

    stellantisOnly:
      true,

    active:
      true,
  },

  {
    code: "FOR-AUD-RUTA-01",

    name:
      "Auditoría Ruta Experiencia",

    description:
      "Auditoría de contraste para revisar la exactitud de la Ruta de Experiencia.",

    url:
      "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=hSzArnhODUilGQQSUxh3cWkTgPCss7NNnCuYtKwOFnpUNk42MEdFVTJHUFlPR0pDUUMyUjJJOVFITi4u",

    frequency:
      "SEGUN_PLAN",

    roles: [
      "EXPERIENCIA_CLIENTES",
      "JEFATURA_COMERCIAL_CLIENTES",
    ],

    stellantisOnly:
      false,

    active:
      true,
  },
]


// ======================================================
// EJECUCIONES DE FORMULARIOS DEMO
// ======================================================

export type MockFormExecution = {
  id: string

  formCode: string

  local: string

  completedByName: string
  completedByEmail: string

  completedAt: string

  compliant: number
  nonCompliant: number
  requested: number
}


export const mockFormExecutions: MockFormExecution[] = [
  {
    id: "EJ-RUTA-001",

    formCode:
      "FOR-RUTA-01",

    local:
      "Vespucio",

    completedByName:
      "Jefatura Local Demo",

    completedByEmail:
      "jefatura.local@ditalcar.cl",

    completedAt:
      "2026-08-27T10:12:00-04:00",

    compliant: 19,
    nonCompliant: 2,
    requested: 1,
  },

  {
    id: "EJ-TOUR-001",

    formCode:
      "FOR-TOUR-STL-01",

    local:
      "Stellantis Costanera",

    completedByName:
      "Jefatura Local Demo",

    completedByEmail:
      "jefatura.local@ditalcar.cl",

    completedAt:
      "2026-08-26T11:20:00-04:00",

    compliant: 25,
    nonCompliant: 3,
    requested: 0,
  },
]


// ======================================================
// BRECHAS DE FORMULARIOS DEMO
// ======================================================

export type MockFormBreach = {
  id: string

  executionId: string
  formCode: string

  local: string

  section: string
  question: string

  status:
    | "NO_CUMPLE"
    | "SOLICITADO"

  mappedProcessCode?: string

  linkedRequestId?: string
}


export const mockFormBreaches: MockFormBreach[] = [
  {
    id: "BRE-RUTA-001",

    executionId:
      "EJ-RUTA-001",

    formCode:
      "FOR-RUTA-01",

    local:
      "Vespucio",

    section:
      "Imagen del equipo",

    question:
      "¿Todos los colaboradores cuentan con su credencial?",

    status:
      "NO_CUMPLE",

    mappedProcessCode:
      "COL-CRE-01",
  },

  {
    id: "BRE-RUTA-002",

    executionId:
      "EJ-RUTA-001",

    formCode:
      "FOR-RUTA-01",

    local:
      "Vespucio",

    section:
      "Zonas de Experiencia",

    question:
      "¿La zona de café se encuentra operativa y correctamente abastecida?",

    status:
      "NO_CUMPLE",

    mappedProcessCode:
      "INS-ZEX-01",
  },

  {
    id: "BRE-RUTA-003",

    executionId:
      "EJ-RUTA-001",

    formCode:
      "FOR-RUTA-01",

    local:
      "Vespucio",

    section:
      "Imagen del equipo",

    question:
      "¿Los colaboradores cuentan con pie de firma corporativo?",

    status:
      "SOLICITADO",

    mappedProcessCode:
      "COL-FIR-01",

    linkedRequestId:
      "SOL-003",
  },
]
