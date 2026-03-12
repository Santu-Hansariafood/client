import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const TermsConditions = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="bg-gradient-to-br from-green-50 via-white to-green-100 min-h-screen py-20 px-6">

      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-5xl font-bold text-green-700 mb-4">
            Terms & Conditions
          </h1>

          <p className="text-gray-600 text-lg">
            Hansaria Food Private Limited
          </p>
        </div>

        {/* Main Content */}
        <div className="backdrop-blur-lg bg-white/80 border border-gray-200 shadow-xl rounded-3xl p-10 md:p-14">

          <Section title="1. Acceptance of Terms">
            These Terms and Conditions (&quot;Terms&quot;) govern access to and use of
            services provided by Hansaria Food Private Limited (&quot;Company&quot;,
            &quot;Hansaria&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;). By accessing or using our platform,
            website, applications, or services (&quot;Platform&quot;), you agree to be
            legally bound by these Terms. If you do not agree, you must not use
            the Platform.
          </Section>

          <Section title="2. Nature of Services">
            Hansaria operates as a trading and brokerage facilitator platform
            connecting buyers, sellers, feed mills, suppliers, and commodity
            traders dealing in agricultural and feed products including maize,
            soya, DDGS, oil cakes, grains, and related commodities.

            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>Intermediary broker</li>
              <li>Transaction facilitator</li>
              <li>Commission agent</li>
              <li>Direct trading party</li>
            </ul>
          </Section>

          <Section title="3. Eligibility">
            Users must:
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>Be legally capable of entering into contracts</li>
              <li>Provide accurate and complete information</li>
              <li>Comply with applicable laws and regulations</li>
            </ul>
          </Section>

          <Section title="4. Account Registration">
            Users agree to maintain accurate account information and keep login
            credentials confidential. Hansaria may suspend accounts where
            suspicious or fraudulent activity is detected.
          </Section>

          <Section title="5. Transactions and Brokerage">
            Hansaria facilitates trade between parties. Pricing, logistics,
            delivery, and quality terms are generally agreed between buyer and
            seller unless otherwise specified in writing.
          </Section>

          <Section title="6. Payments and Settlements">
            Payments must be made through approved channels. Payment delays may
            result in penalties or suspension of services.
          </Section>

          <Section title="7. Logistics and Delivery">
            Delivery timelines are indicative and may be affected by transport
            delays, weather, strikes, or regulatory checks.
          </Section>

          <Section title="8. Warehousing and Storage">
            Hansaria may provide warehousing and storage services through
            authorised facilities. Goods stored remain at the owner&rsquo;s risk
            unless otherwise agreed.
          </Section>

          <Section title="9. Quality and Disputes">
            Quality disputes must generally be reported within{" "}
            <b>48 hours</b> of delivery with proper evidence.
          </Section>

          <Section title="10. Prohibited Use">
            Users must not engage in fraud, misrepresentation, unlawful
            activities, or misuse of platform data.
          </Section>

          <Section title="11. Intellectual Property">
            All platform content, trademarks, logos, and software are owned or
            licensed by Hansaria and protected under intellectual property
            laws.
          </Section>

          <Section title="12. Limitation of Liability">
            Hansaria shall not be liable for indirect losses, supplier default,
            market fluctuations, logistics failures, or force majeure events.
          </Section>

          <Section title="13. Indemnity">
            Users agree to indemnify Hansaria against claims arising from misuse
            of the platform or breach of these Terms.
          </Section>

          <Section title="14. Suspension or Termination">
            Accounts may be suspended if fraud, misuse, or regulatory issues
            arise.
          </Section>

          <Section title="15. Privacy">
            Use of the platform is governed by our Privacy Policy.
          </Section>

          <Section title="16. Force Majeure">
            We are not responsible for delays caused by natural disasters,
            strikes, war, or system failures.
          </Section>

          <Section title="17. Amendments">
            These Terms may be updated periodically. Continued use indicates
            acceptance of updated Terms.
          </Section>

          <Section title="18. Governing Law">
            These Terms are governed by the laws of India and subject to the
            jurisdiction of competent courts.
          </Section>

          <Section title="19. Contact">
            Email:{" "}
            <a
              href="mailto:info@hansariafood.com"
              className="text-green-700 font-semibold hover:underline"
            >
              info@hansariafood.com
            </a>
          </Section>

        </div>

        {/* Back Button */}
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
      <h2 className="text-xl font-semibold text-gray-800 mb-3">
        {title}
      </h2>

      <div className="text-gray-700 leading-relaxed">
        {children}
      </div>
    </div>
  );
};

export default TermsConditions;