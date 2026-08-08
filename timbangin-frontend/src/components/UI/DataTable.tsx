import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
}

function DataTable<T>({ data, columns, isLoading }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto shadow-sm ring-1 ring-gray-200 dark:ring-steel-900 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-steel-800">
        <thead className="bg-gray-100 dark:bg-steel-800">
          <tr>
            {columns.map((col, index) => (
              <th
                key={index}
                scope="col"
                className={`py-3 pl-4 pr-3 text-left text-xs font-display font-semibold text-gray-700 dark:text-steel-100 uppercase tracking-widest sm:pl-6 ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-steel-800 bg-white dark:bg-steel-900">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400 font-mono">
                Loading data...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-8 text-center text-sm text-gray-500 dark:text-gray-400 font-mono">
                Tidak ada data.
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-steel-800 transition-colors even:bg-gray-50/50 dark:even:bg-steel-800/30">
                {columns.map((col, colIndex) => (
                  <td
                    key={colIndex}
                    className={`whitespace-nowrap py-3.5 pl-4 pr-3 text-sm text-gray-700 dark:text-steel-100 sm:pl-6 ${col.className || ''}`}
                  >
                    {typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : (row[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
