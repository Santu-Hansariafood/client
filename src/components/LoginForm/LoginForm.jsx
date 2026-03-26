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
    [],
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
      <div className="w-full max-w-md mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-gray-800">
            {loginLable.title1}
          </h2>
          <p className="text-emerald-600 mt-1 font-semibold">
            <Typewriter text={loginLable.title2} speed={80} delay={1000} />
          </p>
        </div>

        <div className="space-y-5">
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

          <div className="relative">
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
              className="absolute right-4 top-[38px] text-gray-400 hover:text-emerald-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <AiOutlineEye size={20} />
              ) : (
                <AiOutlineEyeInvisible size={20} />
              )}
            </button>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Select Role
            </p>

            <div className="flex flex-wrap justify-center gap-2">
              {roles.map((role) => (
                <button
                  key={role}
                  onClick={() => setUserRole(role)}
                  className={`min-w-[110px] px-4 py-2 rounded-lg text-sm font-medium transition-all text-center ${
                    userRole === role
                      ? "bg-emerald-600 text-white shadow-md scale-[1.03]"
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
            className={`w-full py-3 rounded-xl font-semibold text-white transition-all ${
              loading
                ? "bg-emerald-400 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-md"
            }`}
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>
        </div>
      </div>
    </Suspense>
  );
};

export default LoginForm;
