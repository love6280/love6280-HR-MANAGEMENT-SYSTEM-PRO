import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useForgotPasswordMutation } from '../../services/api';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft } from 'lucide-react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const ForgotPassword = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [forgotPasswordApi, { isLoading }] = useForgotPasswordMutation();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await forgotPasswordApi({ email: data.email }).unwrap();
      toast.success('OTP sent to your email address!');
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      toast.error(err.data?.message || 'Failed to send OTP.');
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
          <h2 className="text-xl font-bold text-text-primary mb-1">Forgot Password</h2>
          <p className="text-xs text-text-secondary">Enter your email and we'll send you an OTP code to reset your password.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Input
            label="Registered Email Address"
            type="email"
            prefix={Mail}
            placeholder="hr@hrms.com"
            error={errors.email}
            {...register('email', {
              required: 'Email address is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />

          <Button
            type="submit"
            loading={isLoading}
            variant="primary"
            className="w-full py-2.5 mt-2 text-sm font-semibold"
          >
            Send OTP Verification
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
