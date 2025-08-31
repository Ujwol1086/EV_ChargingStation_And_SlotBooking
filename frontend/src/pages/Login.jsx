import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { loginSchema } from "../utils/validationSchemas";
import FormInput from "../components/ui/FormInput";
import { EmailIcon, PasswordIcon } from "../components/ui/icons";

export default function Login() {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
  } = useForm({
    resolver: zodResolver(loginSchema),
    mode: "onChange",
  });

  const onSubmit = async (data) => {
    setError("");
    setIsLoading(true);

    try {
      const result = await login(data);

      if (result.success) {
        // Redirect based on user role
        if (result.is_admin) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsGoogleLoading(true);

    try {
      const result = await googleLogin();
      
      if (result.success) {
        // Redirect based on user role
        if (result.is_admin) {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError("Google login failed. Please try again.");
      console.error(err);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative bg-gradient-to-br from-black via-slate-950 to-gray-950 flex flex-col justify-center py-16 px-6">
      {/* Background decoration to match Home */}
      <div className="absolute inset-0 opacity-40 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/15 via-purple-600/15 to-green-600/15 animate-pulse" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-indigo-600/10 to-purple-600/10" />
        <div className="absolute top-20 left-20 w-32 h-32 border border-cyan-500/20 rounded-full" />
        <div className="absolute top-40 right-32 w-24 h-24 border border-purple-500/20 rotate-45" />
        <div className="absolute bottom-40 left-40 w-16 h-16 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-lg" />
      </div>

      <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Welcome Back
          </h2>
          <p className="mt-2 text-gray-300">
            Sign in to your account to continue
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-gray-900/70 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl border border-gray-800/40">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-300">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <FormInput
              id="email"
              type="email"
              label="Email Address"
              placeholder="Enter your email"
              autoComplete="email"
              icon={EmailIcon}
              error={errors.email?.message}
              {...register("email")}
            />

            <FormInput
              id="password"
              type="password"
              label="Password"
              placeholder="Enter your password"
              autoComplete="current-password"
              icon={PasswordIcon}
              error={errors.password?.message}
              {...register("password")}
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
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <span>Sign In</span>
                    <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Google Login Button at bottom of the card */}
          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-sm"
            >
              {isGoogleLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                  Signing in with Google...
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-800"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-transparent text-gray-400">New to EVConnectNepal?</span>
              </div>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <Link
              to="/register"
              className="inline-flex items-center font-semibold text-cyan-400 hover:text-cyan-300 transition-colors duration-300"
            >
              Create a new account
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400">
            Secure login protected by industry-standard encryption
          </p>
        </div>
      </div>
    </div>
  );
}
