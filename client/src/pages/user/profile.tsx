import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, User, Save, LogOut, Crown, Ticket as TicketIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { createAuthenticatedRequest, getAuthHeaders } from "@/lib/auth";
import { type UserSubscription } from "@shared/schema";
import { Link } from "wouter";

interface UserSubscriptionWithDetails extends UserSubscription {
  subscriptionName?: string | null;
  subscriptionDescription?: string | null;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    phone: user?.phone || "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User subscription info
  const { data: userSubscription, isLoading: subscriptionLoading } = useQuery<UserSubscriptionWithDetails | null>({
    queryKey: ["/api/user-subscriptions/me"],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return null;
      const res = await createAuthenticatedRequest("/api/user-subscriptions/me");
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 60000,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await createAuthenticatedRequest("/api/profile", {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("خطا در بروزرسانی پروفایل");
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/auth/me"], updatedUser);
      toast({
        title: "موفقیت",
        description: "پروفایل با موفقیت بروزرسانی شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در بروزرسانی پروفایل",
        variant: "destructive",
      });
    },
  });

  const uploadPictureMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("profilePicture", file);

      const authHeaders = getAuthHeaders();
      const headers: Record<string, string> = {};
      if (authHeaders.Authorization) {
        headers.Authorization = authHeaders.Authorization;
      }
      
      const response = await fetch("/api/profile/picture", {
        method: "POST",
        headers,
        body: formData,
      });
      
      if (!response.ok) throw new Error("خطا در آپلود تصویر");
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/auth/me"], updatedUser);
      toast({
        title: "موفقیت",
        description: "تصویر پروفایل با موفقیت بروزرسانی شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در آپلود تصویر پروفایل",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast({
        title: "خطا",
        description: "لطفاً تمام فیلدها را پر کنید",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate(formData);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "خطا",
          description: "حجم فایل نباید بیشتر از ۵ مگابایت باشد",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "خطا",
          description: "لطفاً یک فایل تصویری انتخاب کنید",
          variant: "destructive",
        });
        return;
      }

      uploadPictureMutation.mutate(file);
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "admin":
        return "مدیر سیستم";
      case "user_level_1":
        return "کاربر سطح ۱";
      default:
        return "کاربر";
    }
  };

  return (
    <DashboardLayout title="اطلاعات کاربری">
      <div className="space-y-4" data-testid="profile-content">
        {/* Subscription Information Card */}
        {(() => {
          const isActive = userSubscription && userSubscription.status === 'active' && userSubscription.remainingDays > 0;
          const days = userSubscription?.remainingDays || 0;

          return (
            <div className={`relative overflow-hidden rounded-[20px] border ${
              subscriptionLoading
                ? "bg-slate-50 dark:bg-zinc-900/50 border-slate-100 dark:border-zinc-800"
                : isActive
                  ? "bg-gradient-to-br from-indigo-900 via-indigo-950 to-zinc-950 border-indigo-500/30 text-white shadow-lg"
                  : "bg-gradient-to-br from-red-950 via-rose-950 to-zinc-950 border-red-500/30 text-white shadow-lg"
            }`}>
              {/* Background abstract glowing shapes */}
              <div className="absolute top-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl -z-10" />

              <div className="p-4">
                {subscriptionLoading ? (
                  <div className="flex items-center justify-center py-2 gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                    <span className="text-xs text-muted-foreground font-medium">در حال بارگذاری وضعیت اشتراک...</span>
                  </div>
                ) : userSubscription ? (
                  <div className="flex items-center justify-between gap-3">
                    {/* Right content: icon + subscription name & status text */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-white/10 text-amber-400 rounded-xl shrink-0">
                        <Crown className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-black text-white truncate" data-testid="text-subscription-name">
                            {userSubscription.subscriptionName || 'پلن درگاه پرداخت'}
                          </h4>
                          <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-indigo-200 mt-0.5 font-bold truncate">
                          {isActive ? 'دسترسی فعال به امکانات پلتفرم و درگاه' : 'اشتراک شما منقضی شده است'}
                        </p>
                      </div>
                    </div>

                    {/* Left content: remaining days badge */}
                    <div className="shrink-0 flex items-center gap-1.5 bg-white/10 border border-white/5 rounded-xl px-3 py-1.5 text-left min-w-[75px] justify-center">
                      <span className="text-base font-black text-white leading-none" data-testid="text-remaining-days">
                        {days}
                      </span>
                      <span className="text-[10px] text-indigo-100 font-bold">روز باقی</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-white/10 rounded-xl text-slate-400 shrink-0">
                        <Crown className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">اشتراک یافت نشد</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">برای خرید یا تمدید اشتراک تیکت پشتیبانی ارسال نمایید</p>
                      </div>
                    </div>
                    <Link href="/tickets">
                      <Button size="sm" variant="ghost" className="text-[11px] text-indigo-200 hover:text-white hover:bg-white/10 h-8 px-2.5 rounded-lg">
                        ارسال تیکت
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Profile Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Profile Picture & Actions */}
          <div className="lg:col-span-1">
            <Card className="border-slate-100 dark:border-zinc-800/80 rounded-[20px]">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-center text-xs font-black">تصویر پروفایل</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-4 pt-2 space-y-3">
                <div className="relative">
                  <Avatar className="w-16 h-16 md:w-20 md:h-20 border border-slate-100 dark:border-zinc-800" data-testid="img-profile-avatar">
                    <AvatarImage src={user?.profilePicture || undefined} />
                    <AvatarFallback className="text-xl">
                      <User className="h-8 w-8 md:h-10 md:w-10" />
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    size="icon"
                    className="absolute -bottom-1 -right-1 rounded-full h-7 w-7 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadPictureMutation.isPending}
                    data-testid="button-change-picture"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    data-testid="input-profile-picture"
                  />
                </div>
                {uploadPictureMutation.isPending && (
                  <p className="text-[10px] text-muted-foreground animate-pulse">در حال آپلود...</p>
                )}
                <p className="text-[9px] text-muted-foreground text-center">
                  حجم فایل حداکثر ۵ مگابایت
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Profile Information */}
          <div className="lg:col-span-2">
            <Card className="border-slate-100 dark:border-zinc-800/80 rounded-[20px]">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs font-black">اطلاعات شخصی</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="firstName" className="text-[10px] font-extrabold text-muted-foreground/80">نام</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        required
                        className="h-8.5 text-xs rounded-xl"
                        data-testid="input-firstName"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="lastName" className="text-[10px] font-extrabold text-muted-foreground/80">نام خانوادگی</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        required
                        className="h-8.5 text-xs rounded-xl"
                        data-testid="input-lastName"
                      />
                    </div>
                  </div>

                  {/* Email field */}
                  {user?.email && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2 space-y-1">
                        <Label htmlFor="email" className="text-[10px] font-extrabold text-muted-foreground/80">ایمیل</Label>
                        <Input
                          id="email"
                          value={user?.email || ""}
                          disabled
                          className="bg-slate-50 dark:bg-zinc-950/50 text-muted-foreground h-8.5 text-xs rounded-xl"
                          data-testid="input-email-disabled"
                        />
                        <p className="text-[9px] text-muted-foreground font-medium mt-0.5">ایمیل قابل تغییر نیست</p>
                      </div>
                    </div>
                  )}

                  {/* Phone & Role Section - Side by side for admin and user_level_1 */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Phone field - Editable for admin only */}
                    <div className="space-y-1">
                      <Label htmlFor="phone" className="text-[10px] font-extrabold text-muted-foreground/80">شماره تلفن</Label>
                      {user?.role === "admin" ? (
                        <>
                          <Input
                            id="phone"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="h-8.5 text-xs rounded-xl"
                            data-testid="input-phone"
                          />
                          <p className="text-[9px] text-muted-foreground font-medium mt-0.5">شماره تماس قابل تغییر است</p>
                        </>
                      ) : (
                        <>
                          <Input
                            id="phone"
                            value={user?.phone || ""}
                            disabled
                            className="bg-slate-50 dark:bg-zinc-950/50 text-muted-foreground h-8.5 text-xs rounded-xl"
                            data-testid="input-phone-disabled"
                          />
                          <p className="text-[9px] text-muted-foreground font-medium mt-0.5">شماره تلفن قابل تغییر نیست</p>
                        </>
                      )}
                    </div>

                    {/* Role field */}
                    <div className="space-y-1">
                      <Label htmlFor="role" className="text-[10px] font-extrabold text-muted-foreground/80">نقش کاربری</Label>
                      <Input
                        id="role"
                        value={getRoleName(user?.role || "")}
                        disabled
                        className="bg-slate-50 dark:bg-zinc-950/50 text-muted-foreground h-8.5 text-xs rounded-xl"
                        data-testid="input-role-disabled"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                      size="sm"
                      style={{ width: "132px", height: "35px" }}
                      className="w-[132px] h-[35px] text-xs rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold"
                    >
                      <Save className="w-3.5 h-3.5 ml-1.5" />
                      {updateProfileMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Logout Button at the end of the page */}
        <div className="flex justify-start sm:justify-end pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={logout}
            className="w-full sm:w-auto h-9 text-xs font-bold text-rose-600 dark:text-rose-400 border-rose-200 hover:border-rose-300 hover:bg-rose-50 dark:border-rose-900/40 dark:hover:bg-rose-950/30 rounded-xl px-4 flex items-center justify-center gap-2 active:scale-97 transition-all cursor-pointer"
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4 rotate-180" />
            <span>خروج از حساب کاربری</span>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}