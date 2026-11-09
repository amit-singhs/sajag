import type { ReactNode } from 'react';
import { ErrorNotice, Loading } from './Feedback';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'start' | 'end';
  mono?: boolean;
}

interface DataTableProps<T> {
  columns: ReadonlyArray<Column<T>>;
  rows: readonly T[];
  rowKey: (row: T) => string;
  empty?: string;
  caption?: string;
}

/** Generic, horizontally scrollable table — never forces the page to scroll sideways on a phone. */
export function DataTable<T>({ columns, rows, rowKey, empty = 'अभी कोई प्रविष्टि नहीं', caption }: DataTableProps<T>) {
  if (rows.length === 0) return <p className="muted">{empty}</p>;
  return (
    <div className="table-wrap">
      <table className="table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.align === 'end' ? 'is-end' : undefined} scope="col">
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((c) => (
                <td key={c.key} className={[c.align === 'end' ? 'is-end' : '', c.mono ? 'mono' : ''].join(' ').trim() || undefined}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface QueryTableProps<T> extends Omit<DataTableProps<T>, 'rows'> {
  query: { data: readonly T[] | undefined; isLoading: boolean; error: unknown };
}

/** DataTable bound to a React Query result: shows loader, error and empty states consistently. */
export function QueryTable<T>({ query, ...table }: QueryTableProps<T>) {
  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorNotice error={query.error} />;
  return <DataTable rows={query.data ?? []} {...table} />;
}
