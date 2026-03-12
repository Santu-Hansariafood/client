import { useEffect } from "react";
import { FaShieldAlt, FaDatabase, FaUserLock, FaArrowLeft } from "react-icons/fa";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-gradient-to-br from-green-50 via-white to-green-100 min-h-screen py-14 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-green-700">
            Privacy Policy
          </h1>
          <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
            <strong>Hansaria Food Private Limited</strong> is committed to protecting
            your personal and business data. This policy explains how we collect,
            use, and safeguard your information.
          </p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-10 md:p-14">

          <Section icon={<FaShieldAlt />} title="1. Introduction">
            Hansaria Food Private Limited (&quot;Company&quot;, &quot;Hansaria&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
            operates a commodity trading and brokerage platform dealing in
            agricultural products such as maize, soya, DDGS, oil cakes, and grains.
            <br /><br />
            This policy explains how personal and business data is collected,
            processed, stored, and protected globally.
          </Section>

          <Section icon={<FaDatabase />} title="2. Information We Collect">
            <ul className="list-disc ml-6 space-y-2">
              <li><b>Identity & Contact:</b> Name, email, phone, address.</li>
              <li><b>Business Data:</b> Company name, GST, registration details.</li>
              <li><b>Transaction Data:</b> Orders, invoices, communications.</li>
              <li><b>Technical Data:</b> IP address, browser type, device information.</li>
            </ul>

            <p className="mt-3 text-gray-600">
              We never store card numbers, UPI PINs, or banking passwords.
            </p>
          </Section>

          <Section icon={<FaUserLock />} title="3. Purpose of Processing">
            <ul className="list-disc ml-6 space-y-2">
              <li>Account creation and verification</li>
              <li>Trading and brokerage facilitation</li>
              <li>Payment processing and settlement</li>
              <li>Logistics coordination</li>
              <li>Fraud prevention and compliance</li>
              <li>Customer support</li>
              <li>Platform analytics and improvement</li>
            </ul>
          </Section>

          <Section title="4. Lawful Basis">
            We process personal data only when legally permitted including:
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>User consent</li>
              <li>Contractual necessity</li>
              <li>Legal compliance</li>
              <li>Legitimate business interests</li>
            </ul>
          </Section>

          <Section title="5. Data Sharing">
            We may share necessary data with trusted partners including:
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Banks and payment processors</li>
              <li>Transport and logistics providers</li>
              <li>Regulatory authorities</li>
              <li>Legal advisers and auditors</li>
              <li>Cloud and IT service providers</li>
            </ul>
          </Section>

          <Section title="6. Cross-Border Transfers">
            Data may be processed outside India where required for international
            trade or technical operations. All transfers follow strict legal
            safeguards and security measures.
          </Section>

          <Section title="7. Data Retention">
            We retain information only for the duration necessary for operational,
            legal, or regulatory purposes. After that, data is securely deleted,
            anonymised, or archived.
          </Section>

          <Section title="8. Security Measures">
            We use modern administrative, technical, and organisational safeguards
            including encryption, controlled access, and monitoring systems to
            protect personal data.
          </Section>

          <Section title="9. User Rights">
            Subject to law, you may request:
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Access to your data</li>
              <li>Correction of inaccurate information</li>
              <li>Deletion of data where legally allowed</li>
              <li>Withdrawal of consent</li>
            </ul>
          </Section>

          <Section title="10. India DPDP Act 2023 Compliance">
            Hansaria complies with the Digital Personal Data Protection Act,
            2023 and processes personal data:
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Lawfully and transparently</li>
              <li>Only for specific business purposes</li>
              <li>With strong security safeguards</li>
            </ul>
          </Section>

          <Section title="11. Children's Data">
            Our services are not intended for individuals below the legally
            permitted age. We do not knowingly collect such data.
          </Section>

          <Section title="12. Third-Party Links">
            Our platform may contain links to external websites. We are not
            responsible for their privacy policies or practices.
          </Section>

          <Section title="13. Policy Updates">
            This Privacy Policy may be updated periodically. Continued use of
            the platform after updates indicates acceptance of the revised
            policy.
          </Section>

          <Section title="14. Contact">
            For privacy or legal requests please contact:
            <p className="mt-2">
              Email:{" "}
              <a
                href="mailto:info@hansariafood.com"
                className="text-green-700 font-semibold"
              >
                info@hansariafood.com
              </a>
            </p>
          </Section>

        </div>

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

export default PrivacyPolicy;