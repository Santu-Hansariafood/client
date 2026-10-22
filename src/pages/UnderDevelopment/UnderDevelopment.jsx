
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaTools } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext/AuthContext";
import AdminPageShell from "../../common/AdminPageShell/AdminPageShell";

const UnderDevelopment = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const goBack = () => {
    const roleDashboards = {
      Admin: "/dashboard",
      Employee: "/employee/dashboard",
      Buyer: "/buyer/dashboard",
      Seller: "/seller/dashboard",
      Transporter: "/transporter/dashboard",
    };
    navigate(roleDashboards[userRole] || "/");
  };

  return (
    <AdminPageShell>
      <div className="flex min-h-[60vh] items-center justify-center px-2 py-10 sm:py-12">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-10">
            <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-lux-ivory ring-1 ring-lux-gold/40 shadow-lg">
              <FaTools className="h-12 w-12 text-lux-emerald animate-pulse" />
            </div>
            <h1 className="font-serif text-4xl font-semibold text-lux-ink mb-4 tracking-tight sm:text-5xl">
              Under Development
            </h1>
            <p className="text-base font-semibold text-lux-muted mb-2 sm:text-lg">
              We&apos;re working on something amazing!
            </p>
            <p className="text-lux-muted">
              This feature will be live soon. Stay tuned!
            </p>
          </div>

          <button
            onClick={goBack}
            className="inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-lux-emerald to-lux-deep px-8 py-3.5 text-sm font-bold text-lux-gold-soft ring-1 ring-lux-gold/30 shadow-lg shadow-lux-emerald/25 transition hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.97]"
          >
            <FaArrowLeft />
            Back to Dashboard
          </button>
        </div>
      </div>
    </AdminPageShell>
  );
};

export default UnderDevelopment;
