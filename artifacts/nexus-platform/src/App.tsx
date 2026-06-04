import React, { useState, useEffect, useMemo, createContext, useContext, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
  LayoutDashboard, Users, Wrench, MessageSquare, Settings, Bell, Bot,
  ChevronRight, Plus, Search, LogOut, Building, ShieldAlert, Zap,
  CheckCircle2, Clock, AlertCircle, Menu, X, Activity,
  CreditCard, FileText, ChevronDown, Send, User, Building2, Sparkles,
  MoreVertical, Paperclip, Fingerprint, Lock, UploadCloud,
  Check, Info, HelpCircle, TrendingUp, Home, ChevronUp, RefreshCw,
  Shield, Database, Globe, ArrowUpRight, ArrowDownRight, Filter,
  Eye, EyeOff, KeyRound, BarChart3, Layers
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
type Role = 'super_admin' | 'property_admin' | 'tenant' | 'maintenance';
type PlanType = 'starter' | 'professional' | 'enterprise';

interface Organization {
  id: string;
  name: string;
  plan: PlanType;
  createdAt: string;
  units: number;
  tenants: number;
}

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  orgId: string;
  avatar?: string;
  unit?: string;
  joinedAt: string;
}

interface Ticket {
  id: string;
  orgId: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high' | 'emergency';
  category: 'plumbing' | 'electrical' | 'hvac' | 'general';
  createdAt: string;
  assignedTo?: string;
  tenantId: string;
  location: string;
}

interface Notification {
  id: string;
  orgId: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: 'alert' | 'info' | 'success';
  createdAt: string;
}

interface ActivityLog {
  id: string;
  orgId: string;
  actor: string;
  action: string;
  target: string;
  timestamp: string;
}

// ============================================================================
// MOCK DATA
// ============================================================================
const MOCK_ORGS: Organization[] = [
  { id: 'org_1', name: 'Skyline Apartments', plan: 'professional', createdAt: '2023-01-15', units: 48, tenants: 41 },
  { id: 'org_2', name: 'Nexus Global', plan: 'enterprise', createdAt: '2022-11-01', units: 0, tenants: 0 },
  { id: 'org_3', name: 'Harbor View Properties', plan: 'starter', createdAt: '2024-03-10', units: 12, tenants: 10 },
];

const INITIAL_USERS: AppUser[] = [
  { id: 'sa1', name: 'Alex Reeves', email: 'alex@nexustenant.ai', role: 'super_admin', orgId: 'org_2', joinedAt: '2022-11-01' },
  { id: 'pa1', name: 'Sarah Morgan', email: 'sarah@skylineapts.com', role: 'property_admin', orgId: 'org_1', joinedAt: '2023-01-15' },
  { id: 't1', name: 'Marcus Chen', email: 'marcus.c@gmail.com', role: 'tenant', orgId: 'org_1', unit: 'Apt 4B', joinedAt: '2023-06-01' },
  { id: 'm1', name: 'David Torres', email: 'david@skylineapts.com', role: 'maintenance', orgId: 'org_1', joinedAt: '2023-02-20' },
  { id: 't2', name: 'Priya Kapoor', email: 'priya.k@gmail.com', role: 'tenant', orgId: 'org_1', unit: 'Apt 12C', joinedAt: '2023-08-15' },
  { id: 't3', name: 'James Liu', email: 'james.l@gmail.com', role: 'tenant', orgId: 'org_1', unit: 'Apt 7A', joinedAt: '2023-09-01' },
];

const INITIAL_TICKETS: Ticket[] = [
  { id: 'TK-1042', orgId: 'org_1', title: 'Leaking AC Unit', description: 'Water is dripping from the living room AC vent onto the hardwood floor.', status: 'open', priority: 'medium', category: 'hvac', createdAt: new Date(Date.now() - 7200000).toISOString(), tenantId: 't1', location: 'Apt 4B' },
  { id: 'TK-1041', orgId: 'org_1', title: 'Power outlet sparking', description: 'Kitchen outlet sparked when plugging in toaster. Stopped using it immediately.', status: 'in_progress', priority: 'emergency', category: 'electrical', createdAt: new Date(Date.now() - 14400000).toISOString(), assignedTo: 'David Torres', tenantId: 't2', location: 'Apt 12C' },
  { id: 'TK-1040', orgId: 'org_1', title: 'Low water pressure', description: 'Shower water pressure has been very low for the past week.', status: 'open', priority: 'low', category: 'plumbing', createdAt: new Date(Date.now() - 86400000).toISOString(), tenantId: 't3', location: 'Apt 7A' },
  { id: 'TK-1039', orgId: 'org_1', title: 'Broken door lock', description: 'Front door lock jams when using the key.', status: 'resolved', priority: 'high', category: 'general', createdAt: new Date(Date.now() - 172800000).toISOString(), assignedTo: 'David Torres', tenantId: 't1', location: 'Apt 4B' },
  { id: 'TK-1038', orgId: 'org_1', title: 'Pest sighting', description: 'Saw cockroaches near the kitchen sink.', status: 'resolved', priority: 'high', category: 'general', createdAt: new Date(Date.now() - 259200000).toISOString(), assignedTo: 'David Torres', tenantId: 't2', location: 'Apt 12C' },
];

class DatabaseStore {
  users: AppUser[] = [...INITIAL_USERS];
  tickets: Ticket[] = [...INITIAL_TICKETS];
  notifications: Notification[] = [
    { id: 'n1', orgId: 'org_1', userId: 'pa1', title: 'Emergency Alert', message: 'Power outlet sparking reported in Apt 12C (emergency)', read: false, type: 'alert', createdAt: new Date(Date.now() - 14400000).toISOString() },
    { id: 'n2', orgId: 'org_1', userId: 'pa1', title: 'Ticket Resolved', message: 'TK-1039 has been resolved by David Torres', read: false, type: 'success', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'n3', orgId: 'org_1', userId: 'pa1', title: 'New Tenant Request', message: 'Marcus Chen submitted a new maintenance request', read: true, type: 'info', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 'n4', orgId: 'org_1', userId: 't1', title: 'Ticket Update', message: 'Your request TK-1039 has been resolved', read: false, type: 'success', createdAt: new Date(Date.now() - 86400000).toISOString() },
  ];
  logs: ActivityLog[] = [
    { id: 'log1', orgId: 'org_1', actor: 'Sarah Morgan', action: 'updated organization settings', target: 'Skyline Apartments', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { id: 'log2', orgId: 'org_1', actor: 'David Torres', action: 'resolved ticket', target: 'TK-1039', timestamp: new Date(Date.now() - 86400000).toISOString() },
    { id: 'log3', orgId: 'org_1', actor: 'David Torres', action: 'resolved ticket', target: 'TK-1038', timestamp: new Date(Date.now() - 259200000).toISOString() },
    { id: 'log4', orgId: 'org_1', actor: 'Marcus Chen', action: 'created ticket', target: 'TK-1042', timestamp: new Date(Date.now() - 7200000).toISOString() },
    { id: 'log5', orgId: 'org_1', actor: 'Priya Kapoor', action: 'created ticket', target: 'TK-1041', timestamp: new Date(Date.now() - 14400000).toISOString() },
  ];
}
const dbStore = new DatabaseStore();

// ============================================================================
// CONTEXT
// ============================================================================
interface AppContextType {
  user: AppUser | null;
  org: Organization | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  tickets: Ticket[];
  notifications: Notification[];
  logs: ActivityLog[];
  users: AppUser[];
  orgs: Organization[];
  createTicket: (ticket: Partial<Ticket>) => void;
  updateTicketStatus: (id: string, status: Ticket['status']) => void;
  markNotificationsRead: () => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUserId = localStorage.getItem('nexus_session');
    if (savedUserId) {
      const foundUser = dbStore.users.find(u => u.id === savedUserId);
      if (foundUser) {
        setUser(foundUser);
        setOrg(MOCK_ORGS.find(o => o.id === foundUser.orgId) || null);
      }
    }
    setTimeout(() => setIsLoading(false), 600);
  }, []);

  useEffect(() => {
    if (!user) return;
    const filterOrg = (item: any) => user.role === 'super_admin' ? true : item.orgId === user.orgId;
    setTickets(dbStore.tickets.filter(filterOrg));
    setNotifications(dbStore.notifications.filter(n => n.userId === user.id));
    setLogs(dbStore.logs.filter(filterOrg));
    setUsers(user.role === 'super_admin' ? dbStore.users : dbStore.users.filter(u => u.orgId === user.orgId));
  }, [user]);

  const login = async (email: string, _password: string) => {
    setIsLoading(true);
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const foundUser = dbStore.users.find(u => u.email === email);
        if (foundUser) {
          localStorage.setItem('nexus_session', foundUser.id);
          setUser(foundUser);
          setOrg(MOCK_ORGS.find(o => o.id === foundUser.orgId) || null);
          setIsLoading(false);
          resolve();
        } else {
          setIsLoading(false);
          reject(new Error('Invalid credentials'));
        }
      }, 900);
    });
  };

  const logout = () => {
    localStorage.removeItem('nexus_session');
    setUser(null);
    setOrg(null);
    setTickets([]);
    setNotifications([]);
    setLogs([]);
  };

  const createTicket = (ticketData: Partial<Ticket>) => {
    if (!user) return;
    const newTicket: Ticket = {
      id: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
      orgId: user.orgId,
      title: ticketData.title || 'New Issue',
      description: ticketData.description || '',
      status: 'open',
      priority: ticketData.priority || 'medium',
      category: ticketData.category || 'general',
      createdAt: new Date().toISOString(),
      tenantId: user.role === 'tenant' ? user.id : (ticketData.tenantId || 'unknown'),
      location: user.unit || ticketData.location || 'Unknown location',
    };
    dbStore.tickets = [newTicket, ...dbStore.tickets];
    dbStore.logs.unshift({ id: Math.random().toString(), orgId: user.orgId, actor: user.name, action: 'created ticket', target: newTicket.id, timestamp: new Date().toISOString() });
    const admins = dbStore.users.filter(u => u.orgId === user.orgId && u.role === 'property_admin');
    admins.forEach(admin => {
      dbStore.notifications.unshift({ id: Math.random().toString(), orgId: user.orgId, userId: admin.id, title: 'New Maintenance Request', message: `${newTicket.title} (${newTicket.priority})`, read: false, type: newTicket.priority === 'emergency' ? 'alert' : 'info', createdAt: new Date().toISOString() });
    });
    setTickets(dbStore.tickets.filter(t => t.orgId === user.orgId));
    setLogs([...dbStore.logs]);
  };

  const updateTicketStatus = (id: string, status: Ticket['status']) => {
    if (!user) return;
    const idx = dbStore.tickets.findIndex(t => t.id === id);
    if (idx > -1) {
      dbStore.tickets[idx].status = status;
      dbStore.logs.unshift({ id: Math.random().toString(), orgId: user.orgId, actor: user.name, action: `moved ticket to ${status.replace('_', ' ')}`, target: id, timestamp: new Date().toISOString() });
      setTickets([...dbStore.tickets.filter(t => t.orgId === user.orgId)]);
      setLogs([...dbStore.logs]);
    }
  };

  const markNotificationsRead = () => {
    if (!user) return;
    dbStore.notifications.forEach(n => { if (n.userId === user.id) n.read = true; });
    setNotifications([...dbStore.notifications.filter(n => n.userId === user.id)]);
  };

  return (
    <AppContext.Provider value={{ user, org, login, logout, tickets, notifications, logs, users, orgs: MOCK_ORGS, createTicket, updateTicketStatus, markNotificationsRead, isLoading }}>
      {children}
    </AppContext.Provider>
  );
};

const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

// ============================================================================
// UTILS
// ============================================================================
const cn = (...classes: (string | undefined | null | false)[]) => classes.filter(Boolean).join(' ');

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
};

const priorityConfig: Record<string, { label: string; color: string; dot: string }> = {
  emergency: { label: 'Emergency', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', dot: 'bg-rose-400' },
  high: { label: 'High', color: 'text-orange-400 bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-400' },
  medium: { label: 'Medium', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', dot: 'bg-amber-400' },
  low: { label: 'Low', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-400' },
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  open: { label: 'Open', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: RefreshCw },
  resolved: { label: 'Resolved', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
};

const planConfig: Record<PlanType, { label: string; color: string }> = {
  starter: { label: 'Starter', color: 'text-zinc-400 bg-zinc-800 border-zinc-700' },
  professional: { label: 'Professional', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  enterprise: { label: 'Enterprise', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
};

// ============================================================================
// UI PRIMITIVES
// ============================================================================
const Card = ({ children, className = '', noPad = false }: { children: React.ReactNode; className?: string; noPad?: boolean }) => (
  <div className={cn('bg-zinc-900/60 border border-zinc-800/60 rounded-2xl overflow-hidden', className)}>
    <div className={cn(!noPad && 'p-5')}>{children}</div>
  </div>
);

const Badge = ({ children, variant = 'default', className = '' }: { children: React.ReactNode; variant?: string; className?: string }) => {
  const variants: Record<string, string> = {
    default: 'text-zinc-400 bg-zinc-800 border-zinc-700',
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    danger: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    info: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
    ai: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };
  return <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium border inline-flex items-center gap-1', variants[variant] || variants.default, className)}>{children}</span>;
};

const Button = ({ children, variant = 'primary', size = 'md', className = '', onClick, type = 'button', disabled = false, icon: Icon, loading = false }: any) => {
  const base = 'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed gap-2';
  const variants: Record<string, string> = {
    primary: 'bg-zinc-100 text-zinc-900 hover:bg-white focus:ring-zinc-100',
    secondary: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700 border border-zinc-700/60 focus:ring-zinc-700',
    outline: 'border border-zinc-700 text-zinc-300 hover:bg-zinc-800/50 focus:ring-zinc-700',
    ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50',
    danger: 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20',
    ai: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-400 hover:to-purple-500 shadow-[0_0_20px_-5px_rgba(99,102,241,0.5)] border border-indigo-400/20',
  };
  const sizes: Record<string, string> = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm', lg: 'px-5 py-2.5 text-sm' };
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={cn(base, variants[variant], sizes[size], className)}>
      {loading ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};

const Input = ({ label, error, className = '', ...props }: any) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-zinc-400 mb-1.5">{label}</label>}
    <input className={cn('w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all text-sm', error && 'border-rose-500/50 focus:ring-rose-500/40', className)} {...props} />
    {error && <p className="mt-1.5 text-xs text-rose-400">{error}</p>}
  </div>
);

const Select = ({ label, children, className = '', ...props }: any) => (
  <div className="w-full">
    {label && <label className="block text-sm font-medium text-zinc-400 mb-1.5">{label}</label>}
    <select className={cn('w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all text-sm appearance-none', className)} {...props}>{children}</select>
  </div>
);

const Avatar = ({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) => {
  const colors = ['from-indigo-500 to-purple-600', 'from-sky-500 to-cyan-600', 'from-emerald-500 to-teal-600', 'from-rose-500 to-pink-600', 'from-amber-500 to-orange-600'];
  const idx = name.charCodeAt(0) % colors.length;
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div className={cn('rounded-xl bg-gradient-to-br flex items-center justify-center font-semibold text-white flex-shrink-0', colors[idx], sizes[size])}>
      {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  );
};

const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={cn('animate-pulse bg-zinc-800/50 rounded-lg', className)} />
);

// ============================================================================
// AI SERVICE
// ============================================================================
const simulateAI = async (input: string): Promise<{ text: string; action?: any }> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const lower = input.toLowerCase();
      if (/leak|water|flood|burst|drip/.test(lower)) {
        resolve({ text: "I've detected a potential water emergency. I'm automatically creating an urgent plumbing ticket and alerting the on-call maintenance team to your unit. Please move any valuables away from the affected area.", action: { type: 'CREATE_TICKET', payload: { title: 'Water Leak Emergency', priority: 'emergency', category: 'plumbing' } } });
      } else if (/power|electric|spark|outlet|fuse/.test(lower)) {
        resolve({ text: "This sounds like a serious electrical hazard. Please stop using the affected outlet immediately. I've created an emergency ticket and your maintenance team has been alerted.", action: { type: 'CREATE_TICKET', payload: { title: 'Electrical Hazard', priority: 'emergency', category: 'electrical' } } });
      } else if (/ac|heat|cool|hvac|ventilat|temperature/.test(lower)) {
        resolve({ text: "I've logged a high-priority HVAC maintenance request for your unit. The team typically responds within 4-6 hours for HVAC issues. You'll receive a notification when a technician is assigned.", action: { type: 'CREATE_TICKET', payload: { title: 'HVAC Issue', priority: 'high', category: 'hvac' } } });
      } else if (/ticket|request|issue|problem|report/.test(lower)) {
        resolve({ text: "I can help you file a maintenance request. Could you describe the issue you're experiencing? Include details like the location in your unit and how long it's been happening." });
      } else if (/rent|pay|payment|invoice|bill/.test(lower)) {
        resolve({ text: "For billing and payment inquiries, please contact your property manager directly at the contact information listed in your lease agreement, or visit the Settings section of your dashboard." });
      } else {
        resolve({ text: "I understand. I'm here to help with maintenance requests, property information, and general support. Would you like me to file a maintenance ticket or connect you with the property management team?" });
      }
    }, 1400);
  });
};

// ============================================================================
// AI CHATBOT
// ============================================================================
const AIChatbot = () => {
  const { user, createTicket } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: `Hi ${user?.name.split(' ')[0]}! I'm your AI concierge. How can I help you today?`, sender: 'ai', time: 'Just now' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!user) return null;

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input;
    setMessages(prev => [...prev, { id: Date.now(), text, sender: 'user', time: 'Just now' }]);
    setInput('');
    setIsTyping(true);
    const res = await simulateAI(text);
    if (res.action?.type === 'CREATE_TICKET') createTicket(res.action.payload);
    setMessages(prev => [...prev, { id: Date.now() + 1, text: res.text, sender: 'ai', time: 'Just now' }]);
    setIsTyping(false);
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-[0_8px_30px_-5px_rgba(99,102,241,0.6)] hover:scale-105 transition-transform">
            <Bot className="w-6 h-6 text-white" />
          </motion.button>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.96 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[560px] max-h-[80vh] flex flex-col bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 shadow-2xl rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-900/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100 flex items-center gap-1.5">
                    Nexus AI <Badge variant="ai" className="text-[10px] py-0">Online</Badge>
                  </p>
                  <p className="text-xs text-zinc-500">Responds instantly</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.map(msg => (
                <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={cn('flex gap-2.5', msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row')}>
                  {msg.sender === 'ai' && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className={cn('max-w-[78%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed', msg.sender === 'user' ? 'bg-indigo-500/20 text-indigo-100 border border-indigo-500/20 rounded-tr-sm' : 'bg-zinc-800/80 text-zinc-200 border border-zinc-700/50 rounded-tl-sm')}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-zinc-800/80 border border-zinc-700/50 px-3.5 py-3 rounded-2xl rounded-tl-sm flex gap-1 items-center">
                    {[0, 1, 2].map(i => <span key={i} className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>
            <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/40">
              <div className="flex gap-2">
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Describe your issue..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/30 transition-all" />
                <button onClick={handleSend} disabled={!input.trim() || isTyping}
                  className="w-9 h-9 bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center disabled:opacity-40 transition-colors flex-shrink-0">
                  <Send className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ============================================================================
// LOGIN PAGE
// ============================================================================
const DEMO_ACCOUNTS = [
  { label: 'Super Admin', email: 'alex@nexustenant.ai', desc: 'Platform-wide visibility' },
  { label: 'Property Admin', email: 'sarah@skylineapts.com', desc: 'Manage Skyline Apartments' },
  { label: 'Tenant', email: 'marcus.c@gmail.com', desc: 'Resident view (Apt 4B)' },
  { label: 'Maintenance', email: 'david@skylineapts.com', desc: 'Maintenance crew view' },
];

const LoginPage = () => {
  const { login, isLoading } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      setError('No account found with that email. Try one of the demo accounts below.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex">
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-zinc-950 via-indigo-950/20 to-zinc-950 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,rgba(99,102,241,0.08),transparent_70%)]" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 max-w-sm">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-zinc-100 tracking-tight">Nexus</span>
          </div>
          <h2 className="text-3xl font-bold text-zinc-100 leading-tight mb-4">
            AI-powered tenant management — built for scale.
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed mb-10">
            Automate maintenance workflows, communicate instantly with tenants, and get actionable insights across every property.
          </p>
          <div className="space-y-3">
            {[
              { icon: Zap, label: 'AI-powered triage and routing' },
              { icon: Shield, label: 'Multi-tenant with role-based access' },
              { icon: Activity, label: 'Real-time analytics and alerts' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-zinc-400">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-indigo-400" />
                </div>
                <span className="text-sm">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Building2 className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-bold text-zinc-100">Nexus</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 mb-1">Sign in</h1>
          <p className="text-sm text-zinc-500 mb-8">Enter your credentials to access the platform.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="you@example.com" required />
            <div className="w-full">
              <label className="block text-sm font-medium text-zinc-400 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all text-sm pr-11" />
                <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && (
              <div className="flex gap-2 p-3 bg-rose-500/8 border border-rose-500/20 rounded-xl">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-rose-400">{error}</p>
              </div>
            )}
            <Button type="submit" loading={submitting} variant="primary" className="w-full py-2.5">
              {submitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          <div className="mt-8">
            <p className="text-xs text-zinc-500 mb-3 font-medium uppercase tracking-wider">Demo accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.email} onClick={() => { setEmail(acc.email); setPassword('demo'); }}
                  className="p-2.5 text-left bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 rounded-xl transition-all group">
                  <p className="text-xs font-semibold text-zinc-300 group-hover:text-zinc-100 transition-colors">{acc.label}</p>
                  <p className="text-[10px] text-zinc-600 mt-0.5">{acc.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SIDEBAR NAVIGATION
// ============================================================================
type PageKey = 'dashboard' | 'tickets' | 'users' | 'ai' | 'settings' | 'organizations' | 'analytics';

const NAV_ITEMS: Record<string, { key: PageKey; label: string; icon: React.ElementType; roles: Role[] }[]> = {
  main: [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'property_admin', 'tenant', 'maintenance'] },
    { key: 'tickets', label: 'Tickets', icon: Wrench, roles: ['super_admin', 'property_admin', 'tenant', 'maintenance'] },
    { key: 'users', label: 'People', icon: Users, roles: ['super_admin', 'property_admin'] },
    { key: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['super_admin', 'property_admin'] },
    { key: 'ai', label: 'AI Console', icon: Sparkles, roles: ['super_admin', 'property_admin'] },
  ],
  admin: [
    { key: 'organizations', label: 'Organizations', icon: Building2, roles: ['super_admin'] },
    { key: 'settings', label: 'Settings', icon: Settings, roles: ['super_admin', 'property_admin', 'tenant', 'maintenance'] },
  ],
};

const Sidebar = ({ current, onNavigate, mobile = false, onClose }: { current: PageKey; onNavigate: (p: PageKey) => void; mobile?: boolean; onClose?: () => void }) => {
  const { user, org, logout, notifications } = useApp();
  const unread = notifications.filter(n => !n.read).length;
  if (!user) return null;

  const allItems = [...NAV_ITEMS.main, ...NAV_ITEMS.admin].filter(i => i.roles.includes(user.role));

  return (
    <div className={cn('flex flex-col h-full bg-zinc-950 border-r border-zinc-800/60', mobile ? 'w-full' : 'w-60')}>
      <div className="p-4 border-b border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-zinc-100 truncate">Nexus</p>
            <p className="text-xs text-zinc-500 truncate">{org?.name || 'Platform'}</p>
          </div>
          {mobile && <button onClick={onClose} className="ml-auto text-zinc-500 hover:text-zinc-300 p-1"><X className="w-4 h-4" /></button>}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV_ITEMS.main.filter(i => i.roles.includes(user.role)).map(item => (
          <button key={item.key} onClick={() => { onNavigate(item.key); onClose?.(); }}
            className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all', current === item.key ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900')}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </button>
        ))}
        <div className="pt-2 pb-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-700 mb-1">Platform</p>
        </div>
        {NAV_ITEMS.admin.filter(i => i.roles.includes(user.role)).map(item => (
          <button key={item.key} onClick={() => { onNavigate(item.key); onClose?.(); }}
            className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all', current === item.key ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20' : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900')}>
            <item.icon className="w-4 h-4 flex-shrink-0" />
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-zinc-800/60">
        <div className="flex items-center gap-2.5 p-2">
          <Avatar name={user.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-200 truncate">{user.name}</p>
            <p className="text-[10px] text-zinc-500 truncate capitalize">{user.role.replace('_', ' ')}</p>
          </div>
          <button onClick={logout} className="text-zinc-600 hover:text-zinc-300 p-1 rounded-lg transition-colors" title="Sign out">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TOP BAR
// ============================================================================
const TopBar = ({ title, onMenuToggle, onNavigate, onShowNotifications }: { title: string; onMenuToggle: () => void; onNavigate: (p: PageKey) => void; onShowNotifications: () => void }) => {
  const { notifications } = useApp();
  const unread = notifications.filter(n => !n.read).length;
  return (
    <div className="h-14 border-b border-zinc-800/60 flex items-center px-4 gap-3 bg-zinc-950/80 backdrop-blur-xl flex-shrink-0">
      <button onClick={onMenuToggle} className="lg:hidden text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
        <Menu className="w-4 h-4" />
      </button>
      <h1 className="text-sm font-semibold text-zinc-100 flex-1">{title}</h1>
      <button onClick={onShowNotifications} className="relative text-zinc-500 hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors">
        <Bell className="w-4 h-4" />
        {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">{unread}</span>}
      </button>
    </div>
  );
};

// ============================================================================
// NOTIFICATIONS PANEL
// ============================================================================
const NotificationsPanel = ({ onClose }: { onClose: () => void }) => {
  const { notifications, markNotificationsRead } = useApp();
  const typeIcons: Record<string, React.ElementType> = { alert: AlertCircle, info: Info, success: CheckCircle2 };
  const typeColors: Record<string, string> = { alert: 'text-rose-400', info: 'text-sky-400', success: 'text-emerald-400' };

  useEffect(() => { markNotificationsRead(); }, []);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
      className="fixed inset-y-0 right-0 z-40 w-80 bg-zinc-950 border-l border-zinc-800 shadow-2xl flex flex-col">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-100">Notifications</h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition-colors"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600">
            <Bell className="w-8 h-8 mb-2" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : notifications.map(n => {
          const Icon = typeIcons[n.type] || Info;
          return (
            <div key={n.id} className="p-4 border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
              <div className="flex gap-3">
                <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', typeColors[n.type])} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-200">{n.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-zinc-700 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

// ============================================================================
// DASHBOARD PAGE
// ============================================================================
const WEEKLY_DATA = [
  { day: 'Mon', open: 3, resolved: 5 },
  { day: 'Tue', open: 5, resolved: 3 },
  { day: 'Wed', open: 2, resolved: 7 },
  { day: 'Thu', open: 6, resolved: 4 },
  { day: 'Fri', open: 4, resolved: 6 },
  { day: 'Sat', open: 1, resolved: 2 },
  { day: 'Sun', open: 2, resolved: 1 },
];

const CATEGORY_DATA = [
  { name: 'HVAC', value: 35, color: '#6366f1' },
  { name: 'Plumbing', value: 28, color: '#8b5cf6' },
  { name: 'Electrical', value: 20, color: '#a78bfa' },
  { name: 'General', value: 17, color: '#c4b5fd' },
];

const DashboardPage = ({ onNavigate }: { onNavigate: (p: PageKey) => void }) => {
  const { tickets, logs, user, org } = useApp();
  const open = tickets.filter(t => t.status === 'open').length;
  const inProgress = tickets.filter(t => t.status === 'in_progress').length;
  const resolved = tickets.filter(t => t.status === 'resolved').length;
  const emergency = tickets.filter(t => t.priority === 'emergency' && t.status !== 'resolved').length;
  const recentTickets = tickets.slice(0, 5);
  const recentLogs = logs.slice(0, 6);

  const stats = user?.role === 'tenant'
    ? [
        { label: 'My Open Tickets', value: tickets.filter(t => t.tenantId === user.id && t.status === 'open').length, icon: Wrench, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
        { label: 'In Progress', value: tickets.filter(t => t.tenantId === user.id && t.status === 'in_progress').length, icon: RefreshCw, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        { label: 'Resolved', value: tickets.filter(t => t.tenantId === user.id && t.status === 'resolved').length, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
      ]
    : [
        { label: 'Open Tickets', value: open, icon: Clock, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20', delta: '+2 today' },
        { label: 'In Progress', value: inProgress, icon: RefreshCw, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', delta: null },
        { label: 'Resolved', value: resolved, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', delta: '+5 this week' },
        { label: 'Emergencies', value: emergency, icon: ShieldAlert, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', delta: emergency > 0 ? 'Needs attention' : null },
      ];

  return (
    <div className="space-y-6">
      {emergency > 0 && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3.5 bg-rose-500/8 border border-rose-500/20 rounded-2xl">
          <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <p className="text-sm text-rose-300 flex-1">{emergency} emergency ticket{emergency > 1 ? 's' : ''} require immediate attention.</p>
          <Button size="sm" variant="danger" onClick={() => onNavigate('tickets')}>View <ChevronRight className="w-3 h-3" /></Button>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card>
              <div className="flex items-start justify-between mb-3">
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border', s.bg, s.border)}>
                  <s.icon className={cn('w-4 h-4', s.color)} />
                </div>
                {(s as any).delta && <span className="text-[10px] text-zinc-500">{(s as any).delta}</span>}
              </div>
              <p className="text-2xl font-bold text-zinc-100">{s.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-zinc-200">Tickets This Week</p>
            <Badge variant="default">7 days</Badge>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={WEEKLY_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="open" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="resolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="open" stroke="#6366f1" strokeWidth={2} fill="url(#open)" name="Opened" />
              <Area type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} fill="url(#resolved)" name="Resolved" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-zinc-200 mb-4">By Category</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={CATEGORY_DATA} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                {CATEGORY_DATA.map((entry, index) => <Cell key={index} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-3 space-y-1.5">
            {CATEGORY_DATA.map(c => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: c.color }} />
                  <span className="text-xs text-zinc-400">{c.name}</span>
                </div>
                <span className="text-xs font-medium text-zinc-300">{c.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card noPad>
          <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
            <p className="text-sm font-semibold text-zinc-200">Recent Tickets</p>
            <Button size="sm" variant="ghost" onClick={() => onNavigate('tickets')}>View all <ArrowUpRight className="w-3 h-3" /></Button>
          </div>
          <div className="divide-y divide-zinc-800/40">
            {recentTickets.length === 0 ? (
              <div className="p-6 text-center text-zinc-600 text-sm">No tickets yet</div>
            ) : recentTickets.map(t => {
              const sc = statusConfig[t.status];
              const pc = priorityConfig[t.priority];
              return (
                <div key={t.id} className="flex items-center gap-3 p-4 hover:bg-zinc-900/40 transition-colors">
                  <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', pc.dot)} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">{t.title}</p>
                    <p className="text-xs text-zinc-500">{t.location} · {timeAgo(t.createdAt)}</p>
                  </div>
                  <Badge className={sc.color}>{sc.label}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
        <Card noPad>
          <div className="p-5 border-b border-zinc-800/60">
            <p className="text-sm font-semibold text-zinc-200">Activity Log</p>
          </div>
          <div className="divide-y divide-zinc-800/40">
            {recentLogs.map(log => (
              <div key={log.id} className="flex gap-3 p-4 hover:bg-zinc-900/40 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Activity className="w-3.5 h-3.5 text-zinc-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300"><span className="font-medium text-zinc-100">{log.actor}</span> {log.action}</p>
                  <p className="text-xs text-zinc-600 mt-0.5 flex items-center gap-1">
                    <span className="font-medium text-zinc-500">{log.target}</span> · {timeAgo(log.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ============================================================================
// TICKETS PAGE
// ============================================================================
const NewTicketModal = ({ onClose }: { onClose: () => void }) => {
  const { createTicket, user } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Ticket['priority']>('medium');
  const [category, setCategory] = useState<Ticket['category']>('general');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      createTicket({ title, description, priority, category });
      setSubmitting(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
        className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-100">New Maintenance Request</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition-colors"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input label="Issue Title" value={title} onChange={(e: any) => setTitle(e.target.value)} placeholder="e.g. Leaking faucet in kitchen" required />
          <div className="w-full">
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the issue in detail..." required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 transition-all text-sm min-h-[80px] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Priority" value={priority} onChange={(e: any) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="emergency">Emergency</option>
            </Select>
            <Select label="Category" value={category} onChange={(e: any) => setCategory(e.target.value)}>
              <option value="general">General</option>
              <option value="plumbing">Plumbing</option>
              <option value="electrical">Electrical</option>
              <option value="hvac">HVAC</option>
            </Select>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" loading={submitting} variant="primary" className="flex-1">Submit Request</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const TicketsPage = () => {
  const { tickets, updateTicketStatus, user } = useApp();
  const [filter, setFilter] = useState<'all' | Ticket['status']>('all');
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);

  const filtered = tickets.filter(t => {
    if (user?.role === 'tenant' && t.tenantId !== user.id) return false;
    if (filter !== 'all' && t.status !== filter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-1.5">
          {(['all', 'open', 'in_progress', 'resolved'] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-all', filter === s ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50')}>
              {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="ml-1.5 text-[10px] opacity-60">
                {s === 'all' ? tickets.length : tickets.filter(t => t.status === s).length}
              </span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tickets..."
              className="bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-40 transition-all focus:w-52" />
          </div>
          <Button icon={Plus} variant="primary" size="sm" onClick={() => setShowNew(true)}>New Ticket</Button>
        </div>
      </div>

      <Card noPad>
        <div className="divide-y divide-zinc-800/40">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
              <Wrench className="w-8 h-8 mb-2" />
              <p className="text-sm">No tickets found</p>
            </div>
          ) : filtered.map(t => {
            const pc = priorityConfig[t.priority];
            const sc = statusConfig[t.status];
            return (
              <div key={t.id} onClick={() => setSelected(t)} className="flex items-center gap-4 p-4 hover:bg-zinc-900/40 cursor-pointer transition-colors">
                <div className={cn('w-2 h-8 rounded-full flex-shrink-0', pc.dot === 'bg-rose-400' ? 'bg-rose-400/60' : pc.dot === 'bg-orange-400' ? 'bg-orange-400/60' : pc.dot === 'bg-amber-400' ? 'bg-amber-400/60' : 'bg-emerald-400/60')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-200 truncate">{t.title}</p>
                    <span className="text-xs text-zinc-600 flex-shrink-0">{t.id}</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">{t.location} · {timeAgo(t.createdAt)}{t.assignedTo && ` · ${t.assignedTo}`}</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                  <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium border', pc.color)}>{pc.label}</span>
                  <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium border', sc.color)}>{sc.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-700 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      </Card>

      <AnimatePresence>
        {showNew && <NewTicketModal onClose={() => setShowNew(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setSelected(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 border-b border-zinc-800">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{selected.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{selected.id} · {selected.location}</p>
                </div>
                <button onClick={() => setSelected(null)} className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg hover:bg-zinc-800 transition-colors"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-zinc-400 leading-relaxed">{selected.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <p className="text-[10px] text-zinc-600 mb-1">Priority</p>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', priorityConfig[selected.priority].color)}>{priorityConfig[selected.priority].label}</span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <p className="text-[10px] text-zinc-600 mb-1">Status</p>
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium border', statusConfig[selected.status].color)}>{statusConfig[selected.status].label}</span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <p className="text-[10px] text-zinc-600 mb-1">Category</p>
                    <p className="text-sm text-zinc-300 capitalize">{selected.category}</p>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                    <p className="text-[10px] text-zinc-600 mb-1">Assigned To</p>
                    <p className="text-sm text-zinc-300">{selected.assignedTo || 'Unassigned'}</p>
                  </div>
                </div>
                {(user?.role === 'property_admin' || user?.role === 'maintenance' || user?.role === 'super_admin') && selected.status !== 'resolved' && (
                  <div className="flex gap-2 pt-1">
                    {selected.status === 'open' && (
                      <Button variant="secondary" size="sm" className="flex-1" icon={RefreshCw} onClick={() => { updateTicketStatus(selected.id, 'in_progress'); setSelected({ ...selected, status: 'in_progress' }); }}>Start Work</Button>
                    )}
                    <Button variant="ai" size="sm" className="flex-1" icon={CheckCircle2} onClick={() => { updateTicketStatus(selected.id, 'resolved'); setSelected(null); }}>Mark Resolved</Button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================================================
// USERS / PEOPLE PAGE
// ============================================================================
const roleLabels: Record<Role, string> = { super_admin: 'Super Admin', property_admin: 'Admin', tenant: 'Tenant', maintenance: 'Maintenance' };
const roleVariants: Record<Role, string> = { super_admin: 'purple', property_admin: 'ai', tenant: 'default', maintenance: 'warning' };

const UsersPage = () => {
  const { users, tickets, user } = useApp();
  const [search, setSearch] = useState('');
  const filtered = users.filter(u => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center justify-between">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search people..."
            className="bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 w-44 transition-all focus:w-56" />
        </div>
        <Button icon={Plus} variant="primary" size="sm">Invite</Button>
      </div>
      <Card noPad>
        <div className="divide-y divide-zinc-800/40">
          {filtered.map(u => {
            const orgName = MOCK_ORGS.find(o => o.id === u.orgId)?.name;
            const openTickets = tickets.filter(t => t.tenantId === u.id && t.status !== 'resolved').length;
            return (
              <div key={u.id} className="flex items-center gap-4 p-4 hover:bg-zinc-900/40 transition-colors">
                <Avatar name={u.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-200 truncate">{u.name}</p>
                    <Badge variant={roleVariants[u.role] as any}>{roleLabels[u.role]}</Badge>
                  </div>
                  <p className="text-xs text-zinc-500 mt-0.5">{u.email} · {orgName}{u.unit && ` · ${u.unit}`}</p>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-right flex-shrink-0">
                  {u.role === 'tenant' && openTickets > 0 && (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-zinc-200">{openTickets}</p>
                      <p className="text-[10px] text-zinc-600">open</p>
                    </div>
                  )}
                  <button className="text-zinc-600 hover:text-zinc-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"><MoreVertical className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// ANALYTICS PAGE
// ============================================================================
const MONTHLY_DATA = [
  { month: 'Jan', tickets: 18, resolved: 15, avg: 2.1 },
  { month: 'Feb', tickets: 24, resolved: 20, avg: 1.8 },
  { month: 'Mar', tickets: 20, resolved: 19, avg: 1.5 },
  { month: 'Apr', tickets: 31, resolved: 28, avg: 2.3 },
  { month: 'May', tickets: 26, resolved: 24, avg: 1.9 },
  { month: 'Jun', tickets: 22, resolved: 21, avg: 1.4 },
];

const AnalyticsPage = () => {
  const { tickets, users } = useApp();
  const tenants = users.filter(u => u.role === 'tenant').length;
  const resolvedRate = tickets.length > 0 ? Math.round((tickets.filter(t => t.status === 'resolved').length / tickets.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tickets', value: tickets.length, icon: Wrench, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
          { label: 'Resolution Rate', value: `${resolvedRate}%`, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { label: 'Active Tenants', value: tenants, icon: Users, color: 'text-sky-400', bg: 'bg-sky-500/10', border: 'border-sky-500/20' },
          { label: 'Avg. Response', value: '1.8h', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card>
              <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border mb-3', s.bg, s.border)}>
                <s.icon className={cn('w-4 h-4', s.color)} />
              </div>
              <p className="text-2xl font-bold text-zinc-100">{s.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <p className="text-sm font-semibold text-zinc-200 mb-4">Monthly Ticket Volume</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={MONTHLY_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: '#18181b', border: '1px solid #27272a', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="tickets" fill="#6366f1" radius={[4, 4, 0, 0]} name="Opened" />
            <Bar dataKey="resolved" fill="#10b981" radius={[4, 4, 0, 0]} name="Resolved" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <p className="text-sm font-semibold text-zinc-200 mb-4">Priority Breakdown</p>
          <div className="space-y-3">
            {(['emergency', 'high', 'medium', 'low'] as const).map(p => {
              const count = tickets.filter(t => t.priority === p).length;
              const pct = tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0;
              const pc = priorityConfig[p];
              return (
                <div key={p}>
                  <div className="flex justify-between mb-1">
                    <span className={cn('text-xs font-medium', pc.color.split(' ')[0])}>{pc.label}</span>
                    <span className="text-xs text-zinc-500">{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', pc.dot)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <p className="text-sm font-semibold text-zinc-200 mb-4">Top Issues by Category</p>
          <div className="space-y-2">
            {(['hvac', 'plumbing', 'electrical', 'general'] as const).map(cat => {
              const count = tickets.filter(t => t.category === cat).length;
              const pct = tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0;
              return (
                <div key={cat} className="flex items-center gap-3 p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/40">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                  </div>
                  <span className="flex-1 text-sm text-zinc-300 capitalize">{cat}</span>
                  <span className="text-xs font-semibold text-zinc-300">{count}</span>
                  <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ============================================================================
// AI CONSOLE PAGE
// ============================================================================
const AIConsolePage = () => {
  const { tickets, users } = useApp();
  const autoResolved = 3;
  const triaged = tickets.length;
  const accuracy = 94;

  return (
    <div className="space-y-6">
      <div className="p-5 bg-gradient-to-br from-indigo-500/8 to-purple-500/8 border border-indigo-500/15 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">Nexus AI Engine</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-zinc-400">Operational</span>
            </div>
          </div>
          <Badge variant="ai" className="ml-auto">GPT-4o</Badge>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">AI-powered triage, automatic priority scoring, and intelligent routing for all incoming maintenance requests.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Requests Triaged', value: triaged, icon: Bot, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
          { label: 'Auto-Resolved', value: autoResolved, icon: Zap, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { label: 'Routing Accuracy', value: `${accuracy}%`, icon: Fingerprint, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
        ].map(s => (
          <Card key={s.label}>
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center border mb-3', s.bg, s.border)}>
              <s.icon className={cn('w-4 h-4', s.color)} />
            </div>
            <p className="text-2xl font-bold text-zinc-100">{s.value}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      <Card>
        <p className="text-sm font-semibold text-zinc-200 mb-4">Automation Rules</p>
        <div className="space-y-2">
          {[
            { trigger: 'Water or flood keywords detected', action: 'Create emergency plumbing ticket + notify team', active: true },
            { trigger: 'Electrical hazard keywords detected', action: 'Create emergency electrical ticket + notify team', active: true },
            { trigger: 'HVAC / temperature complaint', action: 'Create high-priority HVAC ticket', active: true },
            { trigger: 'Ticket unacknowledged > 2 hours', action: 'Escalate priority and re-notify admin', active: false },
            { trigger: 'Ticket unresolved > 48 hours (emergency)', action: 'Send escalation alert to property owner', active: true },
          ].map((rule, i) => (
            <div key={i} className="flex items-start gap-3 p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/40">
              <div className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2', rule.active ? 'bg-emerald-400' : 'bg-zinc-600')} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-300">If: <span className="text-zinc-100">{rule.trigger}</span></p>
                <p className="text-xs text-zinc-500 mt-0.5">Then: {rule.action}</p>
              </div>
              <Badge variant={rule.active ? 'success' : 'default'}>{rule.active ? 'Active' : 'Paused'}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-zinc-200 mb-4">Recent AI Actions</p>
        <div className="space-y-2">
          {tickets.slice(0, 4).map(t => (
            <div key={t.id} className="flex items-center gap-3 p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/40">
              <Bot className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-zinc-300">Triaged <span className="text-indigo-300">{t.id}</span> — {t.title}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">Assigned priority: {priorityConfig[t.priority].label} · {timeAgo(t.createdAt)}</p>
              </div>
              <span className={cn('px-2 py-0.5 rounded-full text-[11px] font-medium border', priorityConfig[t.priority].color)}>{priorityConfig[t.priority].label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

// ============================================================================
// ORGANIZATIONS PAGE (Super Admin)
// ============================================================================
const OrganizationsPage = () => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-zinc-500">{MOCK_ORGS.length} organizations</p>
        <Button icon={Plus} variant="primary" size="sm">Add Organization</Button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {MOCK_ORGS.map((org, i) => {
          const pc = planConfig[org.plan];
          const orgUsers = dbStore.users.filter(u => u.orgId === org.id);
          return (
            <motion.div key={org.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-zinc-400" />
                  </div>
                  <Badge className={pc.color}>{pc.label}</Badge>
                </div>
                <p className="text-sm font-semibold text-zinc-100 mb-0.5">{org.name}</p>
                <p className="text-xs text-zinc-500 mb-4">Since {new Date(org.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/40">
                    <p className="text-base font-bold text-zinc-100">{org.units}</p>
                    <p className="text-[10px] text-zinc-600">Units</p>
                  </div>
                  <div className="p-2.5 bg-zinc-950/60 rounded-xl border border-zinc-800/40">
                    <p className="text-base font-bold text-zinc-100">{orgUsers.length}</p>
                    <p className="text-[10px] text-zinc-600">Users</p>
                  </div>
                </div>
                <div className="flex -space-x-1.5">
                  {orgUsers.slice(0, 4).map(u => <Avatar key={u.id} name={u.name} size="sm" />)}
                  {orgUsers.length > 4 && <div className="w-7 h-7 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[10px] text-zinc-400 font-medium">+{orgUsers.length - 4}</div>}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// SETTINGS PAGE
// ============================================================================
const SettingsPage = () => {
  const { user, org } = useApp();
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifPush, setNotifPush] = useState(true);
  const [notifSms, setNotifSms] = useState(false);

  return (
    <div className="space-y-4 max-w-2xl">
      <Card>
        <p className="text-sm font-semibold text-zinc-100 mb-4">Profile</p>
        <div className="flex items-center gap-4 mb-5">
          <Avatar name={user?.name || ''} size="lg" />
          <div>
            <p className="text-sm font-semibold text-zinc-100">{user?.name}</p>
            <p className="text-xs text-zinc-500">{user?.email}</p>
            <Badge variant={roleVariants[user?.role || 'tenant'] as any} className="mt-1.5">{roleLabels[user?.role || 'tenant']}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Full Name" defaultValue={user?.name} />
          <Input label="Email" type="email" defaultValue={user?.email} />
          {user?.unit && <Input label="Unit" defaultValue={user.unit} disabled className="opacity-60 cursor-not-allowed" />}
        </div>
        <Button variant="primary" size="md" className="mt-4">Save Changes</Button>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-zinc-100 mb-4">Notifications</p>
        <div className="space-y-3">
          {[
            { label: 'Email notifications', desc: 'Receive updates and alerts via email', value: notifEmail, set: setNotifEmail },
            { label: 'Push notifications', desc: 'Browser push notifications for urgent alerts', value: notifPush, set: setNotifPush },
            { label: 'SMS notifications', desc: 'Text messages for emergency alerts only', value: notifSms, set: setNotifSms },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/40">
              <div>
                <p className="text-sm font-medium text-zinc-200">{item.label}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
              </div>
              <button onClick={() => item.set(!item.value)} className={cn('w-10 h-5.5 rounded-full transition-all relative flex-shrink-0', item.value ? 'bg-indigo-500' : 'bg-zinc-700')}>
                <span className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all', item.value ? 'left-5.5' : 'left-0.5')} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-sm font-semibold text-zinc-100 mb-4">Security</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/40">
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-zinc-500" />
              <div>
                <p className="text-sm font-medium text-zinc-200">Password</p>
                <p className="text-xs text-zinc-500">Last changed 3 months ago</p>
              </div>
            </div>
            <Button variant="secondary" size="sm">Change</Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/40">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-4 h-4 text-zinc-500" />
              <div>
                <p className="text-sm font-medium text-zinc-200">Two-factor authentication</p>
                <p className="text-xs text-zinc-500">Add an extra layer of security</p>
              </div>
            </div>
            <Button variant="ai" size="sm">Enable</Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-zinc-950/60 rounded-xl border border-zinc-800/40">
            <div className="flex items-center gap-3">
              <KeyRound className="w-4 h-4 text-zinc-500" />
              <div>
                <p className="text-sm font-medium text-zinc-200">API Keys</p>
                <p className="text-xs text-zinc-500">Manage programmatic access</p>
              </div>
            </div>
            <Button variant="secondary" size="sm">Manage</Button>
          </div>
        </div>
      </Card>

      {org && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-zinc-100">Organization</p>
            <Badge className={planConfig[org.plan].color}>{planConfig[org.plan].label}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <Input label="Organization Name" defaultValue={org.name} />
            <Input label="Plan" defaultValue={org.plan} disabled className="opacity-60 cursor-not-allowed capitalize" />
          </div>
          <Button variant="secondary" size="sm" className="border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/10">Upgrade Plan</Button>
        </Card>
      )}
    </div>
  );
};

// ============================================================================
// PAGE TITLES
// ============================================================================
const PAGE_TITLES: Record<PageKey, string> = {
  dashboard: 'Dashboard',
  tickets: 'Tickets',
  users: 'People',
  analytics: 'Analytics',
  ai: 'AI Console',
  organizations: 'Organizations',
  settings: 'Settings',
};

// ============================================================================
// SHELL / LAYOUT
// ============================================================================
const AppShell = () => {
  const { user } = useApp();
  const [page, setPage] = useState<PageKey>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  if (!user) return <LoginPage />;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex overflow-hidden">
      <div className="hidden lg:flex w-60 flex-shrink-0 h-screen sticky top-0">
        <Sidebar current={page} onNavigate={setPage} />
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-zinc-950/80 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 inset-y-0 z-50 w-72 lg:hidden">
              <Sidebar current={page} onNavigate={setPage} mobile onClose={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <TopBar title={PAGE_TITLES[page]} onMenuToggle={() => setMobileOpen(v => !v)} onNavigate={setPage} onShowNotifications={() => setShowNotifs(v => !v)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div key={page} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
              {page === 'dashboard' && <DashboardPage onNavigate={setPage} />}
              {page === 'tickets' && <TicketsPage />}
              {page === 'users' && <UsersPage />}
              {page === 'analytics' && <AnalyticsPage />}
              {page === 'ai' && <AIConsolePage />}
              {page === 'organizations' && <OrganizationsPage />}
              {page === 'settings' && <SettingsPage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <AnimatePresence>
        {showNotifs && <NotificationsPanel onClose={() => setShowNotifs(false)} />}
      </AnimatePresence>

      <AIChatbot />
    </div>
  );
};

// ============================================================================
// ROOT
// ============================================================================
export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
