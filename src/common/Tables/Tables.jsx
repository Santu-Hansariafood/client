import PropTypes from "prop-types";

const Tables = ({ headers, rows }) => {
  return (
    <div className="w-full overflow-x-auto scroll-smooth rounded-2xl shadow-lg bg-white">
      <table className="w-full table-auto border-separate border-spacing-0 min-w-max">
        <thead className="sticky top-0 z-10">
          <tr className="bg-gradient-to-r from-green-500 to-green-700 text-white">
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 border-b border-green-600 text-left text-xs md:text-sm lg:text-base font-bold uppercase tracking-wider whitespace-nowrap sticky top-0 bg-gradient-to-r from-green-500 to-green-700 shadow-md"
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
                    className="px-4 py-3 border-b border-gray-200 text-xs md:text-sm lg:text-base break-words whitespace-nowrap"
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
  );
};

Tables.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
  rows: PropTypes.arrayOf(PropTypes.array).isRequired,
};

export default Tables;
