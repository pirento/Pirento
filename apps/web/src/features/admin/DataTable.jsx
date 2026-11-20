// A plain table for admin lists: scrolls sideways on small screens instead of squashing.
export function DataTable({columns, rows, rowKey = (r) => r._id, empty = 'Nothing here yet.', error}) {
  if (error) return <p className="body py-6">⚠ {error.message}</p>;
  if (!rows) return <p className="body py-6 text-muted">Loading…</p>;
  if (rows.length === 0) return <p className="body py-6">{empty}</p>;
  return (
    <div className="overflow-x-auto rounded-[18px] border border-rule">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="bg-stone text-xs tracking-[0.08em] text-muted uppercase">
          <tr>
            {columns.map((c) => (
              <th key={c.label} scope="col" className={`px-4 py-3 font-medium ${c.right ? 'text-right' : ''}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={rowKey(r)} className="border-t border-rule">
              {columns.map((c) => (
                <td key={c.label} className={`px-4 py-3 align-top ${c.right ? 'text-right tabular-nums' : ''}`}>
                  {c.cell(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
