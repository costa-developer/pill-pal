import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { DashboardHeader } from '@/components/DashboardHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Camera, User, Save, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile, uploadAvatar } = useProfile();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url);
    } else if (user) {
      // Fallback to user metadata if profile not loaded yet
      setFullName(user.user_metadata?.full_name || '');
    }
  }, [profile, user]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const publicUrl = await uploadAvatar(file);
      setAvatarUrl(publicUrl);
      await updateProfile({ avatar_url: publicUrl });
      toast.success('Avatar updated! ✨');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName });
      toast.success('Profile saved! 🎉');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background gradient-mesh">
        <div className="relative">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <div className="absolute inset-0 animate-ping">
            <Loader2 className="w-10 h-10 text-primary/30" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = fullName
    ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="fixed inset-0 gradient-mesh pointer-events-none" />
      <div className="floating-pill-1" />
      <div className="floating-pill-2" />

      <DashboardHeader />

      <main className="container mx-auto px-4 py-8 relative z-10 max-w-2xl">
        {/* Page Header */}
        <div className="mb-10 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            Profile Settings
          </div>
          <h1 className="text-4xl font-display font-bold text-foreground">
            Your <span className="text-gradient">Profile</span>
          </h1>
          <p className="text-muted-foreground mt-2">
            Customize your account information and preferences
          </p>
        </div>

        {/* Profile Card */}
        <Card className="bento-card animate-slide-up-delay">
          <CardHeader>
            <CardTitle className="font-display">Personal Information</CardTitle>
            <CardDescription>Update your photo and personal details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-primary/20 shadow-xl">
                  <AvatarImage src={avatarUrl || undefined} alt={fullName || 'Avatar'} />
                  <AvatarFallback className="text-3xl font-display font-bold bg-gradient-to-br from-primary/20 to-accent/20 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                {/* Upload Overlay */}
                <button
                  onClick={handleAvatarClick}
                  disabled={uploading}
                  className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer"
                >
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <Camera className="w-8 h-8 text-white" />
                  )}
                </button>
                
                {/* Decorative ring */}
                <div className="absolute -inset-2 rounded-full border-2 border-dashed border-primary/30 group-hover:border-primary/60 transition-colors duration-300" />
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <p className="text-sm text-muted-foreground">
                Click to upload a new photo
              </p>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="pl-12 h-12 rounded-xl border-2 border-muted focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                <Input
                  id="email"
                  value={user.email || ''}
                  disabled
                  className="h-12 rounded-xl border-2 border-muted bg-muted/30 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 rounded-xl gradient-button text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
