import PropTypes from "prop-types";
import React from "react";
import { FaInbox } from "react-icons/fa";

const ExpandableCell = ({ content }) => {
  const [expanded, setExpanded] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(false);
  const contentRef = React.useRef(null);

  React.useEffect(() => {
    if (expanded || !contentRef.current) return undefined;

    const element = contentRef.current;
    const measureOverflow = () => {
      setHasMore(element.scrollHeight > element.clientHeight + 1);
    };

    measureOverflow();
    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(measureOverflow);
    observer?.observe(element);

    return () => observer?.disconnect();
  }, [content, expanded]);

  return (
    <>
      <div
        ref={contentRef}
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
              }
        }
      >
        {content}
      </div>
      {(hasMore || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-1 text-xs font-semibold text-lux-emerald hover:text-lux-deep underline"
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </>
  );
};

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
                  bg-lux-cream shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)] border border-[#e9e2d3]
                  transition-all duration-300 cubic-bezier(0.2, 0.8, 0.2, 1)
                  active:scale-[0.99] hover:shadow-lg hover:shadow-lux-emerald/10
                `}
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-lux-emerald via-lux-gold to-lux-emerald opacity-70 animate-gradient-border" />
                <div className="divide-y divide-[#ece4d2]">
                  {row.map((cell, cellIndex) => (
                    <div
                      key={cellIndex}
                      className="flex items-start justify-between gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3 transition-colors duration-150 hover:bg-lux-ivory"
                    >
                      <span className="text-[10px] sm:text-xs font-extrabold text-lux-emerald/80 uppercase tracking-[0.12em] shrink-0 mt-0.5 font-serif">
                        {headers[cellIndex]}
                      </span>
                      <div className="text-xs sm:text-sm font-semibold text-lux-ink text-right break-words max-w-[62%] leading-relaxed">
                        <ExpandableCell content={cell} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lux-gold/40 to-transparent" />
              </div>
            );
          })
        ) : (
          <div className="
            rounded-2xl border-2 border-dashed border-[#e6dcc4]
            bg-gradient-to-br from-lux-cream via-lux-ivory to-[#f2eee2]
            p-8 sm:p-10 text-center animate-scale-in
          ">
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-lux-cream to-[#f2eee2] flex items-center justify-center animate-float">
                <FaInbox className="w-6 h-6 sm:w-7 sm:h-7 text-lux-gold/70" />
              </div>
              <div>
                <p className="text-lux-ink text-sm sm:text-base font-bold font-serif">
                  No data available
                </p>
                <p className="text-lux-muted text-xs sm:text-sm mt-1">
                  Records will appear here when added
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="hidden md:block w-full overflow-x-auto rounded-2xl border border-[#e9e2d3] bg-lux-cream shadow-[0_18px_40px_-28px_rgba(6,95,70,0.35)]">
        <div className="relative">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="bg-gradient-to-r from-lux-emerald via-lux-deep to-lux-emerald">
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="relative px-5 py-4 text-left text-xs font-bold text-lux-gold-soft uppercase tracking-[0.1em] border-b border-lux-deep/30 whitespace-nowrap first:rounded-tl-2xl last:rounded-tr-2xl font-serif"
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
                      border-b border-[#ece4d2] last:border-0
                      odd:bg-lux-cream even:bg-[#f2eee2]/50
                      transition-all duration-300 ease-out
                      hover:bg-gradient-to-r hover:from-[#f7f4ec] hover:via-[#f7f4ec] hover:to-[#f2eee2]
                      hover:[&>td]:text-lux-ink
                      group
                    "
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="
                          px-5 py-3.5 text-sm text-lux-ink
                          border-x border-[#ece4d2]/60 align-top
                          transition-all duration-300 ease-out
                          group-hover:border-x-lux-gold-soft/70
                        "
                      >
                        <div className="transition-transform duration-300 ease-out group-hover:translate-x-0.5">
                          <ExpandableCell content={cell} />
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
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lux-cream to-[#f2eee2] flex items-center justify-center animate-float">
                        <FaInbox className="w-8 h-8 text-lux-gold/70" />
                      </div>
                      <div>
                        <p className="text-lux-ink font-bold text-base font-serif">
                          No data available
                        </p>
                        <p className="text-lux-muted text-sm mt-1">
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
