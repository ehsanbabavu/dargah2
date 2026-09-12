import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  CreditCard,
  CheckCircle2,
  Copy,
  Check,
  Clock,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Phone,
  User,
  Lock,
  ShoppingBag,
  ExternalLink,
  ChevronLeft,
  Building,
  Info,
  CheckCircle,
  AlertTriangle,
  RotateCcw
} from "lucide-react";

interface PublicGatewayInfo {
  id: string;
  slug: string;
  username: string;
  sellerName: string;
  title: string;
  description?: string;
  defaultAmount?: string;
  minAmount?: string;
  maxAmount?: string;
  cardHolderName?: string;
  bankName?: string;
  supportPhone?: string;
  successMessage?: string;
  isActive: boolean;
}

interface InvoiceResponse {
  invoiceId: string;
  blupalInvoiceId?: string;
  paymentLink?: string;
  amount: string;
  finalAmount?: string;
  destCardNumber: string;
  destCardHolder: string;
  bankName: string;
  mode?: string;
  expiresAt: string;
  sellerTitle?: string;
}

interface TransactionStatus {
  id: string;
  invoiceId: string;
  status: "pending" | "verifying" | "paid" | "failed" | "expired";
  amount: string;
  payerName: string;
  payerPhone: string;
  trackingCode?: string;
  cardLastFour?: string;
  destCardNumber?: string;
  destCardHolder?: string;
  paidAt?: string;
}

// Convert numbers into Persian words (تومان)
function numberToPersianWords(num: number): string {
  if (!num || isNaN(num) || num <= 0) return "";
  const yekan = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
  const dahgan = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
  const dahTaNoozdah = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
  const sadgan = ["", "یکصد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
  const scales = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];

  const chunk3 = (n: number): string => {
    const s = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const y = n % 10;
    const parts: string[] = [];

    if (s > 0) parts.push(sadgan[s]);
    if (d === 1) {
      parts.push(dahTaNoozdah[y]);
    } else {
      if (d > 1) parts.push(dahgan[d]);
      if (y > 0) parts.push(yekan[y]);
    }
    return parts.join(" و ");
  };

  const chunks: string[] = [];
  let temp = Math.floor(num);
  let scaleIdx = 0;

  while (temp > 0) {
    const chunkVal = temp % 1000;
    if (chunkVal > 0) {
      const chunkStr = chunk3(chunkVal);
      const scaleStr = scales[scaleIdx] ? ` ${scales[scaleIdx]}` : "";
      chunks.unshift(`${chunkStr}${scaleStr}`);
    }
    temp = Math.floor(temp / 1000);
    scaleIdx++;
  }

  return chunks.length > 0 ? `${chunks.join(" و ")} تومان` : "";
}

// Detect Iranian Bank from Card Prefix
function getBankNameFromCard(cardNumber: string): string {
  if (!cardNumber) return "بانک مقصد";
  const clean = cardNumber.replace(/\D/g, "");
  const prefix = clean.substring(0, 6);

  const bankPrefixes: Record<string, string> = {
    "603799": "بانک ملی ایران",
    "610433": "بانک ملت",
    "621986": "بانک سامان",
    "627412": "بانک اقتصاد نوین",
    "589210": "بانک سپه",
    "502229": "بانک پاسارگاد",
    "639346": "بانک سینا",
    "627353": "بانک تجارت",
    "627381": "بانک انصار",
    "505416": "بانک گردشگری",
    "603770": "بانک کشاورزی",
    "628023": "بانک مسکن",
    "639607": "بانک سرمایه",
    "627760": "پست بانک ایران",
    "502908": "بانک توسعه تعاون",
    "627648": "بانک توسعه صادرات",
    "636214": "بانک آینده",
    "502938": "بانک دی",
    "504172": "بانک رسالت",
    "606373": "بانک قرض‌الحسنه مهر ایران",
    "589463": "بانک رفاه کارگران",
    "622106": "بانک پارسیان",
    "639599": "بانک قوامین",
    "636949": "بانک حکمت ایرانیان",
    "505785": "بانک ایران زمین",
  };

  return bankPrefixes[prefix] || "";
}

export default function BlupalPaymentPage() {
  const { slugOrUsername } = useParams<{ slugOrUsername: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // URL query params
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const urlInvoiceId = searchParams.get("invoice");
  const urlOrderId = searchParams.get("order_id");
  const wpReturnUrl = searchParams.get("wp_return");

  // Screen steps: 'form' | 'transfer' | 'verifying' | 'success' | 'expired'
  const [step, setStep] = useState<"form" | "transfer" | "verifying" | "success" | "expired">("form");

  // Form inputs
  const [amount, setAmount] = useState<string>("");
  const [payerName, setPayerName] = useState<string>("");
  const [payerPhone, setPayerPhone] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  // Invoice state
  const [invoice, setInvoice] = useState<InvoiceResponse | null>(null);
  const [trackingInput, setTrackingInput] = useState<string>("");
  const [cardLastFour, setCardLastFour] = useState<string>("");

  // Copy states
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Time remaining (15 minutes standard gateway timeout)
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);

  // Auto-fetch invoice if redirected with an existing invoice ID
  useEffect(() => {
    if (urlInvoiceId && !invoice) {
      fetch(`/api/blupal/public/invoice-status/${urlInvoiceId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.invoiceId) {
            setInvoice({
              invoiceId: data.invoiceId,
              amount: data.amount,
              finalAmount: data.finalAmount || data.amount,
              destCardNumber: data.destCardNumber || "",
              destCardHolder: data.destCardHolder || "",
              bankName: data.bankName || "",
              expiresAt: data.expiresAt || new Date().toISOString(),
            });
            if (data.payerName) setPayerName(data.payerName);
            if (data.payerPhone) setPayerPhone(data.payerPhone);
            if (data.amount) setAmount(data.amount);
            if (data.status === "paid") {
              setStep("success");
            } else if (data.status === "expired") {
              setStep("expired");
            } else if (data.status === "verifying") {
              setStep("verifying");
            } else {
              setStep("transfer");
            }
          }
        })
        .catch(console.error);
    }
  }, [urlInvoiceId]);

  // Fetch Public Gateway Details
  const { data: gateway, isLoading: loadingGateway, error: gatewayError } = useQuery<PublicGatewayInfo>({
    queryKey: [`/api/blupal/public/gateway/${slugOrUsername}`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/blupal/public/gateway/${slugOrUsername}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "درگاه پرداخت یافت نشد");
      }
      return res.json();
    },
    enabled: !!slugOrUsername,
    retry: 1,
  });

  // Set default amount if available
  useEffect(() => {
    if (gateway?.defaultAmount && !amount) {
      setAmount(gateway.defaultAmount);
    }
  }, [gateway]);

  // Create Invoice Mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/blupal/public/create-invoice", {
        slugOrUsername,
        payerName: payerName.trim(),
        payerPhone: payerPhone.trim(),
        amount: amount.replace(/,/g, ""),
        description: description.trim(),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "خطا در ایجاد فاکتور پرداخت");
      }
      return res.json();
    },
    onSuccess: (data: InvoiceResponse) => {
      setInvoice(data);
      setStep("transfer");
      setTimeLeft(15 * 60);
    },
    onError: (err: any) => {
      toast({
        title: "خطا در ثبت فاکتور",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Countdown timer for transfer step
  useEffect(() => {
    if (step !== "transfer" || !invoice) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setStep("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, invoice]);

  // Auto poll invoice status every 3 seconds
  const { data: invoiceStatus, refetch: refetchInvoiceStatus, isFetching: isCheckingStatus } = useQuery<TransactionStatus>({
    queryKey: [`/api/blupal/public/invoice-status/${invoice?.invoiceId}`],
    queryFn: async () => {
      if (!invoice?.invoiceId) return null as any;
      const res = await apiRequest("GET", `/api/blupal/public/invoice-status/${invoice.invoiceId}`);
      if (!res.ok) return null as any;
      return res.json();
    },
    enabled: (step === "transfer" || step === "verifying") && !!invoice?.invoiceId,
    refetchInterval: 3000,
  });

  // Status updates
  useEffect(() => {
    if (invoiceStatus?.status === "paid") {
      setStep("success");
    } else if (invoiceStatus?.status === "expired") {
      setStep("expired");
    }
  }, [invoiceStatus]);

  // Confirm Transfer Mutation
  const confirmTransferMutation = useMutation({
    mutationFn: async () => {
      if (!invoice) return;
      const res = await apiRequest("POST", "/api/blupal/public/confirm-transfer", {
        invoiceId: invoice.invoiceId,
        trackingCode: trackingInput.trim() || undefined,
        cardLastFour: cardLastFour.trim() || undefined,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "خطا در ثبت اطلاعات واریز");
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data?.verified || data?.status === "paid") {
        setStep("success");
        toast({
          title: "واریزی تایید شد",
          description: "واریزی شما از طریق شبکه شتاب با موفقیت تایید شد.",
        });
      } else {
        setStep("verifying");
        toast({
          title: "اطلاعات فیش ثبت شد",
          description: "درگاه در حال دریافت تاییدیه قطعی بانکی است...",
        });
      }
    },
    onError: (err: any) => {
      toast({
        title: "خطا",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const formatTomans = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val.replace(/,/g, "")) : val;
    if (isNaN(num)) return "۰";
    return num.toLocaleString("fa-IR");
  };

  const getRials = (val: string | number) => {
    const num = typeof val === "string" ? parseFloat(val.replace(/,/g, "")) : val;
    if (isNaN(num)) return 0;
    return Math.round(num * 10);
  };

  const formatRials = (val: string | number) => {
    const rials = getRials(val);
    return rials.toLocaleString("fa-IR");
  };

  const formatCardNumber = (cardNum: string) => {
    if (!cardNum) return "";
    const cleaned = cardNum.replace(/\s+/g, "");
    const parts = [];
    for (let i = 0; i < cleaned.length; i += 4) {
      parts.push(cleaned.substring(i, i + 4));
    }
    return parts.join(" - ");
  };

  const copyToClipboard = (text: string, type: "card" | "amount" | "tracking") => {
    navigator.clipboard.writeText(text);
    if (type === "card") {
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 2000);
    } else if (type === "amount") {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    } else {
      setCopiedTracking(true);
      setTimeout(() => setCopiedTracking(false), 2000);
    }
    toast({ title: "کپی شد", description: "در حافظه موقت کپی شد." });
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isTimerLow = timeLeft < 180; // less than 3 mins

  const rawAmountNumber = parseFloat((invoice?.finalAmount || invoice?.amount || amount || "0").replace(/,/g, ""));
  const persianWordsAmount = numberToPersianWords(rawAmountNumber);
  const detectedBank = invoice ? (invoice.bankName || getBankNameFromCard(invoice.destCardNumber) || "بانک مقصد") : "";

  // ---------------- Loading State ----------------
  if (loadingGateway) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] dark:bg-[#0b0f19] flex items-center justify-center p-4 font-sans text-slate-800 dark:text-slate-100" dir="rtl">
        <div className="bg-white dark:bg-[#131b2e] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-md space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">درگاه پرداخت اینترنتی</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">در حال برقراری ارتباط با سامانه پرداخت شاپرک...</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- Error State ----------------
  if (gatewayError || !gateway) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] dark:bg-[#0b0f19] flex items-center justify-center p-4 font-sans text-slate-800 dark:text-slate-100" dir="rtl">
        <div className="bg-white dark:bg-[#131b2e] border border-red-200 dark:border-red-900/40 rounded-2xl p-6 max-w-md w-full text-center shadow-md space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">درگاه پرداخت یافت نشد</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              شناسه درگاه نامعتبر است یا این درگاه توسط پذیرنده غیرفعال گردیده است.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLocation("/")}
            className="w-full text-xs h-10 rounded-xl"
          >
            بازگشت به صفحه اصلی
          </Button>
        </div>
      </div>
    );
  }

  // ---------------- Inactive State ----------------
  if (!gateway.isActive) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] dark:bg-[#0b0f19] flex items-center justify-center p-4 font-sans text-slate-800 dark:text-slate-100" dir="rtl">
        <div className="bg-white dark:bg-[#131b2e] border border-amber-200 dark:border-amber-900/40 rounded-2xl p-6 max-w-md w-full text-center shadow-md space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">درگاه موقتاً غیرفعال است</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              پذیرنده ({gateway.sellerName}) در حال به‌روزرسانی تنظیمات درگاه است. لطفاً دقایقی دیگر مجدداً تلاش فرمایید.
            </p>
          </div>
          {gateway.supportPhone && (
            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex items-center justify-center gap-2">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>شماره پشتیبانی پذیرنده:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100" dir="ltr">{gateway.supportPhone}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eceff3] dark:bg-[#0a0e17] flex flex-col justify-between py-3 px-3 sm:py-5 sm:px-6 lg:px-8 xl:px-12 font-sans text-slate-800 dark:text-slate-100 antialiased" dir="rtl">
      <div className="w-full space-y-3.5 sm:space-y-4">

        {/* ---------------- OFFICIAL TOP BAR ---------------- */}
        <header className="w-full bg-white dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs flex items-center justify-between gap-3">
          {/* Right: Gateway branding */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#1e3a8a] text-white flex items-center justify-center shadow-xs shrink-0">
              <CreditCard className="w-4 h-4 text-blue-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-none">
                  درگاه پرداخت الکترونیک
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-none">
                سامانه هوشمند واریز امن شتاب ({gateway.title})
              </p>
            </div>
          </div>
        </header>

        {/* WooCommerce Order Banner if present */}
        {urlOrderId && (
          <div className="w-full bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 rounded-xl p-2.5 px-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="font-medium text-slate-800 dark:text-slate-200">
                سفارش فروشگاه اینترنتی: <strong className="font-mono text-blue-700 dark:text-blue-300">#{urlOrderId}</strong>
              </span>
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-100/60 dark:bg-emerald-950/60 px-2 py-0.5 rounded font-medium border border-emerald-300/40">
              تایید مستقیم ووکامرس
            </span>
          </div>
        )}

        {/* ---------------- MAIN CONTAINER: 2-PANEL IPG DESIGN (FULL WIDTH & RESPONSIVE) ---------------- */}
        <div className="w-full bg-white dark:bg-[#111726] border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl shadow-xs overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-200/80 dark:divide-slate-800">
            
            {/* RIGHT SIDE: MERCHANT & TRANSACTION SUMMARY (Classic IPG Right Column) */}
            <div className="lg:col-span-4 xl:col-span-4 bg-slate-50/70 dark:bg-[#0e1320] p-4 sm:p-5 lg:p-6 flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                
                {/* Merchant Header */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 mb-0.5">اطلاعات پذیرنده</div>
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {gateway.sellerName}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      @{gateway.slug}
                    </span>
                  </div>
                  {gateway.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed bg-white/70 dark:bg-slate-800/40 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                      {gateway.description}
                    </p>
                  )}
                </div>

                {/* Key Transaction Data List */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-slate-500 dark:text-slate-400 text-[11px]">عنوان درگاه:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-[11px]">{gateway.title}</span>
                  </div>

                  {invoice?.invoiceId && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">شناسه فاکتور:</span>
                      <span className="font-mono font-bold text-blue-700 dark:text-blue-400 text-[11px]">{invoice.invoiceId}</span>
                    </div>
                  )}

                  {urlOrderId && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">شماره سفارش:</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300 text-[11px]">#{urlOrderId}</span>
                    </div>
                  )}

                  {payerName && step !== "form" && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">پرداخت‌کننده:</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium text-[11px]">{payerName}</span>
                    </div>
                  )}
                </div>

                {/* Amount Display Box */}
                <div className="bg-white dark:bg-[#131b2e] border border-blue-200 dark:border-blue-900/50 rounded-xl p-3 space-y-1.5 shadow-xs">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">مبلغ قابل پرداخت:</div>
                  <div className="flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg sm:text-xl font-bold font-mono text-[#1e3a8a] dark:text-blue-400">
                        {formatTomans(invoice?.finalAmount || invoice?.amount || amount || 0)}
                      </span>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">تومان</span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {formatRials(invoice?.finalAmount || invoice?.amount || amount || 0)} ریال
                    </div>
                  </div>
                  {persianWordsAmount && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800 leading-tight">
                      معادل: <span className="font-medium text-slate-700 dark:text-slate-300">{persianWordsAmount}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Merchant Support Info Footer */}
              <div className="pt-2 text-[10px] text-slate-400 dark:text-slate-500 space-y-1 border-t border-slate-200/60 dark:border-slate-800/60">
                {gateway.supportPhone && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>پشتیبانی پذیرنده:</span>
                    <span className="font-mono font-bold" dir="ltr">{gateway.supportPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Info className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>تراکنش تحت پروتکل امن شبکه شاپرک ثبت می‌شود.</span>
                </div>
              </div>
            </div>

            {/* LEFT SIDE: PAYMENT FLOW STEPS (Dynamic Forms & Actions) */}
            <div className="lg:col-span-8 xl:col-span-8 p-4 sm:p-6 lg:p-7 flex flex-col justify-between">

              {/* ---------------- STEP 1: PAYMENT FORM ---------------- */}
              {step === "form" && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800/80 pb-2">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      اطلاعات پرداخت و صدور فاکتور
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      جهت دریافت شماره کارت مقصد و ثبت تراکنش، فیلدهای زیر را تکمیل فرمایید:
                    </p>
                  </div>

                  <div className="space-y-3.5">
                    {/* Amount Input */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="amount" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          مبلغ پرداختی (تومان) <span className="text-red-500">*</span>
                        </Label>
                        {gateway.minAmount && (
                          <span className="text-[10px] text-slate-400">
                            حداقل: {formatTomans(gateway.minAmount)} تومان
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <Input
                          id="amount"
                          type="number"
                          placeholder="مثال: ۵۰,۰۰۰"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="h-10 text-sm font-bold font-mono text-center rounded-lg border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-400 pr-3 pl-12 focus-visible:ring-1 focus-visible:ring-blue-600"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                          تومان
                        </span>
                      </div>

                      {/* Preset Pills */}
                      <div className="grid grid-cols-4 gap-1.5 pt-1">
                        {["20000", "50000", "100000", "200000"].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setAmount(preset)}
                            className="text-[10px] font-mono py-1 px-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-700 dark:hover:text-blue-300 transition-colors border border-slate-200/60 dark:border-slate-700/60 cursor-pointer text-center"
                          >
                            {formatTomans(preset)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Name & Phone in 2 clean columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="payerName" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          نام و نام‌خانوادگی <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="payerName"
                            placeholder="مثال: رضا محمدی"
                            value={payerName}
                            onChange={(e) => setPayerName(e.target.value)}
                            className="h-10 text-xs rounded-lg pl-8 border-slate-200 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-blue-600"
                          />
                          <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="payerPhone" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          شماره موبایل جهت پیگیری <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Input
                            id="payerPhone"
                            type="tel"
                            placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                            value={payerPhone}
                            onChange={(e) => setPayerPhone(e.target.value)}
                            className="h-10 text-xs rounded-lg pl-8 text-left font-mono border-slate-200 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-blue-600"
                            dir="ltr"
                          />
                          <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>
                    </div>

                    {/* Description Input */}
                    <div className="space-y-1">
                      <Label htmlFor="description" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        بابت / توضیحات تراکنش (اختیاری)
                      </Label>
                      <Input
                        id="description"
                        placeholder="مثال: خرید کالا، شماره فاکتور، هزینه اشتراک..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="h-10 text-xs rounded-lg border-slate-200 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-blue-600"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="button"
                      onClick={() => createInvoiceMutation.mutate()}
                      disabled={createInvoiceMutation.isPending || !amount || !payerName.trim() || !payerPhone.trim()}
                      className="w-full h-11 rounded-lg bg-[#1e3a8a] hover:bg-[#1e40af] active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      {createInvoiceMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          در حال صدور فاکتور پرداخت...
                        </>
                      ) : (
                        <>
                          <span>دریافت اطلاعات کارت و ادامه پرداخت</span>
                          <ChevronLeft className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* ---------------- STEP 2: TRANSFER & CARD DETAILS ---------------- */}
              {step === "transfer" && invoice && (
                <div className="space-y-4">
                  {/* Step Header */}
                  <div className="border-b border-slate-100 dark:border-slate-800/80 pb-2 flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        دستور انتقال کارت‌به‌کارت (شتاب)
                      </h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        مبلغ را از اپلیکیشن همراه بانک به کارت مقصد واریز فرمایید:
                      </p>
                    </div>
                    <span className="text-[10px] font-mono bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 px-2 py-0.5 rounded">
                      فاکتور: {invoice.invoiceId}
                    </span>
                  </div>

                  {/* AUTHENTIC IRANIAN BANK CARD COMPONENT */}
                  <div className="bg-gradient-to-tr from-[#0f172a] via-[#1e293b] to-[#1e3a8a] text-white rounded-xl p-4 shadow-sm border border-slate-700/60 relative overflow-hidden space-y-3">
                    {/* Bank & Network */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                        <Building className="w-3.5 h-3.5 text-blue-300" />
                        <span>{detectedBank}</span>
                      </div>
                      <span className="text-[9px] bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-medium">
                        عضو شتاب
                      </span>
                    </div>

                    {/* 16-Digit Card Number */}
                    <div className="space-y-1 text-center py-1">
                      <div className="text-[10px] text-slate-300 font-medium">شماره کارت مقصد جهت واریز:</div>
                      <div className="font-mono text-base sm:text-lg font-black tracking-widest text-white select-all" dir="ltr">
                        {formatCardNumber(invoice.destCardNumber)}
                      </div>
                    </div>

                    {/* Cardholder Name & Copy Button */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-700/80 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">نام صاحب حساب:</span>
                        <span className="font-bold text-slate-100 text-xs">{invoice.destCardHolder}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => copyToClipboard(invoice.destCardNumber, "card")}
                        className="h-7 text-[11px] bg-blue-600 hover:bg-blue-700 text-white rounded-md px-2.5 gap-1 cursor-pointer"
                      >
                        {copiedCard ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedCard ? "کپی شد" : "کپی کارت"}</span>
                      </Button>
                    </div>
                  </div>

                  {/* EXACT AMOUNT BOX WITH 3-DIGIT UNIQUE CODE NOTICE */}
                  <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-amber-800 dark:text-amber-300 font-medium block">
                        مبلغ دقیق قابل انتقال (همراه با شناسه ۳ رقمی):
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm sm:text-base font-bold font-mono text-amber-900 dark:text-amber-200">
                          {formatRials(invoice.finalAmount || invoice.amount)}
                        </span>
                        <span className="text-xs font-bold text-amber-800 dark:text-amber-300">ریال</span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 mr-2">
                          ({formatTomans(invoice.finalAmount || invoice.amount)} تومان)
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(String(getRials(invoice.finalAmount || invoice.amount)), "amount")}
                      className="h-7 text-[10px] rounded-md px-2 gap-1 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 hover:bg-amber-100/50 cursor-pointer shrink-0"
                    >
                      {copiedAmount ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedAmount ? "کپی شد" : "کپی مبلغ"}</span>
                    </Button>
                  </div>

                  {/* Payer Confirmation Form Fields */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800 rounded-xl p-3 sm:p-3.5 space-y-3">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      اطلاعات فیش واریزی جهت تایید نهایی:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="trackingInput" className="text-[11px] text-slate-600 dark:text-slate-400">
                          شماره پیگیری / شماره مرجع (RRN)
                        </Label>
                        <Input
                          id="trackingInput"
                          placeholder="مثال: ۱۲۳۴۵۶"
                          value={trackingInput}
                          onChange={(e) => setTrackingInput(e.target.value)}
                          className="h-9 text-xs rounded-lg font-mono text-center border-slate-200 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-blue-600"
                          dir="ltr"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="cardLastFour" className="text-[11px] text-slate-600 dark:text-slate-400">
                          ۴ رقم آخر کارت شما (اختیاری)
                        </Label>
                        <Input
                          id="cardLastFour"
                          maxLength={4}
                          placeholder="مثال: ۴۳۲۱"
                          value={cardLastFour}
                          onChange={(e) => setCardLastFour(e.target.value.replace(/\D/g, ""))}
                          className="h-9 text-xs rounded-lg font-mono text-center tracking-widest border-slate-200 dark:border-slate-700 focus-visible:ring-1 focus-visible:ring-blue-600"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* Submit Confirmation Button */}
                    <Button
                      type="button"
                      onClick={() => confirmTransferMutation.mutate()}
                      disabled={confirmTransferMutation.isPending}
                      className="w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all mt-1"
                    >
                      {confirmTransferMutation.isPending ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          در حال ثبت و استعلام بانکی...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>من واریز کردم (ثبت و دریافت رسید پرداخت)</span>
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
                    سیستم به صورت خودکار نیز در حال بررسی وضعیت تراکنش شما با وب‌هوک شتاب است.
                  </p>
                </div>
              )}

              {/* ---------------- STEP 3: VERIFYING IN PROGRESS ---------------- */}
              {step === "verifying" && invoice && (
                <div className="space-y-4 text-center py-2">
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto ring-4 ring-blue-500/10">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>

                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2.5 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                      در حال تطبیق با حساب بانکی
                    </span>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      اطلاعات پرداخت شما با موفقیت ثبت شد
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                      سیستم به صورت خودکار در حال دریافت تاییدیه نهایی وب‌هوک و اتصال به شبکه شتاب می‌باشد.
                    </p>
                  </div>

                  {/* Verification Status Ledger */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200/70 dark:border-slate-800 text-xs text-right space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-[11px] text-slate-700 dark:text-slate-300">صدور فاکتور شاپرکی</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{invoice.invoiceId}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-[11px] text-slate-700 dark:text-slate-300">ثبت مشخصات فیش واریز</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {trackingInput ? `کد: ${trackingInput}` : "ثبت شد"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
                        <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400">استعلام وب‌هوک و تسویه شتاب</span>
                      </div>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400">استعلام هر ۳ ثانیه</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-1.5 pt-1">
                    <Button
                      type="button"
                      onClick={() => refetchInvoiceStatus()}
                      disabled={isCheckingStatus}
                      className="w-full h-9 rounded-lg bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-bold gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isCheckingStatus ? "animate-spin" : ""}`} />
                      <span>{isCheckingStatus ? "در حال بررسی..." : "استعلام مجدد وضعیت از سرور"}</span>
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setStep("transfer")}
                      className="w-full h-8 text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                    >
                      ویرایش اطلاعات فیش و شماره پیگیری
                    </Button>
                  </div>
                </div>
              )}

              {/* ---------------- STEP 4: SUCCESS DIGITAL RECEIPT ---------------- */}
              {step === "success" && (
                <div className="space-y-4">
                  {/* Success Header */}
                  <div className="text-center space-y-1 py-1">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-4 ring-emerald-500/10">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                      پرداخت با موفقیت انجام شد
                    </h2>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                      تراکنش شما توسط شبکه شاپرک و درگاه بانکی تایید گردید.
                    </p>
                  </div>

                  {gateway.successMessage && (
                    <div className="p-2.5 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50 text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed text-center">
                      {gateway.successMessage}
                    </div>
                  )}

                  {/* OFFICIAL DIGITAL RECEIPT TABLE */}
                  <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200/60 dark:border-slate-800 pb-1.5 flex justify-between items-center">
                      <span>رسید دیجیتال تراکنش شتابی</span>
                      <span className="text-[10px] font-normal text-slate-400">وضعیت: پرداخت موفق</span>
                    </div>

                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">شناسه فاکتور:</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[11px]">{invoice?.invoiceId}</span>
                    </div>

                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">کد پیگیری / شماره مرجع (RRN):</span>
                      <span className="font-mono font-bold text-blue-700 dark:text-blue-400 text-[11px]">
                        {trackingInput || invoiceStatus?.trackingCode || "TRX-VERIFIED"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">مبلغ پرداخت شده:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                        {formatTomans(invoice?.finalAmount || invoice?.amount || amount)} تومان ({formatRials(invoice?.finalAmount || invoice?.amount || amount)} ریال)
                      </span>
                    </div>

                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">نام پرداخت‌کننده:</span>
                      <span className="text-slate-800 dark:text-slate-200 text-[11px]">{payerName || "کاربر مهمان"}</span>
                    </div>

                    <div className="flex justify-between items-center py-0.5">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">پذیرنده:</span>
                      <span className="text-slate-800 dark:text-slate-200 text-[11px]">{gateway.sellerName}</span>
                    </div>
                  </div>

                  {/* Return Button or New Invoice */}
                  {wpReturnUrl ? (
                    <div className="space-y-1.5 pt-1">
                      <a
                        href={`${wpReturnUrl}&order_id=${urlOrderId || ""}&invoice_id=${invoice?.invoiceId || ""}&status=paid&tracking_code=${encodeURIComponent(trackingInput || invoiceStatus?.trackingCode || "TRX-VERIFIED")}`}
                        className="w-full h-10 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all no-underline"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تکمیل سفارش و بازگشت به فروشگاه</span>
                      </a>
                      <p className="text-[10px] text-center text-slate-400">
                        سفارش شما در سایت ووکامرس به‌صورت خودکار به‌روزرسانی شد.
                      </p>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setStep("form");
                        setAmount("");
                        setInvoice(null);
                        setTrackingInput("");
                        setCardLastFour("");
                      }}
                      className="w-full rounded-lg h-10 text-xs font-semibold cursor-pointer"
                    >
                      ثبت پرداخت جدید یا صدور فاکتور دیگر
                    </Button>
                  )}
                </div>
              )}

              {/* ---------------- STEP 5: EXPIRED SESSION ---------------- */}
              {step === "expired" && (
                <div className="space-y-4 text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                      مهلت زمان پرداخت منقضی شد
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                      مهلت ۱۵ دقیقه‌ای صدور و واریز این فاکتور به پایان رسیده است. جهت انجام تراکنش، لطفاً فاکتور جدید صادر فرمایید.
                    </p>
                  </div>

                  <Button
                    type="button"
                    onClick={() => {
                      setStep("form");
                      setInvoice(null);
                    }}
                    className="w-full rounded-lg h-10 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs sm:text-sm font-bold cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 ml-1" />
                    صدور مجدد فاکتور پرداخت
                  </Button>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
