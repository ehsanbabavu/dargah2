import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
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
import { 
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  Filter,
  Calendar,
  User,
  Hash,
  TrendingUp,
  TrendingDown,
  Search,
  Banknote,
  Receipt,
  CreditCard,
  Edit3,
  RefreshCw,
  X
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Transaction } from "@shared/schema";

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  paid: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  failed: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
};

const statusLabels: Record<string, string> = {
  pending: "در انتظار بررسی",
  completed: "تکمیل شده",
  paid: "تکمیل شده",
  failed: "رد شده"
};

const transactionColors = {
  deposit: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  withdraw: "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
  order_payment: "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/30",
  commission: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30"
};

const transactionLabels = {
  deposit: "درخواست واریز",
  withdraw: "درخواست برداشت",
  order_payment: "پرداخت سفارش",
  commission: "کمیسیون"
};

export default function SuccessfulTransactionsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  // Fetch all transactions for management
  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions']
  });

  // Fetch deposits summary for level 1 users
  const { data: depositsSummary } = useQuery<{ totalAmount: number; parentUserId: string }>({
    queryKey: ['/api/deposits/summary'],
    enabled: true // Always enabled for level 1 users viewing this page
  });

  // Update transaction status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ transactionId, status }: { transactionId: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/transactions/${transactionId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setDialogOpen(false);
      setSelectedTransaction(null);
      setNewStatus("");
      toast({
        title: "موفق",
        description: "وضعیت تراکنش به‌روزرسانی شد"
      });
    },
    onError: (_error: Error) => {
      toast({
        title: "خطا",
        description: "خطا در به‌روزرسانی وضعیت",
        variant: "destructive"
      });
    }
  });

  // Filter transactions - حذف تراکنش‌های order_payment از لیست
  const filteredTransactions = transactions.filter(transaction => {
    // حذف تراکنش‌های پرداخت سفارش از نمایش
    if (transaction.type === 'order_payment') {
      return false;
    }
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesType = typeFilter === "all" || transaction.type === typeFilter;
    const matchesSearch = !searchTerm || 
      transaction.transactionDate?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.accountSource?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.referenceId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesType && matchesSearch;
  });

  // Statistics - فقط برای تراکنش‌های واریزی (deposit)
  const depositTransactions = transactions.filter(t => t.type === 'deposit');
  const stats = {
    total: depositTransactions.length,
    pending: depositTransactions.filter(t => t.status === 'pending').length,
    completed: depositTransactions.filter(t => t.status === 'completed' || t.status === 'paid').length,
    failed: depositTransactions.filter(t => t.status === 'failed').length,
    totalAmount: depositTransactions
      .filter(t => t.status === 'completed' || t.status === 'paid')
      .reduce((acc, t) => acc + Number(t.amount), 0)
  };

  const handleStatusChange = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setNewStatus(transaction.status);
    setDialogOpen(true);
  };

  const handleStatusUpdate = () => {
    if (selectedTransaction && newStatus && newStatus !== selectedTransaction.status) {
      updateStatusMutation.mutate({
        transactionId: selectedTransaction.id,
        status: newStatus
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
  };

  if (isLoading) {
    return (
      <div className="w-full p-3 sm:p-5 lg:p-6 space-y-4 max-w-7xl mx-auto">
        <div className="h-10 bg-muted/60 rounded-xl animate-pulse w-48"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="h-20 bg-muted/50 rounded-xl animate-pulse"></div>
          <div className="h-20 bg-muted/50 rounded-xl animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
        <div className="h-12 bg-muted/50 rounded-xl animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted/40 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  const hasActiveFilters = statusFilter !== "all" || typeFilter !== "all" || searchTerm !== "";

  return (
    <div className="w-full p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-6 max-w-7xl mx-auto" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/50">
        <div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-500 shrink-0" />
            <span>مدیریت تراکنش‌ها و واریزی‌ها</span>
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            بررسی و مدیریت واریزی‌های کاربران، وضعیت تراکنش‌ها و آمار مالی
          </p>
        </div>
      </div>

      {/* Row 1 Stats: Total Card-to-Card & Deposit Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-card text-card-foreground border border-border/70 rounded-2xl p-3.5 sm:p-4 shadow-xs transition-all hover:border-primary/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground font-medium truncate">مجموع مبلغ کارت به کارت کاربران</p>
              <p className="text-sm sm:text-lg font-black text-foreground tracking-tight mt-0.5" data-testid="stat-amount">
                {formatPrice(stats.totalAmount)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card text-card-foreground border border-border/70 rounded-2xl p-3.5 sm:p-4 shadow-xs transition-all hover:border-primary/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shrink-0">
              <Banknote className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground font-medium truncate">واریزی‌های شما</p>
              <p className="text-sm sm:text-lg font-black text-purple-600 dark:text-purple-400 tracking-tight mt-0.5" data-testid="stat-deposits">
                {formatPrice(depositsSummary?.totalAmount || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2 Stats: Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-card text-card-foreground border border-border/70 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 shrink-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">کل تراکنش‌ها</p>
              <p className="text-base sm:text-xl font-bold text-foreground" data-testid="stat-total">
                {stats.total}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card text-card-foreground border border-border/70 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">در انتظار</p>
              <p className="text-base sm:text-xl font-bold text-amber-600 dark:text-amber-400" data-testid="stat-pending">
                {stats.pending}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card text-card-foreground border border-border/70 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">تکمیل شده</p>
              <p className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400" data-testid="stat-completed">
                {stats.completed}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card text-card-foreground border border-border/70 rounded-2xl p-3 sm:p-4 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground font-medium">رد شده</p>
              <p className="text-base sm:text-xl font-bold text-rose-600 dark:text-rose-400" data-testid="stat-failed">
                {stats.failed}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-card text-card-foreground border border-border/70 rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="جستجو (کد پیگیری، شماره حساب، تاریخ...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search"
              className="pr-9 pl-3 h-9 sm:h-10 text-xs sm:text-sm bg-background border-border/70 rounded-xl"
            />
          </div>

          {/* Filter Dropdowns - Fully Accessible on Mobile and Desktop */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-36 rounded-xl bg-background border-border/70" data-testid="select-status-filter">
                <SelectValue placeholder="وضعیت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه وضعیت‌ها</SelectItem>
                <SelectItem value="pending">در انتظار</SelectItem>
                <SelectItem value="completed">تکمیل شده</SelectItem>
                <SelectItem value="failed">رد شده</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm w-full sm:w-40 rounded-xl bg-background border-border/70" data-testid="select-type-filter">
                <SelectValue placeholder="نوع تراکنش" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه انواع</SelectItem>
                <SelectItem value="deposit">واریز</SelectItem>
                <SelectItem value="withdraw">برداشت</SelectItem>
                <SelectItem value="order_payment">پرداخت سفارش</SelectItem>
                <SelectItem value="commission">کمیسیون</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear Filters indicator */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              فیلترهای فعال در حال اعمال هستند
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setStatusFilter("all");
                setTypeFilter("all");
                setSearchTerm("");
              }}
              data-testid="button-clear-filters"
              className="text-xs h-7 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg gap-1"
            >
              <X className="w-3.5 h-3.5" />
              پاک کردن فیلترها
            </Button>
          </div>
        )}
      </div>

      {/* Transactions Container */}
      <div className="w-full">
        {filteredTransactions.length === 0 ? (
          <div className="bg-card text-card-foreground border border-border/70 rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground">
              <Receipt className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              تراکنشی یافت نشد
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm">
              با فیلترها و عبارت جستجوی انتخاب شده تراکنشی وجود ندارد.
            </p>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStatusFilter("all");
                  setTypeFilter("all");
                  setSearchTerm("");
                }}
                className="mt-2 text-xs rounded-xl"
              >
                حذف فیلترها و نمایش همه
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile View: Clean Responsive Cards (Visible on screens smaller than md) */}
            <div className="block md:hidden space-y-3">
              {filteredTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  data-testid={`transaction-${transaction.id}`}
                  className="bg-card text-card-foreground border border-border/70 rounded-2xl p-3.5 shadow-xs space-y-3 transition-all hover:border-primary/40"
                >
                  {/* Top Bar: Type Badge & Status Badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-xl border ${transactionColors[transaction.type as keyof typeof transactionColors] || 'bg-muted'}`}>
                        {transaction.type === 'deposit' && <TrendingUp className="w-3.5 h-3.5" />}
                        {transaction.type === 'withdraw' && <TrendingDown className="w-3.5 h-3.5" />}
                        {transaction.type === 'order_payment' && <DollarSign className="w-3.5 h-3.5" />}
                        {transaction.type === 'commission' && <DollarSign className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-bold text-foreground">
                        {transactionLabels[transaction.type as keyof typeof transactionLabels] || transaction.type}
                      </span>
                    </div>

                    <Badge className={`text-[11px] font-medium px-2 py-0.5 rounded-lg border ${statusColors[transaction.status as keyof typeof statusColors] || ''}`}>
                      {statusLabels[transaction.status as keyof typeof statusLabels] || transaction.status}
                    </Badge>
                  </div>

                  {/* Middle Info: Amount & Details */}
                  <div className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">مبلغ تراکنش:</span>
                      <span className="text-sm font-extrabold text-foreground tracking-tight" data-testid={`amount-${transaction.id}`}>
                        {formatPrice(Number(transaction.amount))}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 pt-1 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border/40">
                      {transaction.transactionDate && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            تاریخ و زمان:
                          </span>
                          <span className="font-medium text-foreground dir-ltr">
                            {transaction.transactionDate} {transaction.transactionTime ? ` - ${transaction.transactionTime}` : ''}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          شماره/منبع حساب:
                        </span>
                        <span className="font-medium text-foreground dir-ltr truncate max-w-[180px]">
                          {transaction.accountSource || '-'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          کد پیگیری:
                        </span>
                        <span className="font-mono font-bold text-foreground text-[11px] dir-ltr">
                          {transaction.referenceId || '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-9 text-xs font-semibold rounded-xl border-border/80 gap-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleStatusChange(transaction)}
                    data-testid={`button-edit-${transaction.id}`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    تغییر وضعیت تراکنش
                  </Button>
                </div>
              ))}
            </div>

            {/* Desktop View: Full Responsive Table (Visible on md screens and larger) */}
            <div className="hidden md:block bg-card text-card-foreground border border-border/70 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow className="border-b border-border/60 hover:bg-transparent">
                      <TableHead className="text-right font-bold text-xs text-foreground py-3.5">نوع تراکنش</TableHead>
                      <TableHead className="text-right font-bold text-xs text-foreground py-3.5">مبلغ</TableHead>
                      <TableHead className="text-right font-bold text-xs text-foreground py-3.5">وضعیت</TableHead>
                      <TableHead className="text-right font-bold text-xs text-foreground py-3.5">تاریخ و زمان انجام</TableHead>
                      <TableHead className="text-right font-bold text-xs text-foreground py-3.5">حساب منبع</TableHead>
                      <TableHead className="text-right font-bold text-xs text-foreground py-3.5">کد پیگیری</TableHead>
                      <TableHead className="text-center font-bold text-xs text-foreground py-3.5">عملیات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id} data-testid={`transaction-${transaction.id}`} className="border-b border-border/40 hover:bg-muted/30 transition-colors">
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-xl border ${transactionColors[transaction.type as keyof typeof transactionColors] || 'bg-muted'}`}>
                              {transaction.type === 'deposit' && <TrendingUp className="w-3.5 h-3.5" />}
                              {transaction.type === 'withdraw' && <TrendingDown className="w-3.5 h-3.5" />}
                              {transaction.type === 'order_payment' && <DollarSign className="w-3.5 h-3.5" />}
                              {transaction.type === 'commission' && <DollarSign className="w-3.5 h-3.5" />}
                            </div>
                            <span className="text-xs font-bold text-foreground">
                              {transactionLabels[transaction.type as keyof typeof transactionLabels] || transaction.type}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="font-extrabold text-sm text-foreground tracking-tight" data-testid={`amount-${transaction.id}`}>
                            {formatPrice(Number(transaction.amount))}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge className={`text-xs px-2.5 py-0.5 rounded-lg border ${statusColors[transaction.status as keyof typeof statusColors] || ''}`}>
                            {statusLabels[transaction.status as keyof typeof statusLabels] || transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="text-xs">
                            {transaction.transactionDate && (
                              <div className="font-medium text-foreground">{transaction.transactionDate}</div>
                            )}
                            {transaction.transactionTime && (
                              <div className="text-muted-foreground text-[11px] mt-0.5">{transaction.transactionTime}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="text-xs font-medium dir-ltr text-foreground">
                            {transaction.accountSource || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-3">
                          <span className="text-xs font-mono font-bold text-foreground dir-ltr">
                            {transaction.referenceId || '-'}
                          </span>
                        </TableCell>
                        <TableCell className="py-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs px-3 h-8 rounded-xl font-medium border-border/80 hover:bg-primary hover:text-primary-foreground transition-colors"
                            onClick={() => handleStatusChange(transaction)}
                            data-testid={`button-edit-${transaction.id}`}
                          >
                            تغییر وضعیت
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Status Update Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="w-[92vw] max-w-[420px] rounded-2xl p-4 sm:p-6 dir-rtl" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold">تغییر وضعیت تراکنش</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
              وضعیت جدید را برای این تراکنش انتخاب کرده و ثبت کنید.
            </DialogDescription>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-4 pt-2">
              <div className="p-3.5 bg-muted/50 rounded-2xl border border-border/60 space-y-2">
                <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-2">
                  <span className="font-bold text-xs sm:text-sm text-foreground">
                    {transactionLabels[selectedTransaction.type as keyof typeof transactionLabels] || selectedTransaction.type}
                  </span>
                  <Badge className={`text-xs ${transactionColors[selectedTransaction.type as keyof typeof transactionColors] || ''}`}>
                    {formatPrice(Number(selectedTransaction.amount))}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  {selectedTransaction.transactionDate && (
                    <p className="flex justify-between">
                      <span>تاریخ انجام:</span>
                      <span className="font-medium text-foreground">{selectedTransaction.transactionDate}</span>
                    </p>
                  )}
                  {selectedTransaction.transactionTime && (
                    <p className="flex justify-between">
                      <span>ساعت انجام:</span>
                      <span className="font-medium text-foreground">{selectedTransaction.transactionTime}</span>
                    </p>
                  )}
                  {selectedTransaction.accountSource && (
                    <p className="flex justify-between">
                      <span>از حساب:</span>
                      <span className="font-medium text-foreground dir-ltr">{selectedTransaction.accountSource}</span>
                    </p>
                  )}
                  {selectedTransaction.referenceId && (
                    <p className="flex justify-between">
                      <span>کد پیگیری:</span>
                      <span className="font-mono font-bold text-foreground dir-ltr">{selectedTransaction.referenceId}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs sm:text-sm font-semibold">وضعیت جدید</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="h-10 text-xs sm:text-sm rounded-xl" data-testid="select-new-status">
                    <SelectValue placeholder="انتخاب وضعیت..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">در انتظار بررسی</SelectItem>
                    <SelectItem value="completed">تکمیل شده</SelectItem>
                    <SelectItem value="failed">رد شده</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button 
                  onClick={handleStatusUpdate}
                  disabled={updateStatusMutation.isPending || !newStatus || newStatus === selectedTransaction.status}
                  data-testid="button-confirm-status"
                  className="flex-1 h-10 text-xs sm:text-sm font-bold rounded-xl"
                >
                  {updateStatusMutation.isPending ? (
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      در حال ثبت...
                    </span>
                  ) : "تایید و بروزرسانی"}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  data-testid="button-cancel-status"
                  className="h-10 text-xs sm:text-sm font-medium rounded-xl border-border/80"
                >
                  لغو
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
