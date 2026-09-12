import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  User,
  Phone,
  Clock,
  Search,
  Trash2,
  CheckCircle,
  Eye,
  PhoneCall,
  MessageSquare,
  AlertCircle,
  Inbox
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createAuthenticatedRequest } from "@/lib/auth";
import type { ProjectOrderRequest } from "@shared/schema";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "در انتظار", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  reviewed: { label: "بررسی شده", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Eye },
  contacted: { label: "تماس گرفته شده", color: "bg-purple-100 text-purple-800 border-purple-200", icon: PhoneCall },
  completed: { label: "تکمیل شده", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle },
};

export default function ProjectOrders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<ProjectOrderRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery<ProjectOrderRequest[]>({
    queryKey: ["/api/admin/project-orders"],
    queryFn: async () => {
      const response = await createAuthenticatedRequest("/api/admin/project-orders");
      if (!response.ok) throw new Error("خطا در دریافت درخواست‌ها");
      return response.json();
    },
    refetchInterval: 30000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await createAuthenticatedRequest(`/api/admin/project-orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("خطا در به‌روزرسانی وضعیت");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/project-orders"] });
      toast({
        title: "موفق",
        description: "وضعیت درخواست به‌روزرسانی شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "به‌روزرسانی وضعیت با مشکل مواجه شد",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await createAuthenticatedRequest(`/api/admin/project-orders/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("خطا در حذف درخواست");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/project-orders"] });
      toast({
        title: "موفق",
        description: "درخواست با موفقیت حذف شد",
      });
    },
    onError: () => {
      toast({
        title: "خطا",
        description: "حذف درخواست با مشکل مواجه شد",
        variant: "destructive",
      });
    },
  });

  const filteredRequests = requests.filter((request) => {
    const matchesSearch = 
      request.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.phone.includes(searchQuery) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: Date | string | null) => {
    if (!date) return "نامشخص";
    const d = new Date(date);
    return new Intl.DateTimeFormat("fa-IR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <DashboardLayout title="پیشنهاد سفارش">
      <div className="p-4 md:p-6 space-y-6" dir="rtl">
        {/* Header */}
        {pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end"
          >
            <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-4 py-2 text-sm">
              <AlertCircle className="w-4 h-4 ml-2" />
              {pendingCount} درخواست جدید
            </Badge>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col md:flex-row gap-4"
        >
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="جستجو بر اساس نام، شماره تماس یا توضیحات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 h-11"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px] h-11">
              <SelectValue placeholder="فیلتر وضعیت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه وضعیت‌ها</SelectItem>
              <SelectItem value="pending">در انتظار</SelectItem>
              <SelectItem value="reviewed">بررسی شده</SelectItem>
              <SelectItem value="contacted">تماس گرفته شده</SelectItem>
              <SelectItem value="completed">تکمیل شده</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">درخواستی یافت نشد</h3>
            <p className="text-gray-500">هنوز هیچ درخواست سفارش پروژه‌ای ثبت نشده است</p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4"
          >
            <AnimatePresence>
              {filteredRequests.map((request) => {
                const status = statusConfig[request.status] || statusConfig.pending;
                const StatusIcon = status.icon;
                
                return (
                  <motion.div
                    key={request.id}
                    variants={itemVariants}
                    layout
                    className="group"
                  >
                    <Card className="hover:shadow-lg transition-all duration-300 border-gray-200 hover:border-emerald-300 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex flex-col lg:flex-row">
                          {/* Main Content */}
                          <div className="flex-1 p-5">
                            <div className="flex flex-col md:flex-row md:items-start gap-4">
                              {/* Avatar */}
                              <div className="flex-shrink-0">
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                  {request.firstName.charAt(0)}
                                </div>
                              </div>
                              
                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                                  <h3 className="text-lg font-bold text-gray-900">
                                    {request.firstName} {request.lastName}
                                  </h3>
                                  <Badge className={`${status.color} border w-fit`}>
                                    <StatusIcon className="w-3 h-3 ml-1" />
                                    {status.label}
                                  </Badge>
                                </div>
                                
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                                  <span className="flex items-center gap-1">
                                    <Phone className="w-4 h-4" />
                                    <span dir="ltr">{request.phone}</span>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {formatDate(request.createdAt)}
                                  </span>
                                </div>
                                
                                <p className="text-gray-600 text-sm line-clamp-2">
                                  {request.description}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex lg:flex-col items-center justify-end gap-2 p-4 lg:p-5 border-t lg:border-t-0 lg:border-r border-gray-100 bg-gray-50/50">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedRequest(request)}
                              className="gap-2"
                            >
                              <MessageSquare className="w-4 h-4" />
                              مشاهده
                            </Button>
                            
                            <Select
                              value={request.status}
                              onValueChange={(status) => updateStatusMutation.mutate({ id: request.id, status })}
                            >
                              <SelectTrigger className="w-[140px] h-9 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">در انتظار</SelectItem>
                                <SelectItem value="reviewed">بررسی شده</SelectItem>
                                <SelectItem value="contacted">تماس گرفته شده</SelectItem>
                                <SelectItem value="completed">تکمیل شده</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent dir="rtl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>حذف درخواست</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    آیا مطمئن هستید که می‌خواهید این درخواست را حذف کنید؟ این عمل قابل بازگشت نیست.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter className="gap-2">
                                  <AlertDialogCancel>انصراف</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteMutation.mutate(request.id)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    حذف
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
          <DialogContent className="sm:max-w-[500px]" dir="rtl">
            {selectedRequest && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold">
                      {selectedRequest.firstName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xl">
                        {selectedRequest.firstName} {selectedRequest.lastName}
                      </div>
                      <div className="text-sm font-normal text-gray-500 flex items-center gap-2 mt-1">
                        <Phone className="w-4 h-4" />
                        <span dir="ltr">{selectedRequest.phone}</span>
                      </div>
                    </div>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4 mt-4">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      تاریخ ثبت
                    </h4>
                    <p className="text-gray-600 bg-gray-50 rounded-lg p-3">
                      {formatDate(selectedRequest.createdAt)}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      توضیحات پروژه
                    </h4>
                    <p className="text-gray-600 bg-gray-50 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                      {selectedRequest.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="text-sm text-gray-500">وضعیت فعلی:</span>
                    <Badge className={`${statusConfig[selectedRequest.status]?.color || statusConfig.pending.color} border`}>
                      {statusConfig[selectedRequest.status]?.label || "نامشخص"}
                    </Badge>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
