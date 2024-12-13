import PropTypes from "prop-types";

const Tables = ({ headers, rows }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto border-collapse border border-gray-300 shadow-md">
        <thead>
          <tr className="bg-gradient-to-r from-blue-500 to-blue-700 text-white">
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-2 border border-gray-300 text-left text-xs md:text-sm lg:text-base font-semibold uppercase tracking-wide"
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
                  rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"
                } hover:bg-blue-100`}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="px-4 py-2 border border-gray-300 text-xs md:text-sm lg:text-base break-words"
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
                className="text-center py-4 text-sm md:text-base text-gray-500"
              >
                No data available
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

Tables.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
  rows: PropTypes.arrayOf(PropTypes.array).isRequired,
};

export default Tables;
