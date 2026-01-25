import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Pill, Heart, Shield, Clock, ChevronRight, CheckCircle2, Bell, BarChart3, Stethoscope } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
              <Pill className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">MediTrack</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/doctor/auth">
              <Button variant="ghost" className="gap-2">
                <Stethoscope className="w-4 h-4" />
                <span className="hidden sm:inline">Doctor Portal</span>
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth">
              <Button variant="hero">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-med-pale rounded-full blur-3xl opacity-50 animate-float" />
          <div className="absolute top-60 -left-20 w-72 h-72 bg-med-light rounded-full blur-3xl opacity-30 animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-med-very-pale rounded-full blur-3xl opacity-40 animate-float" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary mb-6 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm font-medium text-secondary-foreground">
                Trusted by thousands of users
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6 animate-slide-up">
              Never miss a dose.
              <br />
              <span className="gradient-hero bg-clip-text text-transparent">
                Stay healthy, stay on track.
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.1s' }}>
              The smart medication tracker that helps you maintain your health routine with gentle reminders, insightful reports, and seamless tracking.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <Link to="/auth">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  Start Tracking Free
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button variant="outline" size="xl" className="w-full sm:w-auto">
                See How It Works
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 gradient-soft">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Everything you need to stay on track
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to make medication management effortless and stress-free.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: CheckCircle2,
                title: 'Easy Tracking',
                description: 'Mark medications as taken with a single tap. Track multiple medications at different times.',
              },
              {
                icon: Bell,
                title: 'Smart Reminders',
                description: 'Get timely notifications so you never miss a dose. Customize reminder times to fit your schedule.',
              },
              {
                icon: BarChart3,
                title: 'Insightful Reports',
                description: 'View your adherence history and trends. Generate reports to share with your healthcare provider.',
              },
              {
                icon: Shield,
                title: 'Secure & Private',
                description: 'Your health data is encrypted and protected. We never share your information with third parties.',
              },
              {
                icon: Heart,
                title: 'Health Insights',
                description: 'Get AI-powered insights about your medication habits and tips to improve adherence.',
              },
              {
                icon: Clock,
                title: 'Flexible Scheduling',
                description: 'Set up complex schedules for medications taken at different times or on specific days.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="med-card group"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-2xl gradient-button flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-display font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="gradient-hero rounded-3xl p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-2xl" />
              <div className="absolute bottom-10 right-10 w-48 h-48 bg-white rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-4">
                Ready to take control of your health?
              </h2>
              <p className="text-xl text-white/80 mb-8 max-w-xl mx-auto">
                Join thousands of users who trust MediTrack to manage their medications effectively.
              </p>
              <Link to="/auth">
                <Button variant="glass" size="xl">
                  Get Started for Free
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <Pill className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-semibold text-foreground">MediTrack</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} MediTrack. Your health, simplified.
          </p>
        </div>
      </footer>
    </div>
  );
}
