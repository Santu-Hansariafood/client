import { useState } from "react";
import api from "../../utils/apiClient/apiClient";
import { toast } from "react-toastify";
import {
  AiOutlineClose,
  AiOutlineEye,
  AiOutlineEyeInvisible,
} from "react-icons/ai";
import DataInput from "../DataInput/DataInput";
import { useAuth } from "../../context/AuthContext/AuthContext";

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { userRole, mobile } = useAuth();
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    setLoading(true);
    try {
      await api.post("/change-password-otp", { mobile, role: userRole });
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
      toast.success("Password updated successfully.");
      onClose();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Change Password</h2>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <AiOutlineClose size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-sm text-slate-500">
            {step === 1 &&
              "An OTP will be sent to your registered email address to verify your identity."}
            {step === 2 && "Enter the 6-digit OTP sent to your email."}
            {step === 3 && "Create a new secure password for your account."}
          </p>

          {step === 1 && (
            <button
              onClick={handleSendOTP}
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50"
            >
              {loading ? "Sending OTP..." : "Send OTP to Email"}
            </button>
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
                className="w-full text-sm text-emerald-600 hover:underline text-center"
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
              <button
                onClick={handleResetPassword}
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition disabled:opacity-50"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
