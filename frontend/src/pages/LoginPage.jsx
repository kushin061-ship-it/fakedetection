import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) { setError('Email address is required.'); return; }
    if (!password.trim()) { setError('Password is required.'); return; }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    // Look up user in localStorage
    const users = JSON.parse(localStorage.getItem('tl_users') || '[]');
    const user = users.find(
      (u) => u.email === email.trim().toLowerCase() && u.password === password
    );

    if (user) {
      localStorage.setItem('tl_auth', JSON.stringify({
        email: user.email,
        name: user.name,
        loggedIn: true,
      }));
      navigate('/', { replace: true });
    } else {
      setError('Invalid email or password. Please try again or create an account.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tl-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Title */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2.5">
            <svg width={36} height={36} viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <defs>
                <linearGradient id="login-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#3A78F2" />
                  <stop offset="1" stopColor="#74A6FF" />
                </linearGradient>
              </defs>
              <ShieldCheck
                size={36}
                stroke="url(#login-grad)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ display: 'block' }}
              />
            </svg>
            <span className="text-2xl font-bold text-tl-text tracking-tight">TrustLens</span>
          </div>
          <p className="text-sm text-tl-muted">
            Fake Review Detection Dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-tl-card rounded-[14px] border border-tl-border shadow-card p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-tl-text">Sign in</h2>
            <p className="text-xs text-tl-muted mt-1">
              Enter your credentials to access the dashboard
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-xs font-semibold text-tl-text flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-tl-muted" />
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-[10px] border border-tl-border px-3 py-2.5 text-sm bg-tl-fill text-tl-text placeholder:text-tl-muted/60 focus:outline-none focus:border-tl-accent focus:ring-1 focus:ring-tl-accent transition-colors"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="text-xs font-semibold text-tl-text flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-tl-muted" />
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full rounded-[10px] border border-tl-border px-3 py-2.5 pr-10 text-sm bg-tl-fill text-tl-text placeholder:text-tl-muted/60 focus:outline-none focus:border-tl-accent focus:ring-1 focus:ring-tl-accent transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tl-muted hover:text-tl-text transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-[10px] bg-tl-fake-bg border border-tl-fake/20 text-tl-fake text-xs font-medium">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[10px] text-sm font-bold text-white bg-gradient-to-r from-[#3A78F2] to-[#74A6FF] shadow-[0_4px_14px_rgba(58,120,242,0.35)] hover:shadow-[0_6px_20px_rgba(58,120,242,0.45)] hover:-translate-y-0.5 motion-safe:transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link to Signup */}
          <p className="text-center text-xs text-tl-muted">
            Don't have an account?{' '}
            <Link to="/signup" className="text-tl-accent font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>

        <p className="text-center text-[11px] text-tl-muted">
          © 2026 TrustLens · Fake Review Detection Using Machine Learning
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
