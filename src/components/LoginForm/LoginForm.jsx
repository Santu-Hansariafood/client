import { lazy, useState, useMemo, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import axios from "axios";
import Loading from "../../common/Loading/Loading";
import loginLable from "../../language/en/login";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const DataInput = lazy(() => import("../../common/DataInput/DataInput"));
const Buttons = lazy(() => import("../../common/Buttons/Buttons"));
const Captcha = lazy(() => import("../../common/Captcha/Captcha"));

const LoginForm = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("Admin");
  const [showPassword, setShowPassword] = useState(false);
  const [isCaptchaValid, setCaptchaValid] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const roles = useMemo(
    () => ["Admin", "Employee", "Buyer", "Seller", "Transporter"],
    []
  );

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      toast.error("Please enter valid credentials.", { position: "top-right", autoClose: 3000 });
      return;
    }
    if (!isCaptchaValid) {
      toast.error("CAPTCHA is not valid.", { position: "top-right", autoClose: 3000 });
      return;
    }

    setLoading(true);

    const apiEndpoints = {
      Admin: "https://api.hansariafood.shop/api/admin/login",
      Employee: "https://api.hansariafood.shop/api/employees/login",
      Buyer: "https://api.hansariafood.shop/api/buyers/login",
      Seller: "https://api.hansariafood.shop/api/sellers/login",
      Transporter: "https://api.hansariafood.shop/api/transporters/login",
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
      toast.error("Invalid role selected.", { position: "top-right", autoClose: 3000 });
      setLoading(false);
      return;
    }

    const phoneKey = userRole === "Seller" ? "phone" : "mobile";

    try {
      const response = await axios.post(apiUrl, {
        [phoneKey]: phoneNumber,
        password: password,
      });

      if (response.status === 200) {
        login({ ...response.data, mobile: phoneNumber, role: userRole });

        toast.success("Login successful!", { position: "top-right", autoClose: 3000 });

        navigate(roleBasedRoutes[userRole] || "/dashboard", { replace: true });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid mobile number or password", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Suspense fallback={<Loading />}>
      <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
          {loginLable.title1}
          <br />
          {loginLable.title2}
        </h2>
        <div className="mb-4">
          <label
            htmlFor="phoneNumber"
            className="block mb-2 text-gray-700 text-sm font-semibold"
          >
            {loginLable.phone_number}
          </label>
          <DataInput
            placeholder={loginLable.phone_number_placeholder}
            inputType="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            name="phoneNumber"
            className="w-full p-3 rounded-lg border border-gray-300 shadow-md focus:shadow-lg transition-all"
            maxLength="10"
            minLength="10"
          />
        </div>
        <div className="mb-4 relative">
          <label
            htmlFor="password"
            className="block mb-2 text-gray-700 text-sm font-semibold"
          >
            {loginLable.password}
          </label>
          <div className="relative">
            <DataInput
              placeholder={loginLable.password_placeholder}
              inputType={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              name="password"
              className="w-full p-3 pr-12 rounded-lg border border-gray-300 shadow-md focus:shadow-lg transition-all"
            />
            <div
              className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <AiOutlineEye size={20} title={loginLable.show_title} />
              ) : (
                <AiOutlineEyeInvisible size={20} title={loginLable.hide_title} />
              )}
            </div>
          </div>
        </div>
        <div className="mb-4">
          <label className="block mb-2 text-gray-700 text-sm font-semibold">
            Choose Role
          </label>
          <div className="flex flex-wrap justify-center gap-2">
            {roles.map((role) => (
              <Buttons
                key={role}
                label={role}
                onClick={() => setUserRole(role)}
                variant={userRole === role ? "primary" : "secondary"}
                size="sm"
                className={`px-3 py-2 rounded-lg shadow-md hover:shadow-lg transform transition-all ${
                  userRole === role
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-700"
                }`}
              />
            ))}
          </div>
        </div>
        <Captcha onValidate={setCaptchaValid} />
        <div className="flex justify-center mt-4">
          <Buttons
            label={loading ? "Logging in..." : "Login"}
            onClick={handleLogin}
            type="submit"
            variant="primary"
            size="lg"
            className="w-full py-3 rounded-lg shadow-md bg-blue-600 text-white hover:bg-blue-700 transform transition-all hover:shadow-lg"
            disabled={loading}
          />
        </div>
      </div>
    </Suspense>
  );
};

export default LoginForm;
