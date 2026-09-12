import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import loginVideo from "@assets/YouCut_20250930_005437820_1759181322984.mp4";
import { 
  Smartphone, KeyRound, Lock, ArrowLeft, CheckCircle2, 
  RotateCcw, Loader2, Sparkles, ShieldCheck,
  PhoneCall, Phone, Home, Check, AlertCircle, Eye, EyeOff, UserPlus, LogIn,
  MessageCircle, Send
} from "lucide-react";

type ResetStep = "phone" | "otp" | "password" | "success";

export interface LoginPageConfig {
  gradientType?: "preset" | "custom";
  gradientPreset?: string;
  fromColor?: string;
  viaColor?: string;
  toColor?: string;
  gradientDirection?: string;
  customCssGradient?: string;
  imageType?: "default" | "custom_image" | "url";
  imageUrl?: string;
  imageFit?: "contain" | "cover";
  imageOverlayOpacity?: number;
  welcomeTitle?: string;
  welcomeSubtitle?: string;
}

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Multi-step state
  const [step, setStep] = useState<ResetStep>("phone");
  const [mobile, setMobile] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Loading states
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSendingCallOtp, setIsSendingCallOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isCallOtpActive, setIsCallOtpActive] = useState(false);

  // OTP Countdown timer
  const [countdown, setCountdown] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [testCodeNotice, setTestCodeNotice] = useState<string | null>(null);
  const [notFoundNotice, setNotFoundNotice] = useState<string | null>(null);

  // Telegram OTP states
  const [isSendingTelegramOtp, setIsSendingTelegramOtp] = useState(false);
  const [botUsername, setBotUsername] = useState("");
  const [telegramError, setTelegramError] = useState<string | null>(null);

  // Fetch Page Customization Config
  const { data: pageConfig } = useQuery<LoginPageConfig>({
    queryKey: ["/api/public/login-page/config"],
    queryFn: async () => {
      const res = await fetch("/api/public/login-page/config");
      if (!res.ok) throw new Error("Failed to fetch login page config");
      return res.json();
    },
    staleTime: 60000,
  });

  const getGradientStyle = () => {
    if (!pageConfig) {
      return {
        background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 50%, #4338ca 100%)",
      };
    }

    if (pageConfig.customCssGradient) {
      return { background: pageConfig.customCssGradient };
    }

    const directionMap: Record<string, string> = {
      "to-br": "135deg",
      "to-r": "90deg",
      "to-b": "180deg",
      "to-bl": "225deg",
      "to-tr": "45deg",
      "to-t": "0deg",
      "to-l": "270deg",
    };

    const angle = directionMap[pageConfig.gradientDirection || "to-br"] || "135deg";
    const from = pageConfig.fromColor || "#2563eb";
    const to = pageConfig.toColor || "#4338ca";
    const via = pageConfig.viaColor;

    if (via && via !== "transparent") {
      return {
        background: `linear-gradient(${angle}, ${from} 0%, ${via} 50%, ${to} 100%)`,
      };
    }

    return {
      background: `linear-gradient(${angle}, ${from} 0%, ${to} 100%)`,
    };
  };

  // Timer effect for OTP countdown
  useEffect(() => {
    let timer: any = null;
    if (step === "otp" && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  const normalizePhone = (raw: string) => {
    return raw
      .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
      .replace(/[\s\-\+]/g, "")
      .trim();
  };

  // Step 1: Send OTP to mobile
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanMobile = normalizePhone(mobile);

    if (!cleanMobile) {
      toast({
        title: "خطا",
        description: "لطفاً شماره موبایل خود را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    if (!/^09\d{9}$/.test(cleanMobile)) {
      toast({
        title: "شماره موبایل نامعتبر",
        description: "شماره موبایل باید با ۰۹ شروع شده و ۱۱ رقم باشد (مانند ۰۹۱۲۳۴۵۶۷۸۹)",
        variant: "destructive",
      });
      return;
    }

    setIsSendingOtp(true);
    setTestCodeNotice(null);
    setNotFoundNotice(null);

    try {
      const response = await fetch("/api/auth/password-reset/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: cleanMobile }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "USER_NOT_FOUND" || response.status === 404) {
          setNotFoundNotice(cleanMobile);
          toast({
            title: "حساب کاربری یافت نشد",
            description: data.message || "کاربری با این شماره موبایل در سیستم وجود ندارد.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.message || "خطا در ارسال کد تایید");
      }

      toast({
        title: "کد تایید ارسال شد",
        description: data.message || "کد تایید بازیابی به شماره شما پیامک شد",
      });

      if (data.isTestMode && data.testCode) {
        setTestCodeNotice(data.testCode);
      }

      setCountdown(data.expiresInSeconds || 120);
      setCanResend(false);
      setIsCallOtpActive(false);
      setStep("otp");
    } catch (error: any) {
      toast({
        title: "خطا در ارسال کد",
        description: error.message || "خطایی در برقراری ارتباط با سرور رخ داد",
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 1.5: Send Call OTP (Voice Call backup)
  const handleSendCallOtp = async () => {
    const cleanMobile = normalizePhone(mobile);
    if (!cleanMobile) return;

    setIsSendingCallOtp(true);
    setTestCodeNotice(null);

    try {
      const response = await fetch("/api/auth/password-reset/send-call-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: cleanMobile }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "USER_NOT_FOUND" || response.status === 404) {
          setNotFoundNotice(cleanMobile);
          setStep("phone");
          toast({
            title: "حساب کاربری یافت نشد",
            description: "کاربری با این شماره موبایل ثبت نشده است.",
            variant: "destructive",
          });
          return;
        }
        throw new Error(data.message || "خطا در درخواست تماس صوتی");
      }

      toast({
        title: "درخواست تماس صوتی ارسال شد",
        description: data.message || "به زودی با شماره شما تماس گرفته شده و کد تایید خوانده می‌شود.",
      });

      if (data.isTestMode && data.testCode) {
        setTestCodeNotice(data.testCode);
      }

      setIsCallOtpActive(true);
      setCountdown(data.expiresInSeconds || 120);
      setCanResend(false);
    } catch (error: any) {
      toast({
        title: "خطا در تماس صوتی",
        description: error.message || "خطایی در برقراری تماس صوتی رخ داد",
        variant: "destructive",
      });
    } finally {
      setIsSendingCallOtp(false);
    }
  };

  // Step 1.8: Send OTP via Telegram
  const handleSendTelegramOtp = async () => {
    const cleanMobile = normalizePhone(mobile);
    if (!cleanMobile) return;

    setIsSendingTelegramOtp(true);
    setTelegramError(null);
    setTestCodeNotice(null);

    try {
      const response = await fetch("/api/auth/password-reset/send-telegram-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: cleanMobile }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "TELEGRAM_USER_NOT_FOUND") {
          setBotUsername(data.botUsername || "");
          setTelegramError(data.message || "شماره شما در میان مخاطبان ربات تلگرام یافت نشد.");
        }
        throw new Error(data.message || "خطا در درخواست ارسال کد به تلگرام");
      }

      toast({
        title: "کد بازیابی به تلگرام ارسال شد",
        description: data.message || "کد بازیابی با موفقیت از طریق ربات تلگرام برای شما ارسال گردید.",
      });

      if (data.isTestMode && data.testCode) {
        setTestCodeNotice(data.testCode);
      }

      setCountdown(data.expiresInSeconds || 120);
      setCanResend(false);
      setIsCallOtpActive(false);
      setStep("otp");
    } catch (error: any) {
      toast({
        title: "خطا در ارسال تلگرام",
        description: error.message || "خطایی در ارسال کد به تلگرام رخ داد",
        variant: "destructive",
      });
    } finally {
      setIsSendingTelegramOtp(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = normalizePhone(mobile);
    const cleanCode = normalizePhone(otpCode);

    if (!cleanCode) {
      toast({
        title: "خطا",
        description: "لطفاً کد تایید را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const response = await fetch("/api/auth/password-reset/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: cleanMobile, code: cleanCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "کد تایید نادرست است");
      }

      toast({
        title: "کد تایید شد",
        description: "اکنون می‌توانید رمز عبور جدید خود را وارد کنید.",
      });

      setStep("password");
    } catch (error: any) {
      toast({
        title: "کد نامعتبر",
        description: error.message || "کد تایید وارد شده صحیح نیست",
        variant: "destructive",
      });
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step 3: Complete Password Reset
  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMobile = normalizePhone(mobile);
    const cleanCode = normalizePhone(otpCode);

    if (!newPassword || newPassword.trim().length < 6) {
      toast({
        title: "رمز عبور کوتاه است",
        description: "رمز عبور باید حداقل ۶ کاراکتر باشد",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "عدم تطابق رمز عبور",
        description: "رمز عبور جدید و تکرار آن یکسان نیستند",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);

    try {
      const response = await fetch("/api/auth/password-reset/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: cleanMobile,
          code: cleanCode,
          newPassword: newPassword.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "خطا در تغییر رمز عبور");
      }

      toast({
        title: "رمز عبور تغییر یافت",
        description: "رمز عبور شما با موفقیت بروزرسانی شد.",
      });

      setStep("success");
    } catch (error: any) {
      toast({
        title: "خطا در بازیابی رمز",
        description: error.message || "خطایی در تغییر رمز عبور رخ داد",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const showCustomImage =
    (pageConfig?.imageType === "custom_image" || pageConfig?.imageType === "url") &&
    Boolean(pageConfig?.imageUrl);

  return (
    <div className="min-h-screen flex selection:bg-blue-100 selection:text-blue-900" data-testid="page-reset-password" dir="rtl">
      {/* Right Form Container with Dynamic Theme Gradient */}
      <div 
        className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-10 relative overflow-hidden transition-all duration-500"
        style={getGradientStyle()}
      >
        {/* Soft Background Accents */}
        <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px] pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-white/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-28 -left-28 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-md relative z-10">
          {/* Main Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/40 ring-1 ring-black/5">
            
            {/* Brand / Header */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 mb-3">
                {step === "phone" && <Smartphone className="w-6 h-6" />}
                {step === "otp" && <KeyRound className="w-6 h-6" />}
                {step === "password" && <Lock className="w-6 h-6" />}
                {step === "success" && <CheckCircle2 className="w-6 h-6" />}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {step === "phone" && "بازگردانی رمز عبور"}
                {step === "otp" && "تایید شماره موبایل"}
                {step === "password" && "تعیین رمز عبور جدید"}
                {step === "success" && "عملیات موفق"}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
                {step === "phone" && "جهت بازیابی رمز، شماره موبایل ثبت‌شده خود را وارد کنید"}
                {step === "otp" && "کد ارسالی به شماره موبایل خود را وارد نمایید"}
                {step === "password" && "رمز عبور جدید و تکرار آن را وارد نمایید"}
                {step === "success" && "رمز عبور شما با موفقیت به روز شد"}
              </p>
            </div>

            {/* Stepper Progress Bar (Visible during steps 1, 2, 3) */}
            {step !== "success" && (
              <div className="relative mb-7">
                <div className="flex items-center justify-between relative z-10">
                  
                  {/* Step 1 Pill */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div 
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        step === "phone"
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-4 ring-blue-100 scale-105"
                          : "bg-emerald-500 text-white shadow-xs"
                      }`}
                    >
                      {step !== "phone" ? <Check className="w-4 h-4 stroke-[3]" /> : "۱"}
                    </div>
                    <span className={`text-[11px] font-semibold transition-colors ${
                      step === "phone" ? "text-blue-700" : "text-gray-500"
                    }`}>
                      شماره موبایل
                    </span>
                  </div>

                  {/* Step 2 Pill */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div 
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        step === "otp"
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-4 ring-blue-100 scale-105"
                          : step === "password"
                          ? "bg-emerald-500 text-white shadow-xs"
                          : "bg-gray-100 text-gray-400 border border-gray-200"
                      }`}
                    >
                      {step === "password" ? <Check className="w-4 h-4 stroke-[3]" /> : "۲"}
                    </div>
                    <span className={`text-[11px] font-semibold transition-colors ${
                      step === "otp" ? "text-blue-700" : "text-gray-500"
                    }`}>
                      کد تایید
                    </span>
                  </div>

                  {/* Step 3 Pill */}
                  <div className="flex flex-col items-center gap-1.5">
                    <div 
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        step === "password"
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-4 ring-blue-100 scale-105"
                          : "bg-gray-100 text-gray-400 border border-gray-200"
                      }`}
                    >
                      ۳
                    </div>
                    <span className={`text-[11px] font-semibold transition-colors ${
                      step === "password" ? "text-blue-700" : "text-gray-400"
                    }`}>
                      رمز جدید
                    </span>
                  </div>

                </div>

                {/* Connecting Line Track */}
                <div className="absolute top-4.5 right-6 left-6 h-0.5 bg-gray-200 -z-0">
                  <div 
                    className="h-full bg-gradient-to-l from-emerald-500 to-blue-600 transition-all duration-500"
                    style={{
                      width: step === "phone" ? "0%" : step === "otp" ? "50%" : "100%"
                    }}
                  />
                </div>
              </div>
            )}

            {/* STEP 1: Phone Input Form */}
            {step === "phone" && (
              <form onSubmit={handleSendOtp} className="space-y-4" data-testid="form-reset-phone">
                
                {/* User Not Found Warning Notice */}
                {notFoundNotice && (
                  <div 
                    className="p-4 rounded-2xl bg-rose-50/95 border-2 border-rose-300 text-right space-y-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300"
                    data-testid="notice-user-not-found"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-rose-950">
                          حساب کاربری با این شماره یافت نشد!
                        </h4>
                        <p className="text-xs text-rose-900 leading-relaxed">
                          شماره موبایل <span className="font-mono font-bold dir-ltr inline-block px-1.5 py-0.5 bg-rose-100/90 rounded text-rose-950">{notFoundNotice}</span> در سیستم ثبت نشده است. لطفاً ابتدا در سامانه ثبت‌نام کنید.
                        </p>
                      </div>
                    </div>

                    <div className="pt-1">
                      <Link
                        href={`/register?phone=${encodeURIComponent(notFoundNotice)}`}
                        className="w-full h-10 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
                        data-testid="button-go-to-register"
                      >
                        <UserPlus className="w-4 h-4" />
                        ثبت‌نام جدید در سامانه
                      </Link>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-gray-700 font-semibold text-xs flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-blue-600" />
                    شماره تلفن همراه
                  </Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={mobile}
                      onChange={(e) => {
                        setMobile(e.target.value);
                        if (notFoundNotice) setNotFoundNotice(null);
                      }}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className={`h-12 text-center text-lg font-mono font-bold tracking-wider rounded-xl transition-all shadow-2xs ${
                        notFoundNotice
                          ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/15"
                          : "border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                      }`}
                      required
                      autoFocus
                      dir="ltr"
                      data-testid="input-reset-phone"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-0.5 px-1">
                    <span>فرمت: ۱۱ رقمی (شروع با ۰۹)</span>
                    <span className="font-mono text-gray-500">مثال: 09121234567</span>
                  </div>
                </div>

                {/* Dual sending options in Step 1 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <Button
                    type="button"
                    onClick={() => handleSendOtp()}
                    className="h-11 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-xs hover:shadow-sm transition-all"
                    disabled={isSendingOtp || isSendingTelegramOtp || !mobile.trim()}
                    data-testid="button-send-reset-otp"
                  >
                    {isSendingOtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 ml-1.5 animate-spin" />
                        در حال ارسال پیامک...
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-3.5 h-3.5 ml-1.5" />
                        دریافت از طریق پیامک (SMS)
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    onClick={() => handleSendTelegramOtp()}
                    className="h-11 text-xs font-bold bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-xs hover:shadow-sm transition-all"
                    disabled={isSendingOtp || isSendingTelegramOtp || !mobile.trim()}
                    data-testid="button-send-telegram"
                  >
                    {isSendingTelegramOtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 ml-1.5 animate-spin" />
                        در حال ارسال به تلگرام...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="w-3.5 h-3.5 ml-1.5" />
                        دریافت از طریق تلگرام
                      </>
                    )}
                  </Button>
                </div>

                {telegramError && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-right space-y-2 animate-in fade-in duration-300 w-full mt-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-amber-950">شماره در تلگرام رخش یافت نشد</h5>
                        <p className="text-[10px] text-amber-900 leading-relaxed">
                          شماره موبایل شما در لیست اعضای ربات تلگرام ما نیست. ابتدا وارد ربات رخش شده و دکمه <b>«📱 ارسال شماره تلفن من»</b> را بزنید؛ سپس مجدداً گزینه تلگرام را کلیک کنید.
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://t.me/${botUsername || "your_bot_username"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 w-full inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      ورود به ربات و ارسال شماره تلفن
                    </a>
                  </div>
                )}

                <div className="text-center pt-3 border-t border-gray-100 mt-4 space-y-2">
                  <div className="text-xs text-gray-600">
                    رمز عبور خود را به یاد آوردید؟{" "}
                    <Link href="/login" className="text-blue-600 hover:text-blue-700 font-bold hover:underline" data-testid="link-login">
                      وارد شوید
                    </Link>
                  </div>
                  <div>
                    <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors" data-testid="link-home">
                      <Home className="w-3.5 h-3.5" />
                      <span>بازگشت به صفحه اصلی</span>
                    </Link>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 2: OTP Verification Form */}
            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="space-y-4" data-testid="form-reset-otp">
                
                {/* Mobile Badge & Change Link */}
                <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                    <span className="text-gray-600">ارسال شده به:</span>
                    <span className="font-mono font-bold text-gray-900 dir-ltr">{mobile}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setOtpCode("");
                    }}
                    className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
                  >
                    تغییر شماره
                  </button>
                </div>

                {/* Test Code Alert Banner (in test mode) */}
                {testCodeNotice && (
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>کد تستی سامانه:</span>
                    </div>
                    <span className="font-mono font-black text-sm text-amber-900 tracking-wider bg-white px-2 py-0.5 rounded-lg border border-amber-200">
                      {testCodeNotice}
                    </span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="otpCode" className="text-gray-700 font-semibold text-xs flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    کد تایید یکبار مصرف
                  </Label>
                  <Input
                    id="otpCode"
                    name="otpCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="— — — — — —"
                    className="h-12 text-center text-xl font-mono font-bold tracking-[0.4em] rounded-xl border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                    required
                    autoFocus
                    dir="ltr"
                    data-testid="input-reset-otp"
                  />
                </div>

                {/* Countdown & Resend Option */}
                <div className="flex flex-col gap-2.5 text-xs text-gray-500 px-1 border-b border-gray-100 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium">
                      زمان باقی‌مانده:{" "}
                      <span className="font-mono font-bold text-blue-600 dir-ltr inline-block">
                        {formatCountdown(countdown)}
                      </span>
                    </span>
                    {!canResend && <span className="text-gray-400 text-[11px]">ارسال مجدد بعد از پایان زمان</span>}
                  </div>
                  {canResend && (
                    <div className="flex items-center justify-between gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        disabled={isSendingOtp || isSendingCallOtp || isSendingTelegramOtp}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-bold flex items-center gap-1 bg-blue-50/50 hover:bg-blue-50 px-2 py-1 rounded-lg border border-blue-200"
                      >
                        <RotateCcw className="w-3 h-3" />
                        مجدد با پیامک
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendTelegramOtp()}
                        disabled={isSendingOtp || isSendingCallOtp || isSendingTelegramOtp}
                        className="text-indigo-600 hover:text-indigo-800 hover:underline font-bold flex items-center gap-1 bg-indigo-50/50 hover:bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200"
                      >
                        <MessageCircle className="w-3 h-3" />
                        مجدد با تلگرام
                      </button>
                    </div>
                  )}
                </div>

                {/* Voice Call Backup Service */}
                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/70 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs text-emerald-950 font-medium">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>کد تایید را دریافت نکردید؟ (پشتیبان تماس صوتی)</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 leading-relaxed text-right w-full">
                    در صورتی که پیامک یا تلگرام برای شما ارسال نشده است، می‌توانید از طریق تماس صوتی کد را دریافت کنید.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSendCallOtp}
                    disabled={isSendingCallOtp || isSendingOtp || isSendingTelegramOtp}
                    className="h-9 text-xs font-bold text-emerald-700 border-emerald-300 hover:bg-emerald-100 hover:text-emerald-900 bg-white shadow-2xs w-full flex items-center justify-center gap-1.5"
                  >
                    {isSendingCallOtp ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 ml-1.5 animate-spin" />
                        در حال برقراری تماس صوتی...
                      </>
                    ) : (
                      <>
                        <Phone className="w-3.5 h-3.5 ml-1.5" />
                        دریافت کد با تماس صوتی (پشتیبان نهایی)
                      </>
                    )}
                  </Button>
                </div>

                {telegramError && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-right space-y-2 animate-in fade-in duration-300 w-full mt-1">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <h5 className="text-xs font-bold text-amber-950">شماره در تلگرام رخش یافت نشد</h5>
                        <p className="text-[10px] text-amber-900 leading-relaxed">
                          شماره موبایل شما در لیست اعضای ربات تلگرام ما نیست. ابتدا وارد ربات رخش شده و دکمه <b>«📱 ارسال شماره تلفن من»</b> را بزنید؛ سپس مجدداً تلاش کنید.
                        </p>
                      </div>
                    </div>
                    <a
                      href={`https://t.me/${botUsername || "your_bot_username"}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8 w-full inline-flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-2xs transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      ورود به ربات و ارسال شماره تلفن
                    </a>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                  disabled={isVerifyingOtp || otpCode.length < 4}
                  data-testid="button-verify-reset-otp"
                >
                  {isVerifyingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      در حال بررسی کد...
                    </>
                  ) : (
                    <>
                      تایید کد و تعیین رمز جدید
                      <ArrowLeft className="w-4 h-4 mr-2" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* STEP 3: Enter New Password Form */}
            {step === "password" && (
              <form onSubmit={handleCompleteReset} className="space-y-4" data-testid="form-reset-new-password">
                
                {/* Verified Mobile Chip */}
                <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-center gap-2 text-xs text-emerald-800 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>شماره تایید شده: <strong className="font-mono dir-ltr">{mobile}</strong></span>
                </div>

                {/* New Password Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-gray-700 font-semibold text-xs flex items-center justify-between">
                    <span>رمز عبور جدید <span className="text-red-500">*</span></span>
                    <span className="text-[11px] text-gray-400 font-normal">حداقل ۶ کاراکتر</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="رمز عبور جدید را وارد کنید"
                      className="h-11 px-3 pl-10 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 text-sm"
                      required
                      autoFocus
                      autoComplete="new-password"
                      data-testid="input-new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-gray-700 font-semibold text-xs block">
                    تکرار رمز عبور جدید <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="رمز عبور را دوباره وارد کنید"
                      className={`h-11 px-3 pl-10 rounded-xl border-gray-300 focus:ring-4 text-sm ${
                        confirmPassword && confirmPassword !== newPassword
                          ? "border-red-400 focus:border-red-500 focus:ring-red-500/15"
                          : "focus:border-blue-500 focus:ring-blue-500/15"
                      }`}
                      required
                      autoComplete="new-password"
                      data-testid="input-confirm-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-[11px] text-red-500 font-medium">رمز عبور با تکرار آن یکسان نیست</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:from-emerald-700 hover:via-teal-700 hover:to-blue-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 mt-2"
                  disabled={isResetting || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                  data-testid="button-complete-reset"
                >
                  {isResetting ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      در حال ذخیره رمز عبور جدید...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 ml-2" />
                      ثبت رمز عبور جدید
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* STEP 4: Success View */}
            {step === "success" && (
              <div className="text-center py-4 space-y-4 animate-in fade-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900">رمز عبور با موفقیت تغییر یافت!</h3>
                  <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
                    اکنون می‌توانید با شماره موبایل و رمز عبور جدید خود وارد پنل کاربری شوید.
                  </p>
                </div>

                <div className="pt-3">
                  <Link
                    href={`/login?phone=${encodeURIComponent(mobile)}`}
                    className="w-full h-11 inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all"
                    data-testid="button-login-after-reset"
                  >
                    <LogIn className="w-4 h-4" />
                    ورود به حساب کاربری
                  </Link>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Left Media / Branding Showcase (Synchronized with Login Page Theme) */}
      <div className="hidden lg:flex lg:w-1/2 bg-white items-center justify-center p-8 relative overflow-hidden">
        <div className="relative z-10 text-center w-full max-w-lg flex items-center justify-center">
          {showCustomImage ? (
            <img 
              src={pageConfig?.imageUrl} 
              alt="Reset Password Visual" 
              className={`max-h-[80vh] w-auto max-w-full mx-auto object-${pageConfig?.imageFit || "contain"} rounded-2xl shadow-xl transition-all duration-300`}
            />
          ) : (
            <video 
              src={loginVideo} 
              autoPlay
              loop
              muted
              playsInline
              className="h-[80vh] w-auto mx-auto mb-6 object-cover rounded-2xl shadow-xl"
            />
          )}
        </div>
      </div>
    </div>
  );
}
