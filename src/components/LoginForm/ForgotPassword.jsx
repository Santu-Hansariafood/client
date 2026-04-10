import { useState } from "react";
import api from "../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import { AiOutlineArrowLeft, AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import DataInput from "../../common/DataInput/DataInput";

const ForgotPassword = ({ onBack, userRole }) => {
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP, 3: New Password
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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

    setLoading(true);
    try {
      await api.post("/reset-password", {
        mobile,
        role: userRole,
        otp,
        newPassword,
      });
      toast.success("Password reset successfully. Please login with your new password.");
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
          {step === 3 && "Create a new secure password"}
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
              {showPassword ? <AiOutlineEye size={20} /> : <AiOutlineEyeInvisible size={20} />}
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
