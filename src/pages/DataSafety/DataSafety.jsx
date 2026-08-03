import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const DataSafety = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-gradient-to-br from-green-50 via-white to-green-100 min-h-screen py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h1 className="text-5xl font-bold text-green-700 mb-4">
            Data Safety & Privacy Disclosure
          </h1>

          <p className="text-gray-600 text-lg">
            Hansaria Food Private Limited
          </p>
        </div>

        <div className="backdrop-blur-lg bg-white/80 border border-gray-200 shadow-xl rounded-3xl p-10 md:p-14">

          <Section title="1. Overview">
            This Data Safety disclosure explains how Hansaria Food Private Limited (&quot;Company&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;) collects, processes, stores, and protects user data. This page is designed in compliance with Google Play policies and applicable Indian laws including the Digital Personal Data Protection Act, 2023.
          </Section>

          <Section title="2. Categories of Data Collected">
            We may collect and process the following categories of data:
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li><b>Personal Information:</b> Name, phone number, email address</li>
              <li><b>Business Information:</b> Company name, GST details, trade-related data</li>
              <li><b>Transaction Data:</b> Orders, pricing, quantities, trade history</li>
              <li><b>Device & Technical Data:</b> IP address, device type, browser, OS</li>
              <li><b>Communication Data:</b> Messages, support queries, notifications</li>
            </ul>
          </Section>

          <Section title="3. Purpose of Data Collection">
            We collect data strictly for the following purposes:
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>User registration and authentication</li>
              <li>Facilitating buyer-seller transactions</li>
              <li>Providing brokerage and trading services</li>
              <li>Improving platform performance and analytics</li>
              <li>Customer support and dispute resolution</li>
              <li>Sending transaction alerts and important updates</li>
            </ul>
          </Section>

          <Section title="4. Legal Basis for Processing">
            Data is processed based on:
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>User consent</li>
              <li>Contractual necessity (transactions)</li>
              <li>Legal obligations under Indian laws</li>
            </ul>
          </Section>

          <Section title="5. Data Sharing & Disclosure">
            We do NOT sell user data. Data may be shared only in the following cases:
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>Between buyers and sellers to enable transactions</li>
              <li>With logistics providers and payment partners</li>
              <li>With government authorities when legally required</li>
              <li>With internal staff on a need-to-know basis</li>
            </ul>
          </Section>

          <Section title="6. Data Security Measures">
            We implement industry-standard security practices:
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>SSL/HTTPS encryption for all communications</li>
              <li>Secure cloud infrastructure and firewalls</li>
              <li>Role-based access control</li>
              <li>Regular monitoring and vulnerability checks</li>
            </ul>
          </Section>

          <Section title="7. Data Retention Policy">
            Data is retained only for as long as necessary:
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>Active accounts: retained during usage period</li>
              <li>Closed accounts: retained for legal/compliance purposes</li>
              <li>Financial records: retained as per tax and regulatory laws</li>
            </ul>
          </Section>

          <Section title="8. User Rights">
            Users have the following rights:
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>Right to access their data</li>
              <li>Right to correction of inaccurate data</li>
              <li>Right to request deletion of data</li>
              <li>Right to withdraw consent</li>
            </ul>
          </Section>

          <Section title="9. Data Deletion Request">
            Users can request account and data deletion by:
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>Emailing: info@hansariafood.com</li>
              <li>Submitting request via app (if available)</li>
            </ul>
            Requests are processed within a reasonable timeframe subject to legal obligations.
          </Section>

          <Section title="10. Children's Privacy">
            Our platform is strictly intended for business users above 18 years. We do not knowingly collect data from minors.
          </Section>

          <Section title="11. Third-Party Services">
            We may use third-party services such as:
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>Payment gateways</li>
              <li>Cloud hosting providers</li>
              <li>Analytics tools</li>
            </ul>
            These providers follow their own privacy and security policies.
          </Section>

          <Section title="12. Compliance with Laws">
            We comply with:
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>Digital Personal Data Protection Act, 2023 (India)</li>
              <li>Information Technology Act, 2000</li>
              <li>Google Play Developer Policies</li>
            </ul>
          </Section>

          <Section title="13. International Data Transfers">
            If data is processed outside India, we ensure appropriate safeguards are implemented.
          </Section>

          <Section title="14. Policy Updates">
            This Data Safety policy may be updated periodically. Continued use of the platform implies acceptance of updates.
          </Section>

          <Section title="15. Contact Information">
            Email:{" "}
            <a
              href="mailto:info@hansariafood.com"
              className="text-green-700 font-semibold hover:underline"
            >
              info@hansariafood.com
            </a>
          </Section>

        </div>

        <div className="text-center mt-14">
          <Link
            to="/"
            className="inline-flex items-center gap-3 bg-green-600 text-white px-8 py-4 rounded-full text-lg font-semibold shadow-lg hover:bg-green-700 hover:scale-105 transition"
          >
            <FaArrowLeft />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

const Section = ({ title, children }) => {
  return (
    <div className="mb-8 p-6 rounded-xl border border-gray-200 bg-white/70 hover:shadow-md transition">
      <h2 className="text-xl font-semibold text-gray-800 mb-3">{title}</h2>
      <div className="text-gray-700 leading-relaxed">{children}</div>
    </div>
  );
};

export default DataSafety;