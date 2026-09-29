import PropTypes from "prop-types";
import React from "react";
import { FaInbox } from "react-icons/fa";

// eslint-disable-next-line react/display-name
const Tables = React.memo(({ headers, rows }) => {
  return (
    <div className="w-full">
      <div className="md:hidden space-y-2.5 sm:space-y-3">
        {rows.length > 0 ? (
          rows.map((row, rowIndex) => {
            const staggerDelay = `stagger-${Math.min((rowIndex % 8) + 1, 8)}`;
            return (
              <div
                key={rowIndex}
                className={`
                  relative animate-card-stagger ${staggerDelay}
                  rounded-2xl overflow-hidden
                  bg-white shadow-md shadow-slate-900/5 border border-slate-200/80
                  transition-all duration-300 cubic-bezier(0.2, 0.8, 0.2, 1)
                  active:scale-[0.99] hover:shadow-lg hover:shadow-slate-900/10
                `}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400 opacity-70 animate-gradient-border" />
                <div className="divide-y divide-slate-100">
                  {row.map((cell, cellIndex) => (
                    <div
                      key={cellIndex}
                      className="flex items-start justify-between gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 transition-colors duration-150 hover:bg-slate-50/50"
                    >
                      <span className="text-[10px] sm:text-xs font-extrabold text-emerald-700/80 uppercase tracking-[0.12em] shrink-0 mt-0.5 font-display">
                        {headers[cellIndex]}
                      </span>
                      <div className="text-xs sm:text-sm font-semibold text-slate-800 text-right break-words max-w-[62%] leading-relaxed">
                        {cell}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-200/60 to-transparent" />
              </div>
            );
          })
        ) : (
          <div className="
            rounded-2xl border-2 border-dashed border-emerald-200/60
            bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/30
            p-8 sm:p-10 text-center animate-scale-in
          ">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center animate-float">
                <FaInbox className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-600/70" />
              </div>
              <div>
                <p className="text-slate-700 text-sm sm:text-base font-bold">
                  No data available
                </p>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">
                  Records will appear here when added
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:block w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
        <div className="relative">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-800 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-gradient-border opacity-50" />
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="relative px-5 py-4 text-left text-xs font-bold text-white uppercase tracking-[0.1em] border-b border-emerald-600/30 whitespace-nowrap first:rounded-tl-2xl last:rounded-tr-2xl font-display"
                  >
                    <span className="relative z-10">{header}</span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.length > 0 ? (
                rows.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="
                      border-b border-slate-100 last:border-0
                      odd:bg-white even:bg-slate-50/40
                      transition-all duration-300 ease-out
                      hover:bg-gradient-to-r hover:from-emerald-50/80 hover:via-teal-50/50 hover:to-cyan-50/50
                      hover:[&>td]:text-slate-900
                      group
                    "
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="
                          px-5 py-3.5 text-sm text-slate-800
                          border-x border-slate-100/60 align-top
                          transition-all duration-300 ease-out
                          group-hover:border-x-emerald-100
                        "
                      >
                        <div className="transition-transform duration-300 ease-out group-hover:translate-x-0.5">
                          {cell}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={headers.length}
                    className="px-5 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-4 animate-scale-in">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center animate-float">
                        <FaInbox className="w-8 h-8 text-emerald-600/70" />
                      </div>
                      <div>
                        <p className="text-slate-700 font-bold text-base">
                          No data available
                        </p>
                        <p className="text-slate-500 text-sm mt-1">
                          Records will appear here when they are available
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

Tables.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
  rows: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.node)).isRequired,
};

export default Tables;
