import { useState } from "react";
import { useNavigate } from "react-router-dom";

const BidIntroduction = () => {
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "text-lux-gold";
      case "Accepted":
        return "text-lux-emerald";
      case "Rejected":
        return "text-red-500";
      default:
        return "text-lux-muted";
    }
  };

  return (
    <div className="flex items-center justify-center p-4 min-h-screen lux-canvas">
      <div className="lux-card p-6 w-full max-w-4xl">
        <h2 className="text-3xl font-bold font-serif text-center text-lux-ink mb-6">
          Bid Introduction
        </h2>
        <div className="overflow-x-auto mb-6">
          <table className="w-full text-sm text-left border border-[#e9e2d3] rounded-lg">
            <thead className="bg-lux-ivory text-lux-ink">
              <tr>
                <th className="p-3 border">Supplier Name</th>
                <th className="p-3 border">Origin</th>
                <th className="p-3 border">BID Quantity (TONS)</th>
                <th className="p-3 border">BID Rate(INR)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-lux-ivory">
                <td className="p-3 border">
                  <input
                    type="text"
                    placeholder="Supplier Name"
                    className="w-full px-2 py-1 border border-[#e9e2d3] rounded-md bg-lux-ivory text-lux-ink placeholder:text-lux-muted/70 focus:border-lux-gold/50 focus:ring-2 focus:ring-lux-gold/30 outline-none"
                  />
                </td>
                <td className="p-3 border">
                  <input
                    type="text"
                    placeholder="Origin"
                    className="w-full px-2 py-1 border border-[#e9e2d3] rounded-md bg-lux-ivory text-lux-ink placeholder:text-lux-muted/70 focus:border-lux-gold/50 focus:ring-2 focus:ring-lux-gold/30 outline-none"
                  />
                </td>
                <td className="p-3 border">
                  <input
                    type="number"
                    placeholder="Quantity"
                    className="w-full px-2 py-1 border border-[#e9e2d3] rounded-md bg-lux-ivory text-lux-ink placeholder:text-lux-muted/70 focus:border-lux-gold/50 focus:ring-2 focus:ring-lux-gold/30 outline-none"
                  />
                </td>
                <td className="p-3 border">
                  <input
                    type="number"
                    placeholder="Amount"
                    className="w-full px-2 py-1 border border-[#e9e2d3] rounded-md bg-lux-ivory text-lux-ink placeholder:text-lux-muted/70 focus:border-lux-gold/50 focus:ring-2 focus:ring-lux-gold/30 outline-none"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <h3 className="text-xl font-semibold font-serif text-lux-ink mt-4 mb-4">
          Negotiate Rate
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border border-[#e9e2d3] rounded-lg">
            <thead className="bg-lux-ivory text-lux-ink">
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
              <tr className="hover:bg-lux-ivory">
                <td className="p-3 border">
                  <input
                    type="number"
                    placeholder="Negotiate Rate"
                    className="w-full px-2 py-1 border border-[#e9e2d3] rounded-md bg-lux-ivory text-lux-ink placeholder:text-lux-muted/70 focus:border-lux-gold/50 focus:ring-2 focus:ring-lux-gold/30 outline-none"
                  />
                </td>
                <td className="p-3 border">
                  <input
                    type="number"
                    placeholder="Negotiate Quantity (TONS)"
                    className="w-full px-2 py-1 border border-[#e9e2d3] rounded-md bg-lux-ivory text-lux-ink placeholder:text-lux-muted/70 focus:border-lux-gold/50 focus:ring-2 focus:ring-lux-gold/30 outline-none"
                  />
                </td>
                <td className="p-3 border">
                  <input
                    type="number"
                    placeholder="Acc. Qty"
                    className="w-full px-2 py-1 border border-[#e9e2d3] rounded-md bg-lux-ivory text-lux-ink placeholder:text-lux-muted/70 focus:border-lux-gold/50 focus:ring-2 focus:ring-lux-gold/30 outline-none"
                  />
                </td>
                <td className="p-3 border">
                  <input
                    type="number"
                    placeholder="Acc. Rate"
                    className="w-full px-2 py-1 border border-[#e9e2d3] rounded-md bg-lux-ivory text-lux-ink placeholder:text-lux-muted/70 focus:border-lux-gold/50 focus:ring-2 focus:ring-lux-gold/30 outline-none"
                  />
                </td>
                <td className="p-3 border">
                  <input
                    type="text"
                    placeholder="Remark"
                    className="w-full px-2 py-1 border border-[#e9e2d3] rounded-md bg-lux-ivory text-lux-ink placeholder:text-lux-muted/70 focus:border-lux-gold/50 focus:ring-2 focus:ring-lux-gold/30 outline-none"
                  />
                </td>
                <td className="p-3 border">
                  <select
                    className={`w-full px-2 py-1 border border-[#e9e2d3] rounded-md bg-lux-ivory text-lux-ink focus:border-lux-gold/50 focus:ring-2 focus:ring-lux-gold/30 outline-none ${getStatusColor(
                      status,
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
            className="px-6 py-2 bg-lux-cream border border-[#e9e2d3] text-lux-emerald font-semibold rounded-md hover:bg-lux-ivory transition duration-300"
            onClick={() => {
              navigate("/manage-bids/bid-list", { replace: true });
              window.location.reload();
            }}
          >
            Back
          </button>
          <button className="px-6 py-2 bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft ring-1 ring-lux-gold/30 hover:from-lux-deep hover:to-lux-night font-semibold rounded-md transition duration-300">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default BidIntroduction;
