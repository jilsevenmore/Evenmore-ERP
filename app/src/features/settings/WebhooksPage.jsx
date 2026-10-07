import React, { useState, useEffect } from 'react';
import {
  Webhook,
  Send,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  X,
  Radio,
  Bell,
  Mail,
  MessageSquare,
  Smartphone,
  ShieldAlert,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import {
  fetchWebhooks,
  createWebhook,
  deleteWebhook,
  testPingWebhook,
  sendOmnichannelNotification,
} from '../../services/upgradeService';

const AVAILABLE_EVENTS = [
  { id: 'lead.created', label: 'Lead Created' },
  { id: 'deal.won', label: 'Deal Won / Closed' },
  { id: 'order.confirmed', label: 'Sales Order Confirmed' },
  { id: 'purchase.received', label: 'PO Goods Received' },
  { id: 'invoice.paid', label: 'Invoice Payment Received' },
  { id: 'inventory.low_stock', label: 'Low Stock Alert Triggered' },
  { id: 'employee.onboarded', label: 'New Employee Hired' },
  { id: 'contract.signed', label: 'Contract Dual Signed' },
];

export default function WebhooksPage() {
  const showToast = useAppStore((s) => s.showToast);
  const [activeTab, setActiveTab] = useState('endpoints'); // 'endpoints' | 'omnichannel'
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pingingId, setPingingId] = useState(null);
  const [selectedWebhookLogs, setSelectedWebhookLogs] = useState(null);

  // New webhook form
  const [newHook, setNewHook] = useState({
    name: '',
    target_url: '',
    secret_key: '',
    description: '',
    events: ['lead.created', 'deal.won'],
  });

  // Omnichannel broadcast test state
  const [channelForm, setChannelForm] = useState({
    channel: 'in_app', // 'in_app' | 'email' | 'sms' | 'whatsapp' | 'webhook'
    recipient: '',
    title: '',
    message: '',
  });
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  const loadWebhooks = async () => {
    setLoading(true);
    try {
      const res = await fetchWebhooks();
      const list = res?.data || res?.results || res || [];
      setWebhooks(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Failed to fetch webhooks', err);
      setWebhooks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWebhooks();
  }, []);

  const handleCreateWebhook = async (e) => {
    e.preventDefault();
    if (!newHook.name || !newHook.target_url) {
      showToast('Name and Target URL are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await createWebhook({
        name: newHook.name,
        target_url: newHook.target_url,
        secret_key: newHook.secret_key || undefined,
        description: newHook.description,
        events: newHook.events,
        is_active: true,
      });
      showToast(`Webhook endpoint '${newHook.name}' configured`, 'success');
      setIsModalOpen(false);
      setNewHook({
        name: '',
        target_url: '',
        secret_key: '',
        description: '',
        events: ['lead.created', 'deal.won'],
      });
      loadWebhooks();
    } catch (err) {
      showToast(err?.message || 'Failed to create webhook', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWebhook = async (id, name) => {
    if (!window.confirm(`Delete webhook endpoint "${name}"?`)) return;
    try {
      await deleteWebhook(id);
      showToast(`Webhook "${name}" deleted`, 'success');
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      showToast(err?.message || 'Failed to delete webhook', 'error');
    }
  };

  const handleTestPing = async (id, name) => {
    setPingingId(id);
    try {
      const res = await testPingWebhook(id);
      const delivery = res?.data || res;
      showToast(`Ping sent to "${name}": Status ${delivery?.response_status || 200}`, 'success');
      loadWebhooks();
    } catch (err) {
      showToast(err?.message || 'Test ping failed', 'error');
    } finally {
      setPingingId(null);
    }
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!channelForm.recipient || !channelForm.message) {
      showToast('Recipient and message are required', 'error');
      return;
    }
    setBroadcasting(true);
    setBroadcastResult(null);
    try {
      const res = await sendOmnichannelNotification({
        channel: channelForm.channel,
        recipient: channelForm.recipient,
        title: channelForm.title || 'SEWEN Suite Notification',
        message: channelForm.message,
      });
      setBroadcastResult({
        success: true,
        data: res?.data || res,
        timestamp: new Date().toLocaleTimeString(),
      });
      showToast('Omnichannel message dispatched successfully', 'success');
    } catch (err) {
      setBroadcastResult({
        success: false,
        error: err?.message || 'Dispatch error',
        timestamp: new Date().toLocaleTimeString(),
      });
      showToast(err?.message || 'Failed to send notification', 'error');
    } finally {
      setBroadcasting(false);
    }
  };

  const toggleEvent = (eventId) => {
    setNewHook((prev) => {
      const exists = prev.events.includes(eventId);
      return {
        ...prev,
        events: exists ? prev.events.filter((e) => e !== eventId) : [...prev.events, eventId],
      };
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Webhook className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-slate-800">Webhooks & Omnichannel Notifications</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Publish real-time event webhooks and trigger multi-channel broadcasts across In-App, Email, SMS, WhatsApp, and Webhooks.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('endpoints')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'endpoints'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Webhook Endpoints ({webhooks.length})
            </button>
            <button
              onClick={() => setActiveTab('omnichannel')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'omnichannel'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Omnichannel Dispatcher
            </button>
          </div>
          {activeTab === 'endpoints' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Webhook
            </button>
          )}
        </div>
      </div>

      {activeTab === 'endpoints' ? (
        <div className="space-y-6">
          {/* Webhook Endpoints List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500">Loading webhooks...</div>
            ) : webhooks.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <Radio className="h-10 w-10 text-slate-300 mx-auto animate-pulse" />
                <p className="text-base font-medium">No webhook endpoints configured yet</p>
                <p className="text-xs text-slate-400">
                  Register your external endpoint to receive transactional event notifications.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {webhooks.map((w) => (
                  <div key={w.id} className="p-5 hover:bg-slate-50/50 transition-colors">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <h3 className="font-semibold text-slate-900 text-base">{w.name}</h3>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              w.is_active || w.isActive
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {w.is_active || w.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs text-slate-500">
                          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                          <span>{w.target_url || w.targetUrl}</span>
                        </div>
                        {w.description && (
                          <p className="text-xs text-slate-500 mt-1">{w.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {(w.events || []).map((ev) => (
                            <span
                              key={ev}
                              className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-mono rounded"
                            >
                              {ev}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestPing(w.id, w.name)}
                          disabled={pingingId === w.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                        >
                          <Play className="h-3 w-3 text-primary" />
                          {pingingId === w.id ? 'Pinging...' : 'Send Test Ping'}
                        </button>
                        <button
                          onClick={() => setSelectedWebhookLogs(w)}
                          className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-medium transition-all"
                        >
                          Logs ({(w.deliveries || []).length})
                        </button>
                        <button
                          onClick={() => handleDeleteWebhook(w.id, w.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Omnichannel Notification Dispatcher Test Bench */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Send className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-slate-800">Dispatch Omnichannel Notification</h2>
            </div>
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                  Delivery Channel
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'in_app', label: 'In-App', icon: Bell },
                    { id: 'email', label: 'Email', icon: Mail },
                    { id: 'sms', label: 'SMS', icon: Smartphone },
                    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
                    { id: 'webhook', label: 'Webhook', icon: Webhook },
                  ].map((ch) => {
                    const Icon = ch.icon;
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => setChannelForm({ ...channelForm, channel: ch.id })}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-xs font-semibold ${
                          channelForm.channel === ch.id
                            ? 'border-primary bg-primary/5 text-primary shadow-xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        {ch.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Recipient ({channelForm.channel === 'email' ? 'Email Address' : channelForm.channel === 'sms' || channelForm.channel === 'whatsapp' ? 'Phone Number (+91)' : 'User ID / Identifier'})
                </label>
                <input
                  type="text"
                  placeholder={
                    channelForm.channel === 'email'
                      ? 'finance@example.com'
                      : channelForm.channel === 'sms' || channelForm.channel === 'whatsapp'
                      ? '+919876543210'
                      : 'EMP-001 or all_users'
                  }
                  value={channelForm.recipient}
                  onChange={(e) => setChannelForm({ ...channelForm, recipient: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Notification Title / Subject
                </label>
                <input
                  type="text"
                  placeholder="e.g. Critical: Material Inspection Flagged"
                  value={channelForm.title}
                  onChange={(e) => setChannelForm({ ...channelForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Message Payload Body
                </label>
                <textarea
                  rows={4}
                  placeholder="Type the message content to broadcast across the chosen provider gateway..."
                  value={channelForm.message}
                  onChange={(e) => setChannelForm({ ...channelForm, message: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/95 transition-all shadow-sm disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {broadcasting ? 'Dispatching Alert...' : 'Dispatch Omnichannel Alert'}
                </button>
              </div>
            </form>
          </div>

          {/* Test bench status & logs */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Gateway Status</h3>
            {broadcastResult ? (
              <div
                className={`p-4 rounded-xl border ${
                  broadcastResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold text-sm">
                  {broadcastResult.success ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  {broadcastResult.success ? 'Dispatched' : 'Failed'}
                  <span className="text-xs font-normal text-slate-500 ml-auto font-mono">
                    {broadcastResult.timestamp}
                  </span>
                </div>
                <div className="mt-2 text-xs font-mono bg-white/70 p-2.5 rounded border border-current/10 max-h-48 overflow-y-auto">
                  {JSON.stringify(broadcastResult.data || broadcastResult.error, null, 2)}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-xl">
                <Clock className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-xs">No notifications dispatched this session</p>
              </div>
            )}

            <div className="text-xs text-slate-500 space-y-2 pt-2 border-t border-slate-100">
              <div className="flex justify-between py-1">
                <span>In-App Gateway:</span>
                <span className="font-semibold text-emerald-600">Online</span>
              </div>
              <div className="flex justify-between py-1">
                <span>SMTP Email Gateway:</span>
                <span className="font-semibold text-emerald-600">Ready</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Twilio / Fast2SMS:</span>
                <span className="font-semibold text-emerald-600">Connected</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Meta WhatsApp Cloud API:</span>
                <span className="font-semibold text-emerald-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Webhook Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-slate-900">Add Webhook Endpoint</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWebhook} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Endpoint Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Zapier Lead Intake or ERP-WMS Sink"
                  value={newHook.name}
                  onChange={(e) => setNewHook({ ...newHook, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Target Destination URL (HTTPS)
                </label>
                <input
                  type="url"
                  placeholder="https://api.external-system.com/webhook/receive"
                  value={newHook.target_url}
                  onChange={(e) => setNewHook({ ...newHook, target_url: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  HMAC Secret Key (Optional)
                </label>
                <input
                  type="text"
                  placeholder="whsec_xxxxxxxxxxxx"
                  value={newHook.secret_key}
                  onChange={(e) => setNewHook({ ...newHook, secret_key: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Target subscriber notes"
                  value={newHook.description}
                  onChange={(e) => setNewHook({ ...newHook, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-2">
                  Subscribed Event Topics
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 border border-slate-200 rounded-lg">
                  {AVAILABLE_EVENTS.map((ev) => (
                    <label
                      key={ev.id}
                      className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer text-xs text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={newHook.events.includes(ev.id)}
                        onChange={() => toggleEvent(ev.id)}
                        className="rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      <span>{ev.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/95 transition-all shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register Endpoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deliveries Log Modal */}
      {selectedWebhookLogs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delivery Log History</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedWebhookLogs.name}</p>
              </div>
              <button
                onClick={() => setSelectedWebhookLogs(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 max-h-96 overflow-y-auto divide-y divide-slate-100">
              {(selectedWebhookLogs.deliveries || []).length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No deliveries recorded yet. Send a test ping to verify!
                </div>
              ) : (
                (selectedWebhookLogs.deliveries || []).map((del) => (
                  <div key={del.id} className="py-3 text-xs space-y-1 font-mono">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{del.event_name}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          del.response_status === 200
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        HTTP {del.response_status || 0}
                      </span>
                    </div>
                    <div className="text-slate-500 text-[11px]">{del.attempted_at}</div>
                    {del.response_body && (
                      <div className="bg-slate-50 p-2 rounded text-slate-600 overflow-x-auto">
                        {del.response_body}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
