import {
  demoSupplyCatalog,
  ditalcarLocals,
  knownPeopleByEmail,
  requestAssignments,
  requestFields,
  requestProcesses,
} from "../data/requestConfig"
import type {
  ProcessAssignment,
  ProcessConfig,
  ProcessFieldDefinition,
  UserScope,
} from "../types"

const DEMO_EMAILS = new Set([
  "vendedor.demo@ditalcar.cl",
  "jefatura.local@ditalcar.cl",
  "jefatura.marca@ditalcar.cl",
  "jefatura.zonal@ditalcar.cl",
  "gerencia.marca@ditalcar.cl",
  "gerencia.ventas@ditalcar.cl",
  "comercial.clientes@ditalcar.cl",
  "operaciones.comerciales@ditalcar.cl",
  "jefatura.administracion@ditalcar.cl",
  "gerencia.administracion@ditalcar.cl",
  "gerencia.comercial@ditalcar.cl",
  "marketing@ditalcar.cl",
  "experiencia.clientes@ditalcar.cl",
  "administrativo@ditalcar.cl",
  "junior.demo@ditalcar.cl",
  "equipo.comercial@ditalcar.cl",
  "project.manager@ditalcar.cl",
  "gerencia.general@ditalcar.cl",
])

const LEGACY_FIELD_ALIASES: Record<string, string> = {
  BON_NV: "UNI-BON-01-NV_OPERACION",
  BON_CLIENTE: "UNI-BON-01-DETALLE",
  BON_MARCA: "UNI-BON-01-MARCA",
  BON_MODELO: "UNI-BON-01-MODELO",
  BON_MONTO: "UNI-BON-01-MONTO_SOLICITADO",
  BON_MOTIVO: "UNI-BON-01-MOTIVO",
  PED_NV: "UNI-PED-01-NV_OPERACION",
  PED_MARCA: "UNI-PED-01-MARCA",
  PED_MODELO: "UNI-PED-01-MODELO",
  PED_DETALLE: "UNI-PED-01-DETALLE",
  TRA_VIN: "UNI-TRA-01-VIN",
  TRA_MARCA: "UNI-TRA-01-MARCA",
  TRA_MODELO: "UNI-TRA-01-MODELO",
  TRA_ORIGEN: "UNI-TRA-01-LOCAL_ORIGEN",
  TRA_DESTINO: "UNI-TRA-01-LOCAL_DESTINO",
  TRA_MOTIVO: "UNI-TRA-01-MOTIVO",
  CRE_NOMBRE: "COL-CRE-01-NOMBRE_COLABORADOR",
  CRE_CARGO: "COL-CRE-01-CARGO",
  CRE_TIPO: "COL-CRE-01-TIPO_CREDENCIAL",
  FIR_NOMBRE: "COL-FIR-01-NOMBRE_COLABORADOR",
  FIR_CARGO: "COL-FIR-01-CARGO",
  FIR_EMAIL: "COL-FIR-01-EMAIL_CORPORATIVO",
}

export function isDemoUser(user: UserScope) {
  return DEMO_EMAILS.has(user.email.toLowerCase())
}

export function getRequestProcesses(): ProcessConfig[] {
  return requestProcesses
}

export function getRequestProcess(code: string) {
  return requestProcesses.find((process) => process.code === code)
}

function migratedRoleMatches(
  userRole: UserScope["role"],
  configuredRole?: UserScope["role"]
) {
  if (!configuredRole) return false
  if (configuredRole === userRole) return true

  // Durante la migración, GERENCIA_MARCA reemplaza los antiguos
  // perfiles JEFATURA_MARCA / JEFATURA_ZONAL en configuraciones existentes.
  if (userRole === "GERENCIA_MARCA") {
    return ["JEFATURA_MARCA", "JEFATURA_ZONAL"].includes(configuredRole)
  }

  return false
}

export function getProcessesForUser(user: UserScope) {
  return requestProcesses
    .filter(
      (process) =>
        process.active &&
        process.manualRequest &&
        process.requesterRoles.some((role) =>
          migratedRoleMatches(user.role, role)
        )
    )
    .sort((a, b) => a.order - b.order)
}

export function getRequestFields(processCode: string) {
  return requestFields
    .filter(
      (field) =>
        field.active && field.processCode === processCode
    )
    .sort((a, b) => a.order - b.order)
}

export function getFieldDefinition(
  fieldId: string,
  processCode?: string
): ProcessFieldDefinition | undefined {
  const baseId = fieldId.replace(/__(\d+)$/, "")
  const direct = requestFields.find((field) => field.id === baseId)
  if (direct) return direct

  const alias = LEGACY_FIELD_ALIASES[baseId]
  if (alias) {
    return requestFields.find((field) => field.id === alias)
  }

  if (processCode) {
    return requestFields.find(
      (field) =>
        field.processCode === processCode && field.key === baseId
    )
  }

  return undefined
}

export function getProcessAssignments(processCode: string) {
  return requestAssignments
    .filter(
      (assignment) =>
        assignment.active &&
        assignment.processCode === processCode
    )
    .sort(
      (a, b) => (a.priority ?? 999) - (b.priority ?? 999)
    )
}

export function getPrimaryAssignment(
  processCode: string,
  type: ProcessAssignment["type"]
) {
  const options = getProcessAssignments(processCode).filter(
    (assignment) => assignment.type === type
  )

  return (
    options.find((assignment) => assignment.isPrincipal) ??
    options[0]
  )
}

export function getKnownPersonName(email?: string) {
  if (!email) return undefined
  return knownPeopleByEmail[email.toLowerCase()]
}

export function assignmentMatchesUser(
  user: UserScope,
  assignment: ProcessAssignment
) {
  if (!assignment.active) return false

  if (assignment.email) {
    if (
      assignment.email.toLowerCase() === user.email.toLowerCase()
    ) {
      return true
    }

    // Solo para el piloto: un perfil demo puede simular el cargo
    // asociado a una asignación individual. En producción el email
    // será exacto desde 11_AsignacionesProceso.
    if (
      isDemoUser(user) &&
      assignment.role &&
      migratedRoleMatches(user.role, assignment.role)
    ) {
      return true
    }

    return false
  }

  if (
    assignment.role &&
    !migratedRoleMatches(user.role, assignment.role)
  ) {
    return false
  }

  if (
    assignment.areaFunctional &&
    user.areaFunctional &&
    assignment.areaFunctional.toLowerCase() !==
      user.areaFunctional.toLowerCase()
  ) {
    return false
  }

  return Boolean(assignment.role)
}

export function getAssignmentVisibleLabel(
  assignment?: ProcessAssignment
) {
  return assignment?.label ?? assignment?.areaFunctional ?? "Responsable"
}

export function getSupplyCatalog() {
  return demoSupplyCatalog
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

export function getLocalOptions(
  user: UserScope,
  forcedLocal?: string
) {
  if (forcedLocal) {
    return {
      mode: "LOCKED" as const,
      options: [forcedLocal],
      selected: forcedLocal,
    }
  }

  const explicit = unique([
    ...(user.assignedLocals ?? []),
    ...(user.local ? [user.local] : []),
    ...(user.localPrincipal ? [user.localPrincipal] : []),
  ])

  if (explicit.length === 1) {
    return {
      mode: "LOCKED" as const,
      options: explicit,
      selected: explicit[0],
    }
  }

  if (explicit.length > 1) {
    return {
      mode: "SELECT" as const,
      options: explicit,
      selected: user.localPrincipal ?? explicit[0],
    }
  }

  const brandScope =
    user.scope === "MARCA" ||
    user.role === "GERENCIA_MARCA" ||
    user.role === "JEFATURA_MARCA"

  if (brandScope && user.brands?.length) {
    const brands = user.brands.map(normalize)
    const options = ditalcarLocals
      .filter((local) =>
        local.brands.some((brand) =>
          brands.includes(normalize(brand))
        )
      )
      .map((local) => local.name)

    return {
      mode: options.length > 1 ? ("SELECT" as const) : ("LOCKED" as const),
      options,
      selected: options[0] ?? "",
    }
  }

  if (user.role === "JEFATURA_ZONAL" || user.scope === "ZONA") {
    const options = ditalcarLocals
      .filter(
        (local) =>
          local.operation !== "GEELY" &&
          local.operation !== "STELLANTIS"
      )
      .map((local) => local.name)

    return {
      mode: "SELECT" as const,
      options,
      selected: options[0] ?? "",
    }
  }

  const redRoles: UserScope["role"][] = [
    "GERENCIA_VENTAS",
    "GERENCIA_COMERCIAL",
    "GERENCIA_ADMINISTRACION",
    "JEFATURA_COMERCIAL_CLIENTES",
    "JEFATURA_OPERACIONES_COMERCIALES",
    "JEFATURA_ADMINISTRACION",
    "JEFATURA_MARKETING",
    "EXPERIENCIA_CLIENTES",
  ]

  if (user.scope === "RED" || redRoles.includes(user.role)) {
    const options = ditalcarLocals.map((local) => local.name)
    return {
      mode: "SELECT" as const,
      options,
      selected: options[0] ?? "",
    }
  }

  return {
    mode: "LOCKED" as const,
    options: [user.local ?? "Vespucio"],
    selected: user.local ?? "Vespucio",
  }
}
