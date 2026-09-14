import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Package, Calendar, MapPin, CreditCard, Clock, CheckCircle2, Truck, Package2, ShoppingBag, Download, Eye, Copy } from "lucide-react";
import { type Order, type OrderItem } from "@shared/schema";
import { useState, useRef, useEffect, useCallback } from "react";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import moment from "moment-jalaali";
import { PersianDatePicker } from "@/components/persian-date-picker";
import { apiRequest, queryClient } from "@/lib/queryClient";

  // Helper function to escape HTML content for security
  const escapeHtml = (unsafe: string | undefined | null) => {
    if (!unsafe) return '';
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

const statusColors = {
  awaiting_payment: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  preparing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-100",
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

const statusIcons = {
  awaiting_payment: CreditCard,
  pending: Clock,
  confirmed: CheckCircle2,
  preparing: Package2,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: Clock
};

const transactionSchema = z.object({
  amount: z.coerce.number().positive("مبلغ باید مثبت باشد"),
  transactionDate: z.string().min(1, "تاریخ انجام تراکنش الزامی است"),
  transactionTime: z.string().min(1, "ساعت انجام تراکنش الزامی است"),
  accountSource: z.string().min(1, "از حساب الزامی است"),
  referenceId: z.string().optional(),
});

type PaymentMethod = { type: 'card' };

export default function OrdersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch orders
  const { data: orders = [], isLoading } = useQuery<(Order & { addressTitle?: string; fullAddress?: string; postalCode?: string })[]>({
    queryKey: ['/api/orders']
  });

  const formatPrice = (price: number | string) => {
    return new Intl.NumberFormat('fa-IR').format(Number(price)) + ' تومان';
  };

  // Payment dialog states
  const [step1DialogOpen, setStep1DialogOpen] = useState(false); // Dialog انتخاب روش پرداخت
  const [selectedPaymentOrderId, setSelectedPaymentOrderId] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>({ type: 'card' });
  const [formattedAmount, setFormattedAmount] = useState('');

  // Fetch specific order when payment dialog opens
  const { data: specificOrder } = useQuery<Order>({
    queryKey: ['/api/orders', selectedPaymentOrderId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/orders/${selectedPaymentOrderId}`);
      return response.json();
    },
    enabled: !!selectedPaymentOrderId,
  });

  // Fetch seller info when payment dialog opens
  const { data: sellerInfo } = useQuery<{
    sellerId: string;
    sellerName: string;
    bankCardNumber: string | null;
    bankCardHolderName: string | null;
  }>({
    queryKey: ['/api/orders', selectedPaymentOrderId, 'seller-info'],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/orders/${selectedPaymentOrderId}/seller-info`);
      return response.json();
    },
    enabled: !!selectedPaymentOrderId && step1DialogOpen,
  });

  // استفاده از specific order اگر موجود باشد، وگرنه از orders array استفاده کن
  const selectedPaymentOrder = specificOrder || orders.find(o => o.id === selectedPaymentOrderId);

  const handlePayment = async (orderId: string) => {
    setSelectedPaymentOrderId(orderId);
    setSelectedPaymentMethod({ type: 'card' });
    await new Promise(resolve => setTimeout(resolve, 50));
    setStep1DialogOpen(true);
  };

  // Transaction form
  const form = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: 0,
      transactionDate: moment().format('YYYY-MM-DD'),
      transactionTime: moment().format('HH:mm'),
      accountSource: "",
      referenceId: ""
    }
  });

  // Create transaction mutation
  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/transactions', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setStep1DialogOpen(false);
      setSelectedPaymentMethod(null);
      form.reset();
      toast({
        title: "موفق",
        description: "تراکنش با موفقیت ثبت شد و در انتظار تایید است"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "خطا",
        description: "خطا در ثبت تراکنش",
        variant: "destructive"
      });
    }
  });

  const onSubmitTransaction = (data: any) => {
    if (!selectedPaymentOrder) return;

    // تبدیل ریال به تومان
    const amountInToman = Math.floor(data.amount / 10);
    
    const payload = {
      ...data,
      type: "deposit",
      status: "pending",
      paymentMethod: 'card',
      orderId: selectedPaymentOrder.id,
      amount: String(amountInToman)
    };
    
    createTransactionMutation.mutate(payload);
  };

  const handleSelectPaymentMethod = async (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
  };

  const handleProceedToPayment = async () => {
    if (!selectedPaymentOrderId) return;
    form.reset();
  };

  const handleClosePaymentDialog = () => {
    setStep1DialogOpen(false);
    setSelectedPaymentOrderId(null);
    setSelectedPaymentMethod({ type: 'card' });
  };


  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const [invoiceData, setInvoiceData] = useState<(Order & { items: (OrderItem & { productName: string; productDescription?: string; productImage?: string })[]; addressTitle?: string; fullAddress?: string; postalCode?: string; buyerFirstName?: string; buyerLastName?: string; buyerPhone?: string; sellerFirstName?: string; sellerLastName?: string }) | null>(null);
  
  // Fetch detailed order with items when modal is opened OR when downloading invoice
  const { data: selectedOrderData, isLoading: isLoadingOrderData } = useQuery<Order & { items: (OrderItem & { productName: string; productDescription?: string; productImage?: string })[]; addressTitle?: string; fullAddress?: string; postalCode?: string; buyerFirstName?: string; buyerLastName?: string; buyerPhone?: string; sellerFirstName?: string; sellerLastName?: string }>({
    queryKey: ['/api/orders', selectedOrderId || downloadingOrderId],
    enabled: !!(selectedOrderId || downloadingOrderId),
    staleTime: 0 // Always fetch fresh data
  });

  const invoiceRef = useRef<HTMLDivElement>(null);

  const downloadInvoice = async (orderData: Order & { items?: (OrderItem & { productName: string; productDescription?: string; productImage?: string })[]; addressTitle?: string; fullAddress?: string; postalCode?: string; buyerFirstName?: string; buyerLastName?: string; buyerPhone?: string; sellerFirstName?: string; sellerLastName?: string }) => {
    if (!invoiceRef.current) return;
    
    const invoiceElement = invoiceRef.current;
    const originalClassName = invoiceElement.className;
    const originalStyle = invoiceElement.style.cssText;
    
    // Determine size based on number of items
    const itemCount = orderData.items?.length || 0;
    const isLargeOrder = itemCount > 8; // Use A4 if more than 8 items
    const width = isLargeOrder ? '595px' : '842px'; // A4 portrait: 595px, A5 landscape: 842px
    
    try {
      // Make element visible but off-screen for proper measurement and capture
      invoiceElement.className = '';
      invoiceElement.style.cssText = `
        position: fixed;
        left: -9999px;
        top: 0;
        display: block;
        opacity: 1;
        pointer-events: none;
        z-index: -1;
        width: ${width};
        min-height: ${isLargeOrder ? '842px' : '595px'};
        background-color: #ffffff;
      `;
      
      // Wait for fonts to load and images to be ready
      const images = Array.from(invoiceElement.querySelectorAll('img')).filter(img => !img.complete);
      if (images.length > 0) {
        await Promise.all(images.map(img => 
          new Promise(resolve => {
            img.onload = img.onerror = resolve;
          })
        ));
      }
      
      // Additional wait for fonts and styles
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const canvas = await html2canvas(invoiceElement, {
        backgroundColor: '#ffffff',
        scale: window.devicePixelRatio || 2,
        useCORS: true,
        allowTaint: false
      });
      
      const imageData = canvas.toDataURL('image/png');
      
      // دانلود فاکتور برای کاربر
      const link = document.createElement('a');
      link.download = `فاکتور-سفارش-${orderData.orderNumber || orderData.id.slice(0, 8)}.png`;
      link.href = imageData;
      link.click();

      // ذخیره نسخه‌ای از فاکتور در سرور
      try {
        const response = await fetch('/api/save-invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            orderId: orderData.id,
            imageData: imageData
          })
        });

        if (response.ok) {
          console.log('✅ فاکتور با موفقیت در سرور ذخیره شد');
        } else {
          console.error('❌ خطا در ذخیره فاکتور در سرور');
        }
      } catch (saveError) {
        console.error('❌ خطا در ارسال فاکتور به سرور:', saveError);
      }
    } catch (error) {
      console.error('خطا در تولید تصویر فاکتور:', error);
    } finally {
      // Always restore original state
      invoiceElement.className = originalClassName;
      invoiceElement.style.cssText = originalStyle;
    }
  };

  // Helper function to format price as Rial
  const formatPriceRial = (price: number | string) => {
    return new Intl.NumberFormat('fa-IR').format(Number(price) * 10) + ' ریال';
  };

  // Helper function to convert number to Persian words
  const numberToPersianWords = (num: number): string => {
    const ones = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش', 'هفت', 'هشت', 'نه'];
    const tens = ['', '', 'بیست', 'سی', 'چهل', 'پنجاه', 'شصت', 'هفتاد', 'هشتاد', 'نود'];
    const teens = ['ده', 'یازده', 'دوازده', 'سیزده', 'چهارده', 'پانزده', 'شانزده', 'هفده', 'هجده', 'نوزده'];
    const hundreds = ['', 'یکصد', 'دویست', 'سیصد', 'چهارصد', 'پانصد', 'ششصد', 'هفتصد', 'هشتصد', 'نهصد'];
    const scales = ['', 'هزار', 'میلیون', 'میلیارد'];

    if (num === 0) return 'صفر';
    
    const convertGroup = (n: number): string => {
      let result = '';
      const h = Math.floor(n / 100);
      const t = Math.floor((n % 100) / 10);
      const o = n % 10;
      
      if (h > 0) {
        result += hundreds[h];
        if (t > 0 || o > 0) result += ' و ';
      }
      
      if (t === 1) {
        result += teens[o];
      } else {
        if (t > 0) {
          result += tens[t];
          if (o > 0) result += ' و ';
        }
        if (o > 0 && t !== 1) {
          result += ones[o];
        }
      }
      
      return result.trim();
    };

    let result = '';
    let scaleIndex = 0;
    
    while (num > 0) {
      const group = num % 1000;
      if (group > 0) {
        const groupText = convertGroup(group);
        if (scaleIndex > 0) {
          result = groupText + ' ' + scales[scaleIndex] + (result ? ' و ' + result : '');
        } else {
          result = groupText + (result ? ' و ' + result : '');
        }
      }
      num = Math.floor(num / 1000);
      scaleIndex++;
    }
    
    return result.trim();
  };

  const queryClientInstance = useQueryClient();

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      setDownloadingOrderId(orderId);
      
      // Fetch fresh order details
      const orderData = await queryClientInstance.ensureQueryData<Order & { items: (OrderItem & { productName: string; productDescription?: string; productImage?: string })[]; addressTitle?: string; fullAddress?: string; postalCode?: string; buyerFirstName?: string; buyerLastName?: string; buyerPhone?: string; sellerFirstName?: string; sellerLastName?: string }>({
        queryKey: ['/api/orders', orderId],
        staleTime: 0 // Force fresh fetch
      });
      
      if (orderData) {
        // Set invoice data to trigger DOM render
        setInvoiceData(orderData);
        
        // Wait for DOM to mount
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        // Download invoice
        await downloadInvoice(orderData);
        
        // Clean up
        setInvoiceData(null);
      } else {
        console.error('Failed to load order data for invoice generation');
      }
    } catch (error) {
      console.error('Error downloading invoice:', error);
    } finally {
      setDownloadingOrderId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-3 sm:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-8">

        {/* Orders List */}
        <div className="space-y-3 sm:space-y-6">
          {orders.length === 0 ? (
            <Card className="text-center py-12 sm:py-16">
              <CardContent>
                <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  هنوز سفارشی ثبت نکرده‌اید
                </h3>
                <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-6">
                  بعد از خرید محصولات، سفارشات شما اینجا نمایش داده خواهند شد
                </p>
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  data-testid="button-start-shopping"
                >
                  شروع خرید
                </Button>
              </CardContent>
            </Card>
          ) : (
            orders.map((order) => {
              const StatusIcon = statusIcons[order.status as keyof typeof statusIcons];
              const canPay = order.status === 'awaiting_payment';
              
              return (
                <Card key={order.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`card-order-${order.id}`}>
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 p-2 sm:p-3">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                        <div>
                          <CardTitle className="text-sm sm:text-base">
                            سفارش #{order.orderNumber || order.id.slice(0, 8)}
                          </CardTitle>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Badge 
                          className={`${statusColors[order.status as keyof typeof statusColors]} text-xs py-1 px-2`}
                          data-testid={`status-${order.id}`}
                        >
                          {statusLabels[order.status as keyof typeof statusLabels]}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                      {/* Order Info - Compact */}
                      <div className="flex-1 w-full">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                              {new Date(order.createdAt!).toLocaleDateString('fa-IR')}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Package2 className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                            <span className="text-sm sm:text-base font-bold text-green-600" data-testid={`amount-${order.id}`}>
                              {formatPrice(order.totalAmount)}
                            </span>
                          </div>
                        </div>
                        {(order.fullAddress || order.addressTitle) && (
                          <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-500">
                            <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                            <span data-testid={`address-${order.id}`} className="line-clamp-2">
                              {order.addressTitle ? `${order.addressTitle}: ${order.fullAddress || ''}` : order.fullAddress || 'آدرس تعیین نشده'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions - Compact */}
                      <div className="flex flex-col w-full sm:w-auto gap-2">
                        <div className="flex gap-2">
                          {canPay && (
                            <Button
                              size="sm"
                              onClick={() => handlePayment(order.id)}
                              className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none h-9"
                              data-testid={`button-pay-${order.id}`}
                            >
                              <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                              <span className="text-xs sm:text-sm">پرداخت</span>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadInvoice(order.id)}
                            disabled={downloadingOrderId === order.id}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 disabled:opacity-50 flex-1 sm:flex-none h-9"
                            data-testid={`button-download-${order.id}`}
                          >
                            <Download className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                            <span className="text-xs sm:text-sm hidden sm:inline">{downloadingOrderId === order.id ? 'در حال آماده‌سازی...' : 'دانلود فاکتور'}</span>
                            <span className="text-xs sm:hidden">فاکتور</span>
                          </Button>
                        </div>
                        <Dialog onOpenChange={(isOpen) => !isOpen && setSelectedOrderId(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrderId(order.id)}
                              data-testid={`button-details-${order.id}`}
                              className="w-full h-9"
                            >
                              <Eye className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                              <span className="text-xs sm:text-sm">جزئیات</span>
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                            </DialogHeader>
                            {isLoadingOrderData ? (
                              <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                  <p className="text-gray-600 dark:text-gray-400">در حال بارگیری...</p>
                                </div>
                              </div>
                            ) : selectedOrderData ? (
                              <div className="mt-6 space-y-6" dir="rtl">
                                {/* Invoice Header */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-3 rounded-lg">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">شماره سفارش</p>
                                      <p className="font-bold text-sm">{selectedOrderData.orderNumber || selectedOrderData.id.slice(0, 8)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">تاریخ سفارش</p>
                                      <p className="font-medium text-xs">{new Date(selectedOrderData.createdAt!).toLocaleDateString('fa-IR')}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">وضعیت</p>
                                      <Badge className={`${statusColors[selectedOrderData.status as keyof typeof statusColors]} text-xs py-0.5 px-1`}>
                                        {statusLabels[selectedOrderData.status as keyof typeof statusLabels]}
                                      </Badge>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-600 dark:text-gray-400">آدرس تحویل</p>
                                      <p className="font-medium text-xs line-clamp-1">
                                        {selectedOrderData.fullAddress ? (
                                          <>
                                            {selectedOrderData.addressTitle && (
                                              <span className="text-blue-600 font-semibold ml-1">{selectedOrderData.addressTitle}:</span>
                                            )}
                                            {selectedOrderData.fullAddress}
                                          </>
                                        ) : (
                                          'آدرس تعیین نشده'
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </div>
  
                                {/* Order Items */}
                                <div className="border rounded-lg p-6">
                                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Package className="w-5 h-5" />
                                    آیتم‌های سفارش
                                  </h3>
                                  <div className="space-y-3">
                                    {selectedOrderData.items && selectedOrderData.items.length > 0 ? (
                                      selectedOrderData.items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                          {item.productImage && (
                                            <img
                                              src={item.productImage}
                                              alt={item.productName}
                                              className="w-16 h-16 object-cover rounded-lg"
                                            />
                                          )}
                                          <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                              {item.productName}
                                            </h4>
                                            {item.productDescription && (
                                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {item.productDescription}
                                              </p>
                                            )}
                                            <div className="flex justify-between items-center mt-2">
                                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                                تعداد: {item.quantity} عدد
                                              </div>
                                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                                قیمت واحد: {formatPrice(item.unitPrice)}
                                              </div>
                                            </div>
                                          </div>
                                          <div className="text-left">
                                            <div className="font-bold text-green-600">
                                              {formatPrice(item.totalPrice)}
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                                        هیچ آیتمی یافت نشد
                                      </div>
                                    )}
                                    
                                    {/* Total */}
                                    <div className="flex justify-between py-4 bg-green-50 dark:bg-green-950/20 px-4 rounded-lg border-t-2 border-green-200 dark:border-green-800">
                                      <span className="font-bold text-lg">مجموع کل:</span>
                                      <span className="font-bold text-xl text-green-600">
                                        {formatPrice(selectedOrderData.totalAmount)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
  
                                {/* Notes */}
                                {selectedOrderData.notes && (
                                  <div className="border rounded-lg p-6">
                                    <h3 className="text-lg font-semibold mb-3">توضیحات سفارش</h3>
                                    <p className="text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
                                      {selectedOrderData.notes}
                                    </p>
                                  </div>
                                )}

                              </div>
                            ) : (
                              <div className="text-center py-12">
                                <p className="text-gray-600 dark:text-gray-400">خطا در بارگیری جزئیات سفارش</p>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {/* Order Notes */}
                    {order.notes && (
                      <>
                        <Separator className="my-6" />
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            توضیحات سفارش
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg" data-testid={`notes-${order.id}`}>
                            {order.notes}
                          </p>
                        </div>
                      </>
                    )}

                                      </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Invoice for Capture - Persian Style - Moved outside Dialog */}
        {invoiceData && (
          <div 
            ref={invoiceRef} 
            className="hidden"
            style={{
              direction: 'rtl',
              fontFamily: 'Vazirmatn, Arial, sans-serif',
              backgroundColor: '#ffffff',
              width: invoiceData.items && invoiceData.items.length > 8 ? '595px' : '842px',
              margin: '0 auto',
              color: '#000000',
              fontSize: invoiceData.items && invoiceData.items.length > 8 ? '13px' : '14px',
              lineHeight: '1.4',
              padding: '0'
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid #000'
            }}>
              <div style={{ width: '100px' }}></div>
              <h1 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', flex: 1 }}>
                فاکتور فروش
              </h1>
              <div style={{ textAlign: 'left', fontSize: '16px' }}>
                تاریخ: {new Date(invoiceData.createdAt!).toLocaleDateString('fa-IR')}
              </div>
            </div>
            
            {/* Seller Section Header */}
            <div style={{
              backgroundColor: '#d3d3d3',
              textAlign: 'right',
              padding: '10px',
              fontWeight: 'bold',
              fontSize: '16px',
              borderBottom: '1px solid #000'
            }}>
              مشخصات فروشنده
            </div>
            
            {/* Seller Details */}
            <div style={{
              padding: '15px',
              borderBottom: '1px solid #000',
              textAlign: 'right',
              fontSize: '14px'
            }}>
              نام شخص / سازمان : {invoiceData.sellerFirstName && invoiceData.sellerLastName 
                ? `${invoiceData.sellerFirstName} ${invoiceData.sellerLastName}` 
                : 'فروشنده'}
            </div>
            
            {/* Customer Section Header */}
            <div style={{
              backgroundColor: '#d3d3d3',
              textAlign: 'right',
              padding: '10px',
              fontWeight: 'bold',
              fontSize: '16px',
              borderBottom: '1px solid #000'
            }}>
              مشخصات خریدار
            </div>
            
            {/* Customer Details */}
            <div style={{
              padding: '15px',
              borderBottom: '1px solid #000',
              textAlign: 'right',
              fontSize: '14px',
              lineHeight: '1.8'
            }}>
              نام شخص / سازمان : {invoiceData.buyerFirstName && invoiceData.buyerLastName 
                ? `${invoiceData.buyerFirstName} ${invoiceData.buyerLastName}` 
                : 'مشتری گرامی'} - آدرس : {invoiceData.fullAddress || '-'} - کد پستی : {invoiceData.postalCode || '-'} - تلفن : {invoiceData.buyerPhone || '-'}
            </div>
            
            {/* Items Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', margin: '0' }}>
              <thead>
                <tr>
                  <th style={{ width: '8%', backgroundColor: '#d3d3d3', border: '1px solid #000', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', verticalAlign: 'middle' }}>
                    ردیف
                  </th>
                  <th style={{ width: '44%', backgroundColor: '#d3d3d3', border: '1px solid #000', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', verticalAlign: 'middle' }}>
                    شرح کالا یا خدمات
                  </th>
                  <th style={{ width: '12%', backgroundColor: '#d3d3d3', border: '1px solid #000', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', verticalAlign: 'middle' }}>
                    تعداد
                  </th>
                  <th style={{ width: '18%', backgroundColor: '#d3d3d3', border: '1px solid #000', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', verticalAlign: 'middle' }}>
                    قیمت واحد<br />(ریال)
                  </th>
                  <th style={{ width: '18%', backgroundColor: '#d3d3d3', border: '1px solid #000', padding: '10px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px', verticalAlign: 'middle' }}>
                    قیمت کل<br />(ریال)
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Actual Items - Dynamic based on actual count */}
                {invoiceData.items && invoiceData.items.length > 0 && invoiceData.items.map((item, index) => {
                  const isLargeOrder = invoiceData.items!.length > 8;
                  const fontSize = isLargeOrder ? '12px' : '14px';
                  const padding = isLargeOrder ? '6px' : '8px';
                  const itemTotal = parseFloat(item.totalPrice);
                  
                  return (
                    <tr key={item.id}>
                      <td style={{ textAlign: 'center', border: '1px solid #000', padding, fontSize, verticalAlign: 'middle' }}>
                        {index + 1}
                      </td>
                      <td style={{ textAlign: 'right', border: '1px solid #000', padding, fontSize, verticalAlign: 'middle' }}>
                        {item.productName}
                      </td>
                      <td style={{ textAlign: 'center', border: '1px solid #000', padding, fontSize, verticalAlign: 'middle' }}>
                        {item.quantity}
                      </td>
                      <td style={{ textAlign: 'center', border: '1px solid #000', padding, fontSize, verticalAlign: 'middle' }}>
                        {formatPriceRial(item.unitPrice)}
                      </td>
                      <td style={{ textAlign: 'center', border: '1px solid #000', padding, fontSize, verticalAlign: 'middle' }}>
                        {formatPriceRial(itemTotal)}
                      </td>
                    </tr>
                  );
                })}
                {/* Total Row */}
                {(() => {
                  const subtotal = invoiceData.items?.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0) || 0;
                  
                  return (
                    <tr style={{ backgroundColor: '#d3d3d3', fontWeight: 'bold' }}>
                      <td colSpan={4} style={{ textAlign: 'right', border: '1px solid #000', padding: '12px', verticalAlign: 'middle' }}>جمع کل</td>
                      <td style={{ textAlign: 'center', border: '1px solid #000', padding: '12px', verticalAlign: 'middle' }}>
                        {formatPriceRial(subtotal).replace(' ریال', '')}
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
            
            {/* Total in Words */}
            {(() => {
              const subtotal = invoiceData.items?.reduce((sum, item) => sum + parseFloat(item.totalPrice), 0) || 0;
              
              return (
                <div style={{
                  padding: '15px',
                  textAlign: 'right',
                  fontSize: '14px',
                  borderBottom: '1px solid #000'
                }}>
                  جمع کل به حروف: {numberToPersianWords(subtotal * 10)} ریال
                </div>
              );
            })()}
            
            {/* Thank You Message */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              minHeight: '60px'
            }}>
              <div style={{
                flex: 1,
                textAlign: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                color: '#333'
              }}>
                از خرید شما متشکریم
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Step 1 Dialog - انتخاب روش پرداخت */}
      <Dialog open={step1DialogOpen} onOpenChange={(open) => {
        if (!open) {
          handleClosePaymentDialog();
        } else {
          setStep1DialogOpen(true);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" showClose={false}>
          <DialogHeader>
            <DialogTitle className="text-right text-xl">
              انتخاب روش پرداخت
            </DialogTitle>
          </DialogHeader>
          
          {!selectedPaymentOrder ? (
            <div className="flex items-center justify-center p-8" dir="rtl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">در حال بارگذاری...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4" dir="rtl">
              {/* Order Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">اطلاعات سفارش</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">شماره سفارش: </span>
                    <span className="font-bold">#{selectedPaymentOrder.orderNumber || selectedPaymentOrder.id.slice(0, 8)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">مبلغ قابل پرداخت: </span>
                    <span className="font-bold text-green-600">{formatPrice(selectedPaymentOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method - Bank Card */}
              <div className="w-full">
                <Card className="border-2 border-green-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-green-600" />
                      <CardTitle className="text-base">پرداخت با کارت بانکی</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    {sellerInfo && sellerInfo.bankCardNumber ? (
                      <div className="space-y-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">شماره کارت:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold font-mono text-base">{sellerInfo.bankCardNumber}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(sellerInfo.bankCardNumber || "");
                                toast({
                                  title: "کپی شد",
                                  description: "شماره کارت در کلیپ‌بورد کپی شد",
                                });
                              }}
                              className="h-7 px-2 text-xs flex items-center gap-1"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              کپی
                            </Button>
                          </div>
                        </div>
                        {sellerInfo.bankCardHolderName && (
                          <div className="flex items-center justify-between border-t pt-2 dark:border-gray-800">
                            <span className="text-sm text-gray-600 dark:text-gray-400">نام صاحب کارت:</span>
                            <span className="font-semibold text-sm">{sellerInfo.bankCardHolderName}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs text-gray-500 dark:text-gray-400">
                        اطلاعات کارت از فروشنده دریافت شود
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleClosePaymentDialog}
                  className="min-w-[120px]"
                  size="default"
                >
                  بستن
                </Button>
                <Button
                  onClick={handleProceedToPayment}
                  disabled={!selectedPaymentMethod}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed min-w-[120px]"
                  size="default"
                >
                  <CreditCard className="w-4 h-4 ml-2" />
                  پرداخت
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
