'use client';

import { useEffect, useState } from 'react';
import { Activity, Clock, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NavBar } from '@/components/ui/NavBar';
import { IOSButton } from '@/components/ui/IOSButton';
import { cn, formatDateTime } from '@/lib/utils';

interface QueueStats {
  pending: number;
  processing: number;
  sent24h: number;
  failed: number;
  skipped24h: number;
}

interface FailedItem {
  id: string;
  title: string;
  receiver_id: string;
  push_attempts: number;
  push_error: string | null;
  created_at: string;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export default function AdminQueuePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<QueueStats>({
    pending: 0,
    processing: 0,
    sent24h: 0,
    failed: 0,
    skipped24h: 0,
  });
  const [failed, setFailed] = useState<FailedItem[]>([]);
  const [triggering, setTriggering] = useState(false);

  const loadStats = async () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
    const [pendingRes, processingRes, sentRes, failedRes, skippedRes, failedListRes] =
      await Promise.all([
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('push_status', 'pending'),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('push_status', 'processing'),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('push_status', 'sent')
          .gte('push_sent_at', yesterday),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('push_status', 'failed'),
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('push_status', 'skipped')
          .gte('push_sent_at', yesterday),
        supabase
          .from('notifications')
          .select('id, title, receiver_id, push_attempts, push_error, created_at')
          .eq('push_status', 'failed')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

    setStats({
      pending: pendingRes.count ?? 0,
      processing: processingRes.count ?? 0,
      sent24h: sentRes.count ?? 0,
      failed: failedRes.count ?? 0,
      skipped24h: skippedRes.count ?? 0,
    });
    setFailed((failedListRes.data as FailedItem[]) ?? []);
  };

  useEffect(() => {
    if (!user) return;
    loadStats();
    const ch = supabase
      .channel('queue_monitor')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => loadStats()
      )
      .subscribe();
    return () => {
      ch.unsubscribe();
    };
  }, [user]);

  const triggerWorker = async () => {
    setTriggering(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/process-push-queue`, {
        method: 'POST',
      });
      const data = await res.json();
      toast.success(`Worker exécuté : ${data.sent ?? 0} envoyés, ${data.failed ?? 0} échecs`);
      await loadStats();
    } catch (e: any) {
      toast.error('Erreur : ' + e.message);
    } finally {
      setTriggering(false);
    }
  };

  const retryFailed = async () => {
    const ids = failed.map((f) => f.id);
    if (ids.length === 0) return;
    const { error } = await supabase
      .from('notifications')
      .update({ push_status: 'pending', push_attempts: 0, push_error: null })
      .in('id', ids);
    if (error) toast.error(error.message);
    else {
      toast.success(`${ids.length} notifs remises en file`);
      await loadStats();
    }
  };

  return (
    <div>
      <NavBar
        title="File de notifications"
        back
        trailing={
          <button
            onClick={triggerWorker}
            disabled={triggering}
            className="px-3 py-1.5 -mr-2 text-brand-600 active:opacity-60"
            aria-label="Déclencher le worker"
          >
            <RefreshCw className={cn('h-5 w-5', triggering && 'animate-spin')} />
          </button>
        }
      />

      <div className="px-4 pt-2 pb-8">
        {/* KPIs principaux */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="En attente"
            value={stats.pending + stats.processing}
            sub={stats.processing > 0 ? `${stats.processing} en cours` : 'à envoyer'}
            color="bg-orange-50 text-ios-orange"
            highlight={stats.pending + stats.processing > 0}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Envoyées (24h)"
            value={stats.sent24h}
            sub="dernières 24 heures"
            color="bg-green-50 text-ios-green"
          />
          <StatCard
            icon={<XCircle className="h-4 w-4" />}
            label="Échouées"
            value={stats.failed}
            sub="à investiguer"
            color="bg-red-50 text-ios-red"
            highlight={stats.failed > 0}
          />
          <StatCard
            icon={<AlertCircle className="h-4 w-4" />}
            label="Sautées (24h)"
            value={stats.skipped24h}
            sub="aucun appareil"
            color="bg-gray-100 text-ios-gray"
          />
        </div>

        {/* Trigger manuel */}
        <div className="mt-5">
          <IOSButton
            fullWidth
            variant="secondary"
            onClick={triggerWorker}
            isLoading={triggering}
            leftIcon={<Activity className="h-4 w-4" />}
          >
            Déclencher le worker manuellement
          </IOSButton>
          <p className="mt-2 text-[12px] text-ios-gray text-center">
            Le worker tourne automatiquement toutes les minutes.
          </p>
        </div>

        {/* Liste échecs */}
        {failed.length > 0 && (
          <>
            <div className="mt-6 flex items-center justify-between px-1">
              <p className="text-[13px] font-semibold uppercase tracking-wider text-ios-gray">
                10 derniers échecs
              </p>
              <button
                onClick={retryFailed}
                className="text-[13px] font-semibold text-brand-600 active:opacity-60"
              >
                Tout retenter
              </button>
            </div>
            <div className="mt-2 bg-white rounded-ios-lg overflow-hidden shadow-ios-sm">
              {failed.map((f, i) => (
                <div
                  key={f.id}
                  className={cn(
                    'px-4 py-3',
                    i < failed.length - 1 && 'border-b border-ios-separator/10'
                  )}
                >
                  <div className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-ios-red flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium truncate">{f.title}</p>
                      <p className="text-[12px] text-ios-gray">
                        Tentatives : {f.push_attempts} · {formatDateTime(f.created_at)}
                      </p>
                      {f.push_error && (
                        <p className="text-[11px] text-ios-red mt-1 line-clamp-2">
                          {f.push_error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Vue d'ensemble */}
        <div className="mt-6 bg-brand-50 rounded-ios-lg p-4">
          <p className="text-[13px] font-semibold text-brand-600 mb-2">Comment ça marche ?</p>
          <p className="text-[12px] text-ios-label-light leading-relaxed">
            Quand une notification est créée, elle entre dans la file en attente. Un worker
            cron récupère les notifs toutes les minutes et envoie les push FCM en lot. Si
            l'envoi échoue, l'app retente jusqu'à 3 fois automatiquement.
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-ios-lg bg-white p-3 shadow-ios-sm',
        highlight && 'ring-2 ring-brand-500/20'
      )}
    >
      <div className={cn('inline-flex h-7 w-7 items-center justify-center rounded-ios', color)}>
        {icon}
      </div>
      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-ios-gray">
        {label}
      </p>
      <p className="text-[24px] font-bold tracking-sf-tighter">{value}</p>
      <p className="text-[10px] text-ios-gray truncate">{sub}</p>
    </div>
  );
}
