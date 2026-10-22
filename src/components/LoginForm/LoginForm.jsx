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
const ForgotPassword = lazy(() => import("./ForgotPassword"));

const LoginForm = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("Buyer");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const roles = useMemo(
    () => ["Buyer", "Seller", "Transporter", "Employee", "Admin"],
    [],
  );

  const handleLogin = async () => {
    const trimmedPhone = String(phoneNumber || "").trim();
    const trimmedPassword = String(password || "").trim();

    if (!trimmedPhone || !trimmedPassword) {
      toast.error("Please enter valid credentials.");
      return;
    }

    const phoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      toast.error("Please enter a valid mobile number.");
      return;
    }

    if (trimmedPassword.length < 6) {
      toast.error("Password must be at least 6 characters long.");
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
        [phoneKey]: trimmedPhone,
        password: trimmedPassword,
      });

      const success = login({
        ...response.data,
        mobile: trimmedPhone,
        role: userRole,
        token: response.data.token,
      });

      if (success) {
        toast.success("Login successful!");
        setTimeout(() => {
          navigate(roleBasedRoutes[userRole], { replace: true });
        }, 100);
      }
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
      <div className="min-h-screen flex items-center justify-center lux-canvas px-4">
        <div className="w-full max-w-md backdrop-blur-lg lux-card p-8 rounded-3xl shadow-2xl transition-all duration-300">
          {showForgotPassword ? (
            <ForgotPassword
              onBack={() => setShowForgotPassword(false)}
              userRole={userRole}
            />
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-4xl font-black text-lux-ink tracking-tighter font-serif uppercase italic">
                  {loginLable.title1}
                </h2>
                <p className="text-lux-gold mt-2 font-bold tracking-tight">
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
                    className="absolute right-4 top-[38px] text-lux-muted hover:text-lux-gold transition"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <AiOutlineEye size={20} />
                    ) : (
                      <AiOutlineEyeInvisible size={20} />
                    )}
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm font-medium text-lux-emerald hover:text-lux-gold transition"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Role Selector */}
                <div>
                  <p className="text-sm font-semibold text-lux-muted mb-3">
                    Select Role
                  </p>

                  <div className="flex flex-wrap gap-2 justify-center">
                    {roles.map((role) => (
                      <button
                        key={role}
                        onClick={() => setUserRole(role)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                          userRole === role
                            ? "bg-gradient-to-br from-lux-emerald to-lux-deep text-lux-gold-soft shadow-lg scale-105"
                            : "bg-lux-ivory text-lux-muted hover:bg-lux-cream"
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
                  className={`w-full py-3 rounded-xl font-semibold text-lux-gold-soft transition-all duration-300 ${
                    loading
                      ? "bg-lux-emerald/50 cursor-not-allowed"
                      : "bg-gradient-to-br from-lux-emerald to-lux-deep ring-1 ring-lux-gold/30 hover:from-lux-deep hover:to-lux-night hover:shadow-xl active:scale-95"
                  }`}
                >
                  {loading ? "Logging in..." : "Sign In"}
                </button>
              </div>
            </>
          )}
          <p className="text-center text-xs text-lux-muted mt-6">
            Secure login powered by Hansaria Food Private Limited
          </p>
        </div>
      </div>
    </Suspense>
  );
};

export default LoginForm;
