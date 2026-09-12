import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Edit, Trash2, Ban, ShieldCheck, UserX, UserCheck, KeyRound, User, Eye, EyeOff, Crown, Sparkles, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createAuthenticatedRequest } from "@/lib/auth";
import type { User as UserType, Subscription } from "@shared/schema";

// Extended user type to include subscription information
interface UserWithSubscription extends UserType {
  subscription?: {
    id?: string;
    subscriptionId?: string;
    name: string;
    remainingDays: number;
    status: string;
    isTrialPeriod: boolean;
    startDate?: string;
    endDate?: string;
  } | null;
}

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editingUser, setEditingUser] = useState<UserWithSubscription | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithSubscription | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToBlock, setUserToBlock] = useState<UserWithSubscription | null>(null);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState("profile");

  // Subscription management state for edit user modal
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>("");
  const [customRemainingDays, setCustomRemainingDays] = useState<number>(30);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>("active");
  const [isTrialPeriod, setIsTrialPeriod] = useState<boolean>(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscriptionPlans = [] } = useQuery<Subscription[]>({
    queryKey: ["/api/subscriptions"],
    queryFn: async () => {
      const response = await createAuthenticatedRequest("/api/subscriptions");
      if (!response.ok) return [];
      return response.json();
    },
  });

  const { data: users = [], isLoading } = useQuery<UserWithSubscription[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await createAuthenticatedRequest("/api/users");
      if (!response.ok) throw new Error("خطا در دریافت کاربران");
      return response.json();
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: Partial<UserType>) => {
      const response = await createAuthenticatedRequest("/api/users", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("خطا در ایجاد کاربر");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "موفقیت",
        description: "کاربر با موفقیت ایجاد شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در ایجاد کاربر",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<UserType> }) => {
      const response = await createAuthenticatedRequest(`/api/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("خطا در بروزرسانی کاربر");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      toast({
        title: "موفقیت",
        description: "کاربر با موفقیت بروزرسانی شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "خطا در بروزرسانی کاربر",
        variant: "destructive",
      });
    },
  });

  const toggleBlockUserMutation = useMutation({
    mutationFn: async ({ id, isBlocked }: { id: string; isBlocked: boolean }) => {
      const response = await createAuthenticatedRequest(`/api/users/${id}/toggle-block`, {
        method: "PUT",
        body: JSON.stringify({ isBlocked }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "خطا در تغییر وضعیت مسدودی کاربر");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsBlockDialogOpen(false);
      setUserToBlock(null);
      toast({
        title: "موفقیت",
        description: data.message || "وضعیت کاربر با موفقیت تغییر کرد",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error?.message || "خطا در تغییر وضعیت مسدودی کاربر",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await createAuthenticatedRequest(`/api/users/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "خطا در حذف کاربر");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
      toast({
        title: "موفقیت",
        description: "کاربر با موفقیت حذف شد",
      });
    },
    onError: (error: any) => {
      toast({
        title: "خطا",
        description: error?.message || "خطا در حذف کاربر",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.firstName.toLowerCase().includes(search.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(search.toLowerCase()) ||
                         (user.username && user.username.toLowerCase().includes(search.toLowerCase())) ||
                         (user.phone && user.phone.includes(search));
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "blocked" && user.isBlocked) || 
                         (statusFilter === "active" && !user.isBlocked);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="default">مدیر</Badge>;
      case "user_level_1":
        return <Badge variant="secondary">کاربر سطح ۱</Badge>;
      default:
        return <Badge variant="secondary">کاربر</Badge>;
    }
  };

  const getStatusBadge = (isBlocked: boolean | undefined) => {
    if (isBlocked) {
      return (
        <Badge variant="destructive" className="bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20 transition-colors inline-flex items-center gap-1">
          <UserX className="h-3 w-3" />
          <span>مسدود شده</span>
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15 transition-colors inline-flex items-center gap-1">
        <UserCheck className="h-3 w-3" />
        <span>فعال</span>
      </Badge>
    );
  };

  const handleEditUser = (user: UserWithSubscription) => {
    setEditingUser(user);
    setShowPassword(false);
    setActiveEditTab("profile");

    const currentSub = user.subscription;
    const defaultPlan = subscriptionPlans.find((p) => p.isDefault) || subscriptionPlans[0];
    setSelectedSubscriptionId(currentSub?.subscriptionId || defaultPlan?.id || "");
    setCustomRemainingDays(currentSub?.remainingDays ?? 30);
    setSubscriptionStatus(currentSub?.status || "active");
    setIsTrialPeriod(currentSub?.isTrialPeriod || false);

    setIsEditDialogOpen(true);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData(e.target as HTMLFormElement);
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast({
        title: "خطا",
        description: "رمز عبور و تکرار آن یکسان نیستند",
        variant: "destructive",
      });
      return;
    }

    const data = {
      username: formData.get("username") as string,
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      phone: formData.get("phone") as string,
      password: password,
      role: formData.get("role") as string,
    };

    createUserMutation.mutate(data);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const newPassword = (formData.get("password") as string)?.trim();
    const confirmPassword = (formData.get("confirmPassword") as string)?.trim();

    if (newPassword && newPassword !== confirmPassword) {
      toast({
        title: "خطا",
        description: "رمز عبور جدید و تکرار آن یکسان نیستند",
        variant: "destructive",
      });
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast({
        title: "خطا",
        description: "رمز عبور باید حداقل ۶ کاراکتر باشد",
        variant: "destructive",
      });
      return;
    }

    const data: Record<string, any> = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      username: formData.get("username") as string,
      phone: formData.get("phone") as string,
      email: (formData.get("email") as string)?.trim() || null,
      role: formData.get("role") as string,
      isBlocked: formData.get("isBlocked") === "blocked",
    };

    if (newPassword) {
      data.password = newPassword;
    }

    if (selectedSubscriptionId) {
      data.subscription = {
        subscriptionId: selectedSubscriptionId,
        remainingDays: Number(customRemainingDays) || 0,
        status: subscriptionStatus,
        isTrialPeriod: isTrialPeriod,
      };
    }

    updateUserMutation.mutate({ id: editingUser.id, data: data as Partial<UserType> });
  };

  const handleDeleteUser = (user: UserWithSubscription) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleBlockClick = (user: UserWithSubscription) => {
    setUserToBlock(user);
    setIsBlockDialogOpen(true);
  };

  return (
    <DashboardLayout title="مدیریت کاربران">
      <div className="space-y-6" data-testid="page-user-management">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Button 
            onClick={() => setIsCreateDialogOpen(true)}
            data-testid="button-create-user"
            className="w-full md:w-auto"
          >
            <Plus className="h-4 w-4 ml-2" />
            اضافه کردن کاربر جدید
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 md:space-x-4 md:space-x-reverse">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="جستجو در نام، نام کاربری یا تلفن..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-users"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-role-filter">
                  <SelectValue placeholder="همه نقش‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه نقش‌ها</SelectItem>
                  <SelectItem value="admin">مدیر</SelectItem>
                  <SelectItem value="user_level_1">کاربر سطح ۱</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40" data-testid="select-status-filter">
                  <SelectValue placeholder="همه وضعیت‌ها" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                  <SelectItem value="active">کاربران فعال</SelectItem>
                  <SelectItem value="blocked">کاربران مسدود شده</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="secondary" data-testid="button-search" className="hidden sm:inline-flex">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Users Table - Desktop View */}
        <div className="hidden md:block bg-card rounded-lg border border-border overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">در حال بارگذاری...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">هیچ کاربری یافت نشد</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="text-right">نام کاربری</TableHead>
                    <TableHead className="text-right">نام</TableHead>
                    <TableHead className="text-right">شماره تلفن</TableHead>
                    <TableHead className="text-right">نقش</TableHead>
                    <TableHead className="text-right">وضعیت</TableHead>
                    <TableHead className="text-right">نوع اشتراک</TableHead>
                    <TableHead className="text-right">روزهای باقیمانده</TableHead>
                    <TableHead className="text-right">تاریخ عضویت</TableHead>
                    <TableHead className="text-right">عملیات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow 
                      key={user.id} 
                      className={`hover:bg-muted/50 transition-colors ${user.isBlocked ? 'bg-destructive/5' : ''}`}
                      data-testid={`row-user-${user.id}`}
                    >
                      <TableCell className="font-medium" data-testid={`text-user-username-${user.id}`}>
                        {user.username || '-'}
                      </TableCell>
                      <TableCell className="font-medium" data-testid={`text-user-name-${user.id}`}>
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground" data-testid={`text-user-phone-${user.id}`}>
                        {user.phone}
                      </TableCell>
                      <TableCell data-testid={`text-user-role-${user.id}`}>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell data-testid={`text-user-status-${user.id}`}>
                        {getStatusBadge(user.isBlocked)}
                      </TableCell>
                      <TableCell className="text-muted-foreground" data-testid={`text-user-subscription-${user.id}`}>
                        {user.subscription ? (
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <span>{user.subscription.name}</span>
                            {user.subscription.isTrialPeriod && (
                              <Badge variant="secondary" className="text-xs">آزمایشی</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">بدون اشتراک</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground" data-testid={`text-user-remaining-days-${user.id}`}>
                        {user.subscription ? (
                          <div className="flex items-center space-x-1 space-x-reverse">
                            <span className={user.subscription.remainingDays <= 3 ? "text-destructive font-medium" : user.subscription.remainingDays <= 7 ? "text-orange-500 font-medium" : ""}>
                              {user.subscription.remainingDays}
                            </span>
                            <span className="text-xs text-muted-foreground">روز</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground" data-testid={`text-user-created-${user.id}`}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fa-IR') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1 space-x-reverse">
                          {user.role !== "admin" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleBlockClick(user)}
                              className={user.isBlocked 
                                ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40" 
                                : "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"}
                              title={user.isBlocked ? "رفع مسدودیت کاربر" : "مسدود کردن کاربر"}
                              data-testid={`button-toggle-block-${user.id}`}
                            >
                              {user.isBlocked ? (
                                <ShieldCheck className="h-4 w-4" />
                              ) : (
                                <Ban className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                            title="ویرایش کاربر"
                            data-testid={`button-edit-user-${user.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user)}
                            className="text-destructive hover:text-destructive/80"
                            title="حذف کاربر"
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Users Cards - Mobile View */}
        <div className="md:hidden space-y-4">
          {isLoading ? (
            <div className="p-8 text-center bg-card rounded-lg border border-border">در حال بارگذاری...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center bg-card rounded-lg border border-border text-muted-foreground">
              کاربری یافت نشد
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div 
                key={user.id} 
                className={`bg-card rounded-lg border p-4 space-y-3 ${user.isBlocked ? 'border-destructive/40 bg-destructive/5' : 'border-border'}`}
                data-testid={`card-user-${user.id}`}
              >
                {/* Header with name, status and actions */}
                <div className="flex items-start justify-between pb-3 border-b border-border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg" data-testid={`text-user-name-${user.id}`}>
                        {user.firstName} {user.lastName}
                      </h3>
                      {getStatusBadge(user.isBlocked)}
                    </div>
                    <p className="text-sm text-muted-foreground" data-testid={`text-user-username-${user.id}`}>
                      {user.username || '-'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1 space-x-reverse">
                    {user.role !== "admin" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleBlockClick(user)}
                        className={user.isBlocked 
                          ? "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40" 
                          : "text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"}
                        title={user.isBlocked ? "رفع مسدودیت کاربر" : "مسدود کردن کاربر"}
                        data-testid={`button-toggle-block-mobile-${user.id}`}
                      >
                        {user.isBlocked ? (
                          <ShieldCheck className="h-4 w-4" />
                        ) : (
                          <Ban className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      data-testid={`button-edit-user-${user.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteUser(user)}
                      className="text-destructive hover:text-destructive/80"
                      data-testid={`button-delete-user-${user.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* User details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">نقش:</span>
                    <span data-testid={`text-user-role-${user.id}`}>
                      {getRoleBadge(user.role)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">شماره تلفن:</span>
                    <span className="text-sm font-medium" data-testid={`text-user-phone-${user.id}`}>
                      {user.phone}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">نوع اشتراک:</span>
                    <div data-testid={`text-user-subscription-${user.id}`}>
                      {user.subscription ? (
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <span className="text-sm font-medium">{user.subscription.name}</span>
                          {user.subscription.isTrialPeriod && (
                            <Badge variant="secondary" className="text-xs">آزمایشی</Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">بدون اشتراک</span>
                      )}
                    </div>
                  </div>

                  {user.subscription && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">روزهای باقیمانده:</span>
                      <div className="flex items-center space-x-1 space-x-reverse" data-testid={`text-user-remaining-days-${user.id}`}>
                        <span className={`text-sm font-medium ${
                          user.subscription.remainingDays <= 3 
                            ? "text-destructive" 
                            : user.subscription.remainingDays <= 7 
                            ? "text-orange-500" 
                            : ""
                        }`}>
                          {user.subscription.remainingDays}
                        </span>
                        <span className="text-xs text-muted-foreground">روز</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">تاریخ عضویت:</span>
                    <span className="text-sm font-medium" data-testid={`text-user-created-${user.id}`}>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fa-IR') : '-'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create User Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent data-testid="dialog-create-user">
            <DialogHeader>
              <DialogTitle>ایجاد کاربر جدید</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">نام</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    required
                    data-testid="input-create-firstName"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">نام خانوادگی</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    required
                    data-testid="input-create-lastName"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">نام کاربری</Label>
                  <Input
                    id="username"
                    name="username"
                    required
                    data-testid="input-create-username"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">شماره تلفن</Label>
                  <Input
                    id="phone"
                    name="phone"
                    required
                    data-testid="input-create-phone"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">رمز عبور</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    data-testid="input-create-password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">تکرار رمز عبور</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    data-testid="input-create-confirmPassword"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="role">نقش</Label>
                <Select name="role" defaultValue="user_level_1">
                  <SelectTrigger data-testid="select-create-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">مدیر</SelectItem>
                    <SelectItem value="user_level_1">کاربر سطح ۱</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2 space-x-reverse">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  data-testid="button-cancel-create"
                >
                  لغو
                </Button>
                <Button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  data-testid="button-create-user-submit"
                >
                  {createUserMutation.isPending ? "در حال ایجاد..." : "ایجاد کاربر"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="w-[95vw] max-w-2xl max-h-[92vh] p-0 flex flex-col overflow-hidden rounded-xl border border-border" data-testid="dialog-edit-user">
            {/* Mobile-optimized Header */}
            <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border bg-muted/20">
              <div className="flex items-start justify-between gap-3 text-right">
                <div className="space-y-1">
                  <DialogTitle className="flex items-center gap-2 text-base sm:text-lg font-bold">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Edit className="h-4 w-4" />
                    </div>
                    <span>ویرایش مشخصات کاربر</span>
                  </DialogTitle>
                  {editingUser && (
                    <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground pt-1">
                      <span className="font-medium text-foreground">
                        {editingUser.firstName} {editingUser.lastName}
                      </span>
                      <span>•</span>
                      <span dir="ltr">{editingUser.phone}</span>
                      {editingUser.username && (
                        <>
                          <span>•</span>
                          <span dir="ltr">@{editingUser.username}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </DialogHeader>

            {editingUser && (
              <form onSubmit={handleUpdateUser} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                  <Tabs value={activeEditTab} onValueChange={setActiveEditTab} className="w-full" dir="rtl">
                    {/* Responsive Tabs Navigation */}
                    <div className="pb-1">
                      <TabsList className="grid grid-cols-3 w-full h-auto p-1 bg-muted/60 gap-1 rounded-lg">
                        <TabsTrigger 
                          value="profile" 
                          className="flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1 sm:px-2 text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
                        >
                          <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-primary" />
                          <span className="hidden sm:inline">مشخصات فردی</span>
                          <span className="sm:hidden">مشخصات</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="security" 
                          className="flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1 sm:px-2 text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
                        >
                          <KeyRound className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-amber-500" />
                          <span className="hidden sm:inline">رمز و دسترسی</span>
                          <span className="sm:hidden">امنیت</span>
                        </TabsTrigger>
                        <TabsTrigger 
                          value="subscription" 
                          className="flex items-center justify-center gap-1 sm:gap-1.5 py-2.5 px-1 sm:px-2 text-xs sm:text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md transition-all"
                          data-testid="tab-edit-subscription"
                        >
                          <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 text-emerald-500" />
                          <span className="hidden sm:inline">تغییر اشتراک</span>
                          <span className="sm:hidden">اشتراک</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    {/* Tab 1: Profile & Contact */}
                    <TabsContent value="profile" className="space-y-4 pt-3 focus-visible:outline-none">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="edit-firstName" className="text-xs sm:text-sm font-medium">نام <span className="text-destructive">*</span></Label>
                          <Input
                            id="edit-firstName"
                            name="firstName"
                            defaultValue={editingUser.firstName}
                            required
                            className="h-10 sm:h-11 text-sm"
                            data-testid="input-edit-firstName"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="edit-lastName" className="text-xs sm:text-sm font-medium">نام خانوادگی <span className="text-destructive">*</span></Label>
                          <Input
                            id="edit-lastName"
                            name="lastName"
                            defaultValue={editingUser.lastName}
                            required
                            className="h-10 sm:h-11 text-sm"
                            data-testid="input-edit-lastName"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="edit-username" className="text-xs sm:text-sm font-medium">نام کاربری <span className="text-destructive">*</span></Label>
                          <Input
                            id="edit-username"
                            name="username"
                            defaultValue={editingUser.username || ""}
                            required
                            dir="ltr"
                            className="h-10 sm:h-11 text-sm text-left"
                            placeholder="username"
                            data-testid="input-edit-username"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="edit-phone" className="text-xs sm:text-sm font-medium">شماره تلفن همراه <span className="text-destructive">*</span></Label>
                          <Input
                            id="edit-phone"
                            name="phone"
                            defaultValue={editingUser.phone || ""}
                            required
                            dir="ltr"
                            className="h-10 sm:h-11 text-sm text-left"
                            placeholder="09123456789"
                            data-testid="input-edit-phone"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="edit-email" className="text-xs sm:text-sm font-medium">آدرس ایمیل</Label>
                          <Input
                            id="edit-email"
                            name="email"
                            type="email"
                            defaultValue={editingUser.email || ""}
                            dir="ltr"
                            className="h-10 sm:h-11 text-sm text-left"
                            placeholder="user@example.com"
                            data-testid="input-edit-email"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    {/* Tab 2: Security, Password & Role */}
                    <TabsContent value="security" className="space-y-4 pt-3 focus-visible:outline-none">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="edit-role" className="text-xs sm:text-sm font-medium">نقش کاربر</Label>
                          <Select name="role" defaultValue={editingUser.role}>
                            <SelectTrigger id="edit-role" className="h-10 sm:h-11 text-sm" data-testid="select-edit-role">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">مدیر سیستم</SelectItem>
                              <SelectItem value="user_level_1">کاربر سطح ۱</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {editingUser.role !== "admin" ? (
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-isBlocked" className="text-xs sm:text-sm font-medium">وضعیت حساب کاربری</Label>
                            <Select name="isBlocked" defaultValue={editingUser.isBlocked ? "blocked" : "active"}>
                              <SelectTrigger id="edit-isBlocked" className="h-10 sm:h-11 text-sm" data-testid="select-edit-status">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">فعال (دسترسی به پنل مجاز)</SelectItem>
                                <SelectItem value="blocked">مسدود شده (عدم دسترسی به پنل)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="flex flex-col justify-center p-2.5 rounded-lg border border-border bg-muted/20">
                            <span className="text-xs text-muted-foreground font-medium">وضعیت حساب کاربری</span>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">حساب مدیر سیستم همواره فعال است.</span>
                            <input type="hidden" name="isBlocked" value="active" />
                          </div>
                        )}
                      </div>

                      {/* Password Change Box */}
                      <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-muted/30 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                              <KeyRound className="h-3.5 w-3.5" />
                            </div>
                            <span className="font-semibold text-xs sm:text-sm">تغییر رمز عبور کاربر</span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-xs h-8 px-2.5 gap-1.5 bg-background"
                          >
                            {showPassword ? (
                              <>
                                <EyeOff className="h-3.5 w-3.5" />
                                <span>مخفی کردن</span>
                              </>
                            ) : (
                              <>
                                <Eye className="h-3.5 w-3.5" />
                                <span>نمایش رمز</span>
                              </>
                            )}
                          </Button>
                        </div>
                        
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          در صورت تمایل به تغییر رمز عبور کاربر، فیلدهای زیر را پر کنید؛ در غیر این صورت خالی بگذارید.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-1">
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-password" className="text-xs sm:text-sm font-medium">رمز عبور جدید</Label>
                            <Input
                              id="edit-password"
                              name="password"
                              type={showPassword ? "text" : "password"}
                              placeholder="حداقل ۶ کاراکتر"
                              dir="ltr"
                              className="h-10 sm:h-11 text-sm text-left"
                              data-testid="input-edit-password"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-confirmPassword" className="text-xs sm:text-sm font-medium">تکرار رمز عبور جدید</Label>
                            <Input
                              id="edit-confirmPassword"
                              name="confirmPassword"
                              type={showPassword ? "text" : "password"}
                              placeholder="تکرار رمز عبور جدید"
                              dir="ltr"
                              className="h-10 sm:h-11 text-sm text-left"
                              data-testid="input-edit-confirm-password"
                            />
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Tab 3: Subscription Management */}
                    <TabsContent value="subscription" className="space-y-4 pt-3 focus-visible:outline-none">
                      {/* Current Subscription Status Card */}
                      <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-gradient-to-br from-emerald-500/5 via-muted/30 to-muted/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                              <Crown className="h-4 w-4" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-xs sm:text-sm">اطلاعات اشتراک فعلی کاربر</h4>
                              <p className="text-[11px] text-muted-foreground">وضعیت پلن و اعتبار فعلی حساب</p>
                            </div>
                          </div>
                          {editingUser.subscription ? (
                            <Badge variant={editingUser.subscription.status === 'active' ? 'default' : 'destructive'} className="text-xs">
                              {editingUser.subscription.status === 'active' ? 'فعال' : 'منقضی شده'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-muted-foreground">بدون اشتراک</Badge>
                          )}
                        </div>

                        {editingUser.subscription ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                            <div className="p-2.5 bg-background rounded-lg border border-border/60">
                              <span className="text-muted-foreground block text-[11px]">پلن فعلی:</span>
                              <span className="font-bold text-foreground mt-0.5 block">{editingUser.subscription.name}</span>
                            </div>
                            <div className="p-2.5 bg-background rounded-lg border border-border/60">
                              <span className="text-muted-foreground block text-[11px]">اعتبار باقیمانده:</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                                {editingUser.subscription.remainingDays} روز
                              </span>
                            </div>
                            <div className="p-2.5 bg-background rounded-lg border border-border/60 col-span-2 sm:col-span-1">
                              <span className="text-muted-foreground block text-[11px]">نوع پلن:</span>
                              <span className="font-bold text-foreground mt-0.5 block">
                                {editingUser.subscription.isTrialPeriod ? "آزمایشی" : "اصلی"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2.5 rounded-lg">
                            این کاربر در حال حاضر اشتراک فعال ندارد. می‌توانید از بخش زیر برای کاربر اشتراک جدید تعریف یا اختصاص دهید.
                          </p>
                        )}
                      </div>

                      {/* Subscription Change Controls */}
                      <div className="p-3.5 sm:p-4 rounded-xl border border-border bg-card space-y-4">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <h4 className="font-semibold text-xs sm:text-sm">تغییر یا اختصاص اشتراک جدید</h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          {/* Plan Selector */}
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-subscriptionPlan" className="text-xs sm:text-sm font-medium">
                              نوع پلن اشتراک <span className="text-destructive">*</span>
                            </Label>
                            <Select value={selectedSubscriptionId} onValueChange={setSelectedSubscriptionId}>
                              <SelectTrigger id="edit-subscriptionPlan" className="h-10 sm:h-11 text-sm" data-testid="select-edit-subscription-plan">
                                <SelectValue placeholder="انتخاب پلن اشتراک" />
                              </SelectTrigger>
                              <SelectContent>
                                {subscriptionPlans.length === 0 ? (
                                  <SelectItem value="none" disabled>هیچ پلنی یافت نشد</SelectItem>
                                ) : (
                                  subscriptionPlans.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                      {plan.name} ({plan.duration === "monthly" ? "ماهانه" : "سالانه"}) {plan.isDefault ? " [پیش‌فرض]" : ""}
                                    </SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Subscription Status */}
                          <div className="space-y-1.5">
                            <Label htmlFor="edit-subscriptionStatus" className="text-xs sm:text-sm font-medium">وضعیت اشتراک</Label>
                            <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}>
                              <SelectTrigger id="edit-subscriptionStatus" className="h-10 sm:h-11 text-sm" data-testid="select-edit-subscription-status">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">فعال (Active)</SelectItem>
                                <SelectItem value="expired">منقضی شده (Expired)</SelectItem>
                                <SelectItem value="inactive">غیرفعال (Inactive)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Custom Remaining Days & Quick Presets */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="edit-remainingDays" className="text-xs sm:text-sm font-medium">
                              تعداد روزهای اعتبار (روزهای باقیمانده)
                            </Label>
                            <span className="text-xs text-muted-foreground font-mono">
                              {customRemainingDays} روز
                            </span>
                          </div>
                          <Input
                            id="edit-remainingDays"
                            type="number"
                            min="0"
                            max="3650"
                            value={customRemainingDays}
                            onChange={(e) => setCustomRemainingDays(Math.max(0, parseInt(e.target.value) || 0))}
                            className="h-10 sm:h-11 text-sm text-left"
                            dir="ltr"
                            data-testid="input-edit-remaining-days"
                          />

                          {/* Quick Duration Preset Buttons */}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[11px] text-muted-foreground ml-1">میانبرهای زمان:</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setCustomRemainingDays(7)}
                              className={`h-7 px-2 text-xs ${customRemainingDays === 7 ? 'bg-primary/10 text-primary border-primary/30' : ''}`}
                            >
                              ۷ روز
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setCustomRemainingDays(30)}
                              className={`h-7 px-2 text-xs ${customRemainingDays === 30 ? 'bg-primary/10 text-primary border-primary/30' : ''}`}
                            >
                              ۳۰ روز (۱ ماه)
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setCustomRemainingDays(90)}
                              className={`h-7 px-2 text-xs ${customRemainingDays === 90 ? 'bg-primary/10 text-primary border-primary/30' : ''}`}
                            >
                              ۹۰ روز (۳ ماه)
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setCustomRemainingDays(180)}
                              className={`h-7 px-2 text-xs ${customRemainingDays === 180 ? 'bg-primary/10 text-primary border-primary/30' : ''}`}
                            >
                              ۱۸۰ روز (۶ ماه)
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setCustomRemainingDays(365)}
                              className={`h-7 px-2 text-xs ${customRemainingDays === 365 ? 'bg-primary/10 text-primary border-primary/30' : ''}`}
                            >
                              ۳۶۵ روز (۱ سال)
                            </Button>
                          </div>
                        </div>

                        {/* Trial Period Switch */}
                        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                          <div className="space-y-0.5">
                            <Label htmlFor="edit-isTrial" className="text-xs sm:text-sm font-medium cursor-pointer">
                              علامت‌گذاری به عنوان اشتراک آزمایشی
                            </Label>
                            <p className="text-[11px] text-muted-foreground">
                              در صورت فعال بودن، این اشتراک به عنوان دوره آزمایشی در نظر گرفته می‌شود.
                            </p>
                          </div>
                          <Switch
                            id="edit-isTrial"
                            checked={isTrialPeriod}
                            onCheckedChange={setIsTrialPeriod}
                            data-testid="switch-edit-is-trial"
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Fixed Bottom Action Bar for Mobile & Desktop */}
                <div className="p-3 sm:p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    className="flex-1 sm:flex-initial h-10 sm:h-11 text-xs sm:text-sm"
                    data-testid="button-cancel-edit"
                  >
                    انصراف
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateUserMutation.isPending}
                    className="flex-1 sm:flex-initial h-10 sm:h-11 text-xs sm:text-sm font-semibold"
                    data-testid="button-save-user"
                  >
                    {updateUserMutation.isPending ? "در حال ذخیره..." : "ذخیره تغییرات"}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Block / Unblock Confirmation Alert Dialog */}
        <AlertDialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                {userToBlock?.isBlocked ? (
                  <>
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    <span>رفع مسدودیت کاربر</span>
                  </>
                ) : (
                  <>
                    <Ban className="h-5 w-5 text-destructive" />
                    <span>مسدود کردن کاربر</span>
                  </>
                )}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-right leading-relaxed">
                {userToBlock?.isBlocked ? (
                  <>
                    آیا از رفع مسدودیت کاربر «{userToBlock?.firstName} {userToBlock?.lastName}» ({userToBlock?.username || userToBlock?.phone}) اطمینان دارید؟ با رفع مسدودیت، کاربر می‌تواند مجدداً وارد پنل کاربری خود شده و از امکانات استفاده کند.
                  </>
                ) : (
                  <>
                    آیا از مسدود کردن کاربر «{userToBlock?.firstName} {userToBlock?.lastName}» ({userToBlock?.username || userToBlock?.phone}) اطمینان دارید؟ پس از مسدودسازی، دسترسی کاربر به پنل کاربری مسدود شده و تا زمان رفع مسدودیت امکان ورود نخواهد داشت.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel 
                onClick={() => {
                  setIsBlockDialogOpen(false);
                  setUserToBlock(null);
                }}
                disabled={toggleBlockUserMutation.isPending}
              >
                انصراف
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  if (userToBlock) {
                    toggleBlockUserMutation.mutate({
                      id: userToBlock.id,
                      isBlocked: !userToBlock.isBlocked,
                    });
                  }
                }}
                disabled={toggleBlockUserMutation.isPending}
                className={userToBlock?.isBlocked 
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                  : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
              >
                {toggleBlockUserMutation.isPending 
                  ? "در حال اعمال..." 
                  : userToBlock?.isBlocked 
                  ? "رفع مسدودیت" 
                  : "مسدود کردن کاربر"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Confirmation Alert Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>حذف کاربر</AlertDialogTitle>
              <AlertDialogDescription>
                آیا از حذف کاربر «{userToDelete?.firstName} {userToDelete?.lastName}» ({userToDelete?.username || userToDelete?.phone}) اطمینان دارید؟ تمام داده‌های مرتبط با این کاربر حذف خواهند شد و این عملیات غیرقابل بازگشت است.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel 
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setUserToDelete(null);
                }}
                disabled={deleteUserMutation.isPending}
              >
                انصراف
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  if (userToDelete) {
                    deleteUserMutation.mutate(userToDelete.id);
                  }
                }}
                disabled={deleteUserMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteUserMutation.isPending ? "در حال حذف..." : "حذف کاربر"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
