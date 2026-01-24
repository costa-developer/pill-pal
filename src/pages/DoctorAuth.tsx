import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { z } from 'zod';
import { Stethoscope, Mail, Lock, Loader2, ArrowLeft, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Please enter your full name').optional(),
});

export default function DoctorAuth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validationData = mode === 'signup' 
        ? { email, password, fullName } 
        : { email, password };
      
      authSchema.parse(validationData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === 'signup') {
        const redirectUrl = `${window.location.origin}/doctor`;
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
              role: 'doctor',
            },
          },
        });

        if (error) throw error;

        // Add doctor role
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('user_roles').insert({
            user_id: user.id,
            role: 'doctor',
          });
        }

        toast.success('Account created! Please check your email to verify.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // Check if user has doctor role
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'doctor')
            .single();

          if (!roleData) {
            await supabase.auth.signOut();
            toast.error('This account is not registered as a doctor');
            return;
          }
        }

        toast.success('Welcome back, Doctor!');
        navigate('/doctor');
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        {/* Card */}
        <div className="med-card">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl gradient-button mx-auto flex items-center justify-center mb-4">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {mode === 'login' ? 'Doctor Portal' : 'Register as Doctor'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {mode === 'login' 
                ? 'Access patient reports with secure keys'
                : 'Create your doctor account to view patient reports'
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <Input
                    id="fullName"
                    placeholder="Dr. Jane Smith"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="med-input pl-10"
                  />
                  <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-destructive">{errors.fullName}</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="med-input pl-10"
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="med-input pl-10"
                />
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="hero"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'login' ? (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign In
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </>
              )}
            </Button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-muted-foreground">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
            </p>
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
              className="text-primary hover:underline font-medium mt-1"
            >
              {mode === 'login' ? 'Register as Doctor' : 'Sign In'}
            </button>
          </div>
        </div>

        {/* Patient Link */}
        <p className="text-center text-muted-foreground mt-6">
          Are you a patient?{' '}
          <Link to="/auth" className="text-primary hover:underline">
            Patient Login
          </Link>
        </p>
      </div>
    </div>
  );
}
