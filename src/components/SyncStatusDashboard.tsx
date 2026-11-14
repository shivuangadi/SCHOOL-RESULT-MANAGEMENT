import React, { useState, useEffect } from 'react';
import {
  srmsSyncEngine,
  SyncEngineState,
  SyncState,
  SyncLogItem,
} from '../utils/srmsSyncEngine';
import {
  Cloud,
  CheckCircle,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  Wifi,
  WifiOff,
  Database,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  X,
  History,
  ShieldCheck,
} from 'lucide-react';

interface SyncStatusDashboardProps {
  variant?: 'badge' | 'card' | 'detailed';
  className?: string;
}

interface StatusConfig {
  label: string;
  kannada: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  dotColor: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
}

export const SyncStatusDashboard: React.FC<SyncStatusDashboardProps> = ({
  variant = 'badge',
  className = '',
}) => {
  const [state, setState] = useState<SyncEngineState>(srmsSyncEngine.getStatus());
  const [showModal, setShowModal] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [logs, setLogs] = useState<SyncLogItem[]>([]);

  useEffect(() => {
    const unsub = srmsSyncEngine.subscribe((newState) => {
      setState(newState);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (showModal) {
      srmsSyncEngine.getSyncLogs(30).then((l) => setLogs(l));
    }
  }, [showModal, state.lastSyncTime]);

  const handleSyncNow = async () => {
    setIsManualSyncing(true);
    try {
      await srmsSyncEngine.syncNow();
      const updatedLogs = await srmsSyncEngine.getSyncLogs(30);
      setLogs(updatedLogs);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const getStatusConfig = (syncState: SyncState): StatusConfig => {
    switch (syncState) {
      case 'ONLINE_SYNCED':
        return {
          label: 'ONLINE – SYNCED',
          kannada: 'ಕ್ಲೌಡ್ ಸಿಂಕ್ ಪೂರ್ಣಗೊಂಡಿದೆ',
          bgColor: 'bg-emerald-50',
          textColor: 'text-emerald-800',
          borderColor: 'border-emerald-300',
          dotColor: 'bg-emerald-500',
          icon: CheckCircle,
          iconColor: 'text-emerald-600',
        };
      case 'OFFLINE_LOCAL':
        return {
          label: 'OFFLINE – LOCAL SAVING',
          kannada: 'ಆಫ್‌ಲೈನ್‌ ಉಳಿತಾಯ',
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-800',
          borderColor: 'border-amber-300',
          dotColor: 'bg-amber-500',
          icon: CloudOff,
          iconColor: 'text-amber-600',
        };
      case 'SYNCING':
        return {
          label: 'SYNCING – UPLOADING DATA',
          kannada: 'ಮಾಹಿತಿ ಸಿಂಕ್ ಆಗುತ್ತಿದೆ',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-300',
          dotColor: 'bg-blue-500 animate-ping',
          icon: RefreshCw,
          iconColor: 'text-blue-600 animate-spin',
        };
      case 'PENDING_SYNC':
        return {
          label: 'PENDING SYNC',
          kannada: `${state.pendingCount} ಬದಲಾವಣೆ ಬಾಕಿ ಇದೆ`,
          bgColor: 'bg-amber-50',
          textColor: 'text-amber-900',
          borderColor: 'border-amber-300',
          dotColor: 'bg-amber-500',
          icon: Clock,
          iconColor: 'text-amber-600',
        };
      case 'SYNC_ERROR':
      default:
        return {
          label: 'SYNC ERROR',
          kannada: 'ಸಿಂಕ್ ದೋಷ ಉಂಟಾಗಿದೆ',
          bgColor: 'bg-rose-50',
          textColor: 'text-rose-800',
          borderColor: 'border-rose-300',
          dotColor: 'bg-rose-500',
          icon: AlertTriangle,
          iconColor: 'text-rose-600',
        };
    }
  };

  const config = getStatusConfig(state.syncState);
  const StatusIcon = config.icon;

  const formatTime = (isoOrTime: string | null) => {
    if (!isoOrTime) return 'ಇನ್ನೂ ಸಿಂಕ್ ಆಗಿಲ್ಲ (Never)';
    try {
      const d = new Date(isoOrTime);
      if (isNaN(d.getTime())) return isoOrTime;
      return d.toLocaleTimeString('kn-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
        ' (' + d.toLocaleDateString('en-GB') + ')';
    } catch {
      return isoOrTime;
    }
  };

  // 1. Header Badge Variant
  if (variant === 'badge') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          title={`ಕ್ಲೌಡ್ ಸಿಂಕ್ ಸ್ಥಿತಿ: ${config.label} (${config.kannada})`}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold ${config.bgColor} ${config.textColor} border ${config.borderColor} shadow-xs hover:shadow transition-all cursor-pointer ${className}`}
        >
          <span className={`w-2 h-2 rounded-full ${config.dotColor}`} />
          <StatusIcon className={`w-3.5 h-3.5 ${config.iconColor}`} />
          <div className="flex flex-col text-left leading-none">
            <span className="font-bold text-[10px] hidden sm:inline">{config.label}</span>
            <span className="text-[9px] opacity-90">{config.kannada}</span>
          </div>
        </button>
        {showModal && (
          <SyncDetailsModal
            state={state}
            config={config}
            logs={logs}
            onClose={() => setShowModal(false)}
            onSyncNow={handleSyncNow}
            isManualSyncing={isManualSyncing}
            formatTime={formatTime}
          />
        )}
      </>
    );
  }

  // 2. Card Variant (for Dashboard)
  return (
    <>
      <div className={`rounded-2xl border ${config.borderColor} ${config.bgColor} p-5 shadow-xs transition-all hover:shadow-md ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`p-3 rounded-xl bg-white shadow-xs border ${config.borderColor} shrink-0`}>
              <StatusIcon className={`w-6 h-6 ${config.iconColor}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${config.dotColor}`} />
                <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                  {config.label}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/70 border border-slate-200">
                  {state.isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1">
                {config.kannada}
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                ಕಳೆದ ಬಾರಿ ಸಿಂಕ್: <strong>{formatTime(state.lastSyncTime)}</strong>
                {state.pendingCount > 0 && (
                  <span className="ml-2 text-amber-700 font-bold">
                    ({state.pendingCount} ಬದಲಾವಣೆಗಳು ಕ್ಲೌಡ್‌ಗೆ ಹೋಗಲು ಬಾಕಿ ಇವೆ)
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSyncNow}
              disabled={isManualSyncing || state.syncState === 'SYNCING'}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isManualSyncing ? 'animate-spin' : ''}`} />
              <span>SYNC NOW – ಈಗಲೇ ಸಿಂಕ್ ಮಾಡಿ</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-white/80 border border-slate-300 transition-colors cursor-pointer"
              title="ಸಿಂಕ್ ವಿವರಗಳನ್ನು ವೀಕ್ಷಿಸಿ"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <SyncDetailsModal
          state={state}
          config={config}
          logs={logs}
          onClose={() => setShowModal(false)}
          onSyncNow={handleSyncNow}
          isManualSyncing={isManualSyncing}
          formatTime={formatTime}
        />
      )}
    </>
  );
};

// -------------------------------------------------------------------------------------
// Sync Details Modal
// -------------------------------------------------------------------------------------
interface SyncDetailsModalProps {
  state: SyncEngineState;
  config: StatusConfig;
  logs: SyncLogItem[];
  onClose: () => void;
  onSyncNow: () => Promise<void>;
  isManualSyncing: boolean;
  formatTime: (ts: string | null) => string;
}

const SyncDetailsModal: React.FC<SyncDetailsModalProps> = ({
  state,
  config,
  logs,
  onClose,
  onSyncNow,
  isManualSyncing,
  formatTime,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
              <Cloud className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                SRMS ಕ್ಲೌಡ್ ಸಿಂಕ್ ಕೇಂದ್ರ (Cloud Sync Hub)
              </h3>
              <p className="text-xs text-blue-200">
                Firebase Firestore • IndexedDB Offline Storage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm">
          {/* Current Status Banner */}
          <div className={`p-4 rounded-xl border ${config.borderColor} ${config.bgColor} flex items-center justify-between gap-3`}>
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${config.dotColor}`} />
              <div>
                <span className="font-black text-xs uppercase tracking-wider block">
                  {config.label}
                </span>
                <span className="font-semibold text-sm text-slate-800">
                  {config.kannada}
                </span>
              </div>
            </div>
            <button
              onClick={onSyncNow}
              disabled={isManualSyncing || state.syncState === 'SYNCING'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isManualSyncing ? 'animate-spin' : ''}`} />
              <span>ಸಿಂಕ್ ಮಾಡಿ</span>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1 text-slate-500 text-[11px] font-bold">
                {state.isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-600" /> : <WifiOff className="w-3.5 h-3.5 text-rose-600" />}
                <span>ಇಂಟರ್ನೆಟ್</span>
              </div>
              <div className="text-xs font-extrabold mt-1 text-slate-800">
                {state.isOnline ? 'ಸಂಪರ್ಕವಿದೆ (Online)' : 'ಆಫ್‌ಲೈನ್ (Offline)'}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1 text-slate-500 text-[11px] font-bold">
                <Database className="w-3.5 h-3.5 text-blue-600" />
                <span>ಬಾಕಿ ಸಿಂಕ್</span>
              </div>
              <div className={`text-sm font-extrabold mt-1 ${state.pendingCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>
                {state.pendingCount} ಬದಲಾವಣೆ
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1 text-slate-500 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>ಯಶಸ್ವಿ ಸಿಂಕ್</span>
              </div>
              <div className="text-sm font-extrabold mt-1 text-emerald-700">
                {state.syncedCount}
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div className="flex items-center justify-center gap-1 text-slate-500 text-[11px] font-bold">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>ದೋಷಗಳು</span>
              </div>
              <div className="text-sm font-extrabold mt-1 text-rose-700">
                {state.failedCount}
              </div>
            </div>
          </div>

          {/* Sync Metadata */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span>ಕಳೆದ ಯಶಸ್ವಿ ಕ್ಲೌಡ್ ಸಿಂಕ್ ಸಮಯ:</span>
              <strong className="text-slate-900">{formatTime(state.lastSyncTime)}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>ಸ್ಥಳೀಯ ಸಂಗ್ರಹಣೆ ವ್ಯವಸ್ಥೆ (Storage Engine):</span>
              <span className="font-bold text-slate-900">IndexedDB + Firestore</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>ಮಾಹಿತಿ ಸುರಕ್ಷತೆ (Data Source of Truth):</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Firebase Cloud Firestore
              </span>
            </div>
          </div>

          {/* Sync History / Recent Logs */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center gap-2 font-bold text-slate-700 text-xs">
              <History className="w-3.5 h-3.5" />
              <span>ಇತ್ತೀಚಿನ ಸಿಂಕ್ ಇತಿಹಾಸ (Recent Sync Activities)</span>
            </div>
            <div className="p-3 max-h-48 overflow-y-auto space-y-2">
              {logs.length === 0 ? (
                <p className="text-center text-slate-400 py-3 text-xs">ಯಾವುದೇ ಸಿಂಕ್ ದಾಖಲೆಗಳಿಲ್ಲ</p>
              ) : (
                logs.slice(0, 15).map((log: SyncLogItem) => (
                  <div
                    key={log.id || log.opId || `${log.timestamp}_${log.recordId}`}
                    className="flex items-start justify-between gap-2 text-[11px] p-2 rounded bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-start gap-2">
                      {log.status === 'SUCCESS' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />}
                      {log.status === 'ERROR' && <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />}
                      {log.status === 'SKIPPED' && <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />}
                      <div>
                        <span className="font-bold text-slate-800">{log.type}: {log.message}</span>
                        <div className="text-[10px] text-slate-500 mt-0.5">ID: {log.recordId} ({log.diseCode})</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            SRMS Offline-First Architecture v3.0
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 text-white hover:bg-slate-900 transition-colors cursor-pointer"
          >
            ಮುಚ್ಚಿ (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
