import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createAuthenticatedRequest } from "@/lib/auth";
import {
  Send, Bot, Key, Shield, Bell, MessageSquare, Terminal, Globe,
  RefreshCw, CheckCircle2, AlertTriangle, XCircle, Play, Sparkles,
  ExternalLink, Trash2, Plus, Eye, EyeOff, Radio, Cpu,
  Layers, ShoppingCart, UserCheck, MessageCircle, Info, PhoneCall,
  Flame, Check, Loader2, Users, Search, Copy, CheckCheck, User,
  UserPlus, Ban, Smartphone, Hash, Calendar, Clock, MessageSquarePlus,
  UserX, ArrowRight, ShieldCheck, Mail, SlidersHorizontal, Zap,
  FolderTree, ChevronDown, ChevronUp, ChevronLeft, CornerDownLeft, ListTree,
  Image as ImageIcon, Video, FileText, Music, Paperclip, UploadCloud, X
} from "lucide-react";

export interface TelegramBotUser {
  chatId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  phoneVerifiedAt?: string;
  languageCode?: string;
  firstSeenAt: string;
  lastActiveAt: string;
  messageCount: number;
  lastMessage?: string;
  isBlocked?: boolean;
  notes?: string;
}

interface TelegramButton {
  id: string;
  text: string;
  type: "url" | "command" | "text";
  value: string;
}

export interface TelegramCommandResponse {
  id: string;
  command: string;
  description: string;
  response: string;
  isEnabled: boolean;
  isSystem?: boolean;
  parentId?: string | null;
  mediaType?: "photo" | "video" | "document" | "audio" | "none";
  mediaUrl?: string;
}

interface TelegramLogEntry {
  id: string;
  timestamp: string;
  type: "info" | "success" | "warning" | "error" | "webhook" | "notification";
  message: string;
  details?: any;
}

interface TelegramConfig {
  botToken: string;
  isEnabled: boolean;
  botUsername?: string;
  botFirstName?: string;
  botId?: number;
  adminChatId: string;
  apiBaseUrl: string;
  webhookUrl?: string;
  isWebhookSet: boolean;
  notifications: {
    successBloPalTxLevel1: boolean;
    answeredTicketLevel1: boolean;
    subscriptionExpiry3DaysLevel1: boolean;
    newAnnouncementsLevel1: boolean;
  };
  botResponses: {
    welcomeMessage: string;
    helpMessage: string;
    aboutMessage: string;
    contactMessage: string;
    enableCatalog: boolean;
    enableOrderTracking: boolean;
  };
  menuButtons: TelegramButton[];
  botCommands?: TelegramCommandResponse[];
  botUsers?: TelegramBotUser[];
  stats: {
    totalMessagesSent: number;
    totalUpdatesReceived: number;
    lastActiveAt?: string;
  };
  logs: TelegramLogEntry[];
  updatedAt?: string;
}

export default function TelegramBotPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local Form States
  const [botToken, setBotToken] = useState("");
  const [isEnabled, setIsEnabled] = useState(false);
  const [adminChatId, setAdminChatId] = useState("");
  const [apiBaseUrl, setApiBaseUrl] = useState("https://api.telegram.org");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [showToken, setShowToken] = useState(false);

  // Notification States
  const [notifications, setNotifications] = useState({
    successBloPalTxLevel1: true,
    answeredTicketLevel1: true,
    subscriptionExpiry3DaysLevel1: true,
    newAnnouncementsLevel1: true,
  });

  // Bot Auto Responses
  const [botResponses, setBotResponses] = useState({
    welcomeMessage: "",
    helpMessage: "",
    aboutMessage: "",
    contactMessage: "",
    enableCatalog: true,
    enableOrderTracking: true,
  });

  // Menu Buttons
  const [menuButtons, setMenuButtons] = useState<TelegramButton[]>([]);
  const [newBtnText, setNewBtnText] = useState("");
  const [newBtnType, setNewBtnType] = useState<"url" | "command">("url");
  const [newBtnValue, setNewBtnValue] = useState("");

  // Dynamic Bot Commands & Responses
  const [botCommands, setBotCommands] = useState<TelegramCommandResponse[]>([]);
  const [newCmdName, setNewCmdName] = useState("");
  const [newCmdDesc, setNewCmdDesc] = useState("");
  const [newCmdResponse, setNewCmdResponse] = useState("");
  const [newCmdParentId, setNewCmdParentId] = useState<string>("root");
  const [newCmdMediaType, setNewCmdMediaType] = useState<"none" | "photo" | "video" | "document" | "audio">("none");
  const [newCmdMediaUrl, setNewCmdMediaUrl] = useState<string>("");
  const [isUploadingCmdMedia, setIsUploadingCmdMedia] = useState<boolean>(false);
  const [collapsedParents, setCollapsedParents] = useState<Record<string, boolean>>({});
  const [commandSearchQuery, setCommandSearchQuery] = useState("");
  const [editingCmdId, setEditingCmdId] = useState<string | null>(null);
  const [isAddCmdModalOpen, setIsAddCmdModalOpen] = useState(false);

  // Test Message & Broadcast states
  const [testChatId, setTestChatId] = useState("");
  const [testCustomMessage, setTestCustomMessage] = useState("");
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastButtonText, setBroadcastButtonText] = useState("");
  const [broadcastButtonUrl, setBroadcastButtonUrl] = useState("");
  const [broadcastCustomTarget, setBroadcastCustomTarget] = useState("");

  // Users Sub-Tabs and Filter States
  const [usersSubTab, setUsersSubTab] = useState<"bot_users" | "system_users">("bot_users");
  const [botUserSearch, setBotUserSearch] = useState("");
  const [botUserFilterStatus, setBotUserFilterStatus] = useState<"all" | "active" | "with_phone" | "blocked">("all");
  const [copiedChatId, setCopiedChatId] = useState<string | null>(null);

  // Direct Message Modal States
  const [directMsgModalOpen, setDirectMsgModalOpen] = useState(false);
  const [directMsgTargetUser, setDirectMsgTargetUser] = useState<TelegramBotUser | null>(null);
  const [directMsgText, setDirectMsgText] = useState("");
  const [directMsgBtnText, setDirectMsgBtnText] = useState("");
  const [directMsgBtnUrl, setDirectMsgBtnUrl] = useState("");

  // Add Bot User Modal States
  const [addBotUserModalOpen, setAddBotUserModalOpen] = useState(false);
  const [newBotChatId, setNewBotChatId] = useState("");
  const [newBotUsername, setNewBotUsername] = useState("");
  const [newBotFirstName, setNewBotFirstName] = useState("");
  const [newBotLastName, setNewBotLastName] = useState("");
  const [newBotPhoneNumber, setNewBotPhoneNumber] = useState("");
  const [newBotNotes, setNewBotNotes] = useState("");

  // System Users List Request States
  const [usersFilterRole, setUsersFilterRole] = useState("all");
  const [usersLimit, setUsersLimit] = useState(25);
  const [usersSearchQuery, setUsersSearchQuery] = useState("");
  const [usersTargetChatId, setUsersTargetChatId] = useState("");
  const [copiedCommand, setCopiedCommand] = useState(false);

  // Fetch Telegram Bot Users
  const {
    data: botUsers = [],
    isLoading: isLoadingBotUsers,
    refetch: refetchBotUsers,
  } = useQuery<TelegramBotUser[]>({
    queryKey: ["/api/admin/telegram/bot-users"],
    queryFn: async () => {
      try {
        const res = await createAuthenticatedRequest("/api/admin/telegram/bot-users");
        if (!res.ok) return [];
        return await res.json();
      } catch (e) {
        return [];
      }
    },
  });

  // Fetch System Users for Preview
  const { data: appUsers = [], isLoading: isLoadingUsers } = useQuery<any[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      try {
        const res = await createAuthenticatedRequest("/api/users");
        if (!res.ok) return [];
        return await res.json();
      } catch (e) {
        return [];
      }
    },
  });

  // Live Telegram Bot Info & Webhook query
  const { data: config, isLoading, refetch } = useQuery<TelegramConfig>({
    queryKey: ["/api/admin/telegram/config"],
    queryFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/telegram/config");
      if (!res.ok) throw new Error("خطا در دریافت تنظیمات ربات تلگرام");
      return res.json();
    },
  });

  // Populate form with fetched config
  useEffect(() => {
    if (config) {
      setBotToken(config.botToken || "");
      setIsEnabled(config.isEnabled ?? false);
      setAdminChatId(config.adminChatId || "");
      setApiBaseUrl(config.apiBaseUrl || "https://api.telegram.org");
      const defaultWebhook = `${window.location.origin.replace(/^http:\/\//, "https://")}/api/telegram/webhook`;
      setWebhookUrl(config.webhookUrl || defaultWebhook);
      setNotifications(config.notifications || {
        successBloPalTxLevel1: true,
        answeredTicketLevel1: true,
        subscriptionExpiry3DaysLevel1: true,
        newAnnouncementsLevel1: true,
      });
      setBotResponses(config.botResponses || {
        welcomeMessage: "",
        helpMessage: "",
        aboutMessage: "",
        contactMessage: "",
        enableCatalog: true,
        enableOrderTracking: true,
      });
      setMenuButtons(config.menuButtons || []);
      setBotCommands(config.botCommands || []);
      if (config.adminChatId && !testChatId) {
        setTestChatId(config.adminChatId);
      }
    }
  }, [config]);

  // Mutations
  const saveConfigMutation = useMutation({
    mutationFn: async (updatedData: Partial<TelegramConfig>) => {
      const res = await createAuthenticatedRequest("/api/admin/telegram/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "خطا در ذخیره تنظیمات");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/config"] });
      toast({
        title: "ذخیره شد",
        description: data.message || "تنظیمات ربات تلگرام با موفقیت ذخیره شد",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا",
        description: err.message || "خطا در ذخیره تنظیمات",
        variant: "destructive",
      });
    },
  });

  const syncCommandsMutation = useMutation({
    mutationFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/telegram/refresh-menu", {
        method: "POST",
        body: JSON.stringify({ targetChatId: adminChatId.trim() || undefined }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "خطا در همگام‌سازی منو");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/config"] });
      toast({
        title: "منوی تلگرام بروزرسانی شد",
        description: data.message || "منوی ربات تلگرام با موفقیت همگام‌سازی شد و صفحه کلید جدید اعمال گردید.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در بروزرسانی منو",
        description: err.message || "اطمینان حاصل کنید توکن معتبر و ربات فعال است",
        variant: "destructive",
      });
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/telegram/test-connection", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا در بررسی توکن ربات");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/config"] });
      toast({
        title: "اتصال موفق",
        description: data.message || `با موفقیت به ربات تلگرام متصل شد`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطای اعتبارسنجی",
        description: err.message || "توکن ربات نامعتبر است یا ارتباط با تلگرام ممکن نیست",
        variant: "destructive",
      });
    },
  });

  const sendTestMessageMutation = useMutation({
    mutationFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/telegram/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetChatId: testChatId || adminChatId,
          message: testCustomMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا در ارسال پیام تست");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/config"] });
      toast({
        title: "ارسال شد",
        description: data.message || "پیام تستی به تلگرام ارسال گردید",
      });
      setTestCustomMessage("");
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ارسال",
        description: err.message || "امکان ارسال پیام تست وجود ندارد",
        variant: "destructive",
      });
    },
  });

  // Query Telegram getWebhookInfo
  const { data: webhookInfo, refetch: refetchWebhookInfo, isFetching: isFetchingWebhookInfo } = useQuery<{
    success: boolean;
    data?: {
      url: string;
      has_custom_certificate: boolean;
      pending_update_count: number;
      last_error_date?: number;
      last_error_message?: string;
      max_connections?: number;
    };
  }>({
    queryKey: ["/api/admin/telegram/webhook-info"],
    queryFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/telegram/webhook-info");
      if (!res.ok) return { success: false };
      return res.json();
    },
    enabled: Boolean(botToken),
  });

  const setWebhookMutation = useMutation({
    mutationFn: async (customUrl?: string) => {
      let targetUrl = (typeof customUrl === "string" && customUrl.trim() ? customUrl : webhookUrl || "").trim();
      if (!targetUrl) {
        targetUrl = `${window.location.origin.replace(/^http:\/\//, "https://")}/api/telegram/webhook`;
      }
      if (targetUrl.startsWith("http://")) {
        targetUrl = targetUrl.replace(/^http:\/\//, "https://");
      } else if (!targetUrl.startsWith("https://")) {
        targetUrl = `https://${targetUrl}`;
      }

      const res = await createAuthenticatedRequest("/api/admin/telegram/set-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: targetUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا در تنظیم وب‌هوک");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/webhook-info"] });
      refetchWebhookInfo();
      toast({
        title: "وب‌هوک با موفقیت فعال شد",
        description: data.message || `وب‌هوک تلگرام روی ${data.webhookUrl} تنظیم شد`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطای وب‌هوک",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteWebhookMutation = useMutation({
    mutationFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/telegram/delete-webhook", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا در حذف وب‌هوک");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/webhook-info"] });
      refetchWebhookInfo();
      toast({
        title: "وب‌هوک حذف شد",
        description: data.message || "وب‌هوک با موفقیت غیرفعال گردید",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const broadcastMutation = useMutation({
    mutationFn: async () => {
      const targetList = broadcastCustomTarget.trim() 
        ? broadcastCustomTarget.split(",").map(s => s.trim()).filter(Boolean)
        : (adminChatId ? [adminChatId] : []);

      const button = broadcastButtonText && broadcastButtonUrl ? {
        text: broadcastButtonText.trim(),
        url: broadcastButtonUrl.trim(),
      } : undefined;

      const res = await createAuthenticatedRequest("/api/admin/telegram/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatIds: targetList,
          text: broadcastText,
          button,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا در ارسال همگانی");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/config"] });
      toast({
        title: "ارسال همگانی انجام شد",
        description: `تعداد ${data.sentCount || 0} پیام ارسال شد (${data.failedCount || 0} ناموفق)`,
      });
      setBroadcastText("");
      setBroadcastButtonText("");
      setBroadcastButtonUrl("");
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ارسال",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const sendUsersListMutation = useMutation({
    mutationFn: async (customParams?: { target?: string; role?: string; limit?: number; search?: string }) => {
      const target = customParams?.target || usersTargetChatId || adminChatId;
      if (!target) throw new Error("شناسه چت تلگرام مدیر وارد نشده است. لطفاً ابتدا در کادر بالا شناسه را وارد کنید.");

      const res = await createAuthenticatedRequest("/api/admin/telegram/send-users-list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetChatId: target,
          role: customParams?.role || usersFilterRole,
          limit: customParams?.limit || usersLimit,
          search: customParams?.search !== undefined ? customParams.search : usersSearchQuery,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا در ارسال لیست کاربران به تلگرام");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/config"] });
      toast({
        title: "لیست کاربران ارسال شد ✅",
        description: data.message || "اطلاعات کاربران با موفقیت به چت تلگرام ارسال گردید",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ارسال لیست به تلگرام",
        description: err.message || "امکان ارسال لیست به تلگرام وجود ندارد",
        variant: "destructive",
      });
    },
  });

  // Add / Edit Bot User Mutation
  const addBotUserMutation = useMutation({
    mutationFn: async (payload: {
      chatId: string;
      username?: string;
      firstName?: string;
      lastName?: string;
      phoneNumber?: string;
      notes?: string;
    }) => {
      const res = await createAuthenticatedRequest("/api/admin/telegram/bot-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا در ثبت کاربر ربات تلگرام");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/bot-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/config"] });
      toast({
        title: "کاربر با موفقیت ثبت شد",
        description: data.message || "مشخصات کاربر در لیست ربات تلگرام ذخیره گردید",
      });
      setAddBotUserModalOpen(false);
      setNewBotChatId("");
      setNewBotUsername("");
      setNewBotFirstName("");
      setNewBotLastName("");
      setNewBotPhoneNumber("");
      setNewBotNotes("");
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ثبت کاربر",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Delete Bot User Mutation
  const deleteBotUserMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const res = await createAuthenticatedRequest(`/api/admin/telegram/bot-users/${chatId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا در حذف کاربر");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/bot-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/config"] });
      toast({
        title: "کاربر حذف شد",
        description: data.message || "کاربر از فهرست ربات تلگرام حذف شد",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در حذف کاربر",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Toggle Block Bot User Mutation
  const toggleBlockBotUserMutation = useMutation({
    mutationFn: async (chatId: string) => {
      const res = await createAuthenticatedRequest(`/api/admin/telegram/bot-users/${chatId}/toggle-block`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا در تغییر وضعیت کاربر");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/bot-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/config"] });
      toast({
        title: "وضعیت کاربر به‌روز شد",
        description: data.message,
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در تغییر وضعیت",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Live Polling Query
  const { data: pollingStatus } = useQuery<{
    isPolling: boolean;
    lastUpdateId: number;
    isWebhookSet: boolean;
    isEnabled: boolean;
    hasToken: boolean;
  }>({
    queryKey: ["/api/admin/telegram/polling/status"],
    queryFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/telegram/polling/status");
      if (!res.ok) return { isPolling: false, lastUpdateId: 0, isWebhookSet: false, isEnabled: false, hasToken: false };
      return res.json();
    },
    refetchInterval: 4000,
  });

  const startPollingMutation = useMutation({
    mutationFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/telegram/polling/start", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا در راه‌اندازی دریافت خودکار پیام‌ها");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/polling/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/config"] });
      toast({
        title: "دریافت زنده فعال شد",
        description: data.message || "دریافت خودکار پیام‌های تلگرام (Polling) با موفقیت فعال شد",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در فعال‌سازی",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const stopPollingMutation = useMutation({
    mutationFn: async () => {
      const res = await createAuthenticatedRequest("/api/admin/telegram/polling/stop", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا در توقف دریافت خودکار پیام‌ها");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/polling/status"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/config"] });
      toast({
        title: "دریافت زنده متوقف شد",
        description: data.message || "دریافت خودکار پیام‌ها متوقف گردید",
      });
    },
    onError: (err: any) => {
      toast({
        title: "خطا در توقف",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Send Direct Message to specific Telegram Chat
  const sendDirectMessageMutation = useMutation({
    mutationFn: async (payload: {
      chatId: string;
      message: string;
      buttonText?: string;
      buttonUrl?: string;
    }) => {
      const res = await createAuthenticatedRequest("/api/admin/telegram/send-direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "خطا در ارسال پیام مستقیم");
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/bot-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/telegram/config"] });
      toast({
        title: "پیام ارسال شد ✅",
        description: data.message || "پیام با موفقیت به کاربر در تلگرام ارسال شد",
      });
      setDirectMsgModalOpen(false);
      setDirectMsgText("");
      setDirectMsgBtnText("");
      setDirectMsgBtnUrl("");
      setDirectMsgTargetUser(null);
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ارسال پیام",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Filtered Telegram Bot Users
  const filteredBotUsers = useMemo(() => {
    return botUsers.filter((u) => {
      // Filter status
      if (botUserFilterStatus === "active" && u.isBlocked) return false;
      if (botUserFilterStatus === "with_phone" && !u.phoneNumber) return false;
      if (botUserFilterStatus === "blocked" && !u.isBlocked) return false;

      // Filter search
      if (!botUserSearch.trim()) return true;
      const q = botUserSearch.toLowerCase().trim();
      const matchName = (u.firstName + " " + (u.lastName || "")).toLowerCase().includes(q);
      const matchUsername = (u.username || "").toLowerCase().includes(q);
      const matchChatId = String(u.chatId).includes(q);
      const matchPhone = (u.phoneNumber || "").toLowerCase().includes(q);
      const matchLastMsg = (u.lastMessage || "").toLowerCase().includes(q);
      const matchNotes = (u.notes || "").toLowerCase().includes(q);

      return matchName || matchUsername || matchChatId || matchPhone || matchLastMsg || matchNotes;
    });
  }, [botUsers, botUserSearch, botUserFilterStatus]);

  // Handle Full Save
  const handleSaveAll = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    saveConfigMutation.mutate({
      botToken: botToken.trim(),
      isEnabled,
      adminChatId: adminChatId.trim(),
      apiBaseUrl: apiBaseUrl.trim(),
      notifications,
      botResponses,
      menuButtons,
      botCommands,
    });
  };

  // Add custom interactive button
  const handleAddButton = () => {
    if (!newBtnText.trim() || !newBtnValue.trim()) {
      toast({
        title: "خطای ورودی",
        description: "عنوان و مقدار دکمه الزامی است",
        variant: "destructive",
      });
      return;
    }

    const newBtn: TelegramButton = {
      id: "btn-" + Math.random().toString(36).substring(2, 8),
      text: newBtnText.trim(),
      type: newBtnType,
      value: newBtnValue.trim(),
    };

    const updated = [...menuButtons, newBtn];
    setMenuButtons(updated);
    setNewBtnText("");
    setNewBtnValue("");

    // Auto save
    saveConfigMutation.mutate({ menuButtons: updated });
  };

  const handleRemoveButton = (id: string) => {
    const updated = menuButtons.filter(b => b.id !== id);
    setMenuButtons(updated);
    saveConfigMutation.mutate({ menuButtons: updated });
  };

  const handleAddCommand = () => {
    if (!newCmdName.trim()) {
      toast({
        title: "خطا",
        description: "دستور نمی‌تواند خالی باشد",
        variant: "destructive"
      });
      return;
    }
    if (!newCmdResponse.trim() && !newCmdMediaUrl.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً متن پاسخ یا آدرس لینک/رسانه را وارد کنید",
        variant: "destructive"
      });
      return;
    }

    let formattedCmd = newCmdName.trim();
    if (!formattedCmd.startsWith("/") && !formattedCmd.match(/^[a-zA-Z0-9_\u0600-\u06FF\s]+$/)) {
      formattedCmd = "/" + formattedCmd;
    }

    if (botCommands.some(c => c.command.toLowerCase() === formattedCmd.toLowerCase())) {
      toast({
        title: "خطا",
        description: "این دستور از قبل تعریف شده است",
        variant: "destructive"
      });
      return;
    }

    const parentId = newCmdParentId === "root" ? null : newCmdParentId;
    const finalResponse = newCmdResponse.trim() || (newCmdMediaUrl.trim() ? `🎥 مشاهده ویدیو / لینک:\n${newCmdMediaUrl.trim()}` : "پاسخ ثبت شده");

    const newCmd: TelegramCommandResponse = {
      id: "cmd-" + Math.random().toString(36).substring(2, 9),
      command: formattedCmd,
      description: newCmdDesc.trim() || `دستور سفارشی ${formattedCmd}`,
      response: finalResponse,
      isEnabled: true,
      isSystem: false,
      parentId: parentId || null,
      mediaType: newCmdMediaType,
      mediaUrl: newCmdMediaUrl.trim(),
    };

    const updated = [...botCommands, newCmd];
    setBotCommands(updated);
    setNewCmdName("");
    setNewCmdDesc("");
    setNewCmdResponse("");
    setNewCmdParentId("root");
    setNewCmdMediaType("none");
    setNewCmdMediaUrl("");
    setIsAddCmdModalOpen(false);

    if (parentId) {
      setCollapsedParents(prev => ({ ...prev, [parentId]: false }));
    }

    saveConfigMutation.mutate({ botCommands: updated });
    toast({
      title: "موفقیت",
      description: parentId 
        ? `زیردستور ${formattedCmd} با موفقیت اضافه شد`
        : `دستور اصلی ${formattedCmd} با موفقیت اضافه شد`
    });
  };

  const handleUploadCmdMedia = async (file: File, isEditCmdId?: string) => {
    try {
      setIsUploadingCmdMedia(true);
      const formData = new FormData();
      formData.append("file", file);

      const res = await createAuthenticatedRequest("/api/admin/telegram/upload-media", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "خطا در آپلود فایل رسانه");
      }

      const data = await res.json();
      
      if (isEditCmdId) {
        const updated = botCommands.map(c => {
          if (c.id === isEditCmdId) {
            return { ...c, mediaType: data.mediaType, mediaUrl: data.mediaUrl };
          }
          return c;
        });
        setBotCommands(updated);
        saveConfigMutation.mutate({ botCommands: updated });
        toast({
          title: "آپلود رسانه موفقیت‌آمیز بود",
          description: `فایل رسانه با موفقیت به دستور متصل گردید`,
        });
      } else {
        setNewCmdMediaType(data.mediaType);
        setNewCmdMediaUrl(data.mediaUrl);
        toast({
          title: "آپلود رسانه موفقیت‌آمیز بود",
          description: `فایل با موفقیت آپلود و پیوست شد (${data.mediaType === 'photo' ? 'تصویر' : data.mediaType === 'video' ? 'ویدیو' : data.mediaType === 'audio' ? 'صوتی' : 'فایل/سند'})`,
        });
      }
    } catch (err: any) {
      toast({
        title: "خطا در آپلود",
        description: err.message || "آپلود فایل با خطا مواجه شد",
        variant: "destructive",
      });
    } finally {
      setIsUploadingCmdMedia(false);
    }
  };

  const handleRemoveCommand = (id: string) => {
    const getDescendants = (parentId: string): string[] => {
      const children = botCommands.filter(c => c.parentId === parentId);
      let ids: string[] = children.map(c => c.id);
      for (const child of children) {
        ids = [...ids, ...getDescendants(child.id)];
      }
      return ids;
    };

    const idsToRemove = new Set([id, ...getDescendants(id)]);
    const updated = botCommands.filter(c => !idsToRemove.has(c.id));
    setBotCommands(updated);
    saveConfigMutation.mutate({ botCommands: updated });
    toast({
      title: "موفقیت",
      description: "دستور و تمام زیردستورهای آن حذف شدند"
    });
  };

  const handleChangeCommandParent = (id: string, newParentId: string | null) => {
    const updated = botCommands.map(c => {
      if (c.id === id) {
        return { ...c, parentId: newParentId };
      }
      return c;
    });
    setBotCommands(updated);
    saveConfigMutation.mutate({ botCommands: updated });
    toast({
      title: "موقعیت منو به‌روز شد",
      description: "ساختار درختی منو با موفقیت ذخیره گردید",
    });
  };

  const handleStartAddSubCommand = (parentCmdId: string) => {
    setNewCmdParentId(parentCmdId);
    setCollapsedParents(prev => ({ ...prev, [parentCmdId]: false }));
    setIsAddCmdModalOpen(true);
  };

  const toggleParentCollapse = (id: string) => {
    setCollapsedParents(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleCommand = (id: string, isEnabled: boolean) => {
    const updated = botCommands.map(c => {
      if (c.id === id) {
        return { ...c, isEnabled };
      }
      return c;
    });
    setBotCommands(updated);
    saveConfigMutation.mutate({ botCommands: updated });
  };

  const handleUpdateCommandResponse = (id: string, response: string) => {
    const updated = botCommands.map(c => {
      if (c.id === id) {
        return { ...c, response };
      }
      return c;
    });
    setBotCommands(updated);
  };

  const handleUpdateCommandMedia = (id: string, mediaType: "photo" | "video" | "document" | "audio" | "none", mediaUrl: string) => {
    const updated = botCommands.map(c => {
      if (c.id === id) {
        return { ...c, mediaType, mediaUrl };
      }
      return c;
    });
    setBotCommands(updated);
    saveConfigMutation.mutate({ botCommands: updated });
  };

  const getFormattedCommandOptions = (commands: TelegramCommandResponse[]) => {
    const options: { id: string; label: string; depth: number }[] = [];

    const addChildren = (parentId: string | null, depth: number) => {
      const children = commands.filter(c => (c.parentId || null) === parentId);
      for (const child of children) {
        const indent = "— ".repeat(depth);
        options.push({
          id: child.id,
          label: `${indent}${depth > 0 ? "↳ " : ""}${child.command} (${child.description || "بدون عنوان"})`,
          depth,
        });
        addChildren(child.id, depth + 1);
      }
    };

    addChildren(null, 0);
    return options;
  };

  const renderCommandTree = (parentId: string | null = null, depth: number = 0) => {
    let currentCommands = botCommands.filter(c => (c.parentId || null) === parentId);

    if (commandSearchQuery.trim() && depth === 0) {
      const q = commandSearchQuery.trim().toLowerCase();
      currentCommands = botCommands.filter(c => 
        c.command.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.response.toLowerCase().includes(q)
      );
    }

    if (currentCommands.length === 0) return null;

    return currentCommands.map((cmd) => {
      const subCommands = botCommands.filter(c => c.parentId === cmd.id);
      const isCollapsed = !!collapsedParents[cmd.id];
      const isEditing = editingCmdId === cmd.id;
      const hasMedia = cmd.mediaType && cmd.mediaType !== "none" && Boolean(cmd.mediaUrl);

      return (
        <div key={cmd.id} className="pt-2 first:pt-0 space-y-1.5">
          {/* Main Compact Command Row */}
          <div className={`rounded-xl border transition-all duration-200 ${
            isEditing
              ? "border-indigo-400 bg-white shadow-sm ring-2 ring-indigo-500/10"
              : depth === 0
              ? "border-slate-200/90 bg-white hover:border-indigo-300 shadow-2xs"
              : depth === 1
              ? "border-indigo-100 bg-indigo-50/20 hover:bg-indigo-50/40"
              : "border-purple-100 bg-purple-50/20 hover:bg-purple-50/40"
          } p-2.5 sm:p-3`}>
            
            {/* Header Row Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              
              {/* Left Column: Command Badge, Title, Level & Media Badges */}
              <div className="flex flex-wrap items-center gap-1.5 shrink-0 sm:shrink">
                {subCommands.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleParentCollapse(cmd.id)}
                    className="h-6 w-6 p-0 text-indigo-600 hover:bg-indigo-100/70 rounded-md shrink-0"
                    title={isCollapsed ? "باز کردن زیردستورها" : "بستن زیردستورها"}
                  >
                    {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                )}

                {depth > 0 && <CornerDownLeft className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}

                {/* Command Tag */}
                <span className="text-[11px] font-bold font-mono px-2 py-0.5 bg-slate-100 text-indigo-900 border border-slate-200/80 rounded-md dir-ltr text-left flex items-center gap-1">
                  {cmd.command}
                </span>

                {/* Command Title */}
                <span className="text-xs font-bold text-slate-800 truncate max-w-[180px] sm:max-w-xs">
                  {cmd.description}
                </span>

                {/* Status Badges */}
                {cmd.isSystem ? (
                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200/60 text-[9px] px-1.5 py-0 rounded">
                    سیستمی
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[9px] px-1.5 py-0 rounded">
                    سفارشی
                  </Badge>
                )}

                {depth === 0 ? (
                  <Badge variant="outline" className="text-[9px] text-slate-500 border-slate-200 px-1.5 py-0">
                    اصلی
                  </Badge>
                ) : (
                  <Badge className="bg-purple-100/80 text-purple-800 border border-purple-200 text-[9px] px-1.5 py-0 rounded">
                    سطح {depth}
                  </Badge>
                )}

                {/* Subcommands Counter Badge */}
                {subCommands.length > 0 && (
                  <Badge className="bg-purple-50 text-purple-700 border border-purple-200/80 text-[9px] px-1.5 py-0 rounded flex items-center gap-1">
                    <FolderTree className="w-3 h-3" />
                    {subCommands.length} زیرمنو
                  </Badge>
                )}

                {/* Media Attached Badge */}
                {hasMedia && (
                  <Badge className="bg-amber-50 text-amber-800 border border-amber-200 text-[9px] px-1.5 py-0 rounded flex items-center gap-1">
                    {cmd.mediaType === "photo" && <ImageIcon className="w-3 h-3 text-amber-600" />}
                    {cmd.mediaType === "video" && <Video className="w-3 h-3 text-amber-600" />}
                    {cmd.mediaType === "document" && <FileText className="w-3 h-3 text-amber-600" />}
                    {cmd.mediaType === "audio" && <Music className="w-3 h-3 text-amber-600" />}
                    {cmd.mediaType === "photo" ? "عکس" : cmd.mediaType === "video" ? "ویدیو" : cmd.mediaType === "audio" ? "صوت" : "فایل"}
                  </Badge>
                )}
              </div>

              {/* Right Column: Controls */}
              <div className="flex items-center gap-1.5">
                {/* Active Switch */}
                <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                  <span className={`text-[9px] font-bold ${cmd.isEnabled ? "text-emerald-600" : "text-slate-400"}`}>
                    {cmd.isEnabled ? "فعال" : "مخفی"}
                  </span>
                  <Switch
                    checked={cmd.isEnabled}
                    onCheckedChange={(checked) => handleToggleCommand(cmd.id, checked)}
                    className="scale-75 data-[state=checked]:bg-emerald-500"
                  />
                </div>

                {/* Add Subcommand Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartAddSubCommand(cmd.id)}
                  className="h-6 text-[10px] font-bold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 border-indigo-200 rounded-md px-2 gap-1"
                  title="افزودن زیردستور برای این منو"
                >
                  <Plus className="w-3 h-3 text-indigo-600" />
                  زیرمنو
                </Button>

                {/* Edit Toggle Button */}
                <Button
                  type="button"
                  variant={isEditing ? "default" : "outline"}
                  size="sm"
                  onClick={() => setEditingCmdId(isEditing ? null : cmd.id)}
                  className={`h-6 text-[10px] font-bold rounded-md px-2 gap-1 ${
                    isEditing 
                      ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                      : "text-slate-700 bg-white border-slate-200 hover:bg-slate-50"
                  }`}
                  title={isEditing ? "بستن پنل ویرایش" : "تنظیمات و پاسخ"}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  {isEditing ? "بستن" : "تنظیمات"}
                </Button>

                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCommand(cmd.id)}
                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md"
                  title="حذف دستور"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Response Snippet Preview Line (Collapsed Mode) */}
            {!isEditing && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <p className="truncate max-w-2xl font-normal text-slate-600">
                  <span className="font-bold text-slate-400 ml-1">پاسخ:</span>
                  {cmd.response || "(بدون پاسخ متنی)"}
                </p>
                <button
                  type="button"
                  onClick={() => setEditingCmdId(cmd.id)}
                  className="text-[10px] text-indigo-600 hover:underline font-semibold shrink-0 mr-2"
                >
                  ویرایش پاسخ ✎
                </button>
              </div>
            )}

            {/* Expanded Detailed Editor */}
            {isEditing && (
              <div className="mt-2.5 pt-2.5 border-t border-indigo-100 space-y-2.5 bg-indigo-50/20 p-2.5 rounded-lg">
                
                {/* Response Textarea */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label className="text-[10px] font-bold text-slate-700 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                      متن پاسخ ربات (پشتیبانی از فرمت HTML)
                    </Label>
                    <span className="text-[9px] text-slate-400 font-mono">
                      {cmd.response?.length || 0} کاراکتر
                    </span>
                  </div>
                  <Textarea
                    value={cmd.response}
                    onChange={(e) => handleUpdateCommandResponse(cmd.id, e.target.value)}
                    placeholder="متن پاسخ ربات در صورت ارسال این دستور..."
                    rows={2}
                    className="text-xs rounded-lg border-indigo-200 bg-white focus:border-indigo-400 focus-visible:ring-1 min-h-[50px]"
                  />
                </div>

                {/* Parent Switcher & Title Edit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-slate-600">موقعیت در منوی درختی</Label>
                    <Select
                      value={cmd.parentId || "root"}
                      onValueChange={(val) => handleChangeCommandParent(cmd.id, val === "root" ? null : val)}
                    >
                      <SelectTrigger className="h-7 text-xs bg-white rounded-lg border-slate-200">
                        <SelectValue placeholder="انتخاب موقعیت" />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="root">📌 منوی اصلی (بدون والد)</SelectItem>
                        {getFormattedCommandOptions(botCommands)
                          .filter(opt => opt.id !== cmd.id)
                          .map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] font-semibold text-slate-600">عنوان دکمه در تلگرام</Label>
                    <Input
                      value={cmd.description}
                      onChange={(e) => {
                        const newDesc = e.target.value;
                        const updated = botCommands.map(c => c.id === cmd.id ? { ...c, description: newDesc } : c);
                        setBotCommands(updated);
                      }}
                      className="h-7 text-xs bg-white rounded-lg border-slate-200"
                    />
                  </div>
                </div>

                {/* Media Attachment Editor */}
                <div className="p-2 bg-white rounded-lg border border-indigo-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                      رسانه پیوست‌شده به پاسخ
                    </Label>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={cmd.mediaType || "none"}
                      onValueChange={(val: any) => handleUpdateCommandMedia(cmd.id, val, cmd.mediaUrl || "")}
                    >
                      <SelectTrigger className="h-7 text-xs bg-slate-50 rounded-md border-slate-200 w-32">
                        <SelectValue placeholder="نوع رسانه" />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="none">💬 بدون رسانه</SelectItem>
                        <SelectItem value="photo">🖼️ تصویر / عکس</SelectItem>
                        <SelectItem value="video">🎥 کلیپ / ویدیو</SelectItem>
                        <SelectItem value="document">📄 فایل / سند</SelectItem>
                        <SelectItem value="audio">🎵 صوت / پادکست</SelectItem>
                      </SelectContent>
                    </Select>

                    {cmd.mediaType && cmd.mediaType !== "none" && (
                      <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                        <Input
                          type="text"
                          value={cmd.mediaUrl || ""}
                          onChange={(e) => handleUpdateCommandMedia(cmd.id, cmd.mediaType || "photo", e.target.value)}
                          placeholder="مسیر فایل یا URL..."
                          className="h-7 text-xs font-mono dir-ltr text-left rounded-md bg-slate-50 border-slate-200 flex-1"
                        />
                        {cmd.mediaUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateCommandMedia(cmd.id, "none", "")}
                            className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 rounded-md shrink-0"
                            title="حذف پیوست"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    )}

                    <input
                      type="file"
                      id={`cmd-media-file-${cmd.id}`}
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadCmdMedia(file, cmd.id);
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`cmd-media-file-${cmd.id}`)?.click()}
                      disabled={isUploadingCmdMedia}
                      className="h-7 text-xs font-bold text-indigo-700 bg-indigo-50/80 hover:bg-indigo-100 border-indigo-200 rounded-md px-2.5 gap-1 shrink-0"
                    >
                      {isUploadingCmdMedia ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                      ) : (
                        <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                      )}
                      {cmd.mediaUrl ? "تغییر فایل" : "آپلود فایل"}
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end pt-0.5">
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      setEditingCmdId(null);
                      saveConfigMutation.mutate({ botCommands });
                      toast({ title: "ذخیره شد", description: "تغییرات دستور با موفقیت ثبت گردید" });
                    }}
                    className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 rounded-md gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    تایید و بستن
                  </Button>
                </div>

              </div>
            )}

          </div>

          {/* Sub Commands Nested Tree Container */}
          {subCommands.length > 0 && !isCollapsed && (
            <div className="mr-3 pr-2.5 border-r-2 border-indigo-200/70 space-y-1.5 pt-0.5 pb-0.5">
              {renderCommandTree(cmd.id, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const isBotActive = Boolean(config?.isEnabled && config?.botToken);

  return (
    <DashboardLayout title="مدیریت و کنترل ربات تلگرام">
      <div className="space-y-4 max-w-6xl mx-auto p-4 text-right" dir="rtl" data-testid="page-telegram-bot">
        
        {/* Top Header Card */}
        <div className="bg-slate-950 text-white p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xs relative overflow-hidden">
          <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/15">
                  <Bot className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                      کنترل و مدیریت ربات تلگرام
                    </h1>
                    {isBotActive ? (
                      <Badge className="bg-emerald-500/90 hover:bg-emerald-600 text-white border-none px-2 py-0.5 text-[10px] font-bold gap-1 shadow-xs animate-pulse">
                        <CheckCircle2 className="w-3 h-3" />
                        متصل و فعال
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-white/5 text-slate-300 border-white/10 text-[10px] px-2 py-0.5 gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        غیرفعال
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300">
                    اتصال مستقیم به Telegram Bot API، ارسال خودکار اعلان‌های سیستم، دستورات تعاملی و پیام‌های همگانی
                  </p>
                </div>
              </div>

              {config?.botUsername && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white/5 backdrop-blur-xs rounded-full text-[10px] text-slate-300 border border-white/10 mt-1">
                  <Radio className="w-2.5 h-2.5 text-emerald-400 animate-ping" />
                  <span>ربات متصل:</span>
                  <a 
                    href={`https://t.me/${config.botUsername}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="font-bold text-blue-300 underline flex items-center gap-0.5 hover:text-blue-200"
                  >
                    @{config.botUsername}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                  {config.botFirstName && <span className="opacity-75">({config.botFirstName})</span>}
                </div>
              )}
            </div>

            {/* Header Action Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/10">
                <Label htmlFor="master-toggle" className="text-xs font-semibold cursor-pointer select-none text-slate-200">
                  {isEnabled ? "ربات فعال" : "ربات غیرفعال"}
                </Label>
                <Switch
                  id="master-toggle"
                  checked={isEnabled}
                  onCheckedChange={(checked) => {
                    setIsEnabled(checked);
                    saveConfigMutation.mutate({ isEnabled: checked });
                  }}
                  className="scale-75 data-[state=checked]:bg-emerald-500"
                />
              </div>

              <Button
                onClick={() => handleSaveAll()}
                disabled={saveConfigMutation.isPending}
                className="bg-blue-600 text-white hover:bg-blue-500 font-bold px-4 h-9 rounded-xl shadow-sm text-xs transition-all border border-blue-500"
              >
                {saveConfigMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 ml-1.5 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 ml-1.5 text-emerald-200" />
                    ذخیره کلیه تنظیمات
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>



        {/* Main Tabs Navigation */}
        <Tabs defaultValue="credentials" className="space-y-4 text-right" dir="rtl">
          <TabsList className="bg-slate-100 p-1 rounded-xl flex items-center justify-start overflow-x-auto whitespace-nowrap gap-0.5 border border-slate-200/50 w-full scrollbar-none max-w-full">
            <TabsTrigger 
              value="credentials" 
              className="rounded-lg px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs transition-all flex items-center shrink-0"
            >
              <Key className="w-3.5 h-3.5 ml-1 shrink-0" />
              اتصال و توکن ربات
            </TabsTrigger>

            <TabsTrigger 
              value="notifications" 
              className="rounded-lg px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs transition-all flex items-center shrink-0"
            >
              <Bell className="w-3.5 h-3.5 ml-1 shrink-0" />
              هشدارهای خودکار سیستم
            </TabsTrigger>

            <TabsTrigger 
              value="commands" 
              className="rounded-lg px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs transition-all flex items-center shrink-0"
            >
              <Terminal className="w-3.5 h-3.5 ml-1 shrink-0" />
              پاسخ‌ها و دستورات ربات
            </TabsTrigger>

            <TabsTrigger 
              value="users" 
              className="rounded-lg px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs transition-all flex items-center shrink-0 text-indigo-700"
            >
              <Users className="w-3.5 h-3.5 ml-1 shrink-0" />
              دریافت لیست کاربران
            </TabsTrigger>

            <TabsTrigger 
              value="buttons" 
              className="rounded-lg px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs transition-all flex items-center shrink-0"
            >
              <Layers className="w-3.5 h-3.5 ml-1 shrink-0" />
              دکمه‌های تعاملی منو
            </TabsTrigger>

            <TabsTrigger 
              value="broadcast" 
              className="rounded-lg px-3 py-1.5 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs transition-all flex items-center shrink-0"
            >
              <Send className="w-3.5 h-3.5 ml-1 shrink-0" />
              ارسال پیام همگانی
            </TabsTrigger>
          </TabsList>

          {/* ============================================================ */}
          {/* TAB 1: Credentials & Direct Test */}
          {/* ============================================================ */}
          <TabsContent value="credentials" className="space-y-4">
            <div className="max-w-4xl mx-auto space-y-4">
              <Card className="rounded-xl border border-gray-100 bg-white shadow-xs">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-800">
                      <Key className="w-4 h-4 text-blue-500" />
                      تنظیمات اتصال به Telegram Bot API
                    </CardTitle>
                    <CardDescription className="text-[11px] text-gray-400">
                      توکن اختصاصی ربات را از بات رسمی @BotFather در تلگرام دریافت و در اینجا وارد نمایید.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3.5">
                    
                    {/* Bot Token */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="botToken" className="text-[11px] font-bold text-gray-600">
                          توکن ربات تلگرام (Bot Token) <span className="text-red-500">*</span>
                        </Label>
                        <span className="text-[10px] text-gray-400">فرمت: 123456789:AAH...</span>
                      </div>
                      <div className="relative">
                        <Input
                          id="botToken"
                          type={showToken ? "text" : "password"}
                          value={botToken}
                          onChange={(e) => setBotToken(e.target.value)}
                          placeholder="مثال: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                          className="h-9 px-3 pl-9 rounded-lg border-gray-200/80 font-mono text-xs dir-ltr text-left focus-visible:ring-1 focus-visible:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowToken(!showToken)}
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                        >
                          {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Admin Chat ID */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="adminChatId" className="text-[11px] font-bold text-gray-600">
                          شناسه چت یا کانال مدیر (Admin Chat ID / Channel) <span className="text-red-500">*</span>
                        </Label>
                        <span className="text-[10px] text-gray-400">شناسه عددی کاربری یا آیدی کانال</span>
                      </div>
                      <Input
                        id="adminChatId"
                        type="text"
                        value={adminChatId}
                        onChange={(e) => setAdminChatId(e.target.value)}
                        placeholder="مثال: 123456789 یا @my_channel"
                        className="h-9 px-3 rounded-lg border-gray-200/80 font-mono text-xs dir-ltr text-left focus-visible:ring-1 focus-visible:ring-blue-500"
                      />
                      <p className="text-[10px] text-gray-400 leading-relaxed">
                        جهت دریافت Chat ID شخصی خود در تلگرام می‌توانید به ربات <b>@userinfobot</b> پیام دهید. برای کانال یا گروه، ربات خود را ادمین کانال کرده و شناسه یا آیدی کانال را وارد کنید.
                      </p>
                    </div>

                    {/* API Base URL */}
                    <div className="space-y-1">
                      <Label htmlFor="apiBaseUrl" className="text-[11px] font-bold text-gray-600">
                        آدرس پایه سرور تلگرام (Telegram API Base URL)
                      </Label>
                      <Input
                        id="apiBaseUrl"
                        type="text"
                        value={apiBaseUrl}
                        onChange={(e) => setApiBaseUrl(e.target.value)}
                        placeholder="https://api.telegram.org"
                        className="h-9 px-3 rounded-lg border-gray-200/80 font-mono text-xs dir-ltr text-left focus-visible:ring-1 focus-visible:ring-blue-500"
                      />
                      <p className="text-[10px] text-gray-400">
                        پیش‌فرض: https://api.telegram.org (در صورت استفاده از پروکسی معکوس یا سرور اختصاصی تلگرام، آدرس را تغییر دهید)
                      </p>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => testConnectionMutation.mutate()}
                          disabled={testConnectionMutation.isPending || !botToken}
                          className="rounded-lg text-[11px] h-8 px-2.5 border-blue-200 text-blue-700 hover:bg-blue-50/60"
                        >
                          {testConnectionMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 ml-1 text-blue-500" />
                          )}
                          بررسی زنده اعتبار توکن (getMe)
                        </Button>
                      </div>

                      <Button
                        type="button"
                        onClick={() => handleSaveAll()}
                        disabled={saveConfigMutation.isPending}
                        className="rounded-lg text-[11px] h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                      >
                        {saveConfigMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" />
                        ) : null}
                        ذخیره تنظیمات
                      </Button>
                    </div>

                  </CardContent>
                </Card>

                {/* Dedicated Webhook & Communication Method Card */}
                <Card className="rounded-xl border border-gray-200/80 shadow-xs bg-white overflow-hidden">
                  <CardHeader className="p-3.5 pb-2 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                          <Globe className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <CardTitle className="text-xs font-bold text-gray-800">
                            تنظیمات اتصال وب‌هوک و دریافت پیام‌ها (Webhook & Polling)
                          </CardTitle>
                          <CardDescription className="text-[11px] text-gray-400 mt-0.5">
                            روش دریافت پیام‌های ارسالی کاربران در تلگرام توسط این پنل
                          </CardDescription>
                        </div>
                      </div>

                      {/* Live Telegram Webhook Status Badges */}
                      <div className="flex items-center gap-1.5">
                        {webhookInfo?.data?.url ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] h-5 gap-1 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            وب‌هوک فعال
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200 text-[10px] h-5 gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                            وب‌هوک غیرفعال
                          </Badge>
                        )}

                        {pollingStatus?.isPolling && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] h-5 gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            Polling فعال
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3.5 space-y-3">
                    {/* Live Status Details */}
                    {webhookInfo?.data && (
                      <div className="p-2.5 rounded-lg bg-gray-50/70 border border-gray-200/60 text-xs space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <div className="flex items-center gap-1.5 text-gray-600">
                            <span className="text-gray-400">آدرس فعال در تلگرام:</span>
                            <span className="font-mono text-gray-800 dir-ltr select-all text-xs font-semibold">
                              {webhookInfo.data.url || "تنظیم نشده (بدون وب‌هوک)"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500 text-[10px]">
                            <span>پیام‌های صف تلگرام: <strong className="font-mono text-gray-700">{webhookInfo.data.pending_update_count}</strong></span>
                            {webhookInfo.data.max_connections && (
                              <span>حداکثر کانکشن: <strong className="font-mono text-gray-700">{webhookInfo.data.max_connections}</strong></span>
                            )}
                          </div>
                        </div>

                        {webhookInfo.data.last_error_message && (
                          <div className="p-2 rounded-md bg-amber-50/90 border border-amber-200 text-amber-800 text-[11px] flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">آخرین خطای اعلام‌شده از سوی سرور تلگرام: </span>
                              <span className="font-mono text-[10.5px] dir-ltr text-left inline-block">{webhookInfo.data.last_error_message}</span>
                              {webhookInfo.data.last_error_date && (
                                <span className="text-[9.5px] text-amber-700 mr-2">
                                  ({new Date(webhookInfo.data.last_error_date * 1000).toLocaleString("fa-IR")})
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Webhook URL Input & Actions */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="webhookUrlInput" className="text-[11px] font-bold text-gray-700">
                          نشانی وب‌هوک (Webhook URL)
                        </Label>
                        <button
                          type="button"
                          onClick={() => {
                            const originHttps = window.location.origin.replace(/^http:\/\//, "https://");
                            setWebhookUrl(`${originHttps}/api/telegram/webhook`);
                          }}
                          className="text-[10.5px] text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-blue-500" />
                          درج خودکار نشانی دامنه فعلی
                        </button>
                      </div>
                      <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5">
                        <Input
                          id="webhookUrlInput"
                          type="text"
                          value={webhookUrl}
                          onChange={(e) => setWebhookUrl(e.target.value)}
                          placeholder="https://yourdomain.com/api/telegram/webhook"
                          className="h-8 px-2.5 rounded-lg border-gray-200 font-mono text-xs dir-ltr text-left flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setWebhookMutation.mutate(webhookUrl)}
                          disabled={setWebhookMutation.isPending || !botToken}
                          className="rounded-lg text-[11px] h-8 px-3 border-indigo-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-100 font-bold shrink-0"
                        >
                          {setWebhookMutation.isPending ? (
                            <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" />
                          ) : (
                            <Globe className="w-3.5 h-3.5 ml-1 text-indigo-600" />
                          )}
                          ثبت و فعال‌سازی وب‌هوک
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => refetchWebhookInfo()}
                          disabled={isFetchingWebhookInfo || !botToken}
                          title="استعلام آخرین وضعیت وب‌هوک از سرور تلگرام"
                          className="rounded-lg text-[11px] h-8 px-2.5 border-gray-200 text-gray-600 hover:bg-gray-50 shrink-0"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isFetchingWebhookInfo ? "animate-spin text-blue-500" : "text-gray-500"}`} />
                        </Button>
                        {(config?.isWebhookSet || webhookInfo?.data?.url) && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => deleteWebhookMutation.mutate()}
                            disabled={deleteWebhookMutation.isPending}
                            className="rounded-lg text-[11px] h-8 px-2.5 text-red-600 hover:bg-red-50 shrink-0"
                          >
                            {deleteWebhookMutation.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5 ml-1 text-red-500" />
                            )}
                            حذف وب‌هوک
                          </Button>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400">
                        * الزامی: سرور تلگرام منحصراً از نشانی‌های دارای پروتکل امن <strong>HTTPS</strong> و دامنه‌های عمومی اینترنتی پشتیبانی می‌کند.
                      </p>
                    </div>

                    {/* Long Polling Alternative Section */}
                    <div className="pt-2.5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-blue-50/30 -mx-3.5 -mb-3.5 p-3 rounded-b-xl">
                      <div className="space-y-0.5 max-w-xl">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          روش جایگزین: دریافت زنده بدون نیاز به وب‌هوک (Long Polling)
                        </div>
                        <p className="text-[10.5px] text-gray-500 leading-relaxed">
                          اگر در محیط محلی (localhost) هستید یا دامنه شما گواهی معتبر SSL ندارد و وب‌هوک خطا می‌دهد، نیازی به وب‌هوک نیست؛ با کلیک روی دکمه زیر، پیام‌ها مستقیماً و به صورت خودکار توسط سرور پردازش خواهند شد.
                        </p>
                      </div>

                      <div className="shrink-0">
                        {pollingStatus?.isPolling ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => stopPollingMutation.mutate()}
                            disabled={stopPollingMutation.isPending}
                            className="rounded-lg text-[11px] h-8 px-3 border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 font-bold w-full sm:w-auto"
                          >
                            {stopPollingMutation.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" />
                            ) : (
                              <RefreshCw className="w-3.5 h-3.5 ml-1 text-amber-600" />
                            )}
                            توقف دریافت پیام‌ها (Polling)
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            onClick={() => startPollingMutation.mutate()}
                            disabled={startPollingMutation.isPending || !botToken}
                            className="rounded-lg text-[11px] h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full sm:w-auto shadow-xs"
                          >
                            {startPollingMutation.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" />
                            ) : (
                              <Zap className="w-3.5 h-3.5 ml-1 text-emerald-200" />
                            )}
                            فعال‌سازی دریافت زنده (Polling)
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 2: Automated System Alerts */}
          {/* ============================================================ */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="rounded-xl border border-gray-100 bg-white shadow-xs">
              <CardHeader className="p-4 pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-800">
                      <Bell className="w-4 h-4 text-amber-500" />
                      رویدادهای خودکار و اعلان‌های سیستم
                    </CardTitle>
                    <CardDescription className="text-[11px] text-gray-400">
                      با فعال کردن هر رویداد، هنگام وقوع آن در سامانه بلافاصله یک پیام هوشمند به چت یا کانال تلگرام شما ارسال می‌شود.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleSaveAll()}
                    disabled={saveConfigMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs h-8 px-3 font-bold shrink-0"
                  >
                    ذخیره تنظیمات هشدارها
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2.5">
                
                {/* Event 1: Success BloPal Transaction Level 1 */}
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-blue-50/20 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">تراکنش موفق بلو بانک هر کاربر سطح ۱</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        ارسال پیامک تراکنش موفق بلو بانک هر کاربر سطح ۱ به شماره موبایل ثبت شده در سامانه
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.successBloPalTxLevel1}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, successBloPalTxLevel1: checked }))}
                    className="scale-75"
                  />
                </div>

                {/* Event 2: Answered Ticket Level 1 */}
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-emerald-50/20 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">تیکت پاسخ داده شده هر کاربر سطح ۱</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        اطلاع‌رسانی فوری هنگام پاسخ به تیکت‌های پشتیبانی کاربران سطح ۱ در سیستم
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.answeredTicketLevel1}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, answeredTicketLevel1: checked }))}
                    className="scale-75"
                  />
                </div>

                {/* Event 3: Subscription Expiring in 3 Days Level 1 */}
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-purple-50/20 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">اشتراک‌های ۳ روز مانده به انقضای کاربر سطح ۱</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        ارسال پیام یادآوری ۳ روز مانده به پایان اشتراک کاربر سطح ۱ به شماره‌های ثبت شده در صورت وجود
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.subscriptionExpiry3DaysLevel1}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, subscriptionExpiry3DaysLevel1: checked }))}
                    className="scale-75"
                  />
                </div>

                {/* Event 4: New Announcements Level 1 */}
                <div className="flex items-center justify-between p-2.5 rounded-xl border border-gray-100 bg-gray-50/30 hover:bg-amber-50/20 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-800">اطلاعیه‌های جدید</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        ارسال خودکار متن اطلاعیه جدید به همراه عنوان برای تمام کاربران سطح ۱
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications.newAnnouncementsLevel1}
                    onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, newAnnouncementsLevel1: checked }))}
                    className="scale-75"
                  />
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 3: Bot Commands & Auto Responses */}
          {/* ============================================================ */}
          <TabsContent value="commands" className="space-y-3">
            {/* Quick Stats Summary Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Card className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">کل دستورات</p>
                    <h4 className="text-sm font-black text-indigo-600 mt-0.5">
                      {botCommands.length.toLocaleString("fa-IR")}
                    </h4>
                  </div>
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                    <Terminal className="w-4 h-4" />
                  </div>
                </div>
              </Card>

              <Card className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">منوهای اصلی</p>
                    <h4 className="text-sm font-black text-emerald-600 mt-0.5">
                      {botCommands.filter(c => !c.parentId).length.toLocaleString("fa-IR")}
                    </h4>
                  </div>
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
              </Card>

              <Card className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">زیرمنوها</p>
                    <h4 className="text-sm font-black text-purple-600 mt-0.5">
                      {botCommands.filter(c => c.parentId).length.toLocaleString("fa-IR")}
                    </h4>
                  </div>
                  <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                    <FolderTree className="w-4 h-4" />
                  </div>
                </div>
              </Card>

              <Card className="rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">فایل / رسانه‌دار</p>
                    <h4 className="text-sm font-black text-amber-600 mt-0.5">
                      {botCommands.filter(c => c.mediaType && c.mediaType !== "none").length.toLocaleString("fa-IR")}
                    </h4>
                  </div>
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                    <Paperclip className="w-4 h-4" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Tree Management Container */}
            <Card className="rounded-xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
              {/* Header Action Bar */}
              <div className="p-3 bg-slate-50/70 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100/80 text-indigo-700 rounded-lg shrink-0">
                    <ListTree className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">
                      ساختار درختی منوها و پاسخ‌های خودکار
                    </h3>
                    <p className="text-[10px] text-slate-400">
                      دکمه‌های تعاملی، زیرمنوها، پاسخ‌های متنی و پیوست رسانه
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search Filter */}
                  <div className="relative w-full sm:w-44">
                    <Input
                      type="text"
                      value={commandSearchQuery}
                      onChange={(e) => setCommandSearchQuery(e.target.value)}
                      placeholder="جستجوی دستور..."
                      className="h-8 text-xs pl-7 pr-2 rounded-lg border-slate-200 bg-white"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2.5 pointer-events-none" />
                  </div>

                  {/* Add Command Dialog Toggle */}
                  <Button
                    size="sm"
                    onClick={() => {
                      setNewCmdParentId("root");
                      setIsAddCmdModalOpen(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs h-8 px-3 font-bold gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    دستور جدید
                  </Button>

                  {/* Sync Telegram Menu */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => syncCommandsMutation.mutate()}
                    disabled={syncCommandsMutation.isPending}
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-lg text-xs h-8 px-2.5 font-bold gap-1"
                  >
                    {syncCommandsMutation.isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    همگام‌سازی با تلگرام
                  </Button>

                  {/* Save All */}
                  <Button
                    size="sm"
                    onClick={() => handleSaveAll()}
                    disabled={saveConfigMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs h-8 px-3 font-bold gap-1 shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    ذخیره کلی
                  </Button>
                </div>
              </div>

              {/* Commands List Content */}
              <div className="p-3 divide-y divide-slate-100 space-y-2">
                {botCommands.length === 0 ? (
                  <div className="py-8 text-center space-y-3">
                    <Bot className="w-10 h-10 text-slate-300 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-slate-700">هیچ دستوری تعریف نشده است</p>
                      <p className="text-[10px] text-slate-400 mt-1">جهت ساخت منوهای ربات تلگرام روی دکمه زیر کلیک کنید.</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        setNewCmdParentId("root");
                        setIsAddCmdModalOpen(true);
                      }}
                      className="bg-indigo-600 text-white rounded-lg text-xs font-bold px-4 h-8"
                    >
                      <Plus className="w-3.5 h-3.5 ml-1" />
                      ایجاد اولین دستور
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Rendered Command Tree */}
                    {renderCommandTree(null, 0)}

                    {/* Orphaned subcommands if any */}
                    {botCommands.filter(c => c.parentId && !botCommands.some(p => p.id === c.parentId)).length > 0 && (
                      <div className="pt-3 space-y-1.5">
                        <p className="text-[10px] text-amber-800 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          دستورات نیازمند تعیین مجدد والد:
                        </p>
                        {botCommands
                          .filter(c => c.parentId && !botCommands.some(p => p.id === c.parentId))
                          .map((orphan) => (
                            <div key={orphan.id} className="p-2 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between text-xs">
                              <span className="font-bold text-amber-900">{orphan.command} - {orphan.description}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleChangeCommandParent(orphan.id, null)}
                                className="h-6 text-[10px] bg-white border-amber-300 text-amber-900 font-bold"
                              >
                                تبدیل به منوی اصلی
                              </Button>
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB: Users List via Telegram Bot */}
          {/* ============================================================ */}
          <TabsContent value="users" className="space-y-4">
            <div className="space-y-4">
                
                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Card className="rounded-xl border border-gray-100 bg-white shadow-xs">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400 font-medium">کل کاربران ربات</p>
                        <h3 className="text-sm font-black text-blue-600 mt-0.5">
                          {botUsers.length.toLocaleString("fa-IR")}
                        </h3>
                      </div>
                      <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <Bot className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-xl border border-gray-100 bg-white shadow-xs">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400 font-medium">شماره‌های تاییدشده</p>
                        <h3 className="text-sm font-black text-emerald-600 mt-0.5">
                          {botUsers.filter(u => u.phoneNumber).length.toLocaleString("fa-IR")}
                        </h3>
                      </div>
                      <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                        <Smartphone className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-xl border border-gray-100 bg-white shadow-xs">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400 font-medium">پیام‌های دریافتی</p>
                        <h3 className="text-sm font-black text-indigo-600 mt-0.5">
                          {botUsers.reduce((acc, u) => acc + (u.messageCount || 0), 0).toLocaleString("fa-IR")}
                        </h3>
                      </div>
                      <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-xl border border-gray-100 bg-white shadow-xs">
                    <CardContent className="p-3 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-gray-400 font-medium">کاربران مسدودشده</p>
                        <h3 className="text-sm font-black text-red-600 mt-0.5">
                          {botUsers.filter(u => u.isBlocked).length.toLocaleString("fa-IR")}
                        </h3>
                      </div>
                      <div className="p-1.5 bg-red-50 text-red-600 rounded-lg">
                        <Ban className="w-4 h-4" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Table Card */}
                <Card className="rounded-xl border border-gray-100 bg-white shadow-xs">
                  <CardHeader className="p-4 pb-3 border-b border-gray-100/80">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div>
                        <CardTitle className="text-xs font-bold flex items-center gap-2 text-gray-800">
                          <Bot className="w-4 h-4 text-blue-500" />
                          لیست مخاطبان و مشترکین ربات تلگرام
                        </CardTitle>
                        <CardDescription className="text-[10px] text-gray-400 mt-0.5">
                          مشاهده لیست کاربرانی که با ربات ارتباط برقرار کرده‌اند، شماره تلفن‌های واقعی دریافتی، ارسال پیام خصوصی و مدیریت دسترسی
                        </CardDescription>
                      </div>

                      {/* Toolbar & Filters */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Search */}
                        <div className="relative w-full sm:w-60">
                          <Input
                            type="text"
                            value={botUserSearch}
                            onChange={(e) => setBotUserSearch(e.target.value)}
                            placeholder="جستجوی نام، یوزرنیم، شماره، Chat ID..."
                            className="h-8 pr-7 text-xs rounded-lg bg-gray-50/50 border-gray-200"
                          />
                          <Search className="w-3 h-3 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                        </div>

                        {/* Status Filter */}
                        <select
                          value={botUserFilterStatus}
                          onChange={(e) => setBotUserFilterStatus(e.target.value as any)}
                          className="h-8 px-2 rounded-lg border border-gray-200 text-xs bg-gray-50/50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                        >
                          <option value="all">همه کاربران</option>
                          <option value="with_phone">📱 دارای شماره تلفن تاییدشده</option>
                          <option value="active">🟢 صرفاً کاربران فعال</option>
                          <option value="blocked">🚫 صرفاً مسدودشده‌ها</option>
                        </select>

                        {/* Refresh */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            refetchBotUsers();
                            toast({ title: "بروزرسانی شد", description: "لیست کاربران ربات تازه شد" });
                          }}
                          className="h-8 w-8 p-0 rounded-lg text-gray-500 hover:bg-gray-100"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBotUsers ? "animate-spin" : ""}`} />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-0">
                    {isLoadingBotUsers ? (
                      <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        <span>در حال بارگذاری لیست کاربران ربات تلگرام...</span>
                      </div>
                    ) : filteredBotUsers.length === 0 ? (
                      <div className="py-12 text-center px-4">
                        <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-2.5">
                          <Bot className="w-6 h-6" />
                        </div>
                        <h4 className="text-xs font-bold text-gray-800">
                          {botUserSearch ? "هیچ کاربری با این عبارت یافت نشد" : "هنوز کاربری با ربات تلگرام ارتباط برقرار نکرده است"}
                        </h4>
                        <p className="text-[10px] text-gray-400 max-w-sm mx-auto mt-0.5 leading-relaxed">
                          {botUserSearch
                            ? "لطفاً عبارت جستجو را تغییر دهید یا فیلتر وضعیت را پاک کنید."
                            : "به محض اینکه کاربران در تلگرام به ربات پیام دهند یا دکمه /start را بزنند، به طور خودکار در این جدول ذخیره می‌شوند."}
                        </p>
                        <div className="mt-3 flex items-center justify-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setAddBotUserModalOpen(true)}
                            className="h-8 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            ثبت دستی چت آیدی کاربر
                          </Button>
                          {config?.botUsername && (
                            <a
                              href={`https://t.me/${config.botUsername}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 font-bold px-2.5 py-1.5 rounded-lg"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              باز کردن ربات در تلگرام
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-right">
                          <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/40 text-gray-500 font-bold">
                              <th className="py-2 px-3.5">کاربر تلگرام</th>
                              <th className="py-2 px-3.5">شماره تلفن واقعی</th>
                              <th className="py-2 px-3.5">شناسه عددی (Chat ID)</th>
                              <th className="py-2 px-3.5">آخرین فعالیت</th>
                              <th className="py-2 px-3.5">وضعیت در ربات</th>
                              <th className="py-2 px-3.5 text-center">عملیات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {filteredBotUsers.map((user) => {
                              const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "کاربر تلگرام";
                              const firstChar = (user.firstName?.[0] || user.username?.[0] || "U").toUpperCase();
                              const isCopied = copiedChatId === String(user.chatId);

                              return (
                                <tr key={user.chatId} className="hover:bg-blue-50/20 transition-colors">
                                  {/* User Profile Cell */}
                                  <td className="py-2.5 px-3.5">
                                    <div className="flex items-center gap-2.5">
                                      <div className="relative shrink-0">
                                        <div className="w-7.5 h-7.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-[10px] shadow-xs">
                                          {firstChar}
                                        </div>
                                        <span
                                          className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1.5 ring-white ${
                                            user.isBlocked ? "bg-red-500" : "bg-emerald-500"
                                          }`}
                                        />
                                      </div>
                                      <div>
                                        <div className="font-bold text-gray-800 flex items-center gap-1">
                                          <span>{fullName}</span>
                                          {String(user.chatId) === String(adminChatId) && (
                                            <Badge className="bg-amber-100 text-amber-800 border-none text-[8px] px-1 py-0 rounded">
                                              مدیر
                                            </Badge>
                                          )}
                                        </div>
                                        {user.username ? (
                                          <a
                                            href={`https://t.me/${user.username}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-[10px] font-mono text-blue-600 hover:text-blue-800 hover:underline dir-ltr text-right inline-block"
                                          >
                                            @{user.username}
                                          </a>
                                        ) : (
                                          <span className="text-[9px] text-gray-400">بدون نام کاربری</span>
                                        )}
                                        {user.notes && (
                                          <p className="text-[9px] text-gray-400 truncate max-w-[120px]" title={user.notes}>
                                            📝 {user.notes}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  </td>

                                  {/* Phone Number Cell */}
                                  <td className="py-2.5 px-3.5">
                                    {user.phoneNumber ? (
                                      <div className="flex items-center gap-1">
                                        <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200/50 text-[10px] font-mono dir-ltr flex items-center gap-0.5 font-bold py-0">
                                          <Smartphone className="w-2.5 h-2.5 text-emerald-600" />
                                          {user.phoneNumber}
                                        </Badge>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            navigator.clipboard.writeText(user.phoneNumber!);
                                            toast({ title: "کپی شد", description: `شماره تلفن ${user.phoneNumber} کپی شد` });
                                          }}
                                          className="h-5 w-5 p-0 text-gray-400 hover:text-gray-700"
                                          title="کپی شماره تلفن"
                                        >
                                          <Copy className="w-2.5 h-2.5" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <span className="text-[9px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
                                        بدون شماره
                                      </span>
                                    )}
                                  </td>

                                  {/* Chat ID Cell */}
                                  <td className="py-2.5 px-3.5">
                                    <div className="flex items-center gap-1">
                                      <code className="font-mono text-[10px] text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded dir-ltr">
                                        {user.chatId}
                                      </code>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          navigator.clipboard.writeText(String(user.chatId));
                                          setCopiedChatId(String(user.chatId));
                                          setTimeout(() => setCopiedChatId(null), 2000);
                                          toast({ title: "کپی شد", description: `شناسه ${user.chatId} کپی گردید` });
                                        }}
                                        className="h-5 w-5 p-0 text-gray-400 hover:text-gray-700"
                                        title="کپی Chat ID"
                                      >
                                        {isCopied ? (
                                          <CheckCheck className="w-3 h-3 text-emerald-600" />
                                        ) : (
                                          <Copy className="w-3 h-3" />
                                        )}
                                      </Button>
                                    </div>
                                  </td>

                                  {/* Last Active Date */}
                                  <td className="py-2.5 px-3.5">
                                    <div className="text-[10px] text-gray-600">
                                      {user.lastActiveAt ? (
                                        <>
                                          <p className="font-medium">
                                            {new Date(user.lastActiveAt).toLocaleDateString("fa-IR")}
                                          </p>
                                          <p className="text-[9px] text-gray-400 font-mono">
                                            {new Date(user.lastActiveAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}
                                          </p>
                                        </>
                                      ) : (
                                        "-"
                                      )}
                                    </div>
                                  </td>

                                  {/* Block Status */}
                                  <td className="py-2.5 px-3.5">
                                    {user.isBlocked ? (
                                      <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border-none text-[9px] font-bold h-5 px-1.5">
                                        🚫 مسدود
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-emerald-50 text-emerald-800 hover:bg-emerald-50 border-none text-[9px] font-bold h-5 px-1.5">
                                        🟢 فعال
                                      </Badge>
                                    )}
                                  </td>

                                  {/* Action Buttons */}
                                  <td className="py-2.5 px-3.5 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                      {/* Direct Message */}
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setDirectMsgTargetUser(user);
                                          setDirectMsgText("");
                                          setDirectMsgBtnText("");
                                          setDirectMsgBtnUrl("");
                                          setDirectMsgModalOpen(true);
                                        }}
                                        className="h-7 px-2 text-[10px] text-blue-600 hover:bg-blue-50 rounded-lg gap-0.5 font-bold"
                                        title="ارسال پیام خصوصی به کاربر در تلگرام"
                                      >
                                        <MessageSquarePlus className="w-3 h-3" />
                                        <span>پیام</span>
                                      </Button>

                                      {/* Toggle Block */}
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => toggleBlockBotUserMutation.mutate(String(user.chatId))}
                                        disabled={toggleBlockBotUserMutation.isPending}
                                        className={`h-7 w-7 p-0 rounded-lg ${
                                          user.isBlocked
                                            ? "text-emerald-600 hover:bg-emerald-50"
                                            : "text-amber-600 hover:bg-amber-50"
                                        }`}
                                        title={user.isBlocked ? "رفع انسداد کاربر" : "مسدود کردن کاربر"}
                                      >
                                        <Ban className="w-3 h-3" />
                                      </Button>

                                      {/* Delete */}
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          if (confirm(`آیا از حذف کاربر ${fullName} (${user.chatId}) از لیست ربات مطمئن هستید؟`)) {
                                            deleteBotUserMutation.mutate(String(user.chatId));
                                          }
                                        }}
                                        disabled={deleteBotUserMutation.isPending}
                                        className="h-7 w-7 p-0 text-red-500 hover:bg-red-50 rounded-lg"
                                        title="حذف از لیست"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>

            {/* ========================================================= */}
            {/* SUB-TAB 2: WEBSITE DATABASE USERS & TELEGRAM DISPATCH     */}
            {/* ========================================================= */}
            {false && (
              <div className="space-y-6">
                
                {/* Top Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="rounded-2xl border-gray-200/80 shadow-xs">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">کل کاربران پایگاه داده</p>
                        <h3 className="text-2xl font-black text-gray-900 mt-1">
                          {appUsers.length.toLocaleString("fa-IR")}
                        </h3>
                      </div>
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <Users className="w-5 h-5" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-gray-200/80 shadow-xs">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">مدیران سیستم</p>
                        <h3 className="text-2xl font-black text-amber-600 mt-1">
                          {appUsers.filter((u: any) => u.role === "admin").length.toLocaleString("fa-IR")}
                        </h3>
                      </div>
                      <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                        <Shield className="w-5 h-5" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-gray-200/80 shadow-xs">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">کاربران عادی / سطح ۱</p>
                        <h3 className="text-2xl font-black text-indigo-600 mt-1">
                          {appUsers.filter((u: any) => u.role === "user_level_1" || u.role !== "admin").length.toLocaleString("fa-IR")}
                        </h3>
                      </div>
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                        <UserCheck className="w-5 h-5" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-2xl border-gray-200/80 shadow-xs">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">شناسه تلگرام مدیر</p>
                        <h3 className="text-xs font-mono font-bold text-gray-800 mt-2 truncate max-w-[150px] dir-ltr text-left">
                          {adminChatId || "تنظیم‌نشده"}
                        </h3>
                      </div>
                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Bot className="w-5 h-5" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Methods Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column (2 Cols): Dispatch Panel & Options */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="rounded-2xl border-gray-200/80 shadow-xs">
                      <CardHeader>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          <Send className="w-5 h-5 text-blue-600" />
                          ارسال و مخابره لیست کاربران به تلگرام
                        </CardTitle>
                        <CardDescription className="text-xs">
                          با کلیک روی دکمه زیر، ربات تلگرام مشخصات کاربران را همراه با نام، شماره تماس، وضعیت و تاریخ عضویت به چت تلگرام مدیر مخابره می‌کند.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        
                        {/* Destination Chat ID */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="usersTargetChatId" className="text-xs font-bold text-gray-700">
                              شناسه چت یا کانال مقصد در تلگرام
                            </Label>
                            <span className="text-[11px] text-gray-400">پیش‌فرض: شناسه مدیر ({adminChatId || "خالی"})</span>
                          </div>
                          <Input
                            id="usersTargetChatId"
                            type="text"
                            value={usersTargetChatId}
                            onChange={(e) => setUsersTargetChatId(e.target.value)}
                            placeholder={adminChatId || "مثال: 123456789"}
                            className="h-10 text-xs font-mono dir-ltr text-left rounded-xl"
                          />
                        </div>

                        {/* Filter Role & Limit */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700">
                              فیلتر بر اساس نقش کاربری
                            </Label>
                            <select
                              value={usersFilterRole}
                              onChange={(e) => setUsersFilterRole(e.target.value)}
                              className="w-full h-10 px-3 rounded-xl border border-gray-300 text-xs bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="all">همه نقش‌ها (مدیران و کاربران)</option>
                              <option value="admin">صرفاً مدیران سیستم (Admin)</option>
                              <option value="user_level_1">صرفاً کاربران عادی / سطح ۱</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs font-bold text-gray-700">
                              حداکثر تعداد کاربران در گزارش
                            </Label>
                            <select
                              value={usersLimit}
                              onChange={(e) => setUsersLimit(Number(e.target.value))}
                              className="w-full h-10 px-3 rounded-xl border border-gray-300 text-xs bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value={10}>۱۰ کاربر اخیر</option>
                              <option value={25}>۲۵ کاربر اخیر (پیش‌فرض)</option>
                              <option value={50}>۵۰ کاربر اخیر</option>
                              <option value={100}>۱۰۰ کاربر اخیر</option>
                            </select>
                          </div>
                        </div>

                        {/* Search query (Optional) */}
                        <div className="space-y-1.5">
                          <Label htmlFor="usersSearchQuery" className="text-xs font-bold text-gray-700">
                            فیلتر جستجوی خاص (اختیاری)
                          </Label>
                          <div className="relative">
                            <Input
                              id="usersSearchQuery"
                              type="text"
                              value={usersSearchQuery}
                              onChange={(e) => setUsersSearchQuery(e.target.value)}
                              placeholder="نام، شماره موبایل، نام کاربری یا ایمیل خاص..."
                              className="h-10 pr-9 text-xs rounded-xl"
                            />
                            <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>

                        {/* Send Button */}
                        <div className="pt-3 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                          <Button
                            type="button"
                            onClick={() => sendUsersListMutation.mutate()}
                            disabled={sendUsersListMutation.isPending || (!usersTargetChatId && !adminChatId) || !botToken}
                            className="h-11 px-6 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white shadow-md gap-2"
                          >
                            {sendUsersListMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                در حال آماده‌سازی و ارسال به تلگرام...
                              </>
                            ) : (
                              <>
                                <Users className="w-4 h-4" />
                                ارسال زنده لیست کاربران به تلگرام
                              </>
                            )}
                          </Button>

                          {config?.botUsername && (
                            <a
                              href={`https://t.me/${config?.botUsername}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-semibold px-3 py-2 rounded-xl hover:bg-blue-50 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              مشاهده و باز کردن ربات تلگرام
                            </a>
                          )}
                        </div>

                      </CardContent>
                    </Card>

                    {/* Telegram In-Chat Direct Commands Guide */}
                    <Card className="rounded-2xl border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-blue-50/40 shadow-xs">
                      <CardHeader>
                        <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-900">
                          <Terminal className="w-4 h-4 text-indigo-600" />
                          دریافت مستقیم از داخل تلگرام (دستورات متنی ربات)
                        </CardTitle>
                        <CardDescription className="text-xs">
                          به عنوان مدیر سامانه، در هر زمان بدون نیاز به باز کردن وب‌سایت می‌توانید در پیام‌رسان تلگرام به ربات پیام دهید:
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 text-xs">
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-white border border-indigo-100/80 gap-2">
                          <div>
                            <div className="flex items-center gap-2 font-mono font-bold text-indigo-700">
                              <code className="bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-md text-xs dir-ltr">/users</code>
                              <span className="text-xs font-sans text-gray-700 font-normal">یا ارسال کلمه: <b>«لیست کاربران»</b></span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1.5">
                              ربات بلافاصله آمار کامل و مشخصات تمام کاربران ثبت‌شده را با شماره همراه و وضعیت تفکیک شده ارسال می‌کند.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText("/users");
                              setCopiedCommand(true);
                              setTimeout(() => setCopiedCommand(false), 2000);
                              toast({ title: "کپی شد", description: "دستور /users در کلیپ‌بورد کپی شد" });
                            }}
                            className="text-xs text-indigo-600 hover:bg-indigo-50 shrink-0 self-end sm:self-center"
                          >
                            {copiedCommand ? <CheckCheck className="w-3.5 h-3.5 ml-1 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 ml-1" />}
                            {copiedCommand ? "کپی شد" : "کپی دستور"}
                          </Button>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-white border border-indigo-100/80 gap-2">
                          <div>
                            <div className="flex items-center gap-2 font-mono font-bold text-indigo-700">
                              <code className="bg-indigo-50 text-indigo-800 px-2.5 py-1 rounded-md text-xs dir-ltr">/user [شماره یا نام]</code>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1.5">
                              جستجوی سریع یک کاربر مشخص. مثال: <code className="font-mono text-gray-700 dir-ltr bg-gray-100 px-1 rounded">/user 0912</code> یا <code className="font-mono text-gray-700 dir-ltr bg-gray-100 px-1 rounded">/user علی</code>
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText("/user ");
                              toast({ title: "کپی شد", description: "دستور /user در کلیپ‌بورد کپی شد" });
                            }}
                            className="text-xs text-indigo-600 hover:bg-indigo-50 shrink-0 self-end sm:self-center"
                          >
                            <Copy className="w-3.5 h-3.5 ml-1" />
                            کپی پیشوند
                          </Button>
                        </div>

                        <div className="p-3 bg-amber-50/80 text-amber-900 rounded-xl border border-amber-200/70 text-[11px] leading-relaxed flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <span>
                            <b>امنیت و احراز هویت:</b> ربات تنها به چت آیدی مدیر پاسخ می‌دهد. برای امنیت بیشتر، مطمئن شوید Chat ID تلگرام خود را در تب «اتصال و توکن ربات» ذخیره کرده‌اید.
                          </span>
                        </div>

                      </CardContent>
                    </Card>

                  </div>

                  {/* Right Column (1 Col): Telegram Message Bubble Preview */}
                  <div className="space-y-4">
                    <Card className="rounded-2xl border-gray-200/80 shadow-xs overflow-hidden">
                      <div className="bg-[#517da2] text-white p-3 text-xs font-bold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center font-bold">
                            👥
                          </div>
                          <span>پیش‌نمایش خروجی در تلگرام</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-white border-white/40">
                          Telegram Format
                        </Badge>
                      </div>
                      <div className="p-4 bg-[#7696b2]/15 min-h-[440px] flex flex-col justify-end space-y-3">
                        
                        {/* User message bubble */}
                        <div className="self-end bg-[#effdde] text-gray-800 p-2.5 px-3 rounded-2xl rounded-tr-xs text-xs shadow-xs font-mono">
                          /users
                        </div>

                        {/* Bot reply bubble */}
                        <div className="self-start bg-white text-gray-800 p-3.5 rounded-2xl rounded-tl-xs text-xs shadow-xs max-w-[98%] space-y-2.5 border border-gray-100 leading-relaxed font-sans">
                          <div className="font-bold text-gray-900 text-[12px] flex items-center gap-1.5 border-b pb-1.5">
                            <span>👥</span>
                            <span>گزارش لیست کاربران سامانه</span>
                          </div>
                          
                          <div className="text-[11px] text-gray-600 space-y-1 bg-gray-50/80 p-2 rounded-lg">
                            <p className="font-bold text-gray-800">📊 خلاصه وضعیت کاربران:</p>
                            <p>▫️ کل کاربران: <b>{appUsers.length.toLocaleString("fa-IR")} نفر</b></p>
                            <p>▫️ مدیران: <b>{appUsers.filter((u: any) => u.role === "admin").length.toLocaleString("fa-IR")} نفر</b></p>
                            <p>▫️ کاربران عادی: <b>{appUsers.filter((u: any) => u.role === "user_level_1" || u.role !== "admin").length.toLocaleString("fa-IR")} نفر</b></p>
                          </div>

                          <div className="text-[11px] text-gray-700 space-y-2 pt-1 border-t border-gray-100">
                            <div className="p-2 rounded-lg bg-blue-50/40 border border-blue-100/60">
                              <p className="font-bold text-blue-950">۱. مدیر سیستم (👑 مدیر)</p>
                              <p className="text-[10px] text-gray-600">📱 موبایل: <code className="bg-gray-100 px-1 rounded font-mono">0912xxxxxxx</code></p>
                              <p className="text-[10px] text-gray-600">🏷 نام کاربری: <code className="bg-gray-100 px-1 rounded font-mono">admin</code></p>
                              <p className="text-[10px] text-emerald-600 font-semibold">🟢 فعال</p>
                            </div>

                            <div className="p-2 rounded-lg bg-gray-50/70 border border-gray-100">
                              <p className="font-bold text-gray-800">۲. مشتری سامانه (👤 کاربر)</p>
                              <p className="text-[10px] text-gray-600">📱 موبایل: <code className="bg-gray-100 px-1 rounded font-mono">0935xxxxxxx</code></p>
                              <p className="text-[10px] text-gray-600">🏷 نام کاربری: <code className="bg-gray-100 px-1 rounded font-mono">user_1</code></p>
                              <p className="text-[10px] text-emerald-600 font-semibold">🟢 فعال</p>
                            </div>
                          </div>

                          {/* Interactive Buttons Preview */}
                          <div className="pt-2 grid grid-cols-2 gap-1.5">
                            <div className="bg-blue-50 text-blue-700 py-1.5 px-2 rounded-lg text-center text-[10px] font-bold border border-blue-200/70">
                              🔄 تازه‌سازی لیست
                            </div>
                            <div className="bg-blue-50 text-blue-700 py-1.5 px-2 rounded-lg text-center text-[10px] font-bold border border-blue-200/70">
                              📦 سفارشات جدید
                            </div>
                          </div>

                        </div>

                      </div>
                    </Card>
                  </div>

                </div>

                {/* Database Users Table */}
                <Card className="rounded-2xl border-gray-200/80 shadow-xs">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-600" />
                          کاربران ثبت‌شده سامانه ({appUsers.length.toLocaleString("fa-IR")} کاربر)
                        </CardTitle>
                        <CardDescription className="text-xs">
                          فهرست کاربران پایگاه‌داده جهت بازبینی و ارسال اختصاصی هر کاربر به تلگرام
                        </CardDescription>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => sendUsersListMutation.mutate({ limit: 50 })}
                        disabled={sendUsersListMutation.isPending || !botToken || !adminChatId}
                        className="rounded-xl text-xs h-9 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold"
                      >
                        <Send className="w-3.5 h-3.5 ml-1.5" />
                        ارسال همگانی لیست به تلگرام
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingUsers ? (
                      <div className="py-8 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        در حال دریافت کاربران...
                      </div>
                    ) : appUsers.length === 0 ? (
                      <p className="py-8 text-center text-xs text-gray-400">هیچ کاربری در سامانه یافت نشد.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-right">
                          <thead>
                            <tr className="border-b text-gray-500 font-bold">
                              <th className="py-2.5 px-3">#</th>
                              <th className="py-2.5 px-3">نام و نام خانوادگی</th>
                              <th className="py-2.5 px-3">شماره تماس</th>
                              <th className="py-2.5 px-3">نام کاربری</th>
                              <th className="py-2.5 px-3">نقش</th>
                              <th className="py-2.5 px-3">وضعیت</th>
                              <th className="py-2.5 px-3">عملیات تلگرام</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {appUsers.slice(0, 10).map((u: any, idx: number) => {
                              const fullName = [u.firstName, u.lastName].filter(Boolean).join(" ") || "بدون نام";
                              return (
                                <tr key={u.id || idx} className="hover:bg-gray-50/70 transition-colors">
                                  <td className="py-3 px-3 text-gray-400 font-mono">{idx + 1}</td>
                                  <td className="py-3 px-3 font-semibold text-gray-800">{fullName}</td>
                                  <td className="py-3 px-3 font-mono dir-ltr text-right text-gray-600">{u.phone || "-"}</td>
                                  <td className="py-3 px-3 font-mono text-gray-600">{u.username || "-"}</td>
                                  <td className="py-3 px-3">
                                    {u.role === "admin" ? (
                                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none text-[10px]">
                                        مدیر کل
                                      </Badge>
                                    ) : (
                                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none text-[10px]">
                                        کاربر عادی
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="py-3 px-3">
                                    {u.isBlocked ? (
                                      <span className="text-red-600 font-semibold text-[11px]">مسدود</span>
                                    ) : (
                                      <span className="text-emerald-600 font-semibold text-[11px]">فعال</span>
                                    )}
                                  </td>
                                  <td className="py-3 px-3">
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => sendUsersListMutation.mutate({ search: u.phone || u.username, limit: 1 })}
                                      disabled={sendUsersListMutation.isPending || !botToken || !adminChatId}
                                      className="h-7 px-2 text-[11px] text-blue-600 hover:bg-blue-50 rounded-lg gap-1"
                                    >
                                      <Send className="w-3 h-3" />
                                      ارسال به تلگرام
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </div>
            )}

          </TabsContent>
          <TabsContent value="buttons" className="space-y-4">
            <Card className="rounded-xl border border-gray-100 bg-white shadow-xs">
              <CardHeader className="p-4 pb-3 border-b border-gray-100/80">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div>
                    <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-gray-800">
                      <Layers className="w-4 h-4 text-purple-600" />
                      دکمه‌های شیشه‌ای و منوی تعاملی ربات
                    </CardTitle>
                    <CardDescription className="text-[10px] text-gray-400 mt-0.5">
                      دکمه‌هایی که زیر پیام‌های ربات برای دسترسی سریع به وب‌سایت یا اجرای دستورات نمایش داده می‌شوند
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => syncCommandsMutation.mutate()}
                      disabled={syncCommandsMutation.isPending || !botToken}
                      className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-lg text-xs h-7.5 px-3 font-bold gap-1.5"
                    >
                      {syncCommandsMutation.isPending ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          در حال همگام‌سازی...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3.5 h-3.5" />
                          همگام‌سازی خاموش با تلگرام
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSaveAll()}
                      disabled={saveConfigMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs h-7.5 px-3 font-bold"
                    >
                      ذخیره دکمه‌ها
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-4">

                {/* Telegram Keyboard Sync Banner */}
                <div className="p-3 bg-blue-50/70 text-blue-900 rounded-xl border border-blue-200/60 text-xs leading-relaxed flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-blue-950">
                      همگام‌سازی خاموش منو (ویژه ربات‌های همگانی):
                    </p>
                    <p className="text-[11px] text-blue-800">
                      این ربات عمومی است؛ با کلیک بر روی <b>«همگام‌سازی منو با تلگرام»</b>، هیچ پیام یا گزارشی به کاربران یا چت ارسال نمی‌شود. دکمه‌ها و دستورات جدید به صورت آرام در سرور تلگرام ثبت شده و کاربران در اولین تعامل یا دستور، منوی جدید را مشاهده خواهند کرد.
                    </p>
                  </div>
                </div>
                
                {/* Add New Button Form */}
                <div className="p-3 bg-gray-50/50 rounded-xl border border-gray-100/80 space-y-2.5">
                  <h4 className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    افزودن دکمه تعاملی جدید
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <Label className="text-[10px] font-semibold text-gray-500">عنوان دکمه</Label>
                      <Input
                        value={newBtnText}
                        onChange={(e) => setNewBtnText(e.target.value)}
                        placeholder="مثال: 🌐 ورود به سایت"
                        className="h-8 text-xs rounded-lg bg-white mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-[10px] font-semibold text-gray-500">نوع عملکرد</Label>
                      <select
                        value={newBtnType}
                        onChange={(e) => setNewBtnType(e.target.value as any)}
                        className="w-full h-8 text-xs rounded-lg bg-white border border-gray-200 px-2 mt-1 focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700"
                      >
                        <option value="url">لینک اینترنتی (URL)</option>
                        <option value="command">دستور ربات (Command)</option>
                      </select>
                    </div>

                    <div>
                      <Label className="text-[10px] font-semibold text-gray-500">مقدار (آدرس لینک یا دستور)</Label>
                      <Input
                        value={newBtnValue}
                        onChange={(e) => setNewBtnValue(e.target.value)}
                        placeholder={newBtnType === "url" ? "https://rakhsh.ir" : "/products"}
                        className="h-8 text-xs font-mono dir-ltr text-left rounded-lg bg-white mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-0.5">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddButton}
                      className="rounded-lg text-xs h-7 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3"
                    >
                      افزودن به لیست دکمه‌ها
                    </Button>
                  </div>
                </div>

                {/* Buttons List */}
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-bold text-gray-600">دکمه‌های فعال فعلی:</h4>
                  {menuButtons.length === 0 ? (
                    <p className="text-xs text-gray-400 py-4 text-center">دکمه‌ای تعریف نشده است.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {menuButtons.map((btn) => (
                        <div
                          key={btn.id}
                          className="flex items-center justify-between p-2 px-2.5 bg-white rounded-lg border border-gray-100 shadow-3xs hover:border-blue-200 transition-colors"
                        >
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-gray-800">{btn.text}</span>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono dir-ltr">
                              <Badge variant="outline" className="text-[9px] py-0 px-1 font-sans h-4 rounded">
                                {btn.type === "url" ? "لینک" : "دستور"}
                              </Badge>
                              <span className="truncate max-w-[180px]">{btn.value}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveButton(btn.id)}
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          </TabsContent>

          {/* ============================================================ */}
          {/* TAB 5: Broadcast Announcements */}
          {/* ============================================================ */}
          <TabsContent value="broadcast" className="space-y-4">
            <Card className="rounded-xl border border-gray-100 bg-white shadow-xs">
              <CardHeader className="p-4 pb-3 border-b border-gray-100/80">
                <CardTitle className="text-xs font-bold flex items-center gap-1.5 text-gray-800">
                  <Send className="w-4 h-4 text-blue-600" />
                  ارسال پیام همگانی و اطلاعیه به تلگرام
                </CardTitle>
                <CardDescription className="text-[10px] text-gray-400 mt-0.5">
                  ارسال مستقیم اطلاعیه، تخفیف‌ها یا اخبار به کانال رسمی، گروه‌ها یا مخاطبان ثبت شده
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                
                <div className="space-y-1">
                  <Label htmlFor="broadcastTarget" className="text-[11px] font-bold text-gray-600">
                    شناسه‌های مقصد (Chat ID یا آیدی کانال)
                  </Label>
                  <Input
                    id="broadcastTarget"
                    type="text"
                    value={broadcastCustomTarget}
                    onChange={(e) => setBroadcastCustomTarget(e.target.value)}
                    placeholder={adminChatId ? `پیش‌فرض: ${adminChatId} (با کاما برای چند مورد جدا کنید)` : "مثال: 123456789, @my_channel"}
                    className="h-8 text-xs font-mono dir-ltr text-left rounded-lg bg-gray-50/30"
                  />
                  <p className="text-[9px] text-gray-400">
                    در صورت خالی گذاشتن، به چت یا کانال مدیر سیستم ({adminChatId || "تعریف نشده"}) ارسال می‌شود.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="broadcastContent" className="text-[11px] font-bold text-gray-600">
                      متن پیام اطلاعیه <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-[9px] text-gray-400">پشتیبانی از تگ‌های HTML نظیر &lt;b&gt; &lt;i&gt; &lt;a&gt;</span>
                  </div>
                  <Textarea
                    id="broadcastContent"
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="متن اطلاعیه، تخفیف، اخبار یا پیام همگانی خود را اینجا بنویسید..."
                    rows={4}
                    className="text-xs rounded-lg"
                  />
                </div>

                {/* Optional Action Button */}
                <div className="p-2.5 bg-gray-50/50 rounded-lg border border-gray-100/80 space-y-2">
                  <h4 className="text-[10px] font-bold text-gray-600 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3 text-blue-600" />
                    دکمه شیشه‌ای زیر پیام (اختیاری)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[9px] text-gray-400">عنوان دکمه</Label>
                      <Input
                        value={broadcastButtonText}
                        onChange={(e) => setBroadcastButtonText(e.target.value)}
                        placeholder="مثال: خرید آنلاین با ۵۰٪ تخفیف"
                        className="h-8 text-xs rounded-md bg-white mt-0.5"
                      />
                    </div>
                    <div>
                      <Label className="text-[9px] text-gray-400">آدرس اینترنتی دکمه</Label>
                      <Input
                        value={broadcastButtonUrl}
                        onChange={(e) => setBroadcastButtonUrl(e.target.value)}
                        placeholder="https://rakhsh.ir/products"
                        className="h-8 text-xs font-mono dir-ltr text-left rounded-md bg-white mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => broadcastMutation.mutate()}
                  disabled={broadcastMutation.isPending || !broadcastText.trim() || !botToken}
                  className="w-full sm:w-auto h-8 px-4 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white shadow-xs gap-1.5"
                >
                  {broadcastMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      در حال ارسال همگانی به تلگرام...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      ارسال همگانی اطلاعیه به تلگرام
                    </>
                  )}
                </Button>

              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* ============================================================ */}
        {/* MODAL: Direct Message to Bot User in Telegram                */}
        {/* ============================================================ */}
        <Dialog open={directMsgModalOpen} onOpenChange={setDirectMsgModalOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-gray-900">
                <MessageSquarePlus className="w-5 h-5 text-blue-600" />
                ارسال پیام مستقیم و اختصاصی به کاربر تلگرام
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                این پیام به طور مستقیم در صفحه چت تلگرام کاربر نمایش داده می‌شود.
              </DialogDescription>
            </DialogHeader>

            {directMsgTargetUser && (
              <div className="space-y-4 py-2">
                {/* Target User Info Bar */}
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                      {(directMsgTargetUser.firstName?.[0] || directMsgTargetUser.username?.[0] || "U").toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">
                        {[directMsgTargetUser.firstName, directMsgTargetUser.lastName].filter(Boolean).join(" ") || "کاربر تلگرام"}
                      </p>
                      {directMsgTargetUser.username && (
                        <p className="text-[10px] text-blue-600 font-mono dir-ltr text-right">
                          @{directMsgTargetUser.username}
                        </p>
                      )}
                      {directMsgTargetUser.phoneNumber && (
                        <p className="text-[10px] text-emerald-700 font-mono dir-ltr text-right flex items-center gap-1 font-bold mt-0.5">
                          <span>📱</span> {directMsgTargetUser.phoneNumber}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-left font-mono">
                    <span className="text-[10px] text-gray-400 block">Chat ID:</span>
                    <code className="text-xs font-bold text-gray-700 dir-ltr">{directMsgTargetUser.chatId}</code>
                  </div>
                </div>

                {/* Message Textarea */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="directMsgText" className="text-xs font-bold text-gray-700">
                      متن پیام <span className="text-red-500">*</span>
                    </Label>
                    <span className="text-[10px] text-gray-400">پشتیبانی از تگ‌های HTML (&lt;b&gt;, &lt;i&gt;, ...)</span>
                  </div>
                  <Textarea
                    id="directMsgText"
                    value={directMsgText}
                    onChange={(e) => setDirectMsgText(e.target.value)}
                    placeholder="متن پیام اختصاصی خود برای این کاربر را بنویسید..."
                    rows={4}
                    className="text-xs rounded-xl"
                  />
                </div>

                {/* Optional Inline Button */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2.5">
                  <p className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                    <ExternalLink className="w-3 h-3 text-blue-600" />
                    دکمه شیشه‌ای زیر پیام (اختیاری)
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-gray-500">عنوان دکمه</Label>
                      <Input
                        value={directMsgBtnText}
                        onChange={(e) => setDirectMsgBtnText(e.target.value)}
                        placeholder="مثال: پیگیری سفارش"
                        className="h-8 text-xs rounded-lg bg-white mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-[10px] text-gray-500">آدرس اینترنتی دکمه</Label>
                      <Input
                        value={directMsgBtnUrl}
                        onChange={(e) => setDirectMsgBtnUrl(e.target.value)}
                        placeholder="https://..."
                        className="h-8 text-xs font-mono dir-ltr text-left rounded-lg bg-white mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDirectMsgModalOpen(false)}
                className="h-9 text-xs rounded-xl"
              >
                انصراف
              </Button>
              <Button
                type="button"
                disabled={!directMsgText.trim() || sendDirectMessageMutation.isPending || !directMsgTargetUser}
                onClick={() => {
                  if (!directMsgTargetUser || !directMsgText.trim()) return;
                  sendDirectMessageMutation.mutate({
                    chatId: String(directMsgTargetUser.chatId),
                    message: directMsgText.trim(),
                    buttonText: directMsgBtnText.trim() || undefined,
                    buttonUrl: directMsgBtnUrl.trim() || undefined,
                  });
                }}
                className="h-9 text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5"
              >
                {sendDirectMessageMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    در حال ارسال...
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    ارسال پیام به تلگرام
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ============================================================ */}
        {/* MODAL: Manually Register / Add Telegram Bot User             */}
        {/* ============================================================ */}
        <Dialog open={addBotUserModalOpen} onOpenChange={setAddBotUserModalOpen}>
          <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2 text-gray-900">
                <UserPlus className="w-5 h-5 text-blue-600" />
                ثبت دستی کاربر در لیست ربات تلگرام
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                با وارد کردن شناسه عددی چت (Chat ID)، کاربر در لیست مخاطبان ذخیره می‌شود و می‌توانید به او پیام ارسال نمایید.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="newBotChatId" className="text-xs font-bold text-gray-700">
                  شناسه عددی تلگرام (Chat ID) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="newBotChatId"
                  value={newBotChatId}
                  onChange={(e) => setNewBotChatId(e.target.value)}
                  placeholder="مثال: 123456789 یا @my_username"
                  className="h-9 text-xs font-mono dir-ltr text-left rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="newBotFirstName" className="text-xs font-bold text-gray-700">
                    نام (اختیاری)
                  </Label>
                  <Input
                    id="newBotFirstName"
                    value={newBotFirstName}
                    onChange={(e) => setNewBotFirstName(e.target.value)}
                    placeholder="مثال: علی"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newBotLastName" className="text-xs font-bold text-gray-700">
                    نام خانوادگی
                  </Label>
                  <Input
                    id="newBotLastName"
                    value={newBotLastName}
                    onChange={(e) => setNewBotLastName(e.target.value)}
                    placeholder="مثال: محمدی"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newBotUsername" className="text-xs font-bold text-gray-700">
                  نام کاربری تلگرام (بدون @)
                </Label>
                <Input
                  id="newBotUsername"
                  value={newBotUsername}
                  onChange={(e) => setNewBotUsername(e.target.value.replace(/^@/, ""))}
                  placeholder="مثال: ali_mohammadi"
                  className="h-9 text-xs font-mono dir-ltr text-left rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newBotPhoneNumber" className="text-xs font-bold text-gray-700">
                  شماره تلفن همراه (اختیاری)
                </Label>
                <Input
                  id="newBotPhoneNumber"
                  value={newBotPhoneNumber}
                  onChange={(e) => setNewBotPhoneNumber(e.target.value)}
                  placeholder="مثال: 09123456789"
                  className="h-9 text-xs font-mono dir-ltr text-left rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="newBotNotes" className="text-xs font-bold text-gray-700">
                  یادداشت و توضیحات مدیر (اختیاری)
                </Label>
                <Input
                  id="newBotNotes"
                  value={newBotNotes}
                  onChange={(e) => setNewBotNotes(e.target.value)}
                  placeholder="مثال: مشتری VIP / همکار واحد پشتیبانی"
                  className="h-9 text-xs rounded-xl"
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddBotUserModalOpen(false)}
                className="h-9 text-xs rounded-xl"
              >
                انصراف
              </Button>
              <Button
                type="button"
                disabled={!newBotChatId.trim() || addBotUserMutation.isPending}
                onClick={() => {
                  if (!newBotChatId.trim()) return;
                  addBotUserMutation.mutate({
                    chatId: newBotChatId.trim(),
                    username: newBotUsername.trim() || undefined,
                    firstName: newBotFirstName.trim() || undefined,
                    lastName: newBotLastName.trim() || undefined,
                    phoneNumber: newBotPhoneNumber.trim() || undefined,
                    notes: newBotNotes.trim() || undefined,
                  });
                }}
                className="h-9 text-xs rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5"
              >
                {addBotUserMutation.isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    در حال ذخیره...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    ذخیره مشخصات کاربر
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add New Command Modal / Dialog */}
        <Dialog open={isAddCmdModalOpen} onOpenChange={setIsAddCmdModalOpen}>
          <DialogContent className="max-w-lg rounded-2xl p-0 overflow-hidden bg-white dir-rtl" dir="rtl">
            <DialogHeader className="p-4 bg-slate-900 text-white flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-bold text-white">
                    {newCmdParentId === "root" ? "افزودن دستور جدید در منوی اصلی" : "افزودن زیردستور جدید"}
                  </DialogTitle>
                  <DialogDescription className="text-[10px] text-slate-300 mt-0.5">
                    دستور جدید برای ارسال خودکار متن و پیوست رسانه در پاسخ کاربر
                  </DialogDescription>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddCmdModalOpen(false)}
                className="h-7 w-7 p-0 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogHeader>

            <div className="p-4 space-y-3 max-h-[80vh] overflow-y-auto">
              
              {/* Position Select & Trigger Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">موقعیت در منوی درختی</Label>
                  <Select value={newCmdParentId} onValueChange={setNewCmdParentId}>
                    <SelectTrigger className="h-8 text-xs rounded-lg bg-white border-slate-200">
                      <SelectValue placeholder="انتخاب موقعیت" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="root">📌 منوی اصلی (دستور ریشه)</SelectItem>
                      {getFormattedCommandOptions(botCommands).map((opt) => (
                        <SelectItem key={opt.id} value={opt.id}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-700">دستور یا کلمه کلیدی تحریک</Label>
                  <Input
                    value={newCmdName}
                    onChange={(e) => setNewCmdName(e.target.value)}
                    placeholder="مثال: /pricing یا قیمت‌ها"
                    className="h-8 text-xs rounded-lg bg-white border-slate-200 font-mono text-left dir-ltr"
                  />
                </div>
              </div>

              {/* Button Title */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-slate-700">عنوان یا متن دکمه کیبورد در تلگرام</Label>
                <Input
                  value={newCmdDesc}
                  onChange={(e) => setNewCmdDesc(e.target.value)}
                  placeholder="مثال: مشاهده قیمت‌ها و تعرفه‌های عضویت"
                  className="h-8 text-xs rounded-lg bg-white border-slate-200"
                />
              </div>

              {/* Response Text */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label className="text-[11px] font-semibold text-slate-700">پاسخ متنی ربات (HTML پشتیبانی می‌شود)</Label>
                  <span className="text-[9px] text-slate-400 font-mono">{newCmdResponse.length} کاراکتر</span>
                </div>
                <Textarea
                  value={newCmdResponse}
                  onChange={(e) => setNewCmdResponse(e.target.value)}
                  placeholder="متنی که ربات در پاسخ ارسال خواهد نمود..."
                  rows={3}
                  className="text-xs rounded-lg border-slate-200"
                />
              </div>

              {/* Media Attachment Container */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                    پیوست فایل و رسانه (عکس، ویدیو، فایل یا صوت)
                  </Label>
                  {newCmdMediaType !== "none" && (
                    <Badge className="bg-indigo-100 text-indigo-800 text-[10px] border-none px-2 py-0.5 font-bold">
                      {newCmdMediaType === "photo" && "🖼️ تصویر"}
                      {newCmdMediaType === "video" && "🎥 ویدیو"}
                      {newCmdMediaType === "document" && "📄 فایل / سند"}
                      {newCmdMediaType === "audio" && "🎵 صوت"}
                    </Badge>
                  )}
                </div>

                {/* Media Type Selection Buttons */}
                <div className="grid grid-cols-5 gap-1">
                  {[
                    { id: "none", label: "بدون فایل", icon: MessageSquare },
                    { id: "photo", label: "عکس", icon: ImageIcon },
                    { id: "video", label: "ویدیو", icon: Video },
                    { id: "document", label: "سند/فایل", icon: FileText },
                    { id: "audio", label: "صوت", icon: Music },
                  ].map((item) => {
                    const IconComp = item.icon;
                    const isSelected = newCmdMediaType === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setNewCmdMediaType(item.id as any)}
                        className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-[10px] transition-all ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50 text-indigo-800 font-bold shadow-2xs"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <IconComp className={`w-3.5 h-3.5 mb-0.5 ${isSelected ? "text-indigo-600" : "text-slate-400"}`} />
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                {/* File Upload / URL input if media selected */}
                {newCmdMediaType !== "none" && (
                  <div className="space-y-2 pt-1 border-t border-slate-200/80">
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="modal-new-cmd-file-input"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadCmdMedia(file);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById("modal-new-cmd-file-input")?.click()}
                        disabled={isUploadingCmdMedia}
                        className="h-8 text-xs font-bold rounded-lg bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 w-full gap-1.5"
                      >
                        {isUploadingCmdMedia ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                            در حال آپلود فایل...
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                            انتخاب و آپلود مستقیم فایل رسانه
                          </>
                        )}
                      </Button>
                    </div>

                    <div className="space-y-1">
                      <Input
                        type="text"
                        value={newCmdMediaUrl}
                        onChange={(e) => setNewCmdMediaUrl(e.target.value)}
                        placeholder="آدرس ذخیره شده یا URL فایل..."
                        className="h-8 text-xs font-mono dir-ltr text-left rounded-lg bg-white border-slate-200"
                      />
                    </div>
                  </div>
                )}

              </div>

            </div>

            <DialogFooter className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddCmdModalOpen(false)}
                className="text-xs h-8 rounded-lg"
              >
                انصراف
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAddCommand}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 font-bold rounded-lg px-4 gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {newCmdParentId === "root" ? "ثبت در منوی اصلی" : "ثبت به عنوان زیرمنو"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </DashboardLayout>
  );
}
