import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BidIntroduction = () => {
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "text-yellow-500";
      case "Accepted":
        return "text-green-500";
      case "Rejected":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="flex items-center justify-center p-4 min-h-screen bg-gradient-to-r from-blue-100 via-indigo-200 to-purple-100">
      <div className="bg-white shadow-2xl rounded-lg p-6 w-full max-w-4xl">
        <h2 className="text-3xl font-bold text-center text-indigo-600 mb-6">
          Bid Introduction
        </h2>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm text-left border border-gray-300 rounded-lg">
            <thead className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <tr>
                <th className="p-3 border">Supplier Name</th>
                <th className="p-3 border">Origin</th>
                <th className="p-3 border">BID Quantity (TONS)</th>
                <th className="p-3 border">BID Rate(INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-blue-100">
                <td className="p-3 border">
                  <input
                    type="text"
                    placeholder="Supplier Name"
                    className="w-full px-2 py-1 border rounded-md focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </td>
                <td className="p-3 border">
                  <input
                    type="text"
                    placeholder="Origin"
                    className="w-full px-2 py-1 border rounded-md focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </td>
                <td className="p-3 border">
                  <input
                    type="number"
                    placeholder="Quantity"
                    className="w-full px-2 py-1 border rounded-md focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </td>
                <td className="p-3 border">
                  <input
                    type="number"
                    placeholder="Amount"
                    className="w-full px-2 py-1 border rounded-md focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <h3 className="text-xl font-semibold text-indigo-600 mt-4 mb-4">
          Negotiate Rate
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-gray-300 rounded-lg">
            <thead className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <tr>
                <th className="p-3 border">Negotiate Rate(INR)</th>
                <th className="p-3 border">Negotiate Quantity (TONS)</th>
                <th className="p-3 border">Acc. Qty</th>
                <th className="p-3 border">Acc. Rate</th>
                <th className="p-3 border">Remark</th>
                <th className="p-3 border">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-blue-100">
                <td className="p-3 border">
                  <input
                    type="number"
                    placeholder="Negotiate Rate"
                    className="w-full px-2 py-1 border rounded-md focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </td>
                <td className="p-3 border">
                  <input
                    type="number"
                    placeholder="Negotiate Quantity (TONS)"
                    className="w-full px-2 py-1 border rounded-md focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </td>
                <td className="p-3 border">
                  <input
                    type="number"
                    placeholder="Acc. Qty"
                    className="w-full px-2 py-1 border rounded-md focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </td>
                <td className="p-3 border">
                  <input
                    type="number"
                    placeholder="Acc. Rate"
                    className="w-full px-2 py-1 border rounded-md focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </td>
                <td className="p-3 border">
                  <input
                    type="text"
                    placeholder="Remark"
                    className="w-full px-2 py-1 border rounded-md focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </td>
                <td className="p-3 border">
                  <select
                    className={`w-full px-2 py-1 border rounded-md focus:ring-2 focus:ring-indigo-400 outline-none ${getStatusColor(
                      status
                    )}`}
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="">Select Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex justify-between mt-6">
          <button
            className="px-6 py-2 bg-gray-400 text-white font-semibold rounded-md hover:bg-gray-500 transition duration-300"
            onClick={() => {
              navigate("/manage-bids/bid-list", { replace: true });
              window.location.reload();
            }}
          >
            Back
          </button>
          <button className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition duration-300">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default BidIntroduction;
