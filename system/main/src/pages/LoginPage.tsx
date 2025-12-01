import { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Lock, User, ArrowRight, Mail, Phone, UserPlus, KeyRound, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFeedback } from '@/context/FeedbackContext';
import { Logo } from "@/components/Logo";

type ViewMode = 'login' | 'signup' | 'forgot-password';

export default function LoginPage() {
  const { showPromise } = useFeedback();
  const navigate = useNavigate();
  const location = useLocation();
  const [viewMode, setViewMode] = useState<ViewMode>('login');

  useEffect(() => {
    if (location.pathname === '/register') {
      setViewMode('signup');
    } else {
      setViewMode('login');
    }
  }, [location.pathname]);
  
  // Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    switch (viewMode) {
      case 'login': document.title = "NCPS Login"; break;
      case 'signup': document.title = "NCPS Sign Up"; break;
      case 'forgot-password': document.title = "Reset Password"; break;
    }
  }, [viewMode]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);
    resize();

    // Configuration
    const boxSize = 20; // Tiny boxes
    const lights = [
      { 
        x: Math.random() * width, 
        y: Math.random() * height, 
        vx: (Math.random() - 0.5) * 3.0, // Increased speed
        vy: (Math.random() - 0.5) * 3.0, 
        baseRadius: 400, 
        radius: 400,
        pulseSpeed: 0.002,
        pulseOffset: Math.random() * Math.PI * 2,
        color: '77, 189, 204' 
      }, // #4DBDCC
      { 
        x: Math.random() * width, 
        y: Math.random() * height, 
        vx: (Math.random() - 0.5) * 3.0, 
        vy: (Math.random() - 0.5) * 3.0, 
        baseRadius: 450, 
        radius: 450,
        pulseSpeed: 0.0015,
        pulseOffset: Math.random() * Math.PI * 2,
        color: '255, 255, 255' 
      }, // White for contrast
    ];

    const draw = () => {
      // Create a gradient background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#0B4F6C'); // Primary Blue
      gradient.addColorStop(1, '#042D62'); // Darker Blue

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      const time = Date.now();

      // Update lights
      lights.forEach(light => {
        // Organic movement: slightly change velocity
        light.vx += (Math.random() - 0.5) * 0.1;
        light.vy += (Math.random() - 0.5) * 0.1;
        
        // Limit max speed
        const maxSpeed = 4.0; // Increased max speed
        const speed = Math.hypot(light.vx, light.vy);
        if (speed > maxSpeed) {
          light.vx = (light.vx / speed) * maxSpeed;
          light.vy = (light.vy / speed) * maxSpeed;
        }

        light.x += light.vx;
        light.y += light.vy;

        // Bounce off walls
        if (light.x < -200 || light.x > width + 200) light.vx *= -1;
        if (light.y < -200 || light.y > height + 200) light.vy *= -1;

        // Pulsate radius
        light.radius = light.baseRadius + Math.sin(time * light.pulseSpeed + light.pulseOffset) * 80;
      });

      // Draw grid
      const cols = Math.ceil(width / boxSize);
      const rows = Math.ceil(height / boxSize);

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * boxSize;
          const y = j * boxSize;
          const cx = x + boxSize / 2;
          const cy = y + boxSize / 2;

          let maxOpacity = 0;
          let activeColor = '';

          for (const light of lights) {
            const dist = Math.hypot(cx - light.x, cy - light.y);
            if (dist < light.radius) {
              // Smoother falloff
              const opacity = Math.pow(1 - dist / light.radius, 2);
              if (opacity > maxOpacity) {
                maxOpacity = opacity;
                activeColor = light.color;
              }
            }
          }

          if (maxOpacity > 0.05) { // Threshold to avoid drawing barely visible boxes
            ctx.strokeStyle = `rgba(${activeColor}, ${maxOpacity * 0.3})`; // Adjusted for dark bg
            ctx.lineWidth = 1; 
            ctx.strokeRect(x, y, boxSize, boxSize);
            
            ctx.fillStyle = `rgba(${activeColor}, ${maxOpacity * 0.1})`; // Adjusted for dark bg
            ctx.fillRect(x, y, boxSize, boxSize);
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const API_URL = 'http://localhost:5000/api/auth';

    if (viewMode === 'forgot-password') {
      const promise = async () => {
        // TODO: Implement forgot password API
        console.log('Reset password for:', email);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return "Password reset link sent to your email!";
      };

      await showPromise(promise(), {
        loading: 'Sending reset link...',
        success: (data) => data,
        error: 'Failed to send reset link'
      });

      setViewMode('login');
      setIsLoading(false);
      return;
    }

    if (viewMode === 'signup') {
      // Sign Up Logic
      if (password !== confirmPassword) {
        showPromise(Promise.reject(new Error("Passwords do not match")), {
            loading: 'Validating...',
            success: () => '',
            error: (err) => err.message
        });
        setIsLoading(false);
        return;
      }

      const promise = async () => {
        const response = await fetch(`${API_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            firstName,
            lastName,
            email,
            phone,
            password,
            role: 'Customer' // Default role
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Registration failed');
        }
        return "Account created successfully! Please login.";
      };

      try {
        await showPromise(promise(), {
            loading: 'Creating account...',
            success: (data) => data,
            error: (err) => err.message || 'Registration failed'
        });
        setViewMode('login');
        resetForm();
      } catch (error: any) {
        // Error handled by showPromise
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Login Logic
    const promise = async () => {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token and user info
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      
      return data;
    };

    try {
      const data = await showPromise(promise(), {
        loading: 'Logging in...',
        success: (data) => `Welcome back, ${data.user.firstName}!`,
        error: (err) => err.message || 'Login failed'
      });

      // Redirect based on role
      const role = data.user.role.toLowerCase();
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'technician') {
        navigate('/technician');
      } else if (role === 'receptionist') {
        navigate('/receptionist');
      } else {
        navigate('/customer');
      }
    } catch (error: any) {
      // Error handled by showPromise
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B4F6C] relative overflow-hidden">
      {/* Background Elements */}
      <canvas 
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full z-0"
      />

      <div className="w-full max-w-md z-10 px-4 py-8">
        <div className="text-center mb-8 space-y-2 transition-all duration-500 ease-in-out">
          <div className="flex justify-center mb-4">
            <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-sm border border-white/20 shadow-2xl">
              <Logo size="xl" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">
            {viewMode === 'login' && 'Welcome Back'}
            {viewMode === 'signup' && 'Create Account'}
            {viewMode === 'forgot-password' && 'Reset Password'}
          </h1>
          <p className="text-blue-100/80">
            {viewMode === 'login' && 'Sign in to access your dashboard'}
            {viewMode === 'signup' && 'Join NCPS today'}
            {viewMode === 'forgot-password' && 'Enter your email to receive instructions'}
          </p>
        </div>

        <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-md overflow-hidden rounded-2xl">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-xl text-center text-[#0B4F6C]">
              {viewMode === 'login' && 'NCPS Portal'}
              {viewMode === 'signup' && 'Sign Up'}
              {viewMode === 'forgot-password' && 'Forgot Password'}
            </CardTitle>
            <CardDescription className="text-center">
              {viewMode === 'login' && 'Enter your credentials to continue'}
              {viewMode === 'signup' && 'Fill in your details to register'}
              {viewMode === 'forgot-password' && 'We\'ll send you a reset link'}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div key={viewMode} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {viewMode === 'forgot-password' && (
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Email Address</Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#0B4F6C] transition-colors" />
                      </div>
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 border-gray-200 focus:border-[#0B4F6C] focus:ring-[#0B4F6C]/20"
                        required
                      />
                    </div>
                  </div>
                )}

                {viewMode === 'signup' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="border-gray-200 focus:border-[#0B4F6C] focus:ring-[#0B4F6C]/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          className="border-gray-200 focus:border-[#0B4F6C] focus:ring-[#0B4F6C]/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-5 w-5 text-gray-400 group-focus-within:text-[#0B4F6C] transition-colors" />
                        </div>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 border-gray-200 focus:border-[#0B4F6C] focus:ring-[#0B4F6C]/20"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400 group-focus-within:text-[#0B4F6C] transition-colors" />
                        </div>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="0912 345 6789"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="pl-10 border-gray-200 focus:border-[#0B4F6C] focus:ring-[#0B4F6C]/20"
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {(viewMode === 'login' || viewMode === 'signup') && (
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400 group-focus-within:text-[#0B4F6C] transition-colors" />
                      </div>
                      <Input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10 border-gray-200 focus:border-[#0B4F6C] focus:ring-[#0B4F6C]/20 transition-all"
                        required
                      />
                    </div>
                  </div>
                )}
                
                {(viewMode === 'login' || viewMode === 'signup') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      {viewMode === 'login' && (
                        <button 
                          type="button"
                          onClick={() => {
                            setViewMode('forgot-password');
                            resetForm();
                          }}
                          className="text-xs text-[#0B4F6C] hover:text-[#4DBDCC] font-medium transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#0B4F6C] transition-colors" />
                      </div>
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={viewMode === 'login' ? "Enter your password" : "Create a password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 border-gray-200 focus:border-[#0B4F6C] focus:ring-[#0B4F6C]/20 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#0B4F6C] transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                )}

                {viewMode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400 group-focus-within:text-[#0B4F6C] transition-colors" />
                      </div>
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10 border-gray-200 focus:border-[#0B4F6C] focus:ring-[#0B4F6C]/20 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#0B4F6C] transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-[#0B4F6C] hover:bg-[#094057] text-white transition-all duration-300 h-11 text-base font-medium shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {viewMode === 'login' && <>Sign In <ArrowRight className="w-4 h-4" /></>}
                      {viewMode === 'signup' && <>Create Account <UserPlus className="w-4 h-4" /></>}
                      {viewMode === 'forgot-password' && <>Send Reset Link <KeyRound className="w-4 h-4" /></>}
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                {viewMode === 'login' && (
                  <>
                    <span className="text-gray-500">Don't have an account? </span>
                    <button 
                      onClick={() => {
                        setViewMode('signup');
                        resetForm();
                      }}
                      className="font-bold text-[#0B4F6C] hover:text-[#4DBDCC] transition-colors hover:underline"
                    >
                      Sign up
                    </button>
                  </>
                )}
                {viewMode === 'signup' && (
                  <>
                    <span className="text-gray-500">Already have an account? </span>
                    <button 
                      onClick={() => {
                        setViewMode('login');
                        resetForm();
                      }}
                      className="font-bold text-[#0B4F6C] hover:text-[#4DBDCC] transition-colors hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
                {viewMode === 'forgot-password' && (
                  <button 
                    onClick={() => {
                      setViewMode('login');
                      resetForm();
                    }}
                    className="flex items-center justify-center gap-2 mx-auto font-bold text-[#0B4F6C] hover:text-[#4DBDCC] transition-colors hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="mt-8 text-center text-xs text-blue-200/60">
          &copy; 2025 Nasugbu Computer Parts and Services. All rights reserved.
        </div>
      </div>
    </div>
  );
}
