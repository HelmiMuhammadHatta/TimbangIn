import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { useAuthStore } from '../../store/useAuthStore';
import { Lock, User, AlertCircle, CheckCircle2, Video, Scale } from 'lucide-react';
import { Button } from '../../components/UI/Button';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axiosInstance.post('/auth/login', { username, password });
      if (response.data.success) {
        const { token, username: user, role, permissions } = response.data.data;
        setAuth(token, user, role, permissions);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background text-foreground font-sans">
      {/* Kiri: Ilustrasi Panel (60%) */}
      <div className="hidden md:flex md:w-[60%] relative bg-surface border-r border-border overflow-hidden">
        {/* Placeholder untuk foto jembatan timbang */}
        <div className="absolute inset-0 bg-black/60 z-10 mix-blend-multiply" />
        <img 
          src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop" 
          alt="Weighbridge illustration" 
          className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
        
        <div className="relative z-20 flex flex-col justify-end p-12 lg:p-24 w-full h-full">
          <div className="mb-6 flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold text-background text-xl">
              T
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white">TimbangIn</h1>
          </div>
          <p className="text-xl text-muted font-medium mb-8">Weighbridge Management System</p>
          
          <div className="space-y-4">
            <div className="flex items-center text-foreground">
              <CheckCircle2 className="w-5 h-5 mr-3 text-primary" />
              <span>Auto Weighing & Real-time Integration</span>
            </div>
            <div className="flex items-center text-foreground">
              <Video className="w-5 h-5 mr-3 text-primary" />
              <span>ANPR Plate Scan (Automatic Number Plate Recognition)</span>
            </div>
            <div className="flex items-center text-foreground">
              <Scale className="w-5 h-5 mr-3 text-primary" />
              <span>Live CCTV Monitoring & Reporting</span>
            </div>
          </div>
        </div>
      </div>

      {/* Kanan: Login Card (40%) */}
      <div className="w-full md:w-[40%] flex items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-[400px]">
          {/* Logo mobile only */}
          <div className="md:hidden flex items-center space-x-3 mb-10 justify-center">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-background">
              T
            </div>
            <h1 className="text-2xl font-bold tracking-tight">TimbangIn</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight mb-2">Sign In</h2>
            <p className="text-muted text-sm">Enter your credentials to access the control panel.</p>
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger p-3 rounded-lg text-sm mb-6 flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 w-full p-2.5 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-foreground placeholder:text-muted/60"
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full p-2.5 bg-surface border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-foreground placeholder:text-muted/60"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-sm pt-1">
              <label className="flex items-center space-x-2 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-border bg-surface text-primary focus:ring-primary focus:ring-offset-background transition-all appearance-none cursor-pointer"
                  />
                  <CheckCircle2 className={`absolute w-3.5 h-3.5 text-background pointer-events-none left-[1px] ${rememberMe ? 'opacity-100' : 'opacity-0'}`} />
                  {/* Custom checkbox styling fallback via Tailwind */}
                  <div className={`absolute inset-0 rounded pointer-events-none ${rememberMe ? 'bg-primary' : 'border border-border'}`} />
                  {rememberMe && <CheckCircle2 className="absolute w-3.5 h-3.5 text-background pointer-events-none left-[1px] z-10" />}
                </div>
                <span className="text-muted group-hover:text-foreground transition-colors">Ingat saya</span>
              </label>
              <a href="#" className="text-primary hover:text-primary/80 transition-colors font-medium">
                Lupa password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              className="mt-2 h-[44px]"
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
