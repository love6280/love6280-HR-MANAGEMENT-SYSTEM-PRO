import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../../store/authSlice';
import { useLoginMutation, getApiBaseUrl } from '../../services/api';
import toast from 'react-hot-toast';
import { Mail, Lock, LogIn } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loginApi, { isLoading }] = useLoginMutation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const onSubmit = async (data) => {
    try {
      const result = await loginApi({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe,
      }).unwrap();

      dispatch(setCredentials({
        user: result.user,
        token: result.token,
      }));

      toast.success(`Welcome back, ${result.user.employee?.personalInfo?.firstName || 'Admin'}!`);
      navigate(from, { replace: true });
    } catch (err) {
      const errorMsg = err.data?.message || err.error || 'Login failed. Please check credentials.';
      const attemptedUrl = `${getApiBaseUrl()}/auth/login`;
      toast.error(`${errorMsg} (Endpoint: ${attemptedUrl})`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-[#050512] via-[#08091a] to-[#0d1117] overflow-hidden relative">
      {/* Grid mesh overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:50px_50px] bg-center pointer-events-none -z-10" />

      {/* Floating neon mesh orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-[#4f9eff]/15 to-[#00f2fe]/4 blur-[120px] animate-pulse pointer-events-none" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-gradient-to-br from-[#8b5cf6]/15 to-[#d946ef]/4 blur-[150px] animate-pulse pointer-events-none" style={{ animationDuration: '12s' }} />

      <div className="flex flex-col gap-6 w-full max-w-md mx-4 relative z-10 animate-fade-in">
        {/* Centered Glass Card */}
        <div className="w-full p-8 glass-card border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5),_inset_0_1px_0_rgba(255,255,255,0.15)] flex flex-col gap-6">
          {/* Brand Header */}
          <div className="text-center flex flex-col gap-2">
            <h2 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-accent-primary via-[#00f2fe] to-accent-secondary bg-clip-text text-transparent uppercase select-none">
              HRMS Pro
            </h2>
            <p className="text-[11px] text-text-secondary uppercase tracking-widest font-semibold">Sign in to workspace</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Email Address"
              type="email"
              prefix={Mail}
              placeholder="admin@hrms.com"
              error={errors.email}
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />

            <Input
              label="Password"
              type="password"
              prefix={Lock}
              placeholder="••••••••"
              error={errors.password}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
            />

            <div className="flex items-center justify-between text-xs mt-1">
              <label className="flex items-center gap-2 cursor-pointer text-text-secondary select-none">
                <input
                  type="checkbox"
                  className="rounded bg-white/5 border-white/10 text-accent-primary focus:ring-accent-primary/20 cursor-pointer h-4 w-4"
                  {...register('rememberMe')}
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-accent-primary hover:underline font-semibold"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              loading={isLoading}
              variant="primary"
              icon={LogIn}
              className="w-full py-3 mt-2 text-sm font-semibold tracking-wide"
            >
              Sign In
            </Button>
          </form>
        </div>

        {/* Demo Credentials Helper Box */}
        <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] backdrop-blur-md flex flex-col gap-2.5 text-xs text-text-secondary shadow-md">
          <span className="font-bold text-[10px] text-text-primary uppercase tracking-wider border-b border-white/5 pb-1">
            ⚡ Demo Accounts:
          </span>
          <div className="grid grid-cols-1 gap-1.5 font-mono text-[10.5px]">
            <div className="flex justify-between items-center bg-white/[0.02] p-1.5 rounded border border-white/[0.03]">
              <span className="text-accent-primary">SuperAdmin:</span>
              <span>admin@hrms.com / Admin@123</span>
            </div>
            <div className="flex justify-between items-center bg-white/[0.02] p-1.5 rounded border border-white/[0.03]">
              <span className="text-accent-secondary">HRManager:</span>
              <span>hr@hrms.com / Hr@123</span>
            </div>
            <div className="flex justify-between items-center bg-white/[0.02] p-1.5 rounded border border-white/[0.03]">
              <span className="text-state-warning">Employee:</span>
              <span>david@hrms.com / Emp@123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
