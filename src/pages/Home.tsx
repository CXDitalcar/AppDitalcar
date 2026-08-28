import { GraduationCap, ClipboardCheck, MessagesSquare, TimerReset, ChevronRight, Sparkles } from "lucide-react"
import { Link } from "react-router-dom"

const cards = [
  { to: "/academia", title: "Academia", text: "Sello Ditalcar, CONSULTA y evaluaciones.", icon: GraduationCap },
  { to: "/mi-local", title: "Mi Local", text: "Estándares y brechas de la sucursal.", icon: ClipboardCheck },
  { to: "/solicitudes", title: "Solicitudes", text: "Seguimiento de requerimientos y estados.", icon: MessagesSquare },
  { to: "/solicitudes", title: "Acuerdos & SLA", text: "Responsables, tiempos y trazabilidad.", icon: TimerReset },
]

export default function Home({ userName, branch }: { userName: string; branch: string }) {
  const firstName = userName.split(" ")[0] || userName
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">EXPERIENCIA DITALCAR</div>
          <h1>Una sola forma de vivir<br/><em>la experiencia Ditalcar.</em></h1>
          <p>Academia, estándares, solicitudes y acuerdos operativos en un solo lugar.</p>
          <div className="welcome"><Sparkles size={17}/> Hola, {firstName} · {branch}</div>
        </div>
        <div className="hero-orbit"><div className="orbit"><span>D</span></div></div>
      </section>

      <section className="section">
        <div className="section-head">
          <div><span className="eyebrow">ACCESOS PRINCIPALES</span><h2>¿Qué necesitas hacer?</h2></div>
        </div>
        <div className="module-grid">
          {cards.map(({to,title,text,icon:Icon}) => (
            <Link className="module-card" to={to} key={title}>
              <div className="module-icon"><Icon/></div>
              <div className="module-number">DITALCAR</div>
              <h3>{title}</h3>
              <p>{text}</p>
              <div className="module-link">Entrar <ChevronRight size={16}/></div>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
