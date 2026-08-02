import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiPhone, FiLock, FiUser, FiInfo } from 'react-icons/fi';

const Login = () => {
  const { user, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [mockOtp, setMockOtp] = useState(''); // Stores mock OTP if returned by api for easy testing
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      navigate(redirect);
    }
  }, [user, navigate, redirect]);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setMockOtp('');
    
    if (!mobile) {
      setError('Please enter your mobile number.');
      return;
    }

    // Basic format validation
    const cleanMobile = mobile.replace(/\s+/g, '');
    if (cleanMobile.length < 10) {
      setError('Mobile number must be at least 10 digits.');
      return;
    }

    // Auto prepend +91 for India if no country code exists
    let formattedMobile = cleanMobile;
    if (!cleanMobile.startsWith('+')) {
      formattedMobile = `+91${cleanMobile}`;
    }

    setLoading(true);
    try {
      const data = await sendOtp(formattedMobile);
      setIsOtpSent(true);
      setSuccess(data.message || 'OTP sent successfully!');
      
      // If mock mode returns the OTP in response
      if (data.otp) {
        setMockOtp(data.otp);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }

    let formattedMobile = mobile.replace(/\s+/g, '');
    if (!formattedMobile.startsWith('+')) {
      formattedMobile = `+91${formattedMobile}`;
    }

    setLoading(true);
    try {
      const data = await verifyOtp(formattedMobile, otp, name);
      setSuccess('Logged in successfully!');
      navigate(redirect);
    } catch (err) {
      setError(err.message);
      // If backend reports customer needs registration (Wait! In our controller, verifyOtp automatically registers new users, but let's make sure it handles name collection. In our controller, if the user name isn't provided, it defaults to 'Customer'. If user wants to specify name, we can ask for name.
      // Wait, in our controller verifyOtpAndLogin registers the user with input name. If it's a new user, isNewUser is returned. So our flow is fully working.
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white uppercase tracking-tight">
            Sign In / Register
          </h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Sign in instantly using your mobile number and OTP (No passwords required)
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm border border-red-100 dark:border-red-900/40">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl text-sm border border-emerald-100 dark:border-emerald-900/40">
            {success}
          </div>
        )}

        {/* Info panel for mockup tests */}
        {mockOtp && (
          <div className="bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 p-4 rounded-xl text-sm border border-blue-100 dark:border-blue-900/40 flex items-start gap-2">
            <FiInfo className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Development Mode (SMS Mock Enabled)</p>
              <p className="mt-1">Use mock verification OTP: <strong className="bg-blue-200 dark:bg-blue-900 text-blue-950 dark:text-blue-100 px-2 py-0.5 rounded text-base">{mockOtp}</strong></p>
            </div>
          </div>
        )}

        {!isOtpSent ? (
          /* Step 1: Input Mobile Number */
          <form className="mt-8 space-y-6" onSubmit={handleSendOtp}>
            <div className="rounded-md space-y-4">
              <div>
                <label htmlFor="mobile-number" className="block text-sm font-bold text-slate-500 mb-1.5 uppercase">
                  Mobile Number
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FiPhone className="h-5 w-5" />
                  </div>
                  <input
                    id="mobile-number"
                    name="mobile"
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="Enter 10-digit mobile number (e.g. 9876543210)"
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-primary-700 hover:bg-primary-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: Verification Code Input */
          <form className="mt-8 space-y-6" onSubmit={handleVerifyOtp}>
            <div className="rounded-md space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-500 mb-1.5 uppercase">
                  Enter 6-Digit OTP
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FiLock className="h-5 w-5" />
                  </div>
                  <input
                    name="otp"
                    type="text"
                    pattern="\d{6}"
                    maxLength="6"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP code"
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-center tracking-[0.7em] font-mono text-lg"
                  />
                </div>
              </div>

              {/* Optional Name collection if registration required */}
              <div>
                <label htmlFor="customer-name" className="block text-sm font-bold text-slate-500 mb-1.5 uppercase">
                  Your Full Name (For New Users)
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FiUser className="h-5 w-5" />
                  </div>
                  <input
                    id="customer-name"
                    name="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name (e.g. John Doe)"
                    className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-bold text-white bg-primary-700 hover:bg-primary-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                {loading ? 'Verifying...' : 'Verify & Continue'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setIsOtpSent(false);
                  setMockOtp('');
                }}
                className="w-full text-center py-2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                Change Mobile Number
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
