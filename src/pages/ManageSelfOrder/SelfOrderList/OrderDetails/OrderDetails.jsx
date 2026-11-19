import PropTypes from "prop-types";

const OrderDetails = ({ item, qualityParameters = [], commodities = [] }) => {
  const parameterNames = new Map(
    qualityParameters.map((parameter) => [
      String(parameter._id),
      parameter.name,
    ]),
  );
  const commodity = commodities.find(
    (entry) =>
      String(entry.name || "").trim().toLowerCase() ===
      String(item.commodity || "").trim().toLowerCase(),
  );

  (commodity?.parameters || []).forEach((parameter) => {
    const id =
      parameter.parameterId?._id ||
      parameter.parameterId ||
      parameter._id;
    const name =
      parameter.parameterId?.name ||
      parameter.parameter ||
      parameter.name;
    if (id && name && !parameterNames.has(String(id))) {
      parameterNames.set(String(id), name);
    }
  });

  const getParameterName = (parameter) => {
    const parameterId =
      parameter.parameterId?._id ||
      parameter.parameterId ||
      parameter.id?._id ||
      parameter.id;
    const storedName =
      typeof parameter.parameter === "string"
        ? parameter.parameter
        : parameter.parameter?.name || parameter.name || parameter.label;
    const isId = /^[a-f\d]{24}$/i.test(String(storedName || ""));

    return (
      parameterNames.get(String(parameterId)) ||
      (!isId && storedName) ||
      "Unknown Parameter"
    );
  };

  const getParameterValue = (parameter) => {
    const baseValue = parameter.baseValue;
    const maxValue = parameter.maxValue;
    const hasValue = (value) =>
      value != null && String(value).trim() !== "";
    const hasBaseValue = hasValue(baseValue);
    const hasMaxValue = hasValue(maxValue);

    if (hasBaseValue || hasMaxValue) {
      return [
        hasBaseValue ? `Base: ${baseValue}%` : null,
        hasMaxValue ? `Max: ${maxValue}%` : null,
      ]
        .filter(Boolean)
        .join(" Upto ");
    }

    return hasValue(parameter.value) ? `${parameter.value}%` : null;
  };
  const displayParameters = (Array.isArray(item.parameters) ? item.parameters : [])
    .map((parameter) => ({
      parameter,
      value: getParameterValue(parameter),
    }))
    .filter(({ value }) => value);

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
        {displayParameters.length > 0 && (
          <div className="mt-2 space-y-1 rounded-2xl border border-[#ece4d2] bg-lux-ivory p-3">
            <p className="lux-eyebrow mb-2">Quality Parameters</p>
            {displayParameters.map(({ parameter, value }, idx) => (
              <p key={idx} className="text-sm">
                <span className="font-bold text-lux-ink">
                  {getParameterName(parameter)}:
                </span>{" "}
                <span className="font-black text-lux-emerald">
                  {value}
                </span>
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
  qualityParameters: PropTypes.array,
  commodities: PropTypes.array,
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
