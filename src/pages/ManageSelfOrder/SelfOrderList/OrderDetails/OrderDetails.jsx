import PropTypes from "prop-types";

const OrderDetails = ({ item }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <p>
          <strong>Buyer:</strong> {item.buyer}
        </p>
        <p>
          <strong>Buyer Company:</strong> {item.buyerCompany}
        </p>
        <p>
          <strong>Consignee:</strong> {item.consignee}
        </p>
        <p>
          <strong>Commodity:</strong> {item.commodity}
        </p>
        <p>
          <strong>Quantity:</strong> {item.quantity} Tons
        </p>
        <p>
          <strong>Pending Quantity:</strong> {item.pendingQuantity} Tons
        </p>
        <p>
          <strong>Rate:</strong> ₹{item.rate}
        </p>
        <p>
          <strong>State:</strong> {item.state}
        </p>
        <p>
          <strong>Location:</strong> {item.location}
        </p>
      </div>
      <div>
        <p>
          <strong>Broker:</strong> Hansaria Food Private Limited
        </p>
        <p>
          <strong>Agent Name:</strong> {item.agentName}
        </p>
        <p>
          <strong>PO Date:</strong> {new Date(item.poDate).toLocaleDateString()}
        </p>
        <p>
          <strong>Delivery Date:</strong>{" "}
          {new Date(item.deliveryDate).toLocaleDateString()}
        </p>
        <p>
          <strong>Loading Date:</strong>{" "}
          {new Date(item.loadingDate).toLocaleDateString()}
        </p>
        <p>
          <strong>GST:</strong> {item.gst} %
        </p>
        <p>
          <strong>CD:</strong> {item.cd} %
        </p>
        <p>
          <strong>Weight:</strong> {item.weight} Tons
        </p>
        <p>
          <strong>Payment Terms:</strong> {item.paymentTerms} Days
        </p>
        <p>
          <strong>Notes:</strong> {item.notes.join(", ") || "None"}
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
