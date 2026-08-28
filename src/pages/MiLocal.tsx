import { CheckCircle2, AlertTriangle, Clock3, Coffee, BadgeCheck, Shield } from "lucide-react"
import StatusBadge from "../components/StatusBadge"

const standards = [
  ["Recepción del local","Cumple","Cliente recibido, orientado y apoyado al ingresar.",CheckCircle2],
  ["Zona de café","Cumple","Disponible, limpia y con reposición visible.",Coffee],
  ["PAI de precio","Solicitado","Información de marca y precio visible según estándar.",Clock3],
  ["Uniformes","Cumple","Imagen consistente y reposición gestionada.",BadgeCheck],
  ["Patentes / identificadores","No cumple","Stock y reposición según estándar operacional.",AlertTriangle],
  ["Zona de seguridad","Cumple","Señalética visible y protocolo disponible.",Shield],
]

export default function MiLocal({ branch }: { branch: string }) {
  return (
    <>
      <div className="page-head"><span className="eyebrow">MI LOCAL</span><h1>{branch}</h1><p>La revisión debe reflejar la realidad del local y movilizar soluciones.</p></div>
      <div className="standard-list">
        {standards.map(([name,status,desc,Icon]: any) => (
          <article className="standard-card" key={name}>
            <div className="standard-icon"><Icon/></div>
            <div className="standard-copy"><strong>{name}</strong><span>{desc}</span></div>
            <StatusBadge value={status}/>
          </article>
        ))}
      </div>
    </>
  )
}
