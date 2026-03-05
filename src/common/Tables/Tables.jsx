import PropTypes from "prop-types";

const Tables = ({ headers, rows }) => {
  return (
    <div className="w-full">
      <div className="space-y-3 md:hidden">
        {rows.length > 0 ? (
          rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="bg-white/95 rounded-2xl shadow-md border border-gray-200 overflow-hidden"
            >
              <div className="divide-y divide-gray-100">
                {row.map((cell, cellIndex) => (
                  <div
                    key={cellIndex}
                    className="flex items-start justify-between px-4 py-3"
                  >
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 mr-4">
                      {headers[cellIndex]}
                    </span>
                    <div className="text-sm text-gray-900 text-right max-w-[55%] break-words">
                      {cell}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 text-center text-gray-500">
            No data available
          </div>
        )}
      </div>

      <div className="hidden md:block overflow-x-auto scroll-smooth rounded-2xl shadow-lg bg-white">
        <table className="w-full table-auto border-separate border-spacing-0 min-w-max">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-to-r from-green-600 to-green-700 text-white">
              {headers.map((header, index) => (
                <th
                  key={index}
                  scope="col"
                  className="px-5 py-3 border-b border-green-700 text-left text-sm lg:text-base font-bold uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gradient-to-r from-green-600 to-green-700 shadow-md backdrop-blur-sm"
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
                  className={`transition-colors duration-200 ${
                    rowIndex % 2 === 0 ? "bg-green-50" : "bg-white"
                  } hover:bg-green-100`}
                >
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-5 py-3 border-b border-gray-200 text-sm lg:text-base break-words whitespace-nowrap"
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
                  className="text-center py-6 text-base md:text-lg text-gray-500"
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
