import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import FormInput from "../components/ui/FormInput";
import { PasswordIcon } from "../components/ui/icons";

const resetPasswordSchema = z.object({
  new_password: z.string().min(6, "Password must be at least 6 characters"),
  confirm_password: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

export default function ResetPassword() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onChange",
  });

  const newPassword = watch("new_password");

  useEffect(() => {
    // Get email and OTP from navigation state
    if (location.state?.email && location.state?.otp) {
      setEmail(location.state.email);
      setOtp(location.state.otp);
    } else {
      // If no email/OTP in state, redirect to forgot password
      navigate("/forgot-password");
    }
  }, [location.state, navigate]);

  const onSubmit = async (data) => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp: otp,
          new_password: data.new_password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(result.message);
        // Navigate to login page after 2 seconds
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(result.error || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-black via-slate-950 to-gray-950 flex flex-col justify-center py-8 px-6">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/15 via-purple-600/15 to-green-600/15 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-purple-600/10" />
        <div className="absolute top-20 left-20 w-32 h-32 border border-cyan-500/20 rounded-full" />
        <div className="absolute top-40 right-32 w-24 h-24 border border-purple-500/20 rotate-45" />
        <div className="absolute bottom-40 left-40 w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg" />
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Reset Password
          </h2>
          <p className="mt-2 text-gray-300">
            Enter your new password below
          </p>
          {email && (
            <p className="mt-1 text-sm text-cyan-400">
              {email}
            </p>
          )}
        </div>

        {/* Form */}
        <div className="bg-gray-900/70 backdrop-blur-xl py-6 px-6 shadow-2xl rounded-2xl border border-gray-800/40">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-4">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-sm text-green-300">{success}</p>
              </div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormInput
              id="new_password"
              type="password"
              label="New Password"
              placeholder="Enter your new password"
              autoComplete="new-password"
              icon={PasswordIcon}
              error={errors.new_password?.message}
              {...register("new_password")}
            />

            <FormInput
              id="confirm_password"
              type="password"
              label="Confirm New Password"
              placeholder="Confirm your new password"
              autoComplete="new-password"
              icon={PasswordIcon}
              error={errors.confirm_password?.message}
              {...register("confirm_password")}
            />

            {/* Password strength indicator */}
            {newPassword && (
              <div className="space-y-2">
                <div className="text-xs text-gray-400">Password strength:</div>
                <div className="flex space-x-1">
                  <div className={`h-1 w-full rounded ${newPassword.length >= 6 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                  <div className={`h-1 w-full rounded ${newPassword.length >= 8 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                  <div className={`h-1 w-full rounded ${newPassword.length >= 10 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                  <div className={`h-1 w-full rounded ${newPassword.length >= 12 ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                </div>
                <div className="text-xs text-gray-400">
                  {newPassword.length < 6 && "At least 6 characters required"}
                  {newPassword.length >= 6 && newPassword.length < 8 && "Good"}
                  {newPassword.length >= 8 && newPassword.length < 10 && "Better"}
                  {newPassword.length >= 10 && newPassword.length < 12 && "Strong"}
                  {newPassword.length >= 12 && "Very Strong"}
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading || !isValid}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting Password...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span>Reset Password</span>
                    <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center font-semibold text-cyan-400 hover:text-cyan-300 transition-colors duration-300"
            >
              <svg className="mr-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Login
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            Your password has been securely reset
          </p>
        </div>
      </div>
    </div>
  );
}
