const PrivacyPolicy = () => {
  return (
    <div className="bg-gray-50 min-h-screen py-12 px-6">
      <div className="max-w-5xl mx-auto bg-white shadow-lg rounded-2xl p-8 md:p-12">

        <h1 className="text-3xl md:text-4xl font-bold text-green-700 mb-4">
          Privacy Policy
        </h1>

        <p className="text-gray-600 mb-8">
          <strong>Hansaria Food Private Limited</strong><br/>
          We use cookies and similar technologies to give you a better experience.
        </p>
        <Section title="1. Introduction">
          Hansaria Food Private Limited ("Company", "Hansaria", "we", "us", "our")
          operates a trading and brokerage platform for feed mills and commodity
          products such as Maize, Soya, DDGS, and related goods.
          <br /><br />
          This Privacy Policy explains how we collect, use, store, share, and
          protect personal and business data of users globally. By using our
          platform, you agree to this Policy.
        </Section>

        <Section title="2. Information We Collect">
          <ul className="list-disc ml-6 space-y-2">
            <li><b>Identity and Contact Data:</b> name, phone, email, address.</li>
            <li>
              <b>Business Data:</b> company name, GST/VAT, registration documents,
              bank details.
            </li>
            <li>
              <b>Transaction Data:</b> order history, invoices, communication
              records.
            </li>
            <li>
              <b>Technical Data:</b> IP address, device information, browser type,
              usage logs.
            </li>
          </ul>
          <p className="mt-3 text-gray-600">
            We do not store card numbers, UPI PINs, or banking passwords.
          </p>
        </Section>

        <Section title="3. Purpose of Processing">
          <ul className="list-disc ml-6 space-y-2">
            <li>Account creation and verification</li>
            <li>Trading and brokerage facilitation</li>
            <li>Payments and settlements</li>
            <li>Logistics coordination</li>
            <li>Legal and regulatory compliance</li>
            <li>Fraud prevention and security</li>
            <li>Analytics and platform improvement</li>
            <li>Customer support and dispute resolution</li>
          </ul>
        </Section>

        <Section title="4. Lawful Basis">
          We process personal data only when legally permitted, including:
          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li>User consent</li>
            <li>Contractual necessity</li>
            <li>Legal compliance</li>
            <li>Legitimate business interests</li>
          </ul>
        </Section>

        <Section title="5. Data Sharing">
          We may share data with the following categories of recipients:
          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li>Banks and payment processors</li>
            <li>Transport and logistics partners</li>
            <li>Regulators and authorities</li>
            <li>Auditors and legal advisers</li>
            <li>Cloud and IT service providers</li>
          </ul>
          <p className="mt-3 text-gray-600">
            All sharing is limited, necessary, and subject to confidentiality obligations.
          </p>
        </Section>

        <Section title="6. Cross-Border Transfers">
          Your data may be processed outside India where required for
          transactions or operations. Such transfers are subject to appropriate
          legal safeguards and security controls.
        </Section>

        <Section title="7. Data Retention">
          We retain data only as long as necessary for business, legal, or
          compliance purposes. After this period, data is deleted, anonymised,
          or archived securely.
        </Section>

        <Section title="8. Security Measures">
          We use reasonable administrative, technical, and organisational
          safeguards to protect data. However, no digital system is completely
          secure, and users should exercise caution when sharing information.
        </Section>

        <Section title="9. User Rights">
          Subject to applicable laws, you may request:
          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li>Access to your personal data</li>
            <li>Correction of inaccurate or incomplete data</li>
            <li>Deletion of data where permitted</li>
            <li>Withdrawal of consent for processing based on consent</li>
          </ul>
          <p className="mt-3 text-gray-600">
            Requests can be made through our official contact channels.
          </p>
        </Section>

        <Section title="10. India DPDP Act 2023 Compliance">
          Hansaria complies with the Digital Personal Data Protection Act,
          2023 and processes personal data:
          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li>Lawfully and for clear purposes</li>
            <li>Only to the extent necessary for those purposes</li>
            <li>With reasonable security safeguards in place</li>
          </ul>

          <p className="mt-4 font-semibold">User Rights under this Act:</p>

          <ul className="list-disc ml-6 mt-2 space-y-2">
            <li>Access information about their personal data</li>
            <li>Request correction or erasure of personal data</li>
            <li>Withdraw consent where processing is based on consent</li>
            <li>Seek grievance redressal</li>
            <li>
              Nominate another person to exercise rights in case of incapacity
              or death
            </li>
          </ul>

          <p className="mt-4 text-gray-600">
            We act as a Data Fiduciary and process personal data only for lawful
            business purposes.
          </p>
        </Section>

        <Section title="11. Children's Data">
          Our services are not intended for individuals below the legally
          permitted age. We do not knowingly collect personal data from such
          individuals.
        </Section>

        <Section title="12. Third-Party Links">
          Our platform may contain links to third-party websites or services.
          We are not responsible for the privacy practices or content of those
          third parties.
        </Section>

        <Section title="13. Policy Updates">
          We may update this Privacy Policy periodically to reflect changes in
          our practices or legal requirements. Continued use of the platform
          after such updates constitutes acceptance of the revised Policy.
        </Section>

        <Section title="14. Contact and Grievance Officer">
          For privacy-related requests or complaints, you can contact us at:
          <p className="mt-2">
            Email:{" "}
            <a
              href="mailto:info@hansariafood.com"
              className="text-green-700 font-medium"
            >
              info@hansariafood.com
            </a>
          </p>
          <p className="text-gray-600 mt-2">
            Requests are handled within legally required timelines, subject to
            verification of identity and applicable law.
          </p>
        </Section>

        <Section title="15. Governing Law">
          This Privacy Policy is governed by the laws of India and is subject to
          the jurisdiction of competent courts in India.
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

export default PrivacyPolicy;