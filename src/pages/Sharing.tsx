import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, Shield, FileText, Clock, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useAccessKeys } from '@/hooks/useAccessKeys';
import { DashboardHeader } from '@/components/DashboardHeader';
import { AccessKeyCard, GenerateKeyDialog } from '@/components/AccessKeyCard';
import { StatsCard } from '@/components/StatsCard';

export default function Sharing() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { keys, logs, loading: keysLoading, generateKey, revokeKey, deleteKey } = useAccessKeys();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || keysLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  const activeKeys = keys.filter(k => k.status === 'active').length;
  const totalAccesses = logs.length;
  const lastAccess = logs[0]?.accessed_at;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Report Sharing
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage secure access keys to share your medication reports with healthcare providers.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <StatsCard
            title="Active Keys"
            value={activeKeys}
            icon={Key}
            subtitle={`${keys.length} total keys`}
          />
          <StatsCard
            title="Total Accesses"
            value={totalAccesses}
            icon={FileText}
            subtitle="Report views by doctors"
          />
          <StatsCard
            title="Last Access"
            value={lastAccess ? format(new Date(lastAccess), 'MMM d') : 'Never'}
            icon={Clock}
            subtitle={lastAccess ? format(new Date(lastAccess), 'h:mm a') : 'No accesses yet'}
          />
        </div>

        {/* Info Banner */}
        <div className="med-card bg-primary/5 border-primary/20 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-foreground mb-1">
                How Sharing Works
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Generate a secure access key and share it with your doctor</li>
                <li>• Doctors can view your medication reports in read-only mode</li>
                <li>• Revoke keys anytime to immediately cut off access</li>
                <li>• All accesses are logged so you know who viewed your data</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Generate Key Button */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-semibold text-foreground">
            Access Keys
          </h2>
          <GenerateKeyDialog onGenerate={generateKey} />
        </div>

        {/* Keys List */}
        {keys.length === 0 ? (
          <div className="med-card text-center py-16">
            <div className="w-20 h-20 rounded-2xl gradient-soft mx-auto flex items-center justify-center mb-4">
              <Key className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-display font-semibold text-foreground mb-2">
              No access keys yet
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Generate your first access key to share your medication reports with a healthcare provider.
            </p>
            <GenerateKeyDialog onGenerate={generateKey} />
          </div>
        ) : (
          <div className="space-y-4">
            {keys.map((key) => (
              <AccessKeyCard
                key={key.id}
                accessKey={key}
                onRevoke={revokeKey}
                onDelete={deleteKey}
              />
            ))}
          </div>
        )}

        {/* Access Log */}
        {logs.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-display font-semibold text-foreground mb-6">
              Recent Access Log
            </h2>
            <div className="med-card">
              <div className="divide-y divide-border">
                {logs.slice(0, 10).map((log) => (
                  <div key={log.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-foreground capitalize">{log.report_type} Report</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(log.accessed_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
