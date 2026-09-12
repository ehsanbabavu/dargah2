import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import moment from "moment-jalaali";
import {
  Megaphone,
  Plus,
  Pin,
  PinOff,
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Info,
  Flame,
  Trash2,
  Edit,
  Eye,
  Clock,
  User,
  Users,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  Filter,
} from "lucide-react";

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  targetAudience: "user_level_1" | "all";
  priority: "normal" | "important" | "urgent" | "info";
  isPinned: boolean;
  isPublished: boolean;
  authorId: string;
  authorName?: string | null;
  createdAt: string;
  updatedAt?: string;
  isRead?: boolean;
}

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [activeTab, setActiveTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);

  // Form states for Create/Edit
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    targetAudience: "user_level_1",
    priority: "normal",
    isPinned: false,
    isPublished: true,
  });

  // Fetch Announcements
  const { data: announcements = [], isLoading } = useQuery<AnnouncementItem[]>({
    queryKey: ["/api/announcements"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/announcements");
      if (!res.ok) throw new Error("Failed to fetch announcements");
      return res.json();
    },
  });

  // Fetch Unread count for regular users
  const { data: unreadData } = useQuery<{ unreadCount: number }>({
    queryKey: ["/api/announcements/unread-count"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/announcements/unread-count");
      if (!res.ok) return { unreadCount: 0 };
      return res.json();
    },
    enabled: !isAdmin,
  });

  // Create Announcement Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const res = await apiRequest("POST", "/api/announcements", payload);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "خطا در ارسال اطلاعیه");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "اطلاعیه با موفقیت ارسال شد",
        description: "اطلاعیه برای کاربران هدف منتشر شد.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements/unread-count"] });
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: Error) => {
      toast({
        title: "خطا در ارسال اطلاعیه",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Update Announcement Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const res = await apiRequest("PUT", `/api/announcements/${id}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "خطا در ویرایش اطلاعیه");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "اطلاعیه به‌روزرسانی شد",
        description: "تغییرات با موفقیت ذخیره گردید.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements/unread-count"] });
      setEditingAnnouncement(null);
      resetForm();
    },
    onError: (err: Error) => {
      toast({
        title: "خطا در ویرایش",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Delete Announcement Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/announcements/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "خطا در حذف اطلاعیه");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "اطلاعیه حذف شد",
        description: "اطلاعیه با موفقیت از سیستم حذف گردید.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements/unread-count"] });
      setDeletingId(null);
    },
    onError: (err: Error) => {
      toast({
        title: "خطا در حذف",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Mark as Read Mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/announcements/${id}/read`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements/unread-count"] });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      targetAudience: "user_level_1",
      priority: "normal",
      isPinned: false,
      isPublished: true,
    });
  };

  const handleOpenEdit = (item: AnnouncementItem) => {
    setEditingAnnouncement(item);
    setFormData({
      title: item.title,
      content: item.content,
      targetAudience: item.targetAudience,
      priority: item.priority,
      isPinned: item.isPinned,
      isPublished: item.isPublished,
    });
  };

  const handleOpenView = (item: AnnouncementItem) => {
    setSelectedAnnouncement(item);
    if (!isAdmin && !item.isRead) {
      markAsReadMutation.mutate(item.id);
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast({ title: "عنوان الزامی است", variant: "destructive" });
      return;
    }
    if (!formData.content.trim()) {
      toast({ title: "متن اطلاعیه الزامی است", variant: "destructive" });
      return;
    }

    if (editingAnnouncement) {
      updateMutation.mutate({ id: editingAnnouncement.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  // Helper labels and colors
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return (
          <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-0 gap-1 text-[11px] font-medium shadow-xs">
            <Flame className="w-3 h-3" />
            فوری و مهم
          </Badge>
        );
      case "important":
        return (
          <Badge className="bg-amber-500 hover:bg-amber-600 text-white border-0 gap-1 text-[11px] font-medium shadow-xs">
            <AlertTriangle className="w-3 h-3" />
            مهم
          </Badge>
        );
      case "info":
        return (
          <Badge className="bg-sky-500 hover:bg-sky-600 text-white border-0 gap-1 text-[11px] font-medium shadow-xs">
            <Info className="w-3 h-3" />
            اطلاع‌رسانی
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-600 hover:bg-slate-700 text-white border-0 gap-1 text-[11px] font-medium">
            <Bell className="w-3 h-3" />
            عادی
          </Badge>
        );
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case "user_level_1":
        return "کاربران سطح ۱";
      default:
        return "همه کاربران";
    }
  };

  // Filter announcements
  const filteredAnnouncements = announcements.filter((item) => {
    // Search query filter
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.content.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === "pinned") return item.isPinned;
    if (activeTab === "unread") return !item.isRead;
    if (activeTab === "level1") return item.targetAudience === "user_level_1";

    return true;
  });

  const pinnedCount = announcements.filter((a) => a.isPinned).length;
  const level1Count = announcements.filter((a) => a.targetAudience === "user_level_1").length;
  const unreadCount = unreadData?.unreadCount ?? announcements.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-8" dir="rtl">
      {/* HEADER BANNER */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-l from-indigo-900 via-indigo-800 to-slate-900 text-white p-4 md:p-5 shadow-lg border border-indigo-500/20">
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-1/4 -top-12 w-36 h-36 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-[11px] font-semibold">
              <Megaphone className="w-3 h-3 text-indigo-300 animate-pulse" />
              {isAdmin ? "پنل ارسال اطلاعیه به کاربران سطح ۱" : "تابلو اعلانات و پیام‌های رسمی مدیریت"}
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              اطلاعیه‌ها و پیام‌های سیستم
              {!isAdmin && unreadCount > 0 && (
                <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-0 text-[10px] px-2 py-0.5 rounded-full animate-bounce shadow-xs">
                  {unreadCount} اطلاعیه جدید
                </Badge>
              )}
            </h1>
            <p className="text-slate-300 text-xs max-w-xl leading-relaxed">
              {isAdmin
                ? "از این بخش می‌توانید اطلاعیه‌ها، بخشنامه‌های کاری، تغییرات درگاه پرداخت و راهنماها را مستقیماً برای کاربران ارسال نمایید."
                : "تمامی پیام‌ها، اطلاعیه‌ها و هشدارهای رسمی مدیریت سایت در این بخش قابل مشاهده است."}
            </p>
          </div>

          {isAdmin && (
            <Button
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
              className="h-9 px-3.5 rounded-lg bg-white text-indigo-900 hover:bg-indigo-50 font-bold shadow-md gap-1.5 text-xs shrink-0 transition-transform active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-700" />
              ارسال اطلاعیه جدید
            </Button>
          )}
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3.5 pt-3.5 border-t border-indigo-500/20">
          <div className="bg-white/5 backdrop-blur-xs rounded-lg p-2 border border-white/10">
            <div className="text-[10px] text-indigo-200 font-medium">کل اطلاعیه‌ها</div>
            <div className="text-base font-bold mt-0.5 text-white">{announcements.length}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-lg p-2 border border-white/10">
            <div className="text-[10px] text-indigo-200 font-medium">مخصوص کاربران سطح ۱</div>
            <div className="text-base font-bold mt-0.5 text-amber-300">{level1Count}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-lg p-2 border border-white/10">
            <div className="text-[10px] text-indigo-200 font-medium">سنجاق شده به بالا</div>
            <div className="text-base font-bold mt-0.5 text-emerald-300">{pinnedCount}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xs rounded-lg p-2 border border-white/10">
            <div className="text-[10px] text-indigo-200 font-medium">
              {isAdmin ? "وضعیت انتشار" : "خوانده نشده"}
            </div>
            <div className="text-base font-bold mt-0.5 text-rose-300">
              {isAdmin ? "فعال و آنلاین" : unreadCount}
            </div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-card p-2.5 rounded-xl border border-border shadow-2xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="جستجو در عنوان یا متن اطلاعیه‌ها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-8 text-xs h-8 rounded-lg bg-background border-border"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
          <TabsList className="grid grid-cols-3 sm:flex h-8 p-0.5 bg-muted/60 rounded-lg">
            <TabsTrigger value="all" className="text-[11px] rounded-md px-2.5 h-7">
              همه ({announcements.length})
            </TabsTrigger>
            <TabsTrigger value="pinned" className="text-[11px] rounded-md px-2.5 h-7 gap-1">
              <Pin className="w-3 h-3 text-amber-500" />
              سنجاق‌شده ({pinnedCount})
            </TabsTrigger>
            {!isAdmin ? (
              <TabsTrigger value="unread" className="text-[11px] rounded-md px-2.5 h-7 gap-1">
                <Bell className="w-3 h-3 text-rose-500" />
                خوانده نشده ({unreadCount})
              </TabsTrigger>
            ) : (
              <TabsTrigger value="level1" className="text-[11px] rounded-md px-2.5 h-7">
                سطح ۱ ({level1Count})
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      {/* ANNOUNCEMENTS LIST */}
      {isLoading ? (
        <div className="py-12 text-center space-y-2">
          <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-muted-foreground">در حال بارگذاری اطلاعیه‌ها...</p>
        </div>
      ) : filteredAnnouncements.length === 0 ? (
        <Card className="rounded-xl border-dashed border-2 text-center p-8 space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
            <Megaphone className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-foreground">هیچ اطلاعیه‌ای یافت نشد</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {searchQuery
                ? "موردی مطابق با عبارت جستجو شده پیدا نشد."
                : "در حال حاضر اطلاعیه جدیدی در این بخش ثبت نشده است."}
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => {
                resetForm();
                setIsCreateOpen(true);
              }}
              variant="outline"
              className="rounded-lg text-xs h-8 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              ارسال اولین اطلاعیه
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-2.5">
          {filteredAnnouncements.map((item) => (
            <Card
              key={item.id}
              className={`rounded-xl border transition-all duration-200 hover:shadow-xs ${
                item.isPinned
                  ? "border-amber-400/50 bg-gradient-to-r from-amber-500/[0.04] to-transparent dark:from-amber-500/10"
                  : "border-border hover:border-indigo-400/40"
              } ${!isAdmin && !item.isRead ? "ring-2 ring-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/20" : ""}`}
            >
              <CardContent className="p-3.5 md:p-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  {/* MAIN CONTENT AREA */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {item.isPinned && (
                        <Badge className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50 gap-1 text-[10px] font-medium py-0 px-1.5">
                          <Pin className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          سنجاق شده
                        </Badge>
                      )}

                      {getPriorityBadge(item.priority)}

                      <Badge variant="outline" className="text-[10px] text-muted-foreground border-border gap-1 font-normal py-0 px-1.5">
                        <Users className="w-2.5 h-2.5 text-indigo-500" />
                        {getAudienceLabel(item.targetAudience)}
                      </Badge>

                      {!isAdmin && !item.isRead && (
                        <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-ping" title="خوانده نشده" />
                      )}
                    </div>

                    {/* TITLE */}
                    <h3
                      onClick={() => handleOpenView(item)}
                      className="text-sm font-bold text-foreground cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors leading-snug flex items-center gap-1.5"
                    >
                      {item.title}
                      {!isAdmin && !item.isRead && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-semibold">
                          جدید
                        </span>
                      )}
                    </h3>

                    {/* CONTENT PREVIEW */}
                    <p
                      onClick={() => handleOpenView(item)}
                      className="text-xs text-muted-foreground leading-relaxed line-clamp-2 cursor-pointer whitespace-pre-line"
                    >
                      {item.content}
                    </p>

                    {/* FOOTER INFO */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {moment(item.createdAt).format("jYYYY/jMM/jDD - HH:mm")}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        {item.authorName || "مدیریت سایت"}
                      </span>
                    </div>
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end md:self-center">
                    <Button
                      onClick={() => handleOpenView(item)}
                      variant="outline"
                      size="sm"
                      className="text-[11px] h-8 px-2.5 rounded-lg gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-600 border-border"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      مشاهده کامل
                    </Button>

                    {isAdmin && (
                      <>
                        <Button
                          onClick={() => handleOpenEdit(item)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                          title="ویرایش اطلاعیه"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          onClick={() => setDeletingId(item.id)}
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                          title="حذف اطلاعیه"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL: VIEW FULL ANNOUNCEMENT */}
      <Dialog open={!!selectedAnnouncement} onOpenChange={(open) => !open && setSelectedAnnouncement(null)}>
        <DialogContent className="max-w-2xl rounded-2xl p-6" dir="rtl">
          {selectedAnnouncement && (
            <div className="space-y-5">
              <DialogHeader className="text-right space-y-3 pb-3 border-b border-border">
                <div className="flex flex-wrap items-center gap-2">
                  {selectedAnnouncement.isPinned && (
                    <Badge className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 text-[11px]">
                      <Pin className="w-3 h-3 fill-amber-500 mr-1" />
                      سنجاق شده
                    </Badge>
                  )}
                  {getPriorityBadge(selectedAnnouncement.priority)}
                  <Badge variant="outline" className="text-[11px]">
                    {getAudienceLabel(selectedAnnouncement.targetAudience)}
                  </Badge>
                </div>
                <DialogTitle className="text-lg md:text-xl font-black text-foreground leading-snug">
                  {selectedAnnouncement.title}
                </DialogTitle>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {moment(selectedAnnouncement.createdAt).format("jYYYY/jMM/jDD - HH:mm")}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {selectedAnnouncement.authorName || "مدیریت سایت"}
                  </span>
                </div>
              </DialogHeader>

              {/* ANNOUNCEMENT BODY */}
              <div className="bg-muted/30 p-5 rounded-2xl border border-border/60 text-sm leading-relaxed text-foreground whitespace-pre-wrap max-h-[60vh] overflow-y-auto">
                {selectedAnnouncement.content}
              </div>

              <DialogFooter className="flex justify-end pt-2">
                <Button
                  onClick={() => setSelectedAnnouncement(null)}
                  className="rounded-xl px-6 text-xs h-10 font-bold"
                >
                  بستن
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: CREATE / EDIT ANNOUNCEMENT (ADMIN ONLY) */}
      <Dialog
        open={isCreateOpen || !!editingAnnouncement}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingAnnouncement(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl rounded-2xl p-6" dir="rtl">
          <form onSubmit={handleSaveForm} className="space-y-4">
            <DialogHeader className="text-right space-y-1.5 pb-2 border-b border-border">
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-600" />
                {editingAnnouncement ? "ویرایش اطلاعیه" : "ارسال اطلاعیه جدید به کاربران"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                متن و تنظیمات اطلاعیه را مشخص نمایید تا در بخش اطلاعیه‌های کاربران نمایش داده شود.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* TITLE */}
              <div className="space-y-1.5 text-right">
                <Label htmlFor="title" className="text-xs font-bold block text-right">
                  عنوان اطلاعیه <span className="text-rose-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="مثال: تغییرات مهم در درگاه پرداخت کارت به کارت"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="text-xs h-10 rounded-xl"
                  dir="rtl"
                  required
                />
              </div>

              {/* AUDIENCE & PRIORITY */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 text-right">
                  <Label className="text-xs font-bold block text-right">مخاطبان هدف</Label>
                  <Select
                    value={formData.targetAudience}
                    onValueChange={(val) => setFormData({ ...formData, targetAudience: val as any })}
                  >
                    <SelectTrigger className="text-xs h-10 rounded-xl" dir="rtl">
                      <SelectValue placeholder="انتخاب مخاطبان" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="user_level_1" className="text-xs font-medium">
                        کاربران سطح ۱
                      </SelectItem>
                      <SelectItem value="all" className="text-xs font-medium">
                        تمام کاربران سایت
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 text-right">
                  <Label className="text-xs font-bold block text-right">اولویت و نوع پیام</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(val) => setFormData({ ...formData, priority: val as any })}
                  >
                    <SelectTrigger className="text-xs h-10 rounded-xl" dir="rtl">
                      <SelectValue placeholder="انتخاب اولویت" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="normal" className="text-xs">
                        🔵 عادی
                      </SelectItem>
                      <SelectItem value="important" className="text-xs">
                        🟡 مهم
                      </SelectItem>
                      <SelectItem value="urgent" className="text-xs">
                        🔴 فوری و اضطراری
                      </SelectItem>
                      <SelectItem value="info" className="text-xs">
                        🟢 اطلاع‌رسانی و راهنما
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* PIN & PUBLISH SWITCHES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 text-right">
                    <Label className="text-xs font-bold block cursor-pointer">سنجاق به بالای لیست</Label>
                    <span className="text-[10px] text-muted-foreground">نمایش دائمی در صدر اطلاعیه‌ها</span>
                  </div>
                  <Switch
                    checked={formData.isPinned}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPinned: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 text-right">
                    <Label className="text-xs font-bold block cursor-pointer">انتشار فوری</Label>
                    <span className="text-[10px] text-muted-foreground">نمایش به کاربران به صورت آنلاین</span>
                  </div>
                  <Switch
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                  />
                </div>
              </div>

              {/* CONTENT */}
              <div className="space-y-1.5 text-right">
                <Label htmlFor="content" className="text-xs font-bold block text-right">
                  متن کامل اطلاعیه <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="content"
                  placeholder="متن اطلاعیه خود را به همراه جزئیات و نکات لازم اینجا تایپ کنید..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="text-xs min-h-[140px] rounded-xl leading-relaxed resize-y"
                  dir="rtl"
                  required
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingAnnouncement(null);
                  resetForm();
                }}
                className="rounded-xl text-xs h-10"
              >
                انصراف
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="rounded-xl text-xs h-10 font-bold bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    در حال ذخیره...
                  </>
                ) : editingAnnouncement ? (
                  "ذخیره تغییرات اطلاعیه"
                ) : (
                  "ارسال و انتشار اطلاعیه"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE DIALOG */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md p-6" dir="rtl">
          <AlertDialogHeader className="text-right space-y-2">
            <AlertDialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              حذف دائمی اطلاعیه
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              آیا از حذف این اطلاعیه اطمینان دارید؟ این عملیات غیرقابل بازگشت است و اطلاعیه از پنل تمامی کاربران حذف خواهد شد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 pt-4">
            <AlertDialogCancel className="rounded-xl text-xs h-10">انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              disabled={deleteMutation.isPending}
              className="rounded-xl text-xs h-10 bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {deleteMutation.isPending ? "در حال حذف..." : "بله، حذف شود"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
