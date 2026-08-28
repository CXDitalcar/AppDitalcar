type BrandProps = {
  large?: boolean
}

export default function Brand({ large = false }: BrandProps) {
  return (
    <div className={`brand ${large ? "brand-large" : ""}`}>
      <img
        src="/assets/DITALCAR%20%20LOGO%20b.png"
        alt="Ditalcar"
        className="brand-logo"
      />

      <div className="brand-copy">
        <strong>COLABORADORES</strong>
        <span>Portal interno Ditalcar</span>
      </div>
    </div>
  )
}
