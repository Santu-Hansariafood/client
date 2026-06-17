
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
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-rose-100 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-10">
            <div className="w-32 h-32 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-rose-200">
              <FaTools className="text-6xl text-rose-600 animate-pulse" />
            </div>
            <h1 className="text-5xl font-black text-rose-800 mb-4 tracking-tight">
              Under Development
            </h1>
            <p className="text-xl text-rose-700/80 font-semibold mb-2">
              We&apos;re working on something amazing!
            </p>
            <p className="text-gray-600">
              This feature will be live soon. Stay tuned!
            </p>
          </div>
          
          <button
            onClick={goBack}
            className="inline-flex items-center gap-3 bg-rose-600 text-white px-10 py-4 rounded-full text-lg font-semibold shadow-lg hover:bg-rose-700 hover:scale-105 transition-all duration-300"
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

