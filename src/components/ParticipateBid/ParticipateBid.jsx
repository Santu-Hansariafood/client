import React, { useEffect, useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import { useAuth } from "../../context/AuthContext/AuthContext";

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
                className={`transition-colors duration-200 ${rowIndex % 2 === 0 ? "bg-gray-50" : "bg-white"} hover:bg-blue-100`}
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

const ParticipateBid = () => {
  const { mobile } = useAuth();
  const [bids, setBids] = useState([]);
  const [participations, setParticipations] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  useEffect(() => {
    const fetchBidsAndParticipations = async () => {
      try {
        const [bidsRes, participateRes] = await Promise.all([
          axios.get("https://phpserver-v77g.onrender.com/api/bids"),
          axios.get("https://phpserver-v77g.onrender.com/api/participatebids"),
        ]);

        setBids(bidsRes.data);
        setParticipations(participateRes.data);
      } catch (error) {
        console.error("Error fetching data", error);
      }
    };

    fetchBidsAndParticipations();
  }, []);

  useEffect(() => {
    if (bids.length > 0 && participations.length > 0) {
      const matchedData = participations
        .filter((p) => String(p.mobile) === String(mobile))
        .map((participation) => {
          const bid = bids.find((b) => b._id === participation.bidId);
          return bid
            ? [1,
                bid.group,
                bid.consignee,
                bid.origin,
                bid.commodity,
                bid.quantity,
                bid.rate,
                participation.rate,
                participation.quantity,
                new Date(participation.participationDate).toLocaleString(),
                "Status"
              ]
            : null;
        })
        .filter((item) => item !== null);

      setFilteredData(matchedData);
    }
  }, [bids, participations, mobile]);

  const headers = [
    "Count",
    "Group",
    "Consignee",
    "Origin",
    "Commodity",
    "Bid Quantity",
    "Bid Rate",
    "Participation Rate",
    "Participation Quantity",
    "Participation Date",
    "Status"
  ];

  return (
    <div className="p-6 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Participated Bids</h2>
      <Tables headers={headers} rows={filteredData} />
    </div>
  );
};

export default ParticipateBid;
