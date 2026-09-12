import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Calendar, MapPin, User, Phone, Edit, Printer, Truck } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { type Order } from "@shared/schema";

// Extended Order type with customer and address info
type OrderWithDetails = Order & {
  addressTitle?: string;
  fullAddress?: string;
  postalCode?: string;
  buyerFirstName?: string;
  buyerLastName?: string;
  buyerPhone?: string;
};

// Payment status based colors - زرد برای پرداخت نشده، سبز برای پرداخت شده، قرمز برای لغو شده
const getPaymentStatusColor = (status: string) => {
  if (status === 'awaiting_payment') {
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-200";
  } else if (status === 'cancelled') {
    return "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-100 border-red-200";
  }
  // سایر وضعیت‌ها (پرداخت شده)
  return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200";
};

const statusColors = {
  awaiting_payment: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  pending: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100", 
  preparing: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  shipped: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
};

const statusLabels = {
  awaiting_payment: "در انتظار پرداخت",
  pending: "در انتظار تایید",
  confirmed: "تایید شده",
  preparing: "در حال آماده‌سازی",
  shipped: "ارسال شده", 
  delivered: "تحویل داده شده",
  cancelled: "لغو شده"
};

const shippingMethodLabels = {
  post_pishtaz: "پست پیشتاز",
  post_normal: "پست معمولی",
  piyk: "پیک",
  free: "ارسال رایگان"
};

const statusOptions = [
  { value: "awaiting_payment", label: "در انتظار پرداخت" },
  { value: "pending", label: "در انتظار تایید" },
  { value: "confirmed", label: "تایید شده" },
  { value: "preparing", label: "در حال آماده‌سازی" },
  { value: "shipped", label: "ارسال شده" },
  { value: "delivered", label: "تحویل داده شده" },
  { value: "cancelled", label: "لغو شده" }
];

export default function ReceivedOrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  
  // Fetch received orders (orders where current user is seller)
  const { data: orders = [], isLoading } = useQuery<OrderWithDetails[]>({
    queryKey: ['/api/orders/seller']
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await apiRequest('PUT', `/api/orders/${orderId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      // Invalidate cache for both seller orders and customer orders
      queryClient.invalidateQueries({ queryKey: ['/api/orders/seller'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setDialogOpen(false);
      setSelectedOrder(null);
      setNewStatus("");
      toast({
        title: "موفق",
        description: "وضعیت سفارش با موفقیت تغییر کرد"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطا",
        description: "خطا در تغییر وضعیت سفارش",
        variant: "destructive"
      });
    }
  });

  // پرینت مستقیم سفارش
  const printOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest('GET', `/api/orders/${orderId}`);
      return response.json();
    },
    onSuccess: (data) => {
      // Create print window
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      
      const printContent = generatePrintHTML(data);
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    },
    onError: (error: Error) => {
      toast({
        title: "خطا",
        description: "خطا در پرینت سفارش",
        variant: "destructive"
      });
    }
  });

  const generatePrintHTML = (orderData: any) => {
    const order = orderData.order || orderData;
    const items = orderData.items || [];
    
    return `
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>فیش سفارش #${order.orderNumber}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&display=swap');
          
          @page {
            size: A5 portrait;
            margin: 5mm 8mm 8mm 8mm;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            color: #000;
            background: white;
          }
          
          .print-container {
            width: 100%;
            max-width: 148mm;
            margin: 0 auto;
          }
          
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          
          .header h1 {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 10px;
          }
          
          .order-info {
            display: flex;
            justify-content: space-between;
            font-size: 13px;
          }
          
          .section {
            margin-bottom: 15px;
          }
          
          .section h3 {
            font-size: 16px;
            font-weight: 700;
            border-bottom: 2px solid #ccc;
            padding-bottom: 5px;
            margin-bottom: 8px;
          }
          
          .info-box {
            background: #f8f9fa;
            border: 1px solid #ccc;
            padding: 10px;
            border-radius: 4px;
          }
          
          .info-row {
            margin-bottom: 5px;
          }
          
          .info-label {
            font-weight: 700;
            display: inline-block;
            min-width: 80px;
            margin-left: 10px;
          }
          
          .item-box {
            background: #f8f9fa;
            border: 1px solid #ccc;
            padding: 8px;
            border-radius: 4px;
            margin-bottom: 8px;
          }
          
          .item-header {
            font-weight: 700;
            margin-bottom: 5px;
          }
          
          .footer {
            margin-top: 20px;
            border-top: 2px solid #000;
            padding-top: 10px;
            display: flex;
            justify-content: space-between;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <!-- Header -->
          <div class="header">
            <h1>فیش سفارش</h1>
            <div class="order-info">
              <div><strong>شماره سفارش:</strong> #${order.orderNumber}</div>
              <div><strong>تاریخ سفارش:</strong> ${order.createdAt ? 
                new Date(order.createdAt).toLocaleDateString('fa-IR', {
                  year: 'numeric',
                  month: 'long', 
                  day: 'numeric'
                }) : 'نامشخص'}</div>
            </div>
          </div>

          <!-- Customer Info -->
          <div class="section">
            <h3>مشخصات خریدار</h3>
            <div class="info-box">
              <div class="info-row">
                <span class="info-label">نام و نام خانوادگی:</span>
                <span>${order.buyerFirstName && order.buyerLastName 
                  ? `${order.buyerFirstName} ${order.buyerLastName}` 
                  : 'مشتری گرامی'}</span>
              </div>
              ${order.buyerPhone ? `
              <div class="info-row">
                <span class="info-label">شماره تماس:</span>
                <span>${order.buyerPhone}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Address -->
          <div class="section">
            <h3>آدرس تحویل</h3>
            <div class="info-box">
              ${order.addressTitle ? `
              <div class="info-row" style="font-weight: 700; font-size: 15px;">
                📍 ${order.addressTitle}
              </div>
              ` : ''}
              <div class="info-row" style="margin-top: 8px;">
                ${order.fullAddress || 'آدرس مشخص نشده'}
              </div>
              ${order.postalCode ? `
              <div class="info-row" style="margin-top: 5px;">
                <span class="info-label">کد پستی:</span>
                <span>${order.postalCode}</span>
              </div>
              ` : ''}
            </div>
          </div>

          <!-- Order Items -->
          <div class="section">
            <h3>لیست کالاها</h3>
            ${items.map((item: any) => `
              <div class="item-box">
                <div class="item-header">🛒 ${item.productName || 'محصول'}</div>
                ${item.productDescription ? `
                  <div style="font-size: 12px; color: #666; margin-bottom: 5px;">
                    ${item.productDescription}
                  </div>
                ` : ''}
                <div style="text-align: left; font-weight: 700;">
                  تعداد: ${item.quantity}
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Footer -->
          <div class="footer">
            <div>وضعیت سفارش: <strong>${statusLabels[order.status as keyof typeof statusLabels]}</strong></div>
            <div>مهر و امضای فروشنده: ________________</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  const handlePrintOrder = (orderId: string) => {
    printOrderMutation.mutate(orderId);
  };

  const handleStatusUpdate = () => {
    if (!selectedOrder || !newStatus) return;
    updateStatusMutation.mutate({ orderId: selectedOrder.id, status: newStatus });
  };

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat('fa-IR').format(Number(price)) + ' تومان';
  };

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="received-orders-loading">
        <div className="flex justify-end p-1 animate-pulse">
          <div className="h-4 bg-slate-100 dark:bg-zinc-800 rounded-md w-24"></div>
        </div>
        <div className="space-y-3.5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-slate-50/50 dark:bg-zinc-900/50 rounded-[20px] animate-pulse border border-slate-100 dark:border-zinc-800/80"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="received-orders-content">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
          <Package className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
          سفارشات دریافتی
        </h3>
        <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300 font-extrabold px-2.5 py-0.5 rounded-full">
          {orders.length} سفارش
        </span>
      </div>

      {/* Orders List - Mobile-First List View */}
      <div className="space-y-3.5">
        {orders.length === 0 ? (
          <Card className="border-slate-100 dark:border-zinc-800/80 rounded-[20px] shadow-xs">
            <CardContent className="flex flex-col items-center justify-center py-10 px-4">
              <div className="p-3 bg-slate-50 dark:bg-zinc-950 rounded-full text-slate-400 dark:text-slate-600 mb-3">
                <Package className="w-8 h-8" />
              </div>
              <h3 className="text-xs font-extrabold text-gray-900 dark:text-gray-100 mb-1">
                هنوز سفارشی دریافت نکرده‌اید
              </h3>
              <p className="text-[10px] text-slate-400 text-center">
                سفارشات جدید مشتریان در این بخش ظاهر خواهند شد.
              </p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <Card 
              key={order.id} 
              className={`overflow-hidden rounded-[20px] border transition-all duration-300 shadow-xs ${getPaymentStatusColor(order.status)}`} 
              data-testid={`card-order-${order.id}`}
            >
              <CardContent className="p-4 space-y-3.5">
                {/* Top Info Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100/50 dark:border-zinc-800/40">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-100/60 dark:bg-zinc-800/60 text-slate-600 dark:text-slate-400">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-xs text-slate-900 dark:text-slate-100">
                        سفارش #{order.orderNumber}
                      </h3>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">
                        {order.createdAt && new Date(order.createdAt).toLocaleDateString('fa-IR')}
                      </span>
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="text-[9px] text-muted-foreground font-bold block mb-0.5">مبلغ کل</span>
                    <span className="font-black text-xs text-indigo-600 dark:text-indigo-400">
                      {formatPrice(order.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Flat Details Section */}
                <div className="grid grid-cols-1 gap-2.5 text-xs">
                  {/* Customer */}
                  <div className="flex items-start gap-2.5">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 block text-[11px]" data-testid={`customer-${order.id}`}>
                        {order.buyerFirstName && order.buyerLastName 
                          ? `${order.buyerFirstName} ${order.buyerLastName}`
                          : 'مشتری گرامی'
                        }
                      </span>
                      {order.buyerPhone && (
                        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1 mt-0.5 font-mono" data-testid={`customer-phone-${order.id}`}>
                          {order.buyerPhone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delivery Address */}
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      {order.addressTitle && (
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400 text-[10px] block" data-testid={`address-title-${order.id}`}>
                          {order.addressTitle}
                        </span>
                      )}
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5" data-testid={`address-${order.id}`}>
                        {order.fullAddress || 'آدرس تعیین نشده'}
                      </p>
                      {order.postalCode && (
                        <span className="text-[9px] text-muted-foreground font-bold block mt-0.5 font-mono" data-testid={`postal-code-${order.id}`}>
                          کد پستی: {order.postalCode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Shipping Method */}
                  {order.shippingMethod && (
                    <div className="flex items-center gap-2.5 pt-0.5">
                      <Truck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-[11px] text-slate-600 dark:text-slate-300" data-testid={`shipping-method-${order.id}`}>
                        روش ارسال: <strong className="font-bold">{shippingMethodLabels[order.shippingMethod as keyof typeof shippingMethodLabels] || 'نامشخص'}</strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Customer Notes */}
                {order.notes && (
                  <div className="bg-slate-50/80 dark:bg-zinc-950/40 border border-slate-100/50 dark:border-zinc-800 p-2.5 rounded-xl">
                    <span className="text-[9px] text-muted-foreground font-extrabold block mb-0.5">توضیحات مشتری:</span>
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed" data-testid={`notes-${order.id}`}>
                      {order.notes}
                    </p>
                  </div>
                )}

                {/* Bottom Status & Control Actions */}
                <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100/50 dark:border-zinc-800/40">
                  <Badge 
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md ${statusColors[order.status as keyof typeof statusColors]}`}
                    data-testid={`status-${order.id}`}
                  >
                    {statusLabels[order.status as keyof typeof statusLabels]}
                  </Badge>

                  <div className="flex items-center gap-2 shrink-0">
                    {order.status !== 'awaiting_payment' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintOrder(order.id)}
                        data-testid={`button-print-${order.id}`}
                        className="h-8 text-[10px] font-extrabold px-3 rounded-lg border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 active:scale-95 transition-transform"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>پرینت</span>
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setNewStatus(order.status);
                        setDialogOpen(true);
                      }}
                      data-testid={`button-edit-status-${order.id}`}
                      className="h-8 text-[10px] font-extrabold px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1 active:scale-95 transition-transform"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>تغییر وضعیت</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Status Update Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-[24px]">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-sm font-black text-slate-900 dark:text-slate-100 text-right">تغییر وضعیت سفارش</DialogTitle>
            <DialogDescription className="text-[11px] text-muted-foreground text-right mt-1">
              وضعیت جدید سفارش #{selectedOrder?.orderNumber} را انتخاب کنید
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-zinc-950/40 p-2.5 rounded-xl">
              <span className="font-extrabold text-muted-foreground">وضعیت فعلی:</span>
              <Badge className={`${statusColors[selectedOrder?.status as keyof typeof statusColors]} text-[10px] font-black`}>
                {statusLabels[selectedOrder?.status as keyof typeof statusLabels]}
              </Badge>
            </div>

            <div className="space-y-1.5 text-right">
              <label className="text-[10px] font-extrabold text-muted-foreground/80">وضعیت جدید:</label>
              <Select value={newStatus} onValueChange={setNewStatus} defaultValue={selectedOrder?.status}>
                <SelectTrigger className="h-8.5 text-xs rounded-xl text-right" dir="rtl" data-testid="select-new-status">
                  <SelectValue placeholder="انتخاب وضعیت جدید" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value} className="text-xs">
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2.5 pt-2">
              <Button 
                onClick={handleStatusUpdate}
                disabled={!newStatus || newStatus === selectedOrder?.status || updateStatusMutation.isPending}
                data-testid="button-update-status"
                size="sm"
                className="flex-1 h-9 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl"
              >
                {updateStatusMutation.isPending ? "در حال تغییر..." : "ثبت تغییر"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setDialogOpen(false);
                  setSelectedOrder(null);
                  setNewStatus("");
                }}
                data-testid="button-cancel-status"
                size="sm"
                className="h-9 text-xs font-extrabold rounded-xl border-slate-200"
              >
                لغو
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}