          <h1>Usuarios</h1>
          <p>La fuente maestra es la LIST <strong>02_Usuarios</strong>. El Excel queda disponible sólo como respaldo temporal mientras Graph no esté habilitado.</p>
        </div>
        <button className="users-refresh" type="button" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={17} /> Actualizar
        </button>
      </div>

      <section className="users-source-card">
        <div className="users-source-title">
          <div className="users-source-icon"><FileSpreadsheet size={23} /></div>
          <div>
            <strong>Fuente de Usuarios</strong>
            <span>{meta?.source === "SHAREPOINT_LIST" ? `LIST ${meta.listName || "02_Usuarios"}` : meta ? `Respaldo temporal · ${meta.sheet}` : "Pendiente de conexión"}</span>
          </div>
          <div className={`users-source-state ${meta ? "ok" : "pending"}`}>
            {meta ? <CheckCircle2 size={16} /> : <Link2 size={16} />}
            {meta?.source === "SHAREPOINT_LIST" ? "LIST ACTIVA" : meta ? "FALLBACK" : "SIN CONEXIÓN"}
          </div>
        </div>

        <label className="users-url-field">
          <span>LINK DEL EXCEL TEMPORAL</span>
          <input
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://.../Usuarios.xlsx"
            type="url"
          />
          <small>Este enlace sólo se usa si 02_Usuarios no puede leerse desde SharePoint. Cuando Graph esté habilitado, la LIST gobierna automáticamente.</small>
        </label>

        <div className="users-source-actions">
          <button type="button" className="users-save" onClick={() => void handleSave()} disabled={saving || !url.trim()}>
            <Save size={17} /> {saving ? "Probando conexión…" : "Guardar y probar"}
          </button>
          {meta && <span>Última lectura: {dateLabel(meta.checkedAt)}</span>}
        </div>

        {message && <div className="users-alert success"><CheckCircle2 size={17} /> {message}</div>}
        {meta?.warning && <div className="users-alert error"><XCircle size={17} /> {meta.warning}</div>}
        {error && <div className="users-alert error"><XCircle size={17} /> {error}</div>}
      </section>

      <section className="users-source-card">
        <div className="users-source-title">
          <div className="users-source-icon"><Database size={23} /></div>
          <div>
            <strong>Fuentes operativas de la app</strong>
            <span>Usuarios, procesos, campos, asignaciones y SLA se administran desde LISTs.</span>
          </div>
        </div>
        <div className="users-table-wrap">
          <table>
            <thead><tr><th>Fuente</th><th>LIST</th><th>Estado</th><th>Registros</th></tr></thead>
            <tbody>
              {[
                ["Usuarios", operationsStatus?.users],
                ["Procesos", operationsStatus?.processes],
                ["Campos de proceso", operationsStatus?.fields],
                ["Asignaciones", operationsStatus?.assignments],
                ["SLA", operationsStatus?.sla],
              ].map(([label, info]: any) => (
                <tr key={label}>
                  <td><strong>{label}</strong></td>
                  <td>{info?.listName || "—"}</td>
                  <td><span className={`users-status ${info?.source === "SHAREPOINT_LIST" ? "active" : "inactive"}`}>{info?.source === "SHAREPOINT_LIST" ? "LIST activa" : info?.source === "CACHE" ? "Caché" : "Fallback"}</span></td>
                  <td>{info?.count ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="users-summary">
        <article><UsersRound size={20} /><span>Usuarios activos</span><strong>{activeUsers.length}</strong></article>
        <article><span>Locales</span><strong>{locals}</strong><small>según asignación</small></article>
        <article><span>Perfiles</span><strong>{roles}</strong><small>roles distintos</small></article>
        <article><span>Total filas</span><strong>{users.length}</strong><small>{meta?.inactiveCount || 0} inactivos</small></article>
      </section>

      <section className="users-table-card">
        <div className="users-table-header">
          <div>
            <strong>Directorio operativo</strong>
            <span>{loading ? "Leyendo fuente…" : `${users.length} usuarios encontrados`}</span>
          </div>
          <span className="users-structure">LIST primero · Excel sólo fallback</span>
        </div>

        <div className="users-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Local principal</th>
                <th>Locales asignados</th>
                <th>Alcance</th>
                <th>Marcas</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {!loading && users.length === 0 && (
                <tr><td colSpan={8} className="users-empty">No fue posible cargar el directorio desde 02_Usuarios ni desde el respaldo temporal.</td></tr>
              )}
              {users.map((user) => (
                <tr key={user.email}>
                  <td><strong>{user.name}</strong></td>
                  <td>{user.email}</td>
                  <td>{roleLabel(user.role)}</td>
                  <td>{user.localPrincipal || user.local || "—"}</td>
                  <td>{user.assignedLocals?.join(" · ") || "—"}</td>
                  <td>{user.scope || "—"}</td>
                  <td>{user.brands?.join(" · ") || "—"}</td>
                  <td><span className={`users-status ${user.active ? "active" : "inactive"}`}>{user.active ? "Activo" : "Inactivo"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
