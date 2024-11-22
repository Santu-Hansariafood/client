import { lazy, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
const DataInput = lazy(() => import("../../common/DataInput/DataInput"));
const Buttons = lazy(() => import("../../common/Buttons/Buttons"));
const Captcha = lazy(() => import("../../common/Captcha/Captcha"));

const LoginForm = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("Admin");
  const [showPassword, setShowPassword] = useState(false);
  const [isCaptchaValid, setCaptchaValid] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const roles = ["Admin", "Employee", "Buyer", "Seller", "Transporter"];

  const handleLogin = () => {
    if (!phoneNumber || !password) {
      alert("Please enter valid credentials.");
      return;
    }
    if (!isCaptchaValid) {
      alert("CAPTCHA is not valid.");
      return;
    }
    login();
    navigate("/dashboard");
  };

  return (
    <div className="w-full max-w-md bg-white p-6 rounded-xl shadow-md border border-gray-200">
      <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
        Welcome Back <br /> Hansaria Food Private Limited
      </h2>
      <div className="mb-4">
        <label
          htmlFor="phoneNumber"
          className="block mb-2 text-gray-700 text-sm font-semibold"
        >
          Phone Number
        </label>
        <DataInput
          placeholder="Enter your phone number"
          inputType="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          name="phoneNumber"
          className="w-full p-3 rounded-lg border border-gray-300 shadow-md focus:shadow-lg transition-all"
        />
      </div>
      <div className="mb-4 relative">
        <label
          htmlFor="password"
          className="block mb-2 text-gray-700 text-sm font-semibold"
        >
          Password
        </label>
        <div className="relative">
          <DataInput
            placeholder="Enter your password"
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
              <AiOutlineEye size={20} />
            ) : (
              <AiOutlineEyeInvisible size={20} />
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
          label="Login"
          onClick={handleLogin}
          type="submit"
          variant="primary"
          size="lg"
          className="w-full py-3 rounded-lg shadow-md bg-blue-600 text-white hover:bg-blue-700 transform transition-all hover:shadow-lg"
        />
      </div>
    </div>
  );
};

export default LoginForm;
