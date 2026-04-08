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
const Typewriter = lazy(() => import("../../common/Typewriter/Typewriter"));

const LoginForm = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("Buyer");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const roles = useMemo(
    () => ["Buyer", "Seller", "Transporter", "Employee", "Admin"],
    []
  );

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      toast.error("Please enter valid credentials.");
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
    const phoneKey = userRole === "Seller" ? "phone" : "mobile";

    try {
      const response = await api.post(apiUrl, {
        [phoneKey]: phoneNumber,
        password,
      });

      login({
        ...response.data,
        mobile: phoneNumber,
        role: userRole,
        token: response.data.token,
      });

      toast.success("Login successful!");
      navigate(roleBasedRoutes[userRole], { replace: true });
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Login failed. Try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-gray-100 px-4">
        
        <div className="w-full max-w-md backdrop-blur-lg bg-white/80 p-8 rounded-3xl shadow-2xl border border-gray-200 transition-all duration-300">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
              {loginLable.title1}
            </h2>
            <p className="text-emerald-600 mt-2 font-medium">
              <Typewriter text={loginLable.title2} speed={80} delay={1000} />
            </p>
          </div>

          {/* Form */}
          <div className="space-y-6">
            
            {/* Phone */}
            <div className="focus-within:scale-[1.01] transition">
              <DataInput
                label={loginLable.phone_number}
                placeholder={loginLable.phone_number_placeholder}
                inputType="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                name="phoneNumber"
                maxLength="10"
                minLength="10"
                required
              />
            </div>

            {/* Password */}
            <div className="relative focus-within:scale-[1.01] transition">
              <DataInput
                label={loginLable.password}
                placeholder={loginLable.password_placeholder}
                inputType={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                name="password"
                required
              />

              <button
                type="button"
                className="absolute right-4 top-[38px] text-gray-400 hover:text-emerald-600 transition"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <AiOutlineEye size={20} />
                ) : (
                  <AiOutlineEyeInvisible size={20} />
                )}
              </button>
            </div>

            {/* Role Selector */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Select Role
              </p>

              <div className="flex flex-wrap gap-2 justify-center">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => setUserRole(role)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                      userRole === role
                        ? "bg-emerald-600 text-white shadow-lg scale-105"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
                loading
                  ? "bg-emerald-400 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-700 hover:shadow-xl active:scale-95"
              }`}
            >
              {loading ? "Logging in..." : "Sign In"}
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            Secure login powered by Hansaria Food Private Limited
          </p>
        </div>
      </div>
    </Suspense>
  );
};

export default LoginForm;