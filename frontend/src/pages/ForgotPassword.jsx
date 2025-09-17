import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import FormInput from "../components/ui/FormInput";
import { EmailIcon } from "../components/ui/icons";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export default function ForgotPassword() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(result.message);
        // Navigate to OTP verification page after 2 seconds
        setTimeout(() => {
          navigate("/verify-otp", { state: { email: data.email } });
        }, 2000);
      } else {
        setError(result.error || "An error occurred. Please try again.");
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
            Forgot Password
          </h2>
          <p className="mt-2 text-gray-300">
            Enter your email address and we'll send you an OTP to reset your password
          </p>
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
              id="email"
              type="email"
              label="Email Address"
              placeholder="Enter your email address"
              autoComplete="email"
              icon={EmailIcon}
              error={errors.email?.message}
              {...register("email")}
            />

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
                    Sending OTP...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span>Send OTP</span>
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
            We'll send you a secure OTP to verify your identity
          </p>
        </div>
      </div>
    </div>
  );
}
