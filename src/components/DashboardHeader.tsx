import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Pill, LogOut, User, Calendar, BarChart3, FileText } from 'lucide-react';
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
  { href: '/history', label: 'History', icon: BarChart3 },
  { href: '/reports', label: 'Reports', icon: FileText },
];

export function DashboardHeader() {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center">
            <Pill className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-display font-bold text-foreground hidden sm:block">
            MediTrack
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} to={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  'gap-2',
                  location.pathname === item.href && 'bg-secondary text-primary'
                )}
              >
                <item.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            </Link>
          ))}
        </nav>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <span className="hidden sm:inline text-sm font-medium">
                {user?.email?.split('@')[0]}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="text-muted-foreground text-sm">
              {user?.email}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
