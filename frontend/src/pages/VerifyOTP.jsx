import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { z } from "zod";
import FormInput from "../components/ui/FormInput";
import { EmailIcon } from "../components/ui/icons";

const otpSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits").regex(/^\d{6}$/, "OTP must contain only numbers"),
});

export default function VerifyOTP() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(otpSchema),
    mode: "onChange",
  });

  const otpValue = watch("otp");

  useEffect(() => {
    // Get email from navigation state
    if (location.state?.email) {
      setEmail(location.state.email);
    } else {
      // If no email in state, redirect to forgot password
      navigate("/forgot-password");
    }
  }, [location.state, navigate]);

  useEffect(() => {
    // Countdown timer
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Auto-format OTP input
  useEffect(() => {
    if (otpValue && otpValue.length > 6) {
      setValue("otp", otpValue.slice(0, 6));
    }
  }, [otpValue, setValue]);

  const onSubmit = async (data) => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
          otp: data.otp,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(result.message);
        // Navigate to reset password page after 1 second
        setTimeout(() => {
          navigate("/reset-password", { state: { email: email, otp: data.otp } });
        }, 1000);
      } else {
        setError(result.error || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess("New OTP sent successfully!");
        setTimeLeft(600); // Reset timer
        setCanResend(false);
      } else {
        setError(result.error || "Failed to resend OTP. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please check your connection and try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
            Verify OTP
          </h2>
          <p className="mt-2 text-gray-300">
            Enter the 6-digit code sent to your email
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

          {/* Timer */}
          <div className="text-center mb-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30">
              <svg className="w-4 h-4 text-cyan-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-cyan-300">
                {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : "OTP Expired"}
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormInput
              id="otp"
              type="text"
              label="Enter OTP"
              placeholder="000000"
              autoComplete="one-time-code"
              maxLength={6}
              error={errors.otp?.message}
              {...register("otp")}
            />

            <div>
              <button
                type="submit"
                disabled={isLoading || !isValid || timeLeft === 0}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 transition-all duration-300 shadow-lg hover:shadow-cyan-500/25"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span>Verify OTP</span>
                    <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Resend OTP */}
          <div className="mt-4 text-center">
            {canResend ? (
              <button
                onClick={handleResendOTP}
                disabled={isLoading}
                className="text-cyan-400 hover:text-cyan-300 font-semibold text-sm transition-colors duration-300 disabled:opacity-50"
              >
                Resend OTP
              </button>
            ) : (
              <p className="text-sm text-gray-400">
                Didn't receive the code? Resend in {formatTime(timeLeft)}
              </p>
            )}
          </div>

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
            Check your email for the verification code
          </p>
        </div>
      </div>
    </div>
  );
}
