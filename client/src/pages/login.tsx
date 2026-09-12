import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { 
  ArrowRight, Home, Smartphone, KeyRound, Lock, Eye, EyeOff, 
  ShieldAlert, Loader2, Sparkles, UserPlus, CheckCircle2, 
  RotateCcw, Clock, AlertTriangle, LogIn
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import loginVideo from "@assets/YouCut_20250930_005437820_1759181322984.mp4";

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

type LoginStep = "phone" | "password";

interface LockoutState {
  isLocked: boolean;
  lockedUntil?: number;
  remainingSeconds: number;
  message?: string;
}

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Step state: "phone" -> "password"
  const [step, setStep] = useState<LoginStep>("phone");
  const [mobile, setMobile] = useState(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("phone") || params.get("username") || "";
    }
    return "";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // User meta from step 1
  const [userMeta, setUserMeta] = useState<{
    firstName?: string;
    lastName?: string;
    mobile?: string;
    remainingAttempts?: number;
  } | null>(null);

  // Loading states
  const [isCheckingMobile, setIsCheckingMobile] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Not found alert in Step 1
  const [notFoundNotice, setNotFoundNotice] = useState<{
    message: string;
    phone: string;
  } | null>(null);

  // Lockout state (3 failed attempts -> 30 mins)
  const [lockout, setLockout] = useState<LockoutState>({
    isLocked: false,
    remainingSeconds: 0,
  });

  // Attempt error in Step 2
  const [attemptError, setAttemptError] = useState<{
    message: string;
    remainingAttempts?: number;
  } | null>(null);

  // Prefill phone from URL search
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const prefill = params.get("phone") || params.get("username");
    if (prefill && !mobile) {
      setMobile(prefill);
    }
  }, []);

  // Lockout live countdown timer
  useEffect(() => {
    if (!lockout.isLocked || lockout.remainingSeconds <= 0) return;

    const timer = setInterval(() => {
      setLockout((prev) => {
        if (prev.remainingSeconds <= 1) {
          clearInterval(timer);
          return {
            isLocked: false,
            remainingSeconds: 0,
            message: undefined,
          };
        }
        return {
          ...prev,
          remainingSeconds: prev.remainingSeconds - 1,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockout.isLocked, lockout.remainingSeconds]);

  // Fetch Login Page customization settings
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

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const normalizePhone = (raw: string) => {
    return raw
      .replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d).toString())
      .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString())
      .replace(/[\s\-\+]/g, "")
      .trim();
  };

  // Step 1: Check mobile / identifier and advance to password step
  const handleCheckMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotFoundNotice(null);
    setAttemptError(null);

    const cleanInput = normalizePhone(mobile);
    if (!cleanInput) {
      toast({
        title: "شماره موبایل الزامی است",
        description: "لطفاً شماره موبایل خود را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    if (!/^09\d{9}$/.test(cleanInput)) {
      toast({
        title: "شماره موبایل نامعتبر",
        description: "شماره موبایل وارد شده باید با ۰۹ شروع شده و ۱۱ رقم باشد (مانند ۰۹۱۲۳۴۵۶۷۸۹)",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingMobile(true);

    try {
      const res = await fetch("/api/auth/login/check-mobile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: cleanInput }),
      });

      const data = await res.json();

      // Account is locked out due to 3 failed attempts
      if (res.status === 423 || data.isLocked) {
        setLockout({
          isLocked: true,
          lockedUntil: data.lockedUntil,
          remainingSeconds: data.remainingSeconds || (data.remainingMinutes ? data.remainingMinutes * 60 : 1800),
          message: data.message,
        });
        toast({
          title: "حساب مسدود است",
          description: data.message || "به دلیل ۳ بار ورود رمز اشتباه، حساب شما تا ۳۰ دقیقه مسدود است.",
          variant: "destructive",
        });
        return;
      }

      // User not found in system
      if (res.status === 404) {
        setNotFoundNotice({
          message: data.message || "حساب کاربری با این شماره یافت نشد.",
          phone: cleanInput,
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "خطا در بررسی حساب کاربری");
      }

      // Account is valid and unlocked: proceed to Step 2
      setUserMeta({
        firstName: data.firstName,
        lastName: data.lastName,
        mobile: data.mobile,
        remainingAttempts: data.remainingAttempts ?? 3,
      });
      setStep("password");
    } catch (err: any) {
      toast({
        title: "خطا در ارتباط",
        description: err.message || "برقراری ارتباط با سرور با خطا مواجه شد",
        variant: "destructive",
      });
    } finally {
      setIsCheckingMobile(false);
    }
  };

  // Step 2: Verify password and log in
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptError(null);

    const cleanPassword = password.trim();
    if (!cleanPassword) {
      toast({
        title: "رمز عبور الزامی است",
        description: "لطفاً رمز عبور خود را وارد کنید",
        variant: "destructive",
      });
      return;
    }

    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: userMeta?.mobile || mobile.trim(),
          password: cleanPassword,
        }),
      });

      const data = await res.json();

      // Lockout triggered (reached 3 attempts) or already locked
      if (res.status === 423 || data.isLocked) {
        setLockout({
          isLocked: true,
          lockedUntil: data.lockedUntil,
          remainingSeconds: data.remainingSeconds || 1800,
          message: data.message,
        });
        setAttemptError({
          message: data.message || "به علت ۳ بار ورود رمز اشتباه، حساب کاربری به مدت ۳۰ دقیقه مسدود شد.",
          remainingAttempts: 0,
        });
        toast({
          title: "حساب مسدود شد",
          description: "به دلیل ۳ بار ورود رمز عبور اشتباه، امکان ورود تا ۳۰ دقیقه مسدود است.",
          variant: "destructive",
        });
        return;
      }

      // Wrong password (less than 3 attempts)
      if (res.status === 401) {
        const remaining = data.remainingAttempts ?? 0;
        setAttemptError({
          message: data.message || "رمز عبور اشتباه است.",
          remainingAttempts: remaining,
        });
        toast({
          title: "رمز عبور اشتباه است",
          description: data.message || `فرصت‌های باقیمانده: ${remaining} بار از ۳ بار`,
          variant: "destructive",
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.message || "خطا در ورود به حساب");
      }

      // Successful Login
      localStorage.setItem("token", data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);

      toast({
        title: "ورود موفق",
        description: `${data.user.firstName ? data.user.firstName + " عزیز،" : ""} خوش آمدید!`,
      });

      setLocation("/");
    } catch (err: any) {
      toast({
        title: "خطا در ورود",
        description: err.message || "خطا در ورود به حساب کاربری",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Quick Demo Login Handler
  const handleQuickLogin = async (username: string, pass: string) => {
    setMobile(username);
    setPassword(pass);
    setIsLoggingIn(true);
    setAttemptError(null);
    setNotFoundNotice(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: username, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "خطا در ورود سریع");
      }
      localStorage.setItem("token", data.token);
      queryClient.setQueryData(["/api/auth/me"], data.user);
      toast({
        title: "ورود موفق",
        description: `با حساب ${username} وارد شدید`,
      });
      setLocation("/");
    } catch (err: any) {
      toast({
        title: "خطا در ورود آزمایشی",
        description: err.message || "امکان ورود آزمایشی فراهم نشد",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const showCustomImage =
    (pageConfig?.imageType === "custom_image" || pageConfig?.imageType === "url") &&
    Boolean(pageConfig?.imageUrl);

  return (
    <div className="min-h-screen flex dir-rtl" data-testid="page-login">
      {/* Right Side: Gradient and Multi-Step Login Form */}
      <div 
        className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-10 relative overflow-hidden transition-all duration-500"
        style={getGradientStyle()}
      >
        {/* Soft background light bubbles */}
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -ml-32 -mb-32 pointer-events-none" />

        <div className="w-full max-w-md relative z-10">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/40 ring-1 ring-black/5">
            
            {/* Header / Brand Title */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 text-white shadow-lg mb-3">
                {step === "phone" ? (
                  <Smartphone className="w-7 h-7" />
                ) : (
                  <KeyRound className="w-7 h-7" />
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
                {step === "phone" ? "ورود به حساب کاربری" : "رمز عبور را وارد کنید"}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {step === "phone" 
                  ? "برای شروع، شماره موبایل خود را وارد کنید" 
                  : (userMeta?.firstName 
                      ? `سلام ${userMeta.firstName} عزیز، خوش آمدید!` 
                      : "لطفاً رمز عبور حساب کاربری خود را وارد نمایید")}
              </p>
            </div>

            {/* Stepper Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6 px-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step === "phone" 
                    ? "bg-blue-600 text-white ring-4 ring-blue-100" 
                    : "bg-emerald-500 text-white"
                }`}>
                  {step === "password" ? <CheckCircle2 className="w-4 h-4" /> : "۱"}
                </span>
                <span>شماره موبایل</span>
              </div>
              
              <div className={`h-0.5 w-12 rounded-full transition-all duration-300 ${
                step === "password" ? "bg-emerald-500" : "bg-gray-200"
              }`} />

              <div className={`flex items-center gap-1.5 text-xs font-semibold ${
                step === "password" ? "text-blue-600" : "text-gray-400"
              }`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${
                  step === "password" 
                    ? "bg-blue-600 text-white ring-4 ring-blue-100" 
                    : "bg-gray-100 text-gray-500"
                }`}>
                  ۲
                </span>
                <span>رمز عبور</span>
              </div>
            </div>

            {/* Security Lockout Alert Banner */}
            {lockout.isLocked && (
              <div className="mb-5 p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-800 space-y-3 shadow-xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-xl text-red-600 shrink-0">
                    <ShieldAlert className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-red-900">
                      دسترسی به مدت ۳۰ دقیقه مسدود شد
                    </h4>
                    <p className="text-xs text-red-700 leading-relaxed">
                      به علت ۳ بار وارد کردن رمز عبور نادرست، جهت حفاظت از امنیت حساب شما، ورود موقتاً قفل شده است.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white/80 rounded-xl p-2.5 border border-red-200">
                  <span className="text-xs text-gray-700 font-medium flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-red-500" />
                    مدت زمان باقیمانده تا رفع مسدودی:
                  </span>
                  <span className="font-mono text-sm font-bold text-red-600 dir-ltr bg-red-100/60 px-2 py-0.5 rounded-md">
                    {formatCountdown(lockout.remainingSeconds)}
                  </span>
                </div>

                <div className="pt-1">
                  <Link
                    href={`/reset-password?phone=${encodeURIComponent(mobile)}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 py-2.5 px-3 rounded-xl transition-colors shadow-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    بازیابی فوری رمز عبور با پیامک یا تماس
                  </Link>
                </div>
              </div>
            )}

            {/* Step 1: Phone / Username Form */}
            {step === "phone" && !lockout.isLocked && (
              <form onSubmit={handleCheckMobile} className="space-y-4" data-testid="form-login-step1">
                {/* Not Found In System Alert */}
                {notFoundNotice && (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{notFoundNotice.message}</span>
                    </div>
                    <p className="text-[11px] text-amber-700 leading-normal">
                      شماره وارد شده در سامانه وجود ندارد. شما می‌توانید در چند ثانیه به صورت رایگان ثبت‌نام کنید:
                    </p>
                    <Link
                      href={`/register?phone=${encodeURIComponent(notFoundNotice.phone)}`}
                      className="inline-flex items-center justify-center gap-1.5 w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-xs transition-all"
                      data-testid="button-go-register"
                    >
                      <UserPlus className="w-4 h-4" />
                      ثبت‌نام با این شماره
                    </Link>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="mobile" className="text-gray-700 font-semibold text-xs block">
                    شماره موبایل <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="mobile"
                      type="tel"
                      maxLength={11}
                      value={mobile}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9۰-۹٠-٩]/g, "");
                        setMobile(val);
                        if (notFoundNotice) setNotFoundNotice(null);
                      }}
                      placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                      className="h-11 px-3 pl-10 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 text-sm dir-ltr text-center font-mono font-bold tracking-wider"
                      required
                      autoFocus
                      autoComplete="tel"
                      data-testid="input-mobile"
                    />
                    <Smartphone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    شماره موبایل ۱۱ رقمی خود را که با ۰۹ شروع می‌شود وارد کنید
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 mt-2"
                  disabled={isCheckingMobile || !mobile.trim()}
                  data-testid="button-check-mobile"
                >
                  {isCheckingMobile ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      در حال بررسی حساب...
                    </>
                  ) : (
                    <>
                      ادامه
                      <ArrowRight className="w-4 h-4 mr-2" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Step 2: Password Form */}
            {step === "password" && !lockout.isLocked && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4" data-testid="form-login-step2">
                {/* Mobile Verified / User Profile Chip */}
                <div className="p-2.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-blue-950 font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-mono dir-ltr font-bold text-gray-800">
                      {userMeta?.mobile || mobile}
                    </span>
                    {userMeta?.firstName && (
                      <span className="text-gray-500 font-normal">
                        ({userMeta.firstName} {userMeta.lastName})
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setPassword("");
                      setAttemptError(null);
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline px-1.5 py-0.5 rounded hover:bg-blue-100/50 transition-colors"
                  >
                    تغییر شماره
                  </button>
                </div>

                {/* Wrong Password Warning with Attempt Counter */}
                {attemptError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-red-900">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{attemptError.message}</span>
                    </div>
                    {typeof attemptError.remainingAttempts === "number" && attemptError.remainingAttempts > 0 && (
                      <p className="text-[11px] text-red-700">
                        توجه: در صورت ۳ بار اشتباه، دسترسی شما به مدت ۳۰ دقیقه مسدود خواهد شد. ({attemptError.remainingAttempts} فرصت دیگر باقیست)
                      </p>
                    )}
                  </div>
                )}

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-gray-700 font-semibold text-xs block">
                      رمز عبور <span className="text-red-500">*</span>
                    </Label>
                    <Link
                      href={`/reset-password?phone=${encodeURIComponent(mobile)}`}
                      className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      tabIndex={-1}
                    >
                      فراموشی رمز عبور؟
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (attemptError) setAttemptError(null);
                      }}
                      placeholder="رمز عبور خود را وارد کنید"
                      className="h-11 px-3 pl-10 rounded-xl border-gray-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 text-sm"
                      required
                      autoFocus
                      autoComplete="current-password"
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center space-x-2 space-x-reverse pt-1">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    data-testid="checkbox-remember"
                  />
                  <Label htmlFor="remember" className="text-xs text-gray-600 cursor-pointer font-medium">
                    مرا به خاطر بسپار
                  </Label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 mt-2"
                  disabled={isLoggingIn || !password.trim()}
                  data-testid="button-login-submit"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      در حال بررسی و ورود...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 ml-2" />
                      ورود به حساب کاربری
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Quick Demo Logins for Fast Developer/User Testing */}
            <div className="pt-3 pb-1 border-t border-gray-100 mt-5">
              <p className="text-[11px] text-gray-400 text-center mb-2">ورود سریع با حساب‌های آزمایشی:</p>
              <div className="flex gap-2 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 px-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
                  onClick={() => handleQuickLogin("ehsan", "admin123")}
                  disabled={isLoggingIn}
                >
                  مدیر سیستم (ehsan)
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-8 px-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700"
                  onClick={() => handleQuickLogin("test_seller", "test123")}
                  disabled={isLoggingIn}
                >
                  فروشنده (test_seller)
                </Button>
              </div>
            </div>

            {/* Footer Navigation Links */}
            <div className="text-center pt-4 space-y-2 border-t border-gray-100 mt-4">
              <div>
                <span className="text-gray-500 text-xs">حساب کاربری ندارید؟</span>
                <Link
                  href={mobile ? `/register?phone=${encodeURIComponent(mobile)}` : "/register"}
                  className="text-blue-600 hover:text-blue-800 hover:underline mr-1 font-bold text-xs"
                  data-testid="link-register"
                >
                  ثبت‌نام کنید
                </Link>
              </div>
              <div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors font-medium"
                  data-testid="link-home"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span>بازگشت به صفحه اصلی</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Left Side: Media / Custom Image Container (Identical to Register Layout) */}
      <div className="hidden lg:flex lg:w-1/2 bg-white items-center justify-center p-8 relative overflow-hidden">
        <div className="relative z-10 text-center w-full max-w-lg flex items-center justify-center">
          {showCustomImage ? (
            <img 
              src={pageConfig?.imageUrl} 
              alt="Login Visual" 
              className={`max-h-[80vh] w-auto max-w-full mx-auto object-${pageConfig?.imageFit || "contain"} rounded-2xl shadow-sm transition-all duration-300`}
            />
          ) : (
            <video 
              src={loginVideo} 
              autoPlay
              loop
              muted
              playsInline
              className="h-[80vh] w-auto mx-auto mb-6 object-cover rounded-2xl shadow-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}
