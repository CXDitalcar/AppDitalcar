import { useEffect, useState } from "react"
import { CalendarClock, Car, FileText, FileSearch, Percent, Plus, Receipt, Search, Trash2, Wrench } from "lucide-react"
import { ADM_APLICA_LABEL, ADM_TAREAS } from "../data/admTareas"
import { getAdmAccess, saveAdmAccess, type AdmAccess } from "../services/admAccess"
import { leaveInterface } from "../services/interfaceMode"
import type { UserScope } from "../types"
import "./Portal.css"
import "./AdmVentas.css"

// Portada de la interfaz "Administración de Ventas" (solo Administración de Ventas + Experiencia/PM).
const MODULES = [
  { icon: <Car size={22} />, title: "Patentes de nuevos", text: "Días hábiles desde la factura hasta la patente, por local." },
  { icon: <Wrench size={22} />, title: "Transferencias de usados", text: "Estado de cada transferencia y cuáles necesitan seguimiento hoy." },
  { icon: <Receipt size={22} />, title: "Facturación", text: "Notas de venta sin recepción y negocios por facturar." },
  { icon: <Search size={22} />, title: "Buscar una NV", text: "Todo lo que pasó con una nota de venta, en un solo lugar." },
  { icon: <Percent size={22} />, title: "Bonos por marca", text: "Qué bono corresponde cobrar y cuánto falta por cobrar." },
  { icon: <FileText size={22} />, title: "Cargar listas de precio (PDF)", text: "Una vez por marca y mes; no se duplica al cargarla de nuevo." },
]

export default function AdmVentas({ currentUser }: { currentUser: UserScope }) {
  const [access, setAccess] = useState<AdmAccess | null>(null)
  useEffect(() => { getAdmAccess().then(setAccess) }, [])

  if (!access) return <div className="portal-page adm-page"><p className="adm-loading">Cargando…</p></div>
  if (!access.allowed) {
    return (
      <div className="portal-page adm-page">
        <section className="adm-closed">
          <h1>Este enlace es de uso restringido</h1>
          <p>Tu cuenta no tiene acceso a esta sección. Si crees que debería tenerlo, pídeselo al equipo de Experiencia.</p>
          <button type="button" className="adm-btn" onClick={leaveInterface}>Ir a DitalApp</button>
        </section>
      </div>
    )
  }

  const firstName = currentUser.name.split(" ")[0] || currentUser.name
  const criticas = ADM_TAREAS.filter((t) => t.criticidad === "CRITICA")
  const altas = ADM_TAREAS.filter((t) => t.criticidad === "ALTA")

  return (
    <div className="portal-page adm-page">
      <section className="portal-hello">
        <h1>Hola, {firstName}</h1>
        <p>Seguimiento de cada nota de venta, de la factura a la patente o transferencia, y los bonos que corresponde cobrar.</p>
      </section>

      <section className="portal-section" aria-labelledby="adm-modulos">
        <div className="portal-section-head">
          <h2 id="adm-modulos">Qué vas a poder ver aquí</h2>
          <p>Se activan a medida que cargamos los archivos de cada área.</p>
        </div>
        <div className="portal-grid">
          {MODULES.map((m) => (
            <article key={m.title} className="portal-tile adm-tile">
              <div className="portal-tile-link">
                <span className="portal-tile-icon">{m.icon}</span>
                <span className="portal-tile-text"><strong>{m.title}</strong><span>{m.text}</span><span className="adm-soon"><FileSearch size={13} /> En construcción</span></span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="portal-section" aria-labelledby="adm-tareas">
        <div className="portal-section-head">
          <h2 id="adm-tareas">Tareas del negocio y sus plazos</h2>
          <p>Los plazos están en días hábiles desde que corresponde hacerlas.</p>
        </div>
        <TaskGroup title="Críticas" tone="critica" items={criticas} />
        <TaskGroup title="Importantes" tone="alta" items={altas} />
      </section>

      {access.canManage && <AccessEditor initial={access.emails ?? []} />}
    </div>
  )
}

function TaskGroup({ title, tone, items }: { title: string; tone: "critica" | "alta"; items: typeof ADM_TAREAS }) {
  return (
    <div className="adm-group">
      <h3 className={`adm-group-title ${tone}`}>{title}</h3>
      <ul className="adm-tasks">
        {items.map((t) => (
          <li key={t.codigo} className="adm-task">
            <span className="adm-task-main"><strong>{t.nombre}</strong><small>{t.descripcion}</small></span>
            <span className="adm-task-meta">
              <span className="adm-chip">{ADM_APLICA_LABEL[t.aplicaA]}</span>
              <span className="adm-sla"><CalendarClock size={14} /> {t.slaDiasHabiles} {t.slaDiasHabiles === 1 ? "día hábil" : "días hábiles"}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Solo lo ve Experiencia/PM: quién más puede entrar a este enlace.
function AccessEditor({ initial }: { initial: string[] }) {
  const [emails, setEmails] = useState(initial)
  const [draft, setDraft] = useState("")
  const [message, setMessage] = useState("")
  const [saving, setSaving] = useState(false)

  const add = () => {
    const value = draft.trim().toLowerCase()
    if (!value || emails.includes(value)) return
    setEmails([...emails, value]); setDraft(""); setMessage("")
  }
  const save = async () => {
    setSaving(true)
    try { const result = await saveAdmAccess(emails); setEmails(result.emails ?? emails); setMessage("Acceso guardado.") }
    catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo guardar.") }
    finally { setSaving(false) }
  }

  return (
    <section className="portal-section adm-access" aria-labelledby="adm-acceso">
      <div className="portal-section-head">
        <h2 id="adm-acceso">Quién puede entrar</h2>
        <p>Además de Experiencia y Project Manager. Solo tú ves esta sección.</p>
      </div>
      <ul className="adm-emails">
        {emails.map((e) => (
          <li key={e}><span>{e}</span><button type="button" aria-label={`Quitar ${e}`} onClick={() => { setEmails(emails.filter((x) => x !== e)); setMessage("") }}><Trash2 size={16} /></button></li>
        ))}
      </ul>
      <div className="adm-add">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="nombre@ditalcar.cl" aria-label="Correo a agregar" />
        <button type="button" className="adm-btn ghost" onClick={add}><Plus size={16} /> Agregar</button>
        <button type="button" className="adm-btn" onClick={save} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
      </div>
      {message && <p className="adm-msg" role="status">{message}</p>}
    </section>
  )
}
