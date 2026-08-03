import { useState } from "react";
import api from "../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import {
  AiOutlineArrowLeft,
  AiOutlineEye,
  AiOutlineEyeInvisible,
} from "react-icons/ai";
import DataInput from "../../common/DataInput/DataInput";

const ForgotPassword = ({ onBack, userRole: initialRole }) => {
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmLogoutAllDevices, setConfirmLogoutAllDevices] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(initialRole);

  const roles = ["Buyer", "Seller", "Transporter", "Employee", "Admin"];

  const handleSendOTP = async () => {
    if (!mobile || mobile.length !== 10) {
      toast.error("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/forgot-password", { mobile, role: userRole });
      toast.success("OTP sent to your registered email address.");
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/verify-otp", { mobile, role: userRole, otp });
      toast.success("OTP verified successfully.");
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 4) {
      toast.error("Password must be at least 4 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!confirmLogoutAllDevices) {
      toast.error("Please confirm logout from all logged-in devices.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/reset-password", {
        mobile,
        role: userRole,
        otp,
        newPassword,
      });
      toast.success(
        "Password reset successfully. All logged-in devices have been logged out.",
      );
      onBack();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center text-sm text-emerald-600 font-medium hover:text-emerald-700 transition"
      >
        <AiOutlineArrowLeft className="mr-1" /> Back to Login
      </button>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">Reset Password</h2>
        <p className="text-sm text-gray-500 mt-1">
          {step === 1 && "Enter your mobile to receive an OTP on your email"}
          {step === 2 && "Enter the 6-digit OTP sent to your email"}
          {step === 3 &&
            "Create a new secure password and confirm logout from all devices"}
        </p>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <DataInput
            label="Mobile Number"
            placeholder="Enter registered mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            maxLength="10"
            required
          />
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Select Role</p>
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
            onClick={handleSendOTP}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <DataInput
            label="Enter OTP"
            placeholder="6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength="6"
            required
          />
          <button
            onClick={handleVerifyOTP}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
          <button
            onClick={handleSendOTP}
            className="w-full text-sm text-emerald-600 hover:underline"
          >
            Resend OTP
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="relative">
            <DataInput
              label="New Password"
              placeholder="Enter new password"
              inputType={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
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
          <DataInput
            label="Confirm Password"
            placeholder="Confirm new password"
            inputType={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <label className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
            <input
              type="checkbox"
              checked={confirmLogoutAllDevices}
              onChange={(e) => setConfirmLogoutAllDevices(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-green-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span>
              I understand that changing this password will log out this account
              from all logged-in devices.
            </span>
          </label>
          <button
            onClick={handleResetPassword}
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;
