import React from "react";

const BrokerCommissionPolicy = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-2xl p-8 md:p-12">

        <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-4">
          Broker Commission Policy
        </h1>

        <p className="text-gray-600 mb-8">
          <strong>Hansaria Food Private Limited</strong>
        </p>

        <Section title="1. Purpose">
          This Broker Commission Policy outlines the terms governing brokerage,
          service charges, and commissions applied by Hansaria Food Private Limited
          ("Company", "Hansaria", "we", "us", "our") for facilitating commodity
          trades between buyers and sellers.
        </Section>

        <Section title="2. Applicability">
          This Policy applies to all transactions conducted through:
          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li>Direct brokerage deals</li>
            <li>Negotiated trades</li>
            <li>Platform-assisted trades</li>
            <li>Offline confirmed trades introduced by Hansaria</li>
          </ul>

          <p className="mt-3">
            It applies to all commodities handled by the Company, including but not
            limited to maize, soya, DDGS, oil cakes, grains, feed raw materials,
            and related products.
          </p>
        </Section>

        <Section title="3. Commission Structure">
          Hansaria charges brokerage or service commission depending on:
          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li>Commodity type</li>
            <li>Transaction volume</li>
            <li>Market conditions</li>
            <li>Trade complexity</li>
            <li>Logistics involvement</li>
            <li>Storage or inspection services</li>
          </ul>

          <p className="mt-3">Commission may be charged as:</p>

          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li>Fixed fee per metric ton</li>
            <li>Percentage of trade value</li>
            <li>Lump-sum transaction charge</li>
            <li>Margin included in quoted price</li>
          </ul>

          <p className="mt-3">
            The applicable commission will be communicated before trade
            confirmation.
          </p>
        </Section>

        <Section title="4. Liability to Pay Commission">
          Unless agreed otherwise in writing:
          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li>Commission may be payable by buyer, seller, or both parties.</li>
            <li>
              Payment responsibility is confirmed at the time of deal finalisation.
            </li>
            <li>
              Once a trade is confirmed, commission becomes payable regardless of
              whether parties complete delivery independently.
            </li>
          </ul>
        </Section>

        <Section title="5. Payment Terms">
          <ul className="list-disc ml-6 space-y-2">
            <li>Commission invoices must be paid within the stated due date.</li>
            <li>
              Delayed payments may attract interest or penalty charges.
            </li>
            <li>
              Non-payment may result in suspension of trading privileges.
            </li>
          </ul>
        </Section>

        <Section title="6. Non-Circumvention">
          Parties introduced through Hansaria agree not to bypass or circumvent
          the Company to conduct direct transactions with each other for a
          reasonable commercial period.
          <p className="mt-3">
            If such circumvention occurs, Hansaria reserves the right to recover
            full commission as if the transaction had been completed through the
            Company.
          </p>
        </Section>

        <Section title="7. Cancellation or Failed Transactions">
          Commission may still be chargeable if:
          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li>Trade was confirmed and later cancelled by a party</li>
            <li>A party defaults after confirmation</li>
            <li>Documents or approvals were already processed</li>
            <li>Resources or logistics were deployed</li>
          </ul>

          <p className="mt-3">
            Waiver of commission is solely at Company discretion.
          </p>
        </Section>

        <Section title="8. Additional Service Charges">
          Separate charges may apply for optional services including:
          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li>Inspection or quality verification</li>
            <li>Warehousing or storage</li>
            <li>Rejected goods handling</li>
            <li>Documentation or compliance processing</li>
            <li>Logistics coordination</li>
          </ul>

          <p className="mt-3">
            These will be disclosed in advance where applicable.
          </p>
        </Section>

        <Section title="9. Taxes">
          All commissions and service fees are exclusive of applicable taxes
          unless explicitly stated. GST or other statutory taxes shall be
          charged as per law.
        </Section>

        <Section title="10. Right to Modify Rates">
          Hansaria reserves the right to revise brokerage rates at any time
          based on:
          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li>Market volatility</li>
            <li>Operational costs</li>
            <li>Regulatory requirements</li>
            <li>Business policy changes</li>
          </ul>

          <p className="mt-3">
            Updated rates apply prospectively to future transactions.
          </p>
        </Section>

        <Section title="11. Dispute Resolution">
          Any disputes regarding commission must be raised within{" "}
          <strong>7 days</strong> of the invoice date. After this period, the
          invoice will be deemed accepted.
        </Section>

        <Section title="12. Acceptance of Policy">
          By engaging in any trade facilitated by Hansaria, parties acknowledge
          that they have read, understood, and agreed to this Broker Commission
          Policy.
        </Section>

        <Section title="Important Clause">
          <p className="bg-green-50 border-l-4 border-green-600 p-4 rounded-md">
            <strong>
              Brokerage is earned once a transaction is confirmed between
              parties introduced by the Company, irrespective of completion or
              performance of the contract.
            </strong>
          </p>
        </Section>

      </div>
    </div>
  );
};

const Section = ({ title, children }) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-gray-800 mb-3">{title}</h2>
      <div className="text-gray-700 leading-relaxed">{children}</div>
    </div>
  );
};

export default BrokerCommissionPolicy;