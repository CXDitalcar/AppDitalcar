import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react"

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Save,
} from "lucide-react"

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom"

import {
  createSolicitud,
  findActiveSolicitudByBreach,
  getCurrentUser,
} from "../services/graph"


// ======================================================
// TIPOS
// ======================================================

type NuevaSolicitudProps = {
  branch?: string
  currentUser?: any
  demoMode?: boolean
}


type ProcessOption = {
  code: string
  name: string
  family: string
  area: string
  section: string
}


// ======================================================
// CATÁLOGO TEMPORAL
//
// OJO:
// En una siguiente etapa esto se leerá desde 09_Procesos.
// Por ahora nos permite probar escritura REAL sin depender
// todavía de esa conexión.
// ======================================================

const processOptions: ProcessOption[] = [
  {
    code: "COL-CRE-01",
    name: "Credencial",
    family: "COLABORADORES",
    area: "Experiencia de Clientes",
    section: "Imagen del equipo",
  },
  {
    code: "COL-FIR-01",
    name: "Pie de firma",
    family: "COLABORADORES",
    area: "Comercial / Marketing",
    section: "Imagen del equipo",
  },
  {
    code: "COL-ACC-01",
    name: "Habilitación tecnológica",
    family: "COLABORADORES",
    area: "TI",
    section: "Colaboradores",
  },
  {
    code: "UNI-PAT-01",
    name: "Patente definitiva vehículo",
    family: "UNIDADES",
    area: "Administración",
    section: "Unidades",
  },
  {
    code: "UNI-BON-01",
    name: "Bonificación",
    family: "UNIDADES",
    area: "Operaciones Comerciales",
    section: "Unidades",
  },
  {
    code: "UNI-TRA-01",
    name: "Traslado de unidad",
    family: "UNIDADES",
    area: "Operaciones Comerciales",
    section: "Unidades",
  },
  {
    code: "UNI-VUE-01",
    name: "Vuelto de negocio",
    family: "UNIDADES",
    area: "Administración",
    section: "Unidades",
  },
  {
    code: "UNI-FAC-01",
    name: "Facturación",
    family: "UNIDADES",
    area: "Administración",
    section: "Unidades",
  },
  {
    code: "UNI-USA-01",
    name: "Toma de usados",
    family: "UNIDADES",
    area: "Administración",
    section: "Unidades",
  },
  {
    code: "INS-PED-01",
    name: "Pedido de insumos",
    family: "INSUMOS_SHOWROOM",
    area: "Administración",
    section: "Insumos",
  },
  {
    code: "INS-ZEX-01",
    name: "Zonas de experiencia",
    family: "INSUMOS_SHOWROOM",
    area: "Experiencia de Clientes",
    section: "Zonas de experiencia",
  },
  {
    code: "INS-MOB-01",
    name: "Mobiliario y equipamiento",
    family: "INSUMOS_SHOWROOM",
    area: "Experiencia de Clientes",
    section: "Sala de Ventas",
  },
  {
    code: "INS-INT-01",
    name: "Instalaciones y mantención",
    family: "INSUMOS_SHOWROOM",
    area: "Experiencia de Clientes",
    section: "Sala de Ventas",
  },
]


// ======================================================
// HELPERS
// ======================================================

function getFallbackUserName(
  currentUser: any
) {
  return (
    currentUser?.name ??
    currentUser?.displayName ??
    currentUser?.userName ??
    "Usuario Ditalcar"
  )
}


function getFallbackUserEmail(
  currentUser: any
) {
  return (
    currentUser?.email ??
    currentUser?.mail ??
    currentUser?.userPrincipalName ??
    ""
  )
}


function getCurrentRole(
  currentUser: any
) {
  return String(
    currentUser?.role ??
      currentUser?.rol ??
      ""
  ).toUpperCase()
}


// ======================================================
// COMPONENTE
// ======================================================

export default function NuevaSolicitud({
  branch = "",
  currentUser,
  demoMode = false,
}: NuevaSolicitudProps) {
  const navigate =
    useNavigate()

  const [
    searchParams,
  ] =
    useSearchParams()


  // ====================================================
  // ORIGEN DESDE FORMULARIOS / BRECHAS
  // ====================================================

  const processFromUrl =
    searchParams.get("process") ??
    ""

  const breachFromUrl =
    searchParams.get("breach") ??
    ""

  const executionFromUrl =
    searchParams.get("execution") ??
    ""

  const formFromUrl =
    searchParams.get("form") ??
    ""

  const localFromUrl =
    searchParams.get("local") ??
    ""

  const sectionFromUrl =
    searchParams.get("section") ??
    ""

  const detailFromUrl =
    searchParams.get("detail") ??
    ""


  // ====================================================
  // ESTADO
  // ====================================================

  const [
    processCode,
    setProcessCode,
  ] =
    useState(
      processFromUrl
    )


  const [
    local,
    setLocal,
  ] =
    useState(
      localFromUrl ||
        branch ||
        ""
    )


  const [
    section,
    setSection,
  ] =
    useState(
      sectionFromUrl
    )


  const [
    detail,
    setDetail,
  ] =
    useState(
      detailFromUrl
    )


  const [
    requesterName,
    setRequesterName,
  ] =
    useState(
      getFallbackUserName(
        currentUser
      )
    )


  const [
    requesterEmail,
    setRequesterEmail,
  ] =
    useState(
      getFallbackUserEmail(
        currentUser
      )
    )


  const [
    loadingUser,
    setLoadingUser,
  ] =
    useState(false)


  const [
    saving,
    setSaving,
  ] =
    useState(false)


  const [
    error,
    setError,
  ] =
    useState("")


  const [
    successId,
    setSuccessId,
  ] =
    useState("")


  const [
    duplicateId,
    setDuplicateId,
  ] =
    useState("")


  // ====================================================
  // PROCESO SELECCIONADO
  // ====================================================

  const selectedProcess =
    useMemo(
      () =>
        processOptions.find(
          (process) =>
            process.code ===
            processCode
        ),
      [
        processCode,
      ]
    )


  // ====================================================
  // CARGAR DATOS DEL USUARIO REAL
  // ====================================================

  useEffect(
    () => {
      let active =
        true


      async function loadUser() {
        setLoadingUser(
          true
        )


        try {
          const user =
            await getCurrentUser()


          if (!active) {
            return
          }


          setRequesterName(
            user.displayName ||
              getFallbackUserName(
                currentUser
              )
          )


          setRequesterEmail(
            user.mail ||
              user.userPrincipalName ||
              getFallbackUserEmail(
                currentUser
              )
          )
        } catch {
          // No detenemos la pantalla.
          // Puede estar usando modo demo.
        } finally {
          if (active) {
            setLoadingUser(
              false
            )
          }
        }
      }


      loadUser()


      return () => {
        active =
          false
      }
    },
    [
      currentUser,
    ]
  )


  // ====================================================
  // COMPLETAR SECCIÓN DESDE PROCESO
  // ====================================================

  useEffect(
    () => {
      if (
        !selectedProcess
      ) {
        return
      }


      if (!section) {
        setSection(
          selectedProcess.section
        )
      }
    },
    [
      selectedProcess,
      section,
    ]
  )


  // ====================================================
  // BUSCAR DUPLICADO SI VIENE DE BRECHA
  // ====================================================

  useEffect(
    () => {
      let active =
        true


      async function checkDuplicate() {
        if (
          !breachFromUrl
        ) {
          return
        }


        try {
          const existing =
            await findActiveSolicitudByBreach(
              breachFromUrl
            )


          if (
            active &&
            existing
          ) {
            setDuplicateId(
              existing.id
            )
          }
        } catch {
          // Si falla la comprobación,
          // no bloqueamos la pantalla.
        }
      }


      checkDuplicate()


      return () => {
        active =
          false
      }
    },
    [
      breachFromUrl,
    ]
  )


  // ====================================================
  // CREAR SOLICITUD REAL
  // ====================================================

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()


    setError("")
    setSuccessId("")


    if (
      duplicateId
    ) {
      setError(
        "Esta brecha ya tiene una solicitud activa."
      )

      return
    }


    if (
      !selectedProcess
    ) {
      setError(
        "Selecciona un tipo de solicitud."
      )

      return
    }


    if (
      !local.trim()
    ) {
      setError(
        "Debes indicar el local."
      )

      return
    }


    if (
      !detail.trim()
    ) {
      setError(
        "Describe qué necesitas solicitar."
      )

      return
    }


    setSaving(
      true
    )


    try {
      const now =
        new Date()


      const role =
        getCurrentRole(
          currentUser
        )


      // ==================================================
      // REGLA INICIAL
      //
      // Si es vendedor, debe pasar primero por aprobación.
      // Cuando conectemos 02_Usuarios buscaremos aquí
      // automáticamente el email de su Jefatura Local.
      //
      // Los demás nacen RECIBIDA por ahora.
      // ==================================================

      const needsLocalApproval =
        role ===
        "VENDEDOR"


      const initialFlowStatus =
        needsLocalApproval
          ? "PENDIENTE_APROBACION"
          : "RECIBIDA"


      const created =
        await createSolicitud({
          title:
            selectedProcess.name,

          areaResponsable:
            selectedProcess.area,

          categoria:
            selectedProcess.family,

          seccion:
            section ||
            selectedProcess.section,

          solicitud:
            detail.trim(),

          fechaSolicitud:
            now.toISOString(),

          local:
            local.trim(),

          // Cuando nace desde una brecha,
          // el estándar queda Solicitado.
          estado:
            breachFromUrl
              ? "Solicitado"
              : undefined,

          procesoCodigo:
            selectedProcess.code,

          procesoVersion:
            1,

          solicitanteEmail:
            requesterEmail,

          solicitanteNombre:
            requesterName,

          estadoFlujo:
            initialFlowStatus,

          slaAprobacionSnapshot:
            needsLocalApproval
              ? 24
              : undefined,

          slaInicioAprobacion:
            needsLocalApproval
              ? now.toISOString()
              : undefined,

          slaPausaMinutos:
            0,

          confirmacionHorasSnapshot:
            48,

          reabierta:
            false,

          cierreAutomatico:
            false,

          origenFormularioCodigo:
            formFromUrl ||
            (
              breachFromUrl
                ? "FORMULARIO"
                : "APP_MANUAL"
            ),

          origenEjecucionID:
            executionFromUrl ||
            undefined,

          origenBrechaID:
            breachFromUrl ||
            undefined,
        })


      setSuccessId(
        created.id
      )
    } catch (
      errorValue: any
    ) {
      const message =
        errorValue?.message ??
        "No fue posible crear la solicitud."


      if (
        message.includes(
          "401"
        ) ||
        message.includes(
          "403"
        )
      ) {
        setError(
          "La app pudo llegar a SharePoint, pero Microsoft no autorizó la escritura. Para esta prueba entra con tu cuenta Microsoft y no solo con un usuario demo."
        )
      } else {
        setError(
          message
        )
      }
    } finally {
      setSaving(
        false
      )
    }
  }


  // ====================================================
  // ÉXITO
  // ====================================================

  if (
    successId
  ) {
    return (
      <div className="dc-new-request-page">

        <style>
          {pageStyles}
        </style>


        <div className="dc-success-card">

          <div className="dc-success-icon">
            <CheckCircle2
              size={36}
            />
          </div>


          <span className="dc-eyebrow">
            SOLICITUD CREADA
          </span>


          <h1>
            Ya está en el tablero
          </h1>


          <p>
            La solicitud fue registrada
            correctamente en
            <strong>
              {" "}
              Tablero General Solicitudes
            </strong>
            .
          </p>


          <div className="dc-created-id">
            Solicitud SharePoint
            <strong>
              #
              {successId}
            </strong>
          </div>


          <div className="dc-success-actions">

            <button
              type="button"
              className="dc-primary-button"
              onClick={() =>
                navigate(
                  `/solicitudes/${successId}`
                )
              }
            >
              Ver solicitud
            </button>


            <button
              type="button"
              className="dc-secondary-button"
              onClick={() => {
                setSuccessId("")
                setDetail("")
              }}
            >
              Crear otra
            </button>

          </div>

        </div>

      </div>
    )
  }


  // ====================================================
  // PANTALLA
  // ====================================================

  return (
    <div className="dc-new-request-page">

      <style>
        {pageStyles}
      </style>


      {/* ==================================================
          CABECERA
      ================================================== */}

      <div className="dc-request-header">

        <div>

          <Link
            to="/solicitudes"
            className="dc-back-link"
          >
            <ArrowLeft
              size={17}
            />

            Solicitudes
          </Link>


          <span className="dc-eyebrow">
            NUEVA SOLICITUD
          </span>


          <h1>
            Crear solicitud
          </h1>


          <p>
            Registra una gestión y
            realiza seguimiento desde
            Ditalcar Colaboradores.
          </p>

        </div>


        <div className="dc-live-badge">
          <span />
          SHAREPOINT REAL
        </div>

      </div>


      {/* ==================================================
          AVISO DEMO
      ================================================== */}

      {demoMode && (
        <div className="dc-info-box">

          <AlertCircle
            size={20}
          />


          <div>
            <strong>
              Estás viendo un usuario demo
            </strong>

            <span>
              Puedes completar la solicitud.
              Para comprobar la escritura
              real en Microsoft Lists,
              la sesión debe tener acceso
              Graph a Ditalcar.
            </span>
          </div>

        </div>
      )}


      {/* ==================================================
          DUPLICADO
      ================================================== */}

      {duplicateId && (
        <div className="dc-duplicate-box">

          <AlertCircle
            size={21}
          />


          <div>
            <strong>
              Esta brecha ya fue solicitada
            </strong>

            <span>
              Existe una solicitud activa
              asociada a esta brecha.
            </span>


            <Link
              to={`/solicitudes/${duplicateId}`}
            >
              Ver solicitud #
              {duplicateId}
              <ExternalLink
                size={14}
              />
            </Link>
          </div>

        </div>
      )}


      {/* ==================================================
          ORIGEN
      ================================================== */}

      {breachFromUrl && (
        <div className="dc-origin-card">

          <div>
            <span className="dc-origin-label">
              ORIGEN
            </span>

            <strong>
              Brecha detectada en formulario
            </strong>
          </div>


          <div className="dc-origin-tags">

            {formFromUrl && (
              <span>
                {formFromUrl}
              </span>
            )}


            {executionFromUrl && (
              <span>
                Ejecución:
                {" "}
                {executionFromUrl}
              </span>
            )}


            <span>
              Brecha:
              {" "}
              {breachFromUrl}
            </span>

          </div>

        </div>
      )}


      {/* ==================================================
          FORMULARIO
      ================================================== */}

      <form
        className="dc-request-form"
        onSubmit={
          handleSubmit
        }
      >

        <div className="dc-form-section">

          <div className="dc-section-heading">

            <span>
              01
            </span>


            <div>
              <h2>
                ¿Qué necesitas?
              </h2>

              <p>
                Selecciona el proceso
                asociado a la solicitud.
              </p>
            </div>

          </div>


          <label className="dc-field">

            <span>
              Tipo de solicitud
            </span>


            <select
              value={
                processCode
              }
              onChange={(
                event
              ) => {
                setProcessCode(
                  event.target.value
                )

                const process =
                  processOptions.find(
                    (item) =>
                      item.code ===
                      event.target.value
                  )

                if (process) {
                  setSection(
                    process.section
                  )
                }
              }}
              required
            >
              <option value="">
                Selecciona una opción
              </option>


              {processOptions.map(
                (process) => (
                  <option
                    key={
                      process.code
                    }
                    value={
                      process.code
                    }
                  >
                    {process.name}
                  </option>
                )
              )}

            </select>

          </label>


          {selectedProcess && (
            <div className="dc-process-summary">

              <span>
                {
                  selectedProcess.family
                }
              </span>


              <strong>
                {
                  selectedProcess.area
                }
              </strong>

            </div>
          )}

        </div>


        <div className="dc-form-section">

          <div className="dc-section-heading">

            <span>
              02
            </span>


            <div>
              <h2>
                Ubicación
              </h2>

              <p>
                Indica dónde se requiere
                la gestión.
              </p>
            </div>

          </div>


          <div className="dc-two-columns">

            <label className="dc-field">

              <span>
                Local
              </span>


              <input
                value={
                  local
                }
                onChange={(
                  event
                ) =>
                  setLocal(
                    event.target.value
                  )
                }
                placeholder="Ej. Vespucio"
                required
              />

            </label>


            <label className="dc-field">

              <span>
                Sección
              </span>


              <input
                value={
                  section
                }
                onChange={(
                  event
                ) =>
                  setSection(
                    event.target.value
                  )
                }
                placeholder="Ej. Imagen del equipo"
              />

            </label>

          </div>

        </div>


        <div className="dc-form-section">

          <div className="dc-section-heading">

            <span>
              03
            </span>


            <div>
              <h2>
                Detalle
              </h2>

              <p>
                Explica lo necesario
                para que el responsable
                pueda iniciar la gestión.
              </p>
            </div>

          </div>


          <label className="dc-field">

            <span>
              Solicitud
            </span>


            <textarea
              value={
                detail
              }
              onChange={(
                event
              ) =>
                setDetail(
                  event.target.value
                )
              }
              placeholder="Describe claramente qué se necesita..."
              rows={6}
              required
            />

          </label>

        </div>


        <div className="dc-form-section">

          <div className="dc-section-heading">

            <span>
              04
            </span>


            <div>
              <h2>
                Solicitante
              </h2>

              <p>
                Estos datos se obtienen
                desde la sesión Microsoft.
              </p>
            </div>

          </div>


          <div className="dc-two-columns">

            <label className="dc-field">

              <span>
                Nombre
              </span>


              <input
                value={
                  requesterName
                }
                onChange={(
                  event
                ) =>
                  setRequesterName(
                    event.target.value
                  )
                }
                disabled={
                  loadingUser
                }
              />

            </label>


            <label className="dc-field">

              <span>
                Email
              </span>


              <input
                value={
                  requesterEmail
                }
                onChange={(
                  event
                ) =>
                  setRequesterEmail(
                    event.target.value
                  )
                }
                disabled={
                  loadingUser
                }
              />

            </label>

          </div>

        </div>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (
          <div className="dc-error-box">

            <AlertCircle
              size={20}
            />


            <span>
              {error}
            </span>

          </div>
        )}


        {/* ==================================================
            ACCIONES
        ================================================== */}

        <div className="dc-form-actions">

          <Link
            to="/solicitudes"
            className="dc-secondary-button"
          >
            Cancelar
          </Link>


          <button
            type="submit"
            className="dc-primary-button"
            disabled={
              saving ||
              Boolean(
                duplicateId
              )
            }
          >
            {saving ? (
              <>
                <Loader2
                  size={18}
                  className="dc-spin"
                />
                Registrando…
              </>
            ) : (
              <>
                <Save
                  size={18}
                />
                Crear solicitud
              </>
            )}
          </button>

        </div>

      </form>

    </div>
  )
}


// ======================================================
// ESTILOS AUTOCONTENIDOS
// ======================================================

const pageStyles = `
  .dc-new-request-page {
    width: 100%;
    max-width: 1180px;
    margin: 0 auto;
    padding: 28px 26px 60px;
    color: #f7f7f8;
  }

  .dc-request-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 24px;
  }

  .dc-back-link {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    color: #a9a9af;
    text-decoration: none;
    font-size: 13px;
    margin-bottom: 20px;
  }

  .dc-back-link:hover {
    color: #ffffff;
  }

  .dc-eyebrow {
    display: block;
    color: #ef3943;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.14em;
    margin-bottom: 8px;
  }

  .dc-request-header h1,
  .dc-success-card h1 {
    margin: 0;
    color: #ffffff;
    font-size: clamp(30px, 4vw, 46px);
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .dc-request-header p,
  .dc-success-card p {
    color: #9999a2;
    margin: 12px 0 0;
    line-height: 1.5;
  }

  .dc-live-badge {
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    border: 1px solid rgba(73, 204, 119, 0.25);
    border-radius: 999px;
    color: #9be5b3;
    background: rgba(73, 204, 119, 0.07);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
  }

  .dc-live-badge span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #49cc77;
    box-shadow: 0 0 12px rgba(73, 204, 119, 0.8);
  }

  .dc-info-box,
  .dc-duplicate-box,
  .dc-error-box {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 15px 17px;
    margin-bottom: 18px;
    border-radius: 12px;
  }

  .dc-info-box {
    border: 1px solid rgba(255, 183, 77, 0.25);
    background: rgba(255, 183, 77, 0.07);
    color: #efc57b;
  }

  .dc-duplicate-box {
    border: 1px solid rgba(239, 57, 67, 0.35);
    background: rgba(239, 57, 67, 0.08);
    color: #ff9ca2;
  }

  .dc-error-box {
    border: 1px solid rgba(239, 57, 67, 0.4);
    background: rgba(239, 57, 67, 0.09);
    color: #ffb0b5;
  }

  .dc-info-box div,
  .dc-duplicate-box div {
    display: grid;
    gap: 4px;
  }

  .dc-info-box strong,
  .dc-duplicate-box strong {
    color: #ffffff;
    font-size: 13px;
  }

  .dc-info-box span,
  .dc-duplicate-box span {
    font-size: 12px;
    line-height: 1.45;
  }

  .dc-duplicate-box a {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-top: 5px;
    color: #ffffff;
    font-size: 12px;
    font-weight: 700;
  }

  .dc-origin-card {
    display: flex;
    justify-content: space-between;
    gap: 18px;
    padding: 16px 18px;
    margin-bottom: 18px;
    border: 1px solid rgba(239, 57, 67, 0.2);
    border-radius: 14px;
    background:
      linear-gradient(
        110deg,
        rgba(239, 57, 67, 0.10),
        rgba(13, 13, 15, 0.92) 45%
      );
  }

  .dc-origin-label {
    display: block;
    color: #ef3943;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: 0.13em;
    margin-bottom: 5px;
  }

  .dc-origin-card strong {
    font-size: 14px;
  }

  .dc-origin-tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 7px;
  }

  .dc-origin-tags span {
    padding: 6px 9px;
    border-radius: 8px;
    background: #19191d;
    border: 1px solid #29292f;
    color: #b8b8bf;
    font-size: 11px;
  }

  .dc-request-form {
    display: grid;
    gap: 14px;
  }

  .dc-form-section {
    padding: 22px;
    border: 1px solid #25252a;
    border-radius: 16px;
    background:
      linear-gradient(
        145deg,
        rgba(24, 24, 28, 0.98),
        rgba(12, 12, 14, 0.98)
      );
    box-shadow:
      0 18px 50px rgba(0, 0, 0, 0.18);
  }

  .dc-section-heading {
    display: flex;
    align-items: flex-start;
    gap: 13px;
    margin-bottom: 18px;
  }

  .dc-section-heading > span {
    flex: 0 0 auto;
    width: 31px;
    height: 31px;
    display: grid;
    place-items: center;
    border-radius: 9px;
    color: #ffffff;
    background: #df2934;
    font-size: 11px;
    font-weight: 900;
  }

  .dc-section-heading h2 {
    margin: 0;
    color: #ffffff;
    font-size: 17px;
  }

  .dc-section-heading p {
    margin: 4px 0 0;
    color: #85858f;
    font-size: 12px;
  }

  .dc-two-columns {
    display: grid;
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .dc-field {
    display: grid;
    gap: 7px;
  }

  .dc-field > span {
    color: #b7b7bd;
    font-size: 12px;
    font-weight: 700;
  }

  .dc-field input,
  .dc-field select,
  .dc-field textarea {
    width: 100%;
    box-sizing: border-box;
    border: 1px solid #313137;
    border-radius: 10px;
    outline: none;
    padding: 12px 13px;
    color: #ffffff;
    background: #101012;
    font: inherit;
    font-size: 13px;
    transition:
      border-color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .dc-field textarea {
    resize: vertical;
    min-height: 120px;
  }

  .dc-field input:focus,
  .dc-field select:focus,
  .dc-field textarea:focus {
    border-color: #df2934;
    box-shadow:
      0 0 0 3px
      rgba(223, 41, 52, 0.10);
  }

  .dc-field input:disabled {
    opacity: 0.72;
  }

  .dc-process-summary {
    display: flex;
    gap: 8px;
    margin-top: 12px;
  }

  .dc-process-summary span,
  .dc-process-summary strong {
    padding: 6px 9px;
    border-radius: 8px;
    font-size: 10px;
  }

  .dc-process-summary span {
    color: #ff8d94;
    border: 1px solid rgba(239, 57, 67, 0.25);
    background: rgba(239, 57, 67, 0.08);
  }

  .dc-process-summary strong {
    color: #c8c8cf;
    border: 1px solid #2d2d32;
    background: #161619;
  }

  .dc-form-actions {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 10px;
    padding-top: 8px;
  }

  .dc-primary-button,
  .dc-secondary-button {
    min-height: 43px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 10px;
    padding: 0 17px;
    font: inherit;
    font-size: 12px;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;
  }

  .dc-primary-button {
    border: 1px solid #ef3943;
    background:
      linear-gradient(
        135deg,
        #ee3943,
        #b30f19
      );
    color: #ffffff;
    box-shadow:
      0 8px 28px
      rgba(223, 41, 52, 0.20);
  }

  .dc-primary-button:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  .dc-primary-button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .dc-secondary-button {
    border: 1px solid #303036;
    background: #17171a;
    color: #d0d0d5;
  }

  .dc-success-card {
    max-width: 620px;
    margin: 80px auto 0;
    padding: 42px;
    text-align: center;
    border: 1px solid #29292e;
    border-radius: 20px;
    background:
      radial-gradient(
        circle at top,
        rgba(73, 204, 119, 0.10),
        transparent 45%
      ),
      #111114;
  }

  .dc-success-icon {
    width: 70px;
    height: 70px;
    margin: 0 auto 18px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: #67d68a;
    background: rgba(73, 204, 119, 0.10);
    border: 1px solid rgba(73, 204, 119, 0.22);
  }

  .dc-created-id {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 330px;
    margin: 24px auto;
    padding: 13px 15px;
    border: 1px solid #2b2b30;
    border-radius: 10px;
    color: #91919a;
    background: #0c0c0e;
    font-size: 12px;
  }

  .dc-created-id strong {
    color: #ffffff;
    font-size: 16px;
  }

  .dc-success-actions {
    display: flex;
    justify-content: center;
    gap: 9px;
  }

  .dc-spin {
    animation:
      dc-spin 0.8s linear infinite;
  }

  @keyframes dc-spin {
    to {
      transform:
        rotate(360deg);
    }
  }

  @media (
    max-width: 720px
  ) {
    .dc-new-request-page {
      padding:
        20px 15px 45px;
    }

    .dc-request-header {
      align-items:
        flex-start;
      flex-direction:
        column;
    }

    .dc-two-columns {
      grid-template-columns:
        1fr;
    }

    .dc-origin-card {
      flex-direction:
        column;
    }

    .dc-origin-tags {
      justify-content:
        flex-start;
    }

    .dc-form-actions,
    .dc-success-actions {
      flex-direction:
        column-reverse;
    }

    .dc-form-actions > *,
    .dc-success-actions > * {
      width: 100%;
      box-sizing:
        border-box;
    }
  }
`
