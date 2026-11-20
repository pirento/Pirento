// Generic staff queue: status filter pills over a list.
import {useState} from 'react';
import {useApi} from '../../lib/api/useApi';

export function StaffQueue({path, filters, render}) {
  const [filter, setFilter] = useState(filters[0].value);
  // A filter is a status, or a ready query such as "mine=1".
  const query = filter && (filter.includes('=') ? filter : `status=${filter}`);
  const queue = useApi(`${path}${query ? `?${query}` : ''}`);
  return (
    <>
      <div role="tablist" aria-label="Filter" className="no-scrollbar mt-8 flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f.label}
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm ${filter === f.value ? 'border-ink bg-ink text-paper' : 'border-rule hover:border-ink'}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="mt-8 border-t border-rule">
        {queue.error && <p className="body py-6">⚠ {queue.error.message}</p>}
        {queue.data?.length === 0 && <p className="body py-6">Nothing here. All caught up.</p>}
        {queue.data?.map((item) => render(item, queue.reload))}
      </div>
    </>
  );
}

// The work queues, shown as sections of the admin dashboard.
