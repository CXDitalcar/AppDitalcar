import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react"

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Layers3,
  Link2,
  Package,
  Paperclip,
  Users,
} from "lucide-react"

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom"

import "./NuevaSolicitud.css"

import {
  mockFormBreaches,
  mockFormExecutions,
  mockForms,
  mockProcessFields,
  mockProcesses,
  mockUsers,
} from "../data/mockData"

import {
  createDemoRequest,
  getDemoRequests,
  nextDemoRequestId,
} from "../services/demoStore"

import {
  initialRequestRouting,
} from "../services/workflow"

import {
  createSolicitud,
  findActiveSolicitudByBreach,
} from "../services/graph"

import type {
  ProcessDefinition,
  ProcessFieldDefinition,
  RequestFamily,
  RequestItem,
  UserScope,
} from "../types"


type FormValues =
  Record<string, string>


// ======================================================
// FAMILIAS
// ======================================================

const familyInfo:
  Record<
    RequestFamily,
    {
      label: string
      description: string
      icon: typeof Package
    }
  > = {
  UNIDADES: {
    label:
      "Unidades",

    description:
      "Bonificaciones, pedidos, traslados, patentes y otras gestiones asociadas a unidades.",

    icon:
      Package,
  },

  INSUMOS_SHOWROOM: {
    label:
      "Insumos y Showroom",

    description:
      "Insumos, zonas de experiencia, mobiliario, equipamiento e instalaciones del local.",

    icon:
      Layers3,
  },

  COLABORADORES: {
    label:
      "Colaboradores",

    description:
      "Credenciales, pie de firma, accesos y otras necesidades del equipo.",

    icon:
      Users,
  },

  OTROS: {
    label:
      "Otros",

    description:
      "Solicitudes que todavía no están incorporadas al catálogo de procesos.",

    icon:
      FileText,
  },
}


// ======================================================
// ESTADOS ACTIVOS
// PARA EVITAR DUPLICADOS DE BRECHAS
// ======================================================

const activeStatuses =
  new Set([
    "RECIBIDA",
    "INFORMACION_REQUERIDA",
    "PENDIENTE_APROBACION",
    "APROBADA",
    "APROBADA_CON_AJUSTE",
    "EN_GESTION",
    "RESUELTA_POR_CONFIRMAR",
  ])


// ======================================================
// COMPONENTE
// ======================================================

export default function NuevaSolicitud({
  currentUser,
}: {
  currentUser:
    UserScope
}) {
  const navigate =
    useNavigate()

  const [
    searchParams,
  ] =
    useSearchParams()


  // ====================================================
  // MODO DEMO
  // ====================================================

  const demoMode =
    useMemo(
      () =>
        mockUsers.some(
          (user) =>
            user.email.toLowerCase() ===
            currentUser.email.toLowerCase()
        ),
      [
        currentUser.email,
      ]
    )


  // ====================================================
  // URL / ORIGEN
  // ====================================================

  const processFromUrl =
    searchParams.get(
      "process"
    )

  const breachFromUrl =
    searchParams.get(
      "breach"
    )


  // ====================================================
  // ESTADO
  // ====================================================

  const [
    step,
    setStep,
  ] =
    useState(1)

  const [
    selectedFamily,
    setSelectedFamily,
  ] =
    useState<
      RequestFamily |
      null
    >(
      null
    )

  const [
    selectedProcess,
    setSelectedProcess,
  ] =
    useState<
      ProcessDefinition |
      null
    >(
      null
    )

  const [
    values,
    setValues,
  ] =
    useState<FormValues>(
      {}
    )

  const [
    attachments,
    setAttachments,
  ] =
    useState<File[]>(
      []
    )

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false)

  const [
    createdId,
    setCreatedId,
  ] =
    useState("")

  const [
    error,
    setError,
  ] =
    useState("")

  const [
    duplicateId,
    setDuplicateId,
  ] =
    useState("")


  // ====================================================
  // BRECHA
  // ====================================================

  const sourceBreach =
    useMemo(
      () =>
        breachFromUrl
          ? mockFormBreaches.find(
              (
                breach
              ) =>
                breach.id ===
                breachFromUrl
            )
          : undefined,
      [
        breachFromUrl,
      ]
    )


  const sourceExecution =
    useMemo(
      () =>
        sourceBreach
          ? mockFormExecutions.find(
              (
                execution
              ) =>
                execution.id ===
                sourceBreach.executionId
            )
          : undefined,
      [
        sourceBreach,
      ]
    )


  const sourceForm =
    useMemo(
      () =>
        sourceExecution
          ? mockForms.find(
              (
                form
              ) =>
                form.code ===
                sourceExecution.formCode
            )
          : undefined,
      [
        sourceExecution,
      ]
    )


  const requestLocal =
    sourceBreach?.local ??
    currentUser.local ??
    "Red Ditalcar"


  // ====================================================
  // PRECARGA DESDE BRECHA
  // ====================================================

  useEffect(
    () => {
      if (
        !processFromUrl ||
        !sourceBreach
      ) {
        return
      }

      const process =
        mockProcesses.find(
          (
            item
          ) =>
            item.code ===
              processFromUrl &&
            item.active
        )

      if (!process) {
        return
      }

      setSelectedFamily(
        process.family
      )

      setSelectedProcess(
        process
      )

      setStep(
        3
      )

      setValues(
        (
          current
        ) => {
          const nextValues = {
            ...current,
          }

          if (
            process.code ===
            "COL-CRE-01"
          ) {
            nextValues[
              "CRE_LOCAL"
            ] =
              sourceBreach.local
          }

          if (
            process.code ===
            "COL-FIR-01"
          ) {
            nextValues[
              "FIR_LOCAL"
            ] =
              sourceBreach.local
          }

          return nextValues
        }
      )
    },
    [
      processFromUrl,
      sourceB
