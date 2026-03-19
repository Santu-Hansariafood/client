import { lazy, useState, useMemo, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import api from "../../utils/apiClient/apiClient";
import Loading from "../../common/Loading/Loading";
import loginLable from "../../language/en/login";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DataInput = lazy(() => import("../../common/DataInput/DataInput"));
const Buttons = lazy(() => import("../../common/Buttons/Buttons"));
const Typewriter = lazy(() => import("../../common/Typewriter/Typewriter"));

const LoginForm = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("Admin");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const roles = useMemo(
    () => ["Admin", "Employee", "Buyer", "Seller", "Transporter"],
    [],
  );

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      toast.error("Please enter valid credentials.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);

    const apiEndpoints = {
      Admin: "/admin/login",
      Employee: "/employees/login",
      Buyer: "/buyers/login",
      Seller: "/sellers/login",
      Transporter: "/transporters/login",
    };

    const roleBasedRoutes = {
      Admin: "/dashboard",
      Employee: "/employee/dashboard",
      Buyer: "/buyer/dashboard",
      Seller: "/seller/dashboard",
      Transporter: "/transporter/dashboard",
    };

    const apiUrl = apiEndpoints[userRole];

    if (!apiUrl) {
      toast.error("Invalid role selected.", {
        position: "top-right",
        autoClose: 3000,
      });
      setLoading(false);
      return;
    }

    const phoneKey = userRole === "Seller" ? "phone" : "mobile";

    try {
      const response = await api.post(apiUrl, {
        [phoneKey]: phoneNumber,
        password: password,
      });

      if (response.status === 200) {
        login({
          ...response.data,
          mobile: phoneNumber,
          role: userRole,
          token: response.data.token,
        });

        toast.success("Login successful!", {
          position: "top-right",
          autoClose: 3000,
        });

        navigate(roleBasedRoutes[userRole] || "/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("Login Error:", error);
      const errorMsg =
        error.response?.data?.message || `Login failed: ${error.message}`;
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="w-full bg-white p-5 sm:p-8 rounded-2xl shadow-xl border border-gray-100">
        <h2 className="text-xl sm:text-2xl font-extrabold mb-6 text-center text-emerald-800 leading-tight">
          {loginLable.title1}
          <span className="block text-emerald-600 mt-1 font-semibold">
            <Typewriter text={loginLable.title2} speed={80} delay={1000} />
          </span>
        </h2>

        <div className="space-y-4 sm:space-y-5">
          <div>
            <label
              htmlFor="phoneNumber"
              className="block mb-1.5 text-gray-700 text-sm font-bold ml-1"
            >
              {loginLable.phone_number}
            </label>
            <DataInput
              placeholder={loginLable.phone_number_placeholder}
              inputType="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              name="phoneNumber"
              autoComplete="off"
              className="w-full p-3 sm:p-3.5 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              maxLength="10"
              minLength="10"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block mb-1.5 text-gray-700 text-sm font-bold ml-1"
            >
              {loginLable.password}
            </label>
            <div className="relative group">
              <DataInput
                placeholder={loginLable.password_placeholder}
                inputType={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                name="password"
                autoComplete="new-password"
                className="w-full p-3 sm:p-3.5 pr-12 rounded-xl border border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center px-2 text-gray-400 hover:text-emerald-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? (
                  <AiOutlineEye size={22} title={loginLable.show_title} />
                ) : (
                  <AiOutlineEyeInvisible
                    size={22}
                    title={loginLable.hide_title}
                  />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-gray-700 text-sm font-bold ml-1">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {roles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setUserRole(role)}
                  className={`px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all border ${
                    userRole === role
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md transform scale-105"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={handleLogin}
              disabled={loading}
              className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform active:scale-[0.98] ${
                loading
                  ? "bg-emerald-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-200"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Logging in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </div>
        </div>
      </div>
    </Suspense>
  );
};

export default LoginForm;
