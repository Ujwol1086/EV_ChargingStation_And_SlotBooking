import React from "react";

const FormInput = ({
  id,
  type = "text",
  label,
  placeholder,
  error,
  icon: Icon,
  autoComplete,
  ...props
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-300 mb-2">
        {label}
      </label>
      <div className={`relative p-[1.5px] rounded-xl transition-colors ${
        error 
          ? 'bg-red-500/50 focus-within:bg-red-500' 
          : 'bg-gray-700 focus-within:bg-gradient-to-r focus-within:from-cyan-500 focus-within:to-purple-600'
      }`}>
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="w-5 h-5 text-gray-400" />
          </div>
        )}
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          className={`block w-full rounded-[10px] bg-gray-800/60 placeholder-gray-400 text-gray-100 focus:outline-none focus:ring-0 transition-all duration-300 ${
            Icon ? 'pl-10 pr-3 py-3' : 'px-3 py-3'
          }`}
          placeholder={placeholder}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-400 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;
