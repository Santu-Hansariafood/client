import PropTypes from "prop-types";

const Tables = ({ headers, rows }) => {
  return (
    <div className="w-full">
      {/* Mobile View */}
      <div className="md:hidden space-y-3">
        {rows.length > 0 ? (
          rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
            >
              <div className="divide-y divide-slate-100 dark:divide-slate-700/80">
                {row.map((cell, cellIndex) => (
                  <div
                    key={cellIndex}
                    className="flex justify-between gap-4 px-4 py-3.5"
                  >
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0">
                      {headers[cellIndex]}
                    </span>
                    <div className="text-sm text-slate-800 dark:text-slate-200 text-right break-words max-w-[60%]">
                      {cell}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400">No data available</p>
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-5 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 whitespace-nowrap"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.length > 0 ? (
              rows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-b border-slate-100 dark:border-slate-700/50 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-5 py-3.5 text-sm text-slate-800 dark:text-slate-200 whitespace-nowrap"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-5 py-12 text-center text-slate-500 dark:text-slate-400"
                >
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

Tables.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
  rows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.node)).isRequired,
};

export default Tables;
