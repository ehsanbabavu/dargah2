import { useState, useRef } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  RotateCcw, 
  MessageCircle, 
  Tag, 
  AlertTriangle, 
  FileText, 
  Paperclip, 
  X, 
  ArrowRight,
  Sparkles,
  ShieldAlert,
  Clock,
  HelpCircle,
  FileSpreadsheet,
  File
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";

export default function SendTicket() {
  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    priority: "medium",
    message: "",
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTicketMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const formDataToSend = new FormData();
      formDataToSend.append("subject", data.subject);
      formDataToSend.append("category", data.category);
      formDataToSend.append("priority", data.priority);
      formDataToSend.append("message", data.message);

      if (attachments.length > 0) {
        attachments.forEach((file) => {
          formDataToSend.append("attachments", file);
        });
      }

      const authHeaders = getAuthHeaders();
      const headers: Record<string, string> = {};
      if (authHeaders.Authorization) {
        headers.Authorization = authHeaders.Authorization;
      }
      
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers,
        body: formDataToSend,
      });

      if (!response.ok) throw new Error("خطا در ارسال تیکت");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      setFormData({ subject: "", category: "", priority: "medium", message: "" });
      setAttachments([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      toast({
        title: "ارسال شد",
        description: "تیکت شما با موفقیت ثبت شد و پشتیبانی به‌زودی پاسخ خواهد داد.",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "مشکلی در ارسال تیکت پیش آمد. لطفاً مجدداً تلاش نمایید.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.category || !formData.message.trim()) {
      toast({
        title: "نقص اطلاعات",
        description: "لطفاً موضوع، دسته‌بندی و متن پیام را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    createTicketMutation.mutate(formData);
  };

  const handleReset = () => {
    setFormData({ subject: "", category: "", priority: "medium", message: "" });
    setAttachments([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files);

    if (attachments.length + fileList.length > 5) {
      toast({
        title: "تعداد بیش از حد مجاز",
        description: "حداکثر ۵ فایل می‌توانید ضمیمه کنید",
        variant: "destructive",
      });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    for (const file of fileList) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "حجم زیاد فایل",
          description: `حجم فایل ${file.name} بیش از ۵ مگابایت است`,
          variant: "destructive",
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
    }

    setAttachments(prev => [...prev, ...fileList]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <DashboardLayout title="ارسال تیکت">
      <div className="space-y-4 max-w-2xl mx-auto pb-8" data-testid="page-send-ticket">
        
        {/* Mobile Header with Back Navigation */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            >
              <Link href="/my-tickets">
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                ثبت تیکت پشتیبانی
              </h1>
              <p className="text-[10px] text-muted-foreground">
                پاسخ‌گویی سریع تیم پشتیبانی به درخواست‌ها
              </p>
            </div>
          </div>

          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 text-[11px] font-bold rounded-xl border-slate-200 dark:border-zinc-800"
          >
            <Link href="/my-tickets">
              لیست تیکت‌ها
            </Link>
          </Button>
        </div>

        {/* Compact Form Card */}
        <Card className="rounded-[22px] border border-slate-200/80 dark:border-zinc-800/80 shadow-xs overflow-hidden">
          <CardContent className="p-4 sm:p-5">
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-send-ticket">
              
              {/* Subject Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="subject" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-500" />
                    موضوع تیکت
                    <span className="text-rose-500">*</span>
                  </Label>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {formData.subject.length}/80
                  </span>
                </div>
                <Input
                  id="subject"
                  value={formData.subject}
                  maxLength={80}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="عنوان خلاصه مشکل یا درخواست..."
                  required
                  data-testid="input-ticket-subject"
                  className="h-10 text-xs rounded-xl border-slate-200 dark:border-zinc-800 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500"
                />
              </div>

              {/* Category & Priority Grid - Mobile Friendly */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-500" />
                    دسته‌بندی
                    <span className="text-rose-500">*</span>
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger 
                      data-testid="select-ticket-category" 
                      className="h-10 text-xs rounded-xl border-slate-200 dark:border-zinc-800 text-right focus:ring-indigo-500/20"
                      dir="rtl"
                    >
                      <SelectValue placeholder="انتخاب دسته‌بندی..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="technical" className="text-xs">مشکل فنی و سایت</SelectItem>
                      <SelectItem value="account" className="text-xs">حساب کاربری و احراز هویت</SelectItem>
                      <SelectItem value="billing" className="text-xs">امور مالی و پرداخت‌ها</SelectItem>
                      <SelectItem value="feature" className="text-xs">پیشنهاد یا ویژگی جدید</SelectItem>
                      <SelectItem value="other" className="text-xs">سایر موارد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <Label htmlFor="priority" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                    اولویت
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger 
                      data-testid="select-ticket-priority" 
                      className="h-10 text-xs rounded-xl border-slate-200 dark:border-zinc-800 text-right focus:ring-indigo-500/20"
                      dir="rtl"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="low" className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                          کم (عادی)
                        </div>
                      </SelectItem>
                      <SelectItem value="medium" className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          متوسط
                        </div>
                      </SelectItem>
                      <SelectItem value="high" className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          بالا
                        </div>
                      </SelectItem>
                      <SelectItem value="urgent" className="text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          خیلی فوری
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Message Field */}
              <div className="space-y-1.5">
                <Label htmlFor="message" className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-purple-500" />
                  متن پیام و توضیحات
                  <span className="text-rose-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="شرح کامل مشکل، شماره فاکتور یا کد خطا را اینجا بنویسید..."
                  rows={4}
                  required
                  data-testid="textarea-ticket-message"
                  className="text-xs rounded-xl border-slate-200 dark:border-zinc-800 focus-visible:ring-indigo-500/20 focus-visible:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              {/* Attachments Section - Modern Mobile Upload */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                    پیوست فایل
                  </Label>
                  <span className="text-[10px] text-muted-foreground">
                    {attachments.length}/۵ فایل (حداکثر ۵MB)
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  id="attachments"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  data-testid="input-ticket-attachments"
                />

                {/* Upload Trigger Area */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border border-dashed border-slate-200 dark:border-zinc-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-xl p-3 text-center transition-all duration-200 bg-slate-50/50 dark:bg-zinc-900/30 active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                    <Paperclip className="w-4 h-4" />
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      افزودن تصویر، اسکرین‌شات یا سند
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      فرمت‌های مجاز: JPG, PNG, PDF, DOC
                    </span>
                  </div>
                </button>

                {/* Attached Files List */}
                {attachments.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {attachments.map((file, index) => (
                      <div 
                        key={index} 
                        className="flex items-center justify-between p-2 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200/70 dark:border-zinc-800 text-xs"
                        data-testid={`text-attachment-${index}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <File className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium truncate">
                            {file.name}
                          </span>
                          <span className="text-[9px] text-muted-foreground font-mono shrink-0">
                            ({Math.round(file.size / 1024)} KB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeAttachment(index)}
                          className="h-6 w-6 text-slate-400 hover:text-rose-500 rounded-lg shrink-0"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="submit"
                  disabled={createTicketMutation.isPending}
                  data-testid="button-submit-ticket"
                  className="flex-1 h-10 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                  {createTicketMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/30 border-t-white ml-1"></div>
                      در حال ثبت تیکت...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 ml-1" />
                      ارسال تیکت
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  data-testid="button-reset-form"
                  className="h-10 px-3 text-xs font-bold rounded-xl border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Helpful Tip Card for Mobile */}
        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/80 dark:border-indigo-900/40 rounded-2xl flex items-start gap-2.5">
          <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-[10px] text-indigo-900 dark:text-indigo-300 leading-relaxed">
            تیکت‌های شما در ساعات کاری در کمتر از ۲ ساعت بررسی و پاسخ داده خواهند شد. وضعیت پاسخ‌ها در بخش <strong>تیکت‌های من</strong> قابل مشاهده است.
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
