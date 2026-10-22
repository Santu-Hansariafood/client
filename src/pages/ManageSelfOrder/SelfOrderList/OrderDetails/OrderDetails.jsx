import PropTypes from "prop-types";

const OrderDetails = ({ item }) => {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
      <div className="space-y-2 text-lux-ink">
        <p>
          <strong className="font-serif font-semibold text-lux-ink">Buyer:</strong> {item.buyer}
        </p>
        <p>
          <strong className="font-serif font-semibold text-lux-ink">Buyer Company:</strong> {item.buyerCompany}
        </p>
        <p>
          <strong className="font-serif font-semibold text-lux-ink">Consignee:</strong> {item.consignee}
        </p>
        <p>
          <strong className="font-serif font-semibold text-lux-ink">Commodity:</strong> {item.commodity}
        </p>
        {Array.isArray(item.parameters) && item.parameters.length > 0 && (
          <div className="mt-2 space-y-1 rounded-2xl border border-[#ece4d2] bg-lux-ivory p-3">
            <p className="lux-eyebrow mb-2">Quality Parameters</p>
            {item.parameters.map((p, idx) => (
              <p key={idx} className="text-sm">
                <span className="font-bold text-lux-ink">{p.parameter || p.id || "Parameter"}:</span>{" "}
                <span className="font-black text-lux-emerald">{p.value}%</span>
              </p>
            ))}
          </div>
        )}
        <p>
          <strong className="font-serif font-semibold text-lux-ink">Quantity:</strong> {item.quantity} Tons
        </p>
        <p>
          <strong className="font-serif font-semibold text-lux-ink">Pending Quantity:</strong> {item.pendingQuantity} Tons
        </p>
        <p>
          <strong className="font-serif font-semibold text-lux-ink">Rate:</strong> ₹{item.rate}
        </p>
        <p>
          <strong className="font-serif font-semibold text-lux-ink">State:</strong> {item.state}
        </p>
        <p>
          <strong className="font-serif font-semibold text-lux-ink">Location:</strong> {item.location}
        </p>
      </div>
      <div className="space-y-2 text-lux-ink">
        <p>
          <strong className="font-serif font-semibold text-lux-ink">Broker:</strong> Hansaria Food Private Limited
        </p>
        <p>
          <strong className="font-serif font-semibold text-lux-ink">Agent Name:</strong> {item.agentName}
        </p>
        <p>
          <strong className="font-serif font-semibold text-lux-ink">PO Date:</strong> {new Date(item.poDate).toLocaleDateString()}
        </p>
        <p>
          <strong className="font-serif font-semibold text-lux-ink">Delivery Date:</strong>{" "}
          {new Date(item.deliveryDate).toLocaleDateString()}
        </p>
        <p>
          <strong className="font-serif font-semibold text-lux-ink">Loading Date:</strong>{" "}
          {new Date(item.loadingDate).toLocaleDateString()}
        </p>
        <p>
          <strong className="font-serif font-semibold text-lux-ink">GST:</strong> {item.gst} %
        </p>
        <p>
          <strong className="font-serif font-semibold text-lux-ink">CD:</strong> {item.cd} %
        </p>
        <p>
          <strong className="font-serif font-semibold text-lux-ink">Weight:</strong> {item.weight} Tons
        </p>
        <p>
          <strong className="font-serif font-semibold text-lux-ink">Payment Terms:</strong> {item.paymentTerms} Days
        </p>
        <p>
          <strong className="font-serif font-semibold text-lux-ink">Notes:</strong> {item.notes.join(", ") || "None"}
        </p>
      </div>
    </div>
  );
};

OrderDetails.propTypes = {
  item: PropTypes.shape({
    buyer: PropTypes.string.isRequired,
    buyerCompany: PropTypes.string.isRequired,
    consignee: PropTypes.string.isRequired,
    commodity: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
    pendingQuantity: PropTypes.number.isRequired,
    rate: PropTypes.number.isRequired,
    state: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    agentName: PropTypes.string.isRequired,
    poDate: PropTypes.string.isRequired,
    deliveryDate: PropTypes.string.isRequired,
    loadingDate: PropTypes.string.isRequired,
    gst: PropTypes.number.isRequired,
    cd: PropTypes.number.isRequired,
    weight: PropTypes.number.isRequired,
    paymentTerms: PropTypes.number.isRequired,
    notes: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
};

export default OrderDetails;
