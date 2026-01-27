import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pill, LogOut, Calendar, CalendarDays, BarChart3, FileText, Share2, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Today', icon: Calendar },
  { href: '/calendar', label: 'Week', icon: CalendarDays },
  { href: '/history', label: 'History', icon: BarChart3 },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/sharing', label: 'Sharing', icon: Share2 },
];

export function DashboardHeader() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const location = useLocation();

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0];
  const initials = displayName?.slice(0, 2).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-border/30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl gradient-button flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
              <Pill className="w-5 h-5 text-white" />
            </div>
            {/* Animated glow */}
            <div className="absolute inset-0 rounded-2xl gradient-button opacity-50 blur-lg group-hover:opacity-70 transition-opacity duration-300" />
          </div>
          <div className="hidden sm:block">
            <span className="text-xl font-display font-bold text-foreground">
              Medi<span className="text-gradient">Track</span>
            </span>
            <div className="h-0.5 w-0 group-hover:w-full bg-gradient-to-r from-primary to-accent transition-all duration-300" />
          </div>
        </Link>

        {/* Navigation Pills */}
        <nav className="flex items-center">
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-muted/50 backdrop-blur-sm">
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link key={item.href} to={item.href}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'gap-2 rounded-xl transition-all duration-300',
                      isActive 
                        ? 'bg-card shadow-md text-foreground font-semibold' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
                    )}
                  >
                    <item.icon className={cn("w-4 h-4", isActive && "text-primary")} />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="gap-2 rounded-2xl hover:bg-muted/60 transition-colors group"
            >
              <Avatar className="w-9 h-9 rounded-xl ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                <AvatarImage 
                  src={profile?.avatar_url || undefined} 
                  alt={displayName || 'User avatar'} 
                  className="object-cover"
                />
                <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary text-sm font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm font-medium max-w-24 truncate">
                {displayName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
            <div className="px-3 py-2 mb-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Signed in as</p>
              <p className="text-sm font-medium truncate">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="rounded-xl cursor-pointer">
              <Link to="/settings" className="flex items-center">
                <Settings className="w-4 h-4 mr-2" />
                Profile Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={signOut} 
              className="text-destructive focus:text-destructive rounded-xl cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
