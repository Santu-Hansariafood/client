import PropTypes from "prop-types";

const Tables = ({ headers, rows }) => {
  return (
    <div className="w-full">
      <div className="md:hidden space-y-3">
        {rows.length > 0 ? (
          rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="rounded-2xl border border-[#8CC63F]/20 bg-white overflow-hidden shadow-md shadow-slate-900/5"
            >
              <div className="divide-y divide-slate-100">
                {row.map((cell, cellIndex) => (
                  <div
                    key={cellIndex}
                    className="flex justify-between gap-4 px-4 py-3.5"
                  >
                    <span className="text-xs font-semibold text-[#8CC63F] uppercase tracking-wider shrink-0">
                      {headers[cellIndex]}
                    </span>
                    <div className="text-sm text-slate-800 text-right break-words max-w-[60%]">
                      {cell}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-[#8CC63F]/30 bg-[#8CC63F]/5 p-8 text-center">
            <p className="text-slate-600 font-medium">No data available</p>
          </div>
        )}
      </div>

      <div className="hidden md:block w-full overflow-x-auto rounded-2xl border border-[#8CC63F]/20 bg-white shadow-lg shadow-slate-900/5">
        <table className="w-full min-w-[600px] border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-[#8CC63F] to-[#7AB034]">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-5 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider border-b border-[#8CC63F]/20 whitespace-nowrap first:rounded-tl-2xl last:rounded-tr-2xl"
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
                  className="border-b border-slate-100 last:border-0 odd:bg-white even:bg-slate-50/50 hover:bg-[#8CC63F]/5 transition-colors"
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-5 py-3.5 text-sm text-slate-800 whitespace-nowrap"
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
                  className="px-5 py-12 text-center text-slate-500"
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
