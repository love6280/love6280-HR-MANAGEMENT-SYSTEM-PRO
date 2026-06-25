import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useResetPasswordMutation } from '../../services/api';
import toast from 'react-hot-toast';
import { ShieldCheck, ArrowLeft, KeySquare } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { email: emailParam }
  });
  const [resetPasswordApi, { isLoading }] = useResetPasswordMutation();
  const navigate = useNavigate();

  const newPassword = watch('newPassword', '');

  const checkStrength = (pwd) => {
    if (!pwd) return { score: 0, label: 'Empty', color: 'bg-white/10' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { score, label: 'Weak 🔴', color: 'bg-state-danger' };
    if (score === 2) return { score, label: 'Fair 🟡', color: 'bg-state-warning' };
    if (score === 3) return { score, label: 'Good 🔵', color: 'bg-accent-primary' };
    return { score, label: 'Strong 🟢', color: 'bg-state-success' };
  };

  const strength = checkStrength(newPassword);

  const onSubmit = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    try {
      await resetPasswordApi({
        email: data.email,
        otp: data.otp,
        newPassword: data.newPassword,
      }).unwrap();

      toast.success('Password updated successfully! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.data?.message || 'Failed to reset password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#070714] via-[#0b0c1e] to-[#0d1117]">
      <div className="w-full max-w-md p-8 glass-card border border-white/10 shadow-glass flex flex-col gap-6 mx-4">
        <div>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" /> Back to login
          </button>
          <h2 className="text-xl font-bold text-text-primary mb-1">Reset Password</h2>
          <p className="text-xs text-text-secondary font-medium">Verify your OTP and configure a strong new password.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="hr@hrms.com"
            error={errors.email}
            {...register('email', { required: 'Email address is required' })}
          />

          <Input
            label="OTP Code (6 Digits)"
            type="text"
            prefix={ShieldCheck}
            placeholder="123456"
            maxLength={6}
            error={errors.otp}
            {...register('otp', { required: 'Verification OTP code is required' })}
          />

          <Input
            label="New Password"
            type="password"
            prefix={KeySquare}
            placeholder="NewPassword@123"
            error={errors.newPassword}
            {...register('newPassword', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Must be at least 8 characters' }
            })}
          />

          {/* Password Strength Meter */}
          {newPassword && (
            <div className="flex flex-col gap-1.5 mt-0.5">
              <div className="flex justify-between items-center text-[10px] text-text-secondary font-medium">
                <span>Password Strength:</span>
                <span className="font-semibold">{strength.label}</span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strength.color}`}
                  style={{ width: `${(strength.score / 4) * 100}%` }}
                />
              </div>
            </div>
          )}

          <Input
            label="Confirm New Password"
            type="password"
            prefix={KeySquare}
            placeholder="NewPassword@123"
            error={errors.confirmPassword}
            {...register('confirmPassword', { required: 'Please confirm your password' })}
          />

          <Button
            type="submit"
            loading={isLoading}
            variant="primary"
            className="w-full py-2.5 mt-2 text-sm font-semibold"
          >
            Reset Account Password
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
