import React from 'react';
import BrandLogo from '../../components/shared/BrandLogo';

const ComingSoon = ({ title, description, role }) => {
  const roleColors = {
    student: 'from-primary-500 to-blue-500',
    coordinator: 'from-accent-500 to-purple-500',
    alumni: 'from-success-500 to-emerald-500',
    default: 'from-primary-500 to-accent-500',
  };
  const gradient = roleColors[role] || roleColors.default;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <BrandLogo size="md" showText={false} className={`p-2 bg-gradient-to-br ${gradient} rounded-2xl`} />
        </div>
        <h1 className="font-display text-3xl font-bold text-[var(--color-text-primary)] mb-3">{title}</h1>
        <p className="text-[var(--color-text-secondary)] mb-6">{description}</p>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500/20 text-primary-600 text-sm font-semibold border border-primary-500/20">
          🚧 Coming in Part 2+
        </div>
      </div>
    </div>
  );
};

export const LoginPage = () => (
  <ComingSoon
    title="Welcome Back"
    description="Full authentication with JWT, permission-based access, and secure token management. Built in Part 2."
  />
);

export const RegisterPage = () => (
  <ComingSoon
    title="Create Your Avenor Account"
    description="Register as Student, Coordinator, or Alumni. Full validation and onboarding flow. Built in Part 2."
  />
);

export const ForgotPasswordPage = () => (
  <ComingSoon
    title="Forgot Password"
    description="OTP-based password reset via email. Built in Part 2."
  />
);
