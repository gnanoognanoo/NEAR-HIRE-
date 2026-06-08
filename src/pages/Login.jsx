import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ArrowRight, Phone } from 'lucide-react';
import OTPInput from '../components/OTPInput';
import toast from 'react-hot-toast';
import { auth, isDemoMode } from '../services/firebase';
import { RecaptchaVerifier } from 'firebase/auth';
import { authService } from '../services/authService';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState(1); // 1=phone, 2=otp
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);

  const { verifyLoginSession, loginWithPhone } = useAuth();
  const navigate = useNavigate();

  // Initialize invisible reCAPTCHA verifier
  useEffect(() => {
    if (isDemoMode || !auth) return;

    try {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved
        },
        'expired-callback': () => {
          toast.error('reCAPTCHA expired. Please request OTP again.');
        }
      });
    } catch (err) {
      console.error('Failed to initialize RecaptchaVerifier:', err);
    }

    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {
          // ignore
        }
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      const fullPhone = `+91${cleanPhone}`;
      
      // In demo mode or if auth is not initialized, use dummy OTP flow
      if (isDemoMode || !auth) {
        const result = await authService.sendOTP(fullPhone, null);
        setConfirmationResult(result);
        setIsLoading(false);
        setStep(2);
        toast.success('OTP sent successfully!');
        return;
      }

      // Real Firebase Phone Auth
      if (!window.recaptchaVerifier) {
        throw new Error('reCAPTCHA verifier was not initialized properly.');
      }

      const result = await authService.sendOTP(fullPhone, window.recaptchaVerifier);
      setConfirmationResult(result);
      setIsLoading(false);
      setStep(2);
      toast.success('OTP sent successfully!');
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Failed to send OTP. Please try again.');
      console.error('OTP Send Error:', err);
    }
  };

  const handleVerifyOtp = async (code) => {
    if (code.length !== 6) return;

    setIsLoading(true);
    setError('');

    try {
      if (!confirmationResult) {
        throw new Error('No active verification session. Please request OTP again.');
      }

      // Confirm OTP
      const result = await confirmationResult.confirm(code);
      const user = result.user;

      // Sync user profile state from database
      await verifyLoginSession(user);
      setIsLoading(false);

      // Always go to role selection — user picks Worker or Employer every session
      navigate('/role-select');
    } catch (err) {
      setIsLoading(false);
      setError(err.message || 'Verification failed. Please try again.');
      console.error('OTP Verification Error:', err);
    }
  };

  const handleSkipVerification = async () => {
    setError('');
    setIsLoading(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const fallbackPhone = '+919999999999';
      const fullPhone = cleanPhone.length >= 10 ? `+91${cleanPhone.slice(-10)}` : fallbackPhone;

      await loginWithPhone(fullPhone);
      toast.success('Signed in (demo)');
      navigate('/role-select');
    } catch (err) {
      console.error('Skip verification error:', err);
      toast.error('Could not skip verification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center px-4 py-8" style={{ maxWidth: 420, margin: '0 auto' }}>
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      <div className="card glass-card animate-scale-in" style={{ padding: '32px 24px', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.08)', boxShadow: '0 24px 48px rgba(0, 0, 0, 0.6)' }}>
        {/* Header */}
        <div className="flex flex-col items-center" style={{ marginBottom: '28px' }}>
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), #ff8f5c)',
              boxShadow: '0 8px 32px var(--color-primary-glow)',
            }}
          >
            <Briefcase size={30} color="white" />
          </div>
          <h1
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.03em' }}
          >
            NearHire
          </h1>
          <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)', maxWidth: 260 }}>
            Connecting local talent with instant opportunities nearby
          </p>
        </div>

        {/* Form */}
        <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
        {step === 1 ? (
          <form onSubmit={handleRequestOtp}>
            <div className="input-group" style={{ marginBottom: '20px' }}>
              <label className="input-label" style={{ marginBottom: '8px' }}>Phone Number</label>
              <div className="flex gap-2">
                <div
                  className="flex items-center gap-2 px-4 rounded-xl shrink-0"
                  style={{
                    background: 'var(--color-bg-input)',
                    border: '1.5px solid var(--color-border)',
                    minHeight: 48,
                  }}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>🇮🇳 +91</span>
                </div>
                <input
                  type="tel"
                  className={`input-field ${error ? 'input-error' : ''}`}
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setError('');
                  }}
                  maxLength={10}
                  inputMode="numeric"
                  autoFocus
                  id="phone-input"
                />
              </div>
              {error && <p className="error-text">{error}</p>}
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '24px' }} disabled={isLoading} id="send-otp-btn">
              {isLoading ? (
                <span className="spinner spinner-sm" />
              ) : (
                <>
                  Send OTP <ArrowRight size={20} />
                </>
              )}
            </button>

            {(isDemoMode || !auth) && (
              <button
                type="button"
                className="btn-secondary w-full"
                style={{
                  marginTop: 12,
                  minHeight: 48,
                  borderColor: 'rgba(255, 107, 44, 0.25)',
                  color: 'var(--color-primary)',
                }}
                disabled={isLoading}
                onClick={handleSkipVerification}
                id="skip-verification-btn"
              >
                {isLoading ? <span className="spinner spinner-sm" /> : 'Skip verification (demo)'}
              </button>
            )}

            {/* Demo mode notice */}
            {(isDemoMode || !auth) && (
              <div
                className="p-3 rounded-xl text-center text-xs"
                style={{
                  marginTop: '24px',
                  background: 'rgba(255, 107, 44, 0.06)',
                  border: '1px solid rgba(255, 107, 44, 0.12)',
                  color: 'var(--color-text-muted)',
                }}
              >
                <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Demo Mode:</span> Enter any phone number and use code <span className="font-semibold text-white">123456</span> to sign in
              </div>
            )}
          </form>
        ) : (
          <div className="animate-fade-in">
            <div className="text-center mb-8">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--color-bg-input)', color: 'var(--color-primary)' }}
              >
                <Phone size={24} />
              </div>
              <h2
                className="text-xl font-semibold mb-2"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Verify OTP
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Enter the 6-digit code sent to<br />
                <span className="font-medium" style={{ color: 'var(--color-text-secondary)' }}>+91 {phone}</span>
              </p>
            </div>

            <OTPInput length={6} onComplete={handleVerifyOtp} disabled={isLoading} />

            {error && <p className="error-text text-center mt-4">{error}</p>}

            {isLoading && (
              <div className="flex justify-center mt-6">
                <span className="spinner" />
              </div>
            )}

            <button
              type="button"
              className="w-full mt-8 py-3 text-sm font-medium text-center transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
              onClick={() => {
                setStep(1);
                setError('');
              }}
            >
              ← Change Phone Number
            </button>

            <button
              type="button"
              className="w-full mt-2 py-2 text-sm text-center"
              style={{ color: 'var(--color-primary)' }}
              onClick={() => {
                toast.success('OTP resent!');
              }}
            >
              Resend OTP
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 mt-auto animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          By continuing, you agree to our{' '}
          <a href="#" className="underline" style={{ color: 'var(--color-text-secondary)' }}>Terms of Service</a>{' '}
          and{' '}
          <a href="#" className="underline" style={{ color: 'var(--color-text-secondary)' }}>Privacy Policy</a>
        </p>
        <div
          className="w-[120px] h-1 rounded-full mx-auto mt-5"
          style={{ background: 'var(--color-border)' }}
        />
      </div>
    </div>
  );
};

export default Login;
