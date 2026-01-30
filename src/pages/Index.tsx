import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Pill, 
  Heart, 
  Shield, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  Bell, 
  BarChart3, 
  Stethoscope,
  FileText,
  Share2,
  Calendar,
  Activity,
  Users,
  Lock
} from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  const features = [
    {
      icon: Pill,
      title: 'Medication Tracking',
      description: 'Log your daily medications with a single tap. Track multiple prescriptions, dosages, and schedules in one place.',
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Bell,
      title: 'Smart Reminders',
      description: 'Never miss a dose with customizable reminders. Set alerts for morning, afternoon, and evening medications.',
      color: 'bg-success/10 text-success',
    },
    {
      icon: BarChart3,
      title: 'AI Health Reports',
      description: 'Get intelligent weekly and monthly reports analyzing your medication adherence patterns and health trends.',
      color: 'bg-med-medium/20 text-med-dark',
    },
    {
      icon: Share2,
      title: 'Secure Doctor Sharing',
      description: 'Share your medication history securely with healthcare providers using encrypted access keys.',
      color: 'bg-coral/20 text-coral',
    },
    {
      icon: Calendar,
      title: 'Visual Calendar',
      description: 'View your medication schedule in an intuitive calendar format. See past, present, and upcoming doses at a glance.',
      color: 'bg-lavender/20 text-lavender',
    },
    {
      icon: FileText,
      title: 'PDF Export',
      description: 'Export detailed medication reports as PDFs to bring to appointments or keep for your records.',
      color: 'bg-mint/20 text-mint',
    },
  ];

  const stats = [
    { value: '99.9%', label: 'Uptime Reliability' },
    { value: '256-bit', label: 'Encryption' },
    { value: '24/7', label: 'Access' },
    { value: 'HIPAA', label: 'Compliant' },
  ];

  const steps = [
    {
      step: '01',
      title: 'Add Your Medications',
      description: 'Enter your prescriptions with dosage, frequency, and schedule. Import from pharmacy or add manually.',
    },
    {
      step: '02',
      title: 'Track Daily Intake',
      description: 'Mark medications as taken with one tap. Log notes about side effects or missed doses.',
    },
    {
      step: '03',
      title: 'Get AI Insights',
      description: 'Receive personalized health reports analyzing your adherence patterns and suggesting improvements.',
    },
    {
      step: '04',
      title: 'Share With Your Doctor',
      description: 'Generate secure access keys to share your medication history with healthcare providers.',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Pill className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold text-foreground">MedTrack</span>
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
              <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Medical-themed background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-success/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-med-very-pale/30 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/20 mb-8">
              <Shield className="w-4 h-4 text-success" />
              <span className="text-sm font-medium text-success">
                HIPAA Compliant & Secure
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight mb-6">
              Your Personal
              <br />
              <span className="text-primary">
                Medication Manager
              </span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Track your medications, generate AI-powered health reports, and securely share your medical history with healthcare providers — all in one intuitive app.
            </p>

            {/* Key benefits */}
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {[
                { icon: CheckCircle2, text: 'Track medications daily' },
                { icon: Activity, text: 'AI-powered insights' },
                { icon: Lock, text: 'Secure doctor sharing' },
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2 text-muted-foreground">
                  <benefit.icon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth">
                <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-lg px-8 h-14">
                  Start Free Today
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
              <Link to="/doctor/auth">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg px-8 h-14">
                  <Stethoscope className="w-5 h-5 mr-2" />
                  I'm a Healthcare Provider
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="py-12 px-4 border-y border-border bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-display font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is MedTrack */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              What is MedTrack?
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              MedTrack is a comprehensive medication management platform designed to help patients track their prescriptions, monitor adherence, and communicate effectively with healthcare providers. Whether you're managing chronic conditions or temporary treatments, MedTrack keeps you organized and on track.
            </p>
          </div>

          {/* App preview card */}
          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden border-2 border-border bg-card">
              <CardContent className="p-8">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center p-6 rounded-2xl bg-primary/5">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Pill className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground mb-2">For Patients</h3>
                    <p className="text-sm text-muted-foreground">Track medications, set reminders, and monitor your health journey</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-success/5">
                    <div className="w-16 h-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                      <Stethoscope className="w-8 h-8 text-success" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground mb-2">For Doctors</h3>
                    <p className="text-sm text-muted-foreground">Access patient medication history securely through the Doctor Portal</p>
                  </div>
                  <div className="text-center p-6 rounded-2xl bg-med-pale/30">
                    <div className="w-16 h-16 rounded-2xl bg-med-light/30 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-med-dark" />
                    </div>
                    <h3 className="font-display font-semibold text-foreground mb-2">For Caregivers</h3>
                    <p className="text-sm text-muted-foreground">Help loved ones stay on track with their medication routines</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              Everything You Need
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to simplify medication management and improve health outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <Card 
                key={i} 
                className="border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our simple four-step process.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {steps.map((step, i) => (
              <div key={i} className="relative">
                <div className="text-6xl font-display font-bold text-primary/10 mb-4">
                  {step.step}
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 right-0 translate-x-1/2">
                    <ChevronRight className="w-6 h-6 text-primary/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Doctor Portal Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  <Stethoscope className="w-4 h-4" />
                  Healthcare Providers
                </div>
                <h2 className="text-3xl font-display font-bold text-foreground mb-4">
                  Dedicated Doctor Portal
                </h2>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Access your patients' medication history through our secure Doctor Portal. Patients share encrypted access keys, giving you read-only access to their medication logs, adherence reports, and health trends.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    'View patient medication history',
                    'Access AI-generated health reports',
                    'Track adherence patterns over time',
                    'Secure, encrypted data transfer',
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/doctor/auth">
                  <Button className="bg-primary hover:bg-primary/90">
                    Access Doctor Portal
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <div className="relative">
                <Card className="border-2 border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Stethoscope className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">Doctor Portal</div>
                        <div className="text-sm text-muted-foreground">Secure patient access</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="h-3 bg-muted rounded-full w-full" />
                      <div className="h-3 bg-muted rounded-full w-4/5" />
                      <div className="h-3 bg-muted rounded-full w-3/5" />
                      <div className="mt-6 p-4 rounded-xl bg-success/10 border border-success/20">
                        <div className="flex items-center gap-2 text-success text-sm font-medium">
                          <Shield className="w-4 h-4" />
                          End-to-end encrypted
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="max-w-4xl mx-auto bg-primary text-primary-foreground overflow-hidden">
            <CardContent className="p-8 sm:p-12 text-center relative">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-2xl" />
                <div className="absolute bottom-10 right-10 w-48 h-48 bg-white rounded-full blur-3xl" />
              </div>

              <div className="relative z-10">
                <Heart className="w-12 h-12 mx-auto mb-6 opacity-80" />
                <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
                  Take Control of Your Health Today
                </h2>
                <p className="text-xl opacity-90 mb-8 max-w-xl mx-auto">
                  Join thousands of users who trust MedTrack to manage their medications and improve their health outcomes.
                </p>
                <Link to="/auth">
                  <Button size="lg" variant="secondary" className="text-lg px-8 h-14 bg-white text-primary hover:bg-white/90">
                    Get Started for Free
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-muted/30">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Pill className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <span className="font-display font-bold text-foreground">MedTrack</span>
                <p className="text-xs text-muted-foreground">Your health, simplified.</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                HIPAA Compliant
              </span>
              <span className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                256-bit Encryption
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} MedTrack. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
