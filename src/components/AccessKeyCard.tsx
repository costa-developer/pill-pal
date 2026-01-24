import { useState } from 'react';
import { Key, Plus, Copy, Trash2, Shield, Clock, Eye, X } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AccessKey {
  id: string;
  key_preview: string;
  label: string | null;
  status: 'active' | 'revoked';
  created_at: string;
  last_used_at: string | null;
  use_count: number;
}

interface AccessKeyCardProps {
  accessKey: AccessKey;
  onRevoke: (id: string) => void;
  onDelete: (id: string) => void;
}

export function AccessKeyCard({ accessKey, onRevoke, onDelete }: AccessKeyCardProps) {
  const isActive = accessKey.status === 'active';

  return (
    <div className={cn(
      "med-card relative transition-all duration-300",
      !isActive && "opacity-60"
    )}>
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl",
        isActive ? "bg-green-500" : "bg-muted"
      )} />

      <div className="flex items-start justify-between pl-4">
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center",
            isActive ? "bg-green-100 dark:bg-green-900/30" : "bg-muted"
          )}>
            <Key className={cn("w-6 h-6", isActive ? "text-green-600" : "text-muted-foreground")} />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-lg text-foreground">
                {accessKey.label || 'Unnamed Key'}
              </h3>
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? 'Active' : 'Revoked'}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono">
              ••••••••••••••••••••••••••••{accessKey.key_preview}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Created {format(new Date(accessKey.created_at), 'MMM d, yyyy')}
              </span>
              {accessKey.last_used_at && (
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Last used {format(new Date(accessKey.last_used_at), 'MMM d, yyyy')}
                </span>
              )}
              <span>Used {accessKey.use_count} times</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isActive && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <X className="w-4 h-4 mr-1" />
                  Revoke
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Revoke Access Key</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will immediately cut off access for anyone using this key.
                    They will no longer be able to view your reports.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onRevoke(accessKey.id)}>
                    Revoke Key
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Access Key</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this access key. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDelete(accessKey.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}

interface GenerateKeyDialogProps {
  onGenerate: (label?: string) => Promise<string | null>;
}

export function GenerateKeyDialog({ onGenerate }: GenerateKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const key = await onGenerate(label || undefined);
      if (key) {
        setGeneratedKey(key);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (generatedKey) {
      await navigator.clipboard.writeText(generatedKey);
      toast.success('Key copied to clipboard!');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setLabel('');
    setGeneratedKey(null);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else setOpen(true);
    }}>
      <DialogTrigger asChild>
        <Button variant="hero">
          <Plus className="w-5 h-5" />
          Generate Access Key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-button flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            Generate Access Key
          </DialogTitle>
          <DialogDescription>
            Create a secure key to share your medication reports with a healthcare provider.
          </DialogDescription>
        </DialogHeader>

        {!generatedKey ? (
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label (Optional)</Label>
              <Input
                id="label"
                placeholder="e.g., Dr. Smith, Family Doctor"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="med-input"
              />
              <p className="text-xs text-muted-foreground">
                Add a label to remember who you shared this key with.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button variant="hero" className="flex-1" onClick={handleGenerate} disabled={loading}>
                {loading ? 'Generating...' : 'Generate Key'}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ Save this key now! It won't be shown again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-background rounded-lg text-sm font-mono break-all">
                  {generatedKey}
                </code>
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Share this key securely with your healthcare provider. They will use it to access your medication reports.
            </p>

            <Button variant="hero" className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
