import { useEffect } from "react";
import { FaHandshake, FaMoneyBillWave, FaFileInvoice, FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";

const BrokerCommissionPolicy = () => {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-gradient-to-br from-green-50 via-white to-green-100 min-h-screen py-14 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-green-700">
            Broker Commission Policy
          </h1>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            <strong>Hansaria Food Private Limited</strong> outlines the rules
            governing brokerage commissions, service charges, and trade
            facilitation for commodity transactions.
          </p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-10 md:p-14">
          <Section icon={<FaHandshake />} title="1. Purpose">
            This Broker Commission Policy defines the brokerage and service
            charges applied by Hansaria Food Private Limited for facilitating
            commodity trading between buyers and sellers.
          </Section>
          <Section title="2. Applicability">
            This policy applies to all transactions conducted through:
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Direct brokerage deals</li>
              <li>Negotiated trades</li>
              <li>Platform-assisted trades</li>
              <li>Offline confirmed trades introduced by Hansaria</li>
            </ul>
            <p className="mt-3">
              It applies to all commodities including maize, soya, DDGS,
              oil cakes, grains, and other feed raw materials.
            </p>
          </Section>
          <Section icon={<FaMoneyBillWave />} title="3. Commission Structure">
            Hansaria charges brokerage depending on:
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Commodity type</li>
              <li>Transaction volume</li>
              <li>Market conditions</li>
              <li>Trade complexity</li>
              <li>Logistics involvement</li>
              <li>Storage or inspection services</li>
            </ul>
            <p className="mt-3">Commission may be structured as:</p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Fixed fee per metric ton</li>
              <li>Percentage of trade value</li>
              <li>Lump-sum transaction fee</li>
              <li>Margin included in quoted price</li>
            </ul>
          </Section>
          <Section title="4. Liability to Pay Commission">
            Unless agreed otherwise in writing:
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Commission may be payable by buyer, seller, or both parties</li>
              <li>Payment responsibility is confirmed at deal finalisation</li>
              <li>
                Once a trade is confirmed, commission becomes payable even if
                parties later complete delivery independently
              </li>
            </ul>
          </Section>
          <Section icon={<FaFileInvoice />} title="5. Payment Terms">
            <ul className="list-disc ml-6 space-y-2">
              <li>Commission invoices must be paid within the stated due date</li>
              <li>Late payments may attract interest or penalties</li>
              <li>Non-payment may lead to suspension of trading privileges</li>
            </ul>
          </Section>
          <Section title="6. Non-Circumvention">
            Parties introduced through Hansaria agree not to bypass the company
            and trade directly for a reasonable commercial period.
            <p className="mt-3">
              If circumvention occurs, Hansaria reserves the right to recover
              full brokerage as if the trade was completed through the Company.
            </p>
          </Section>
          <Section title="7. Cancellation or Failed Transactions">
            Commission may still be payable if:
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Trade was confirmed and later cancelled</li>
              <li>A party defaults after confirmation</li>
              <li>Documentation or approvals were processed</li>
              <li>Resources or logistics were already deployed</li>
            </ul>
            <p className="mt-3">
              Any waiver of commission is solely at the Company&rsquo;s discretion.
            </p>

          </Section>
          <Section title="8. Additional Service Charges">

            Separate charges may apply for optional services such as:

            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Inspection and quality verification</li>
              <li>Warehousing or storage</li>
              <li>Rejected goods handling</li>
              <li>Documentation and compliance support</li>
              <li>Logistics coordination</li>
            </ul>

          </Section>

          <Section title="9. Taxes">

            All commissions and service fees are exclusive of applicable taxes.
            GST or other statutory taxes will be charged as per Indian law.

          </Section>

          <Section title="10. Right to Modify Rates">

            Hansaria reserves the right to revise brokerage rates depending on:

            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Market volatility</li>
              <li>Operational costs</li>
              <li>Regulatory changes</li>
              <li>Business policy updates</li>
            </ul>

          </Section>

          <Section title="11. Dispute Resolution">

            Any dispute regarding commission must be raised within
            <strong> 7 days </strong> of the invoice date.

          </Section>

          <Section title="12. Acceptance of Policy">

            By engaging in any trade facilitated by Hansaria, all parties
            acknowledge and agree to this Broker Commission Policy.

          </Section>

          {/* Highlight Clause */}

          <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-xl mt-8">

            <p className="font-semibold text-gray-800">
              Brokerage is earned once a transaction is confirmed between
              parties introduced by the Company, regardless of whether the
              contract is later completed or performed.
            </p>

          </div>

        </div>

        {/* Back Button */}

        <div className="text-center mt-10">

          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-green-700 text-white px-6 py-3 rounded-xl shadow-lg hover:bg-green-800 transition"
          >
            <FaArrowLeft />
            Back to Home
          </Link>

        </div>

      </div>
    </div>
  );
};

const Section = ({ title, children, icon }) => {

  return (
    <div className="mb-10 group">

      <div className="flex items-center gap-3 mb-3">

        {icon && (
          <span className="text-green-600 text-xl group-hover:scale-110 transition">
            {icon}
          </span>
        )}

        <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
          {title}
        </h2>

      </div>

      <div className="text-gray-700 leading-relaxed ml-1">
        {children}
      </div>

      <div className="h-[1px] bg-gray-200 mt-6"></div>

    </div>
  );
};

export default BrokerCommissionPolicy;