import { AlertTriangle, BarChart3, Clock3, Database, Filter, ShieldCheck } from "lucide-react"
import SignalLight from "../components/SignalLight"
import type { UserScope } from "../types"
import "./KPI.css"

const KPI_ITEMS = [
  { id: "ventas", label: "Ventas vs meta", detail: "Resultado comercial versus meta del periodo." },
  { id: "facturacion", label: "Facturación vs meta", detail: "Facturación versus meta del periodo." },
  { id: "financiamiento", label: "Financiamiento", detail: "Indicador comercial de financiamiento." },
  { id: "mpp", label: "MPP", detail: "Indicador MPP según la fuente comercial validada." },
  { id: "ci", label: "CI", detail: "Indicador CI según la fuente comercial validada." },
] as const

export default function KPI({ currentUser }: { currentUser: UserScope }) {
  const experienceView = currentUser.role === "EXPERIENCIA_CLIENTES"

  return (
    <div className="kpi-page">
      <section className="kpi-head">
        <div>
          <span className="kpi-eyebrow">KPI · EN DESARROLLO</span>
          <h1>Indicadores comerciales</h1>
          <p>
            Esta vista queda preparada para la futura conexión del archivo KPI alojado en
            SharePoint. Hasta que exista una fuente conectada y validada, no se publican
            resultados numéricos.
          </p>
        </div>
        <span className="kpi-dev-badge"><AlertTriangle size={14} /> EN DESARROLLO</span>
      </section>

      <section className="kpi-warning">
        <AlertTriangle size={19} />
        <div>
          <strong>Fuente KPI aún no conectada</strong>
          <span>
            Los resultados se mostrarán solo desde una actualización válida. Si una futura
            lectura contiene errores, la app mantendrá el último snapshot válido publicado.
          </span>
        </div>
      </section>

      <section className="kpi-toolbar">
        <div className="kpi-filter-title"><Filter size={15} /> Filtros preparados</div>
        <label>
          <span>Marca</span>
          <select disabled><option>Todas</option></select>
        </label>
        <label>
          <span>Local</span>
          <select disabled><option>Todos</option></select>
        </label>
        <label>
          <span>Periodo</span>
          <select disabled><option>Sin conexión</option></select>
        </label>
        <div className="kpi-last-update">
          <Clock3 size={15} />
          <div>
            <span>Última actualización válida</span>
            <strong>Sin conexión</strong>
          </div>
        </div>
      </section>

      <section className="kpi-grid" aria-label="Indicadores preparados">
        {KPI_ITEMS.map((item) => (
          <article className="kpi-card" key={item.id}>
            <div className="kpi-card-top">
              <SignalLight tone="neutral" label="Sin datos" compact />
              <BarChart3 size={17} />
            </div>
            <span>{item.label}</span>
            <strong>—</strong>
            <p>{item.detail}</p>
          </article>
        ))}
      </section>

      <section className="kpi-semaphore-guide">
        <div>
          <span className="kpi-eyebrow">SEMÁFORO GENERAL</span>
          <strong>La misma lectura visual se usará en toda la app.</strong>
        </div>
        <div className="kpi-semaphore-items">
          <SignalLight tone="green" label="≥ 90% · correcto / dentro de estándar" />
          <SignalLight tone="orange" label="60–89% · requiere atención" />
          <SignalLight tone="red" label="< 60% · brecha crítica" />
        </div>
      </section>

      {experienceView && (
        <section className="kpi-technical">
          <div className="kpi-technical-head">
            <ShieldCheck size={18} />
            <div>
              <span className="kpi-eyebrow">SOLO EXPERIENCIA</span>
              <strong>Estado técnico de la fuente</strong>
            </div>
          </div>
          <div className="kpi-technical-grid">
            <TechnicalItem icon={Database} label="Archivo fuente" value="Pendiente de conexión SharePoint" />
            <TechnicalItem icon={Clock3} label="Última lectura" value="Sin conexión" />
            <TechnicalItem icon={ShieldCheck} label="Última publicación válida" value="Sin conexión" />
            <TechnicalItem icon={AlertTriangle} label="Errores / observaciones" value="Aún no evaluados" />
          </div>
          <p>
            La próxima integración guardará la fecha real de modificación del archivo y la
            fecha de la última publicación válida. Una lectura con errores no reemplazará un
            snapshot anterior correcto.
          </p>
        </section>
      )}
    </div>
  )
}

function TechnicalItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Database
  label: string
  value: string
}) {
  return (
    <article>
      <Icon size={16} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  )
}
