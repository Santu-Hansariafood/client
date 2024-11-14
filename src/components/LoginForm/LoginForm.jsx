import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext/AuthContext";
import DataInput from "../../common/DataInput/DataInput";
import Buttons from "../../common/Buttons/Buttons";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const LoginForm = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [userRole, setUserRole] = useState("Admin");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = () => {
    if (phoneNumber && password) {
      login();
      navigate("/dashboard");
    } else {
      alert("Please enter valid credentials.");
    }
  };

  const roles = ["Admin", "Employee", "Buyer", "Seller", "Transporter"];

  return (
    <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl border border-gray-200 transform transition hover:shadow-3xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        Welcome Back <br /> Hansaria Food Private Limited
      </h2>

      <div className="mb-6">
        <label
          htmlFor="phoneNumber"
          className="block mb-2 text-gray-700 text-lg font-semibold tracking-wide"
        >
          Phone Number
        </label>
        <DataInput
          placeholder="Enter your phone number"
          inputType="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          name="phoneNumber"
          className="mb-4 p-3 rounded-lg border border-gray-300 shadow-lg focus:shadow-xl transition-all"
        />
      </div>

      <div className="mb-6 relative">
        <label
          htmlFor="password"
          className="block mb-2 text-gray-700 text-lg font-semibold tracking-wide"
        >
          Password
        </label>
        <DataInput
          placeholder="Enter your password"
          inputType={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          name="password"
          className="mb-4 p-3 pr-10 rounded-lg border border-gray-300 shadow-lg focus:shadow-xl transition-all"
        />

        <div
          className="absolute inset-y-2 right-3 flex items-center cursor-pointer text-gray-600"
          onClick={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <AiOutlineEyeInvisible size={20} />
          ) : (
            <AiOutlineEye size={20} />
          )}
        </div>
      </div>

      <div className="mb-8">
        <label className="block mb-2 text-gray-700 text-lg font-semibold text-center tracking-wide">
          Choose Role
        </label>
        <div className="flex flex-wrap justify-center gap-2">
          {roles.map((role) => (
            <Buttons
              key={role}
              label={role}
              onClick={() => setUserRole(role)}
              variant={userRole === role ? "primary" : "secondary"}
              size="md"
              className={`px-4 py-2 rounded-lg shadow-md hover:shadow-lg transform transition-all ${
                userRole === role ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <Buttons
          label="Login"
          onClick={handleLogin}
          type="submit"
          variant="primary"
          size="lg"
          className="w-1/2 py-3 rounded-lg shadow-lg bg-blue-600 text-white hover:bg-blue-700 transform transition-all hover:shadow-xl"
        />
      </div>
    </div>
  );
};

export default LoginForm;
