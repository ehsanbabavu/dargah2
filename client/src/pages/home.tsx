import React, { useState } from "react";
import { Link } from "wouter";
import { GuestChatWidget } from "@/components/guest-chat-widget";

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="bg-[#f8f9fa] text-[#111827] antialiased min-h-screen flex flex-col justify-between selection:bg-[#bac3ff] selection:text-[#002db6] pt-20" dir="rtl">
      {/* ================= FIXED NAVBAR ================= */}
      <header className="fixed top-0 right-0 left-0 z-50 bg-white/95 dark:bg-[#0F1A2D]/95 backdrop-blur-md shadow-xs border-b border-[#E5E7EB] dark:border-slate-800 transition-all duration-200">
        <div className="flex justify-between items-center w-full px-6 lg:px-8 max-w-[1240px] mx-auto h-20">
          {/* Logo & Navigation Links Group */}
          <div className="flex items-center gap-10">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-[#ffba38]/20 flex items-center justify-center text-[#ffba38] border border-[#ffba38]/30 shadow-inner group-hover:scale-105 transition-transform duration-200">
                <span className="material-symbols-outlined text-2xl text-[#ffba38]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  bolt
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[22px] font-extrabold text-[#0F1A2D] dark:text-white tracking-tight leading-tight">
                  رخش پی
                </span>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                  سامانه درگاه و فروشگاه اختصاصی فروشندگان
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-7">
              <a href="#features" className="text-[#002db6] dark:text-[#bac3ff] font-bold text-[13px] hover:text-[#002db6] dark:hover:text-[#bac3ff] transition-colors duration-200">
                امکانات فروشندگان
              </a>
              <a href="#gateway" className="text-[#4B5563] dark:text-slate-300 font-medium text-[13px] hover:text-[#002db6] dark:hover:text-[#bac3ff] transition-colors duration-200">
                درگاه کارت به کارت
              </a>
              <a href="#store" className="text-[#4B5563] dark:text-slate-300 font-medium text-[13px] hover:text-[#002db6] dark:hover:text-[#bac3ff] transition-colors duration-200">
                ویترین و فروشگاه
              </a>
              <a href="#developers" className="text-[#4B5563] dark:text-slate-300 font-medium text-[13px] hover:text-[#002db6] dark:hover:text-[#bac3ff] transition-colors duration-200">
                افزونه ووکامرس و وب‌هوک
              </a>
              <a href="#faq" className="text-[#4B5563] dark:text-slate-300 font-medium text-[13px] hover:text-[#002db6] dark:hover:text-[#bac3ff] transition-colors duration-200">
                سوالات متداول
              </a>
            </nav>
          </div>

          {/* Trailing Action */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center justify-center px-6 h-12 rounded-xl bg-[#2848d3] text-white font-semibold text-[15px] shadow-xs hover:bg-[#1932B8] hover:shadow-[0_8px_20px_rgba(40,72,211,0.28)] active:scale-95 transition-all duration-200"
            >
              ورود به پنل فروشندگان
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#4B5563] hover:bg-[#F3F4F6] transition-colors"
            >
              <span className="material-symbols-outlined text-2xl">menu</span>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-6 py-4 bg-white border-b border-gray-200 space-y-3">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-[#002db6] font-bold text-sm">امکانات فروشندگان</a>
            <a href="#gateway" onClick={() => setMobileMenuOpen(false)} className="block text-[#4B5563] font-medium text-sm">درگاه کارت به کارت</a>
            <a href="#store" onClick={() => setMobileMenuOpen(false)} className="block text-[#4B5563] font-medium text-sm">ویترین و فروشگاه اختصاصی</a>
            <a href="#developers" onClick={() => setMobileMenuOpen(false)} className="block text-[#4B5563] font-medium text-sm">افزونه ووکامرس و API</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block text-[#4B5563] font-medium text-sm">سوالات متداول</a>
            <Link href="/login" className="block text-center w-full py-2.5 bg-[#2848d3] text-white rounded-xl font-bold text-sm mt-2">
              ورود به پنل فروشندگان
            </Link>
          </div>
        )}
      </header>

      <main className="w-full flex-1">
        {/* ================= HERO SECTION ================= */}
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
          <div className="relative rounded-3xl bg-[#0F1A2D] overflow-hidden p-8 sm:p-12 lg:p-16 border border-white/10 shadow-2xl">
            {/* Soft Background Light Bleeds */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#2848d3]/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-[#ffba38]/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Hero Text Content */}
              <div className="lg:col-span-7 flex flex-col items-start gap-6 text-right">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FFF8E1]/10 border border-[#ffba38]/30 text-[#ffba38] text-[11px] font-bold">
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span>ویژه فروشندگان و پذیرندگان رخش پی</span>
                </div>

                <h1 className="text-[30px] lg:text-[44px] font-black leading-[42px] lg:leading-[60px] text-white tracking-tight">
                  سامانه یکپارچه درگاه پرداخت، فروشگاه آنلاین و مدیریت فروش
                </h1>

                <p className="text-[16px] leading-[28px] text-[#c5c5d7] max-w-xl leading-relaxed">
                  رخش پی بستری جامع برای فروشندگان فراهم کرده تا بدون نیاز به دانش فنی، درگاه پرداخت اختصاصی کارت به کارت با لینک اختصاصی، افزونه ووکامرس، فروشگاه اینترنتی مستقل و ابزار مدیریت سفارش‌ها را در یک پنل هوشمند دریافت کنند.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-8 h-12 rounded-xl bg-[#2848d3] text-white font-semibold text-[15px] hover:bg-[#1932B8] hover:shadow-[0_8px_20px_rgba(40,72,211,0.35)] transition-all duration-200"
                  >
                    ورود به پنل فروشندگان
                  </Link>
                  <div className="flex items-center gap-2 text-[#c5c5d7] text-[13px] font-medium pr-2">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                    <span>اتصال خودکار به وب‌سرویس بلوپال و تسویه آنی</span>
                  </div>
                </div>
              </div>

              {/* Hero Graphic Card Mockup */}
              <div className="lg:col-span-5 flex justify-center relative">
                <div className="relative w-full max-w-sm aspect-[4/3.8] rounded-2xl bg-gradient-to-b from-white/10 to-white/5 p-6 border border-white/10 backdrop-blur-md shadow-2xl flex flex-col justify-between overflow-hidden">
                  <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#2848d3]/40 rounded-full blur-2xl"></div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-white">
                      <span className="material-symbols-outlined text-3xl text-[#ffba38]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
                      <span className="text-[18px] font-bold">RakhshPay C2C</span>
                    </div>
                    <span className="material-symbols-outlined text-white/60 text-2xl">contactless</span>
                  </div>

                  <div className="my-6 space-y-4">
                    <div className="w-12 h-9 rounded-lg bg-[#ffba38]/80 border border-yellow-300 shadow-inner flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#0F1A2D] text-lg">memory</span>
                    </div>
                    <div className="font-mono text-lg text-white tracking-widest font-semibold drop-shadow" dir="ltr">
                      ۶۰۳۷ •••• •••• ۸۲۹۴
                    </div>
                  </div>

                  <div className="flex justify-between items-end text-[#c5c5d7] text-[11px] font-bold">
                    <div>
                      <div className="text-[10px] uppercase opacity-70">وضعیت درگاه</div>
                      <div className="text-white font-medium mt-0.5">فروشنده تاییدشده رخش پی</div>
                    </div>
                    <div className="text-left">
                      <div className="text-[10px] uppercase opacity-70">تایید خودکار</div>
                      <div className="text-[#10B981] font-semibold mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">check_circle</span>
                        استعلام لحظه‌ای
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Indicator Notch */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-white/40 hover:text-white transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-2xl animate-bounce">expand_more</span>
            </div>
          </div>
        </section>

        {/* ================= BRAND & INTEGRATION STRIP ================= */}
        <section className="max-w-[1240px] mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-wrap items-center justify-center md:justify-between gap-8 py-6 opacity-75 grayscale hover:grayscale-0 transition-all duration-300 border-y border-[#E5E7EB]">
            <div className="flex items-center gap-2 font-bold text-[#4B5563] text-[16px]">
              <span className="material-symbols-outlined text-[#002db6]">credit_card</span>
              <span>کارت به کارت شتاب</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-[#4B5563] text-[16px]">
              <span className="material-symbols-outlined text-[#002db6]">api</span>
              <span>وب‌سرویس بلوپال</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-[#4B5563] text-[16px]">
              <span className="material-symbols-outlined text-[#002db6]">shopping_cart</span>
              <span>افزونه ووکامرس وردپرس</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-[#4B5563] text-[16px]">
              <span className="material-symbols-outlined text-[#002db6]">storefront</span>
              <span>فروشگاه اختصاصی محصولات</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-[#4B5563] text-[16px]">
              <span className="material-symbols-outlined text-[#002db6]">share</span>
              <span>صفحه پرداخت عمومی با اسلاگ</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-[#4B5563] text-[16px]">
              <span className="material-symbols-outlined text-[#002db6]">chat</span>
              <span>چت مستقیم با مدیریت</span>
            </div>
          </div>
        </section>

        {/* ================= 4 KEY PILLARS: SELLER CAPABILITIES ================= */}
        <section className="max-w-[1240px] mx-auto px-6 lg:px-8 py-12" id="features">
          <div className="text-center mb-10">
            <span className="px-3.5 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
              پکیج جامع ویژه فروشندگان
            </span>
            <h2 className="text-[28px] lg:text-[32px] font-extrabold text-[#111827] mt-3">
              امکانات و ابزارهای فروشندگان رخش پی
            </h2>
            <p className="text-[15px] text-[#4B5563] mt-2 max-w-2xl mx-auto">
              تمام ابزارهایی که برای فروش اینترنتی، دریافت پول و مدیریت کسب‌وکار خود نیاز دارید، در داشبورد فروشندگان آماده استفاده است.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Pillar 1: درگاه اختصاصی کارت به کارت */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs hover:shadow-md hover:border-[#bac3ff] transition-all duration-200 flex flex-col items-start gap-4 text-right">
              <div className="w-12 h-12 rounded-xl bg-[#F3F4F6] text-[#002db6] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>credit_score</span>
              </div>
              <h3 className="text-[18px] text-[#111827] font-bold">
                درگاه کارت به کارت خودکار
              </h3>
              <p className="text-[14px] text-[#4B5563] leading-relaxed">
                اتصال مستقیم به وب‌سرویس بلوپال با ثبت API Key، تشخیص خودکار نام بانک از شماره کارت، استعلام لحظه‌ای و تایید خودکار واریز مشتریان.
              </p>
            </div>

            {/* Pillar 2: صفحه پرداخت و لینک اشتراک‌گذاری */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs hover:shadow-md hover:border-[#bac3ff] transition-all duration-200 flex flex-col items-start gap-4 text-right">
              <div className="w-12 h-12 rounded-xl bg-[#F3F4F6] text-[#002db6] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
              </div>
              <h3 className="text-[18px] text-[#111827] font-bold">
                صفحه پرداخت اختصاصی
              </h3>
              <p className="text-[14px] text-[#4B5563] leading-relaxed">
                لینک اختصاصی بر اساس نام کاربری یا اسلاگ دلخواه همراه با تنظیم نام درگاه، پیام تشکر، شماره پشتیبانی و تعیین سقف و کف مبالغ تراکنش.
              </p>
            </div>

            {/* Pillar 3: فروشگاه و مدیریت محصولات */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs hover:shadow-md hover:border-[#bac3ff] transition-all duration-200 flex flex-col items-start gap-4 text-right">
              <div className="w-12 h-12 rounded-xl bg-[#F3F4F6] text-[#002db6] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
              </div>
              <h3 className="text-[18px] text-[#111827] font-bold">
                مدیریت محصولات و سفارشات
              </h3>
              <p className="text-[14px] text-[#4B5563] leading-relaxed">
                امکان افزودن و ویرایش محصولات، تنظیم قیمت و موجودی، مشاهده سفارشات در انتظار تایید، و دسترسی به کاتالوگ محصولات سیستمی.
              </p>
            </div>

            {/* Pillar 4: افزونه ووکامرس و چت اختصاصی */}
            <div className="p-6 rounded-2xl bg-white border border-[#E5E7EB] shadow-xs hover:shadow-md hover:border-[#bac3ff] transition-all duration-200 flex flex-col items-start gap-4 text-right">
              <div className="w-12 h-12 rounded-xl bg-[#F3F4F6] text-[#002db6] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>integration_instructions</span>
              </div>
              <h3 className="text-[18px] text-[#111827] font-bold">
                افزونه ووکامرس و چت با مدیر
              </h3>
              <p className="text-[14px] text-[#4B5563] leading-relaxed">
                دانلود مستقیم افزونه آماده وردپرس با تنظیمات از پیش‌پیکربندی‌شده برای سایت شما، به همراه چت اختصاصی داخلی با مدیریت سامانه.
              </p>
            </div>
          </div>
        </section>

        {/* ================= CORE PRODUCT SECTION: IPG & DASHBOARD ================= */}
        <section className="max-w-[1240px] mx-auto px-6 lg:px-8 py-10" id="gateway">
          <div className="rounded-3xl bg-white border border-[#E5E7EB] p-8 sm:p-12 lg:p-16 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Content Left (RTL Right) */}
              <div className="lg:col-span-7 flex flex-col items-start gap-6 text-right">
                <div className="text-[#002db6] text-[13px] font-bold tracking-wide">
                  پیشخوان مالی و درگاه شتابی رخش پی
                </div>
                <h2 className="text-[32px] leading-[46px] text-[#111827] font-extrabold">
                  گزارش‌گیری زنده و استعلام آنی تراکنش‌های بلوپال
                </h2>
                <p className="text-[16px] leading-[28px] text-[#4B5563] leading-relaxed">
                  در پیشخوان فروشندگان، وضعیت لحظه‌ای تراکنش‌های دریافتی، مبالغ کل فروش، درآمد امروز، تعداد تراکنش‌های موفق و تراکنش‌های معلق نمایش داده می‌شود. در صورت نیاز به بررسی مجدد هر فاکتور، دکمه استعلام و تایید دستی از سرور بلوپال در اختیار شما قرار دارد.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center px-6 h-12 rounded-xl bg-[#2848d3] text-white font-semibold text-[15px] hover:bg-[#1932B8] transition-all duration-200 shadow-xs"
                  >
                    تنظیم درگاه پرداخت من
                  </Link>
                  <a
                    href="#developers"
                    className="inline-flex items-center gap-2 justify-center px-6 h-12 rounded-xl bg-white border border-[#E5E7EB] text-[#111827] font-semibold text-[15px] hover:bg-[#F3F4F6] transition-all duration-200"
                  >
                    <span>تنظیمات افزونه وردپرس</span>
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                  </a>
                </div>

                {/* Bullet Matrix */}
                <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-[#E5E7EB] mt-4">
                  <div className="flex items-center gap-2 text-[#111827] font-medium text-[14px]">
                    <span className="material-symbols-outlined text-[#2848d3] text-xl font-bold">check</span>
                    <span>استعلام مجدد وب‌سرویس</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#111827] font-medium text-[14px]">
                    <span className="material-symbols-outlined text-[#2848d3] text-xl font-bold">check</span>
                    <span>۱۰ تراکنش اخیر زنده</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#111827] font-medium text-[14px]">
                    <span className="material-symbols-outlined text-[#2848d3] text-xl font-bold">check</span>
                    <span>کپی سریع شماره کارت</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#111827] font-medium text-[14px]">
                    <span className="material-symbols-outlined text-[#2848d3] text-xl font-bold">check</span>
                    <span>تست اتصال به بلوپال</span>
                  </div>
                </div>
              </div>

              {/* Graphic Terminal Preview */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-sm rounded-2xl bg-[#F3F4F6] p-6 border border-[#E5E7EB] shadow-md">
                  <div className="rounded-xl bg-white p-5 border border-[#E5E7EB] shadow-xs space-y-4">
                    <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-3">
                      <div>
                        <span className="text-[11px] font-bold text-[#9CA3AF] block">پیش‌نمایش پرداخت رخش پی</span>
                        <span className="text-[13px] font-bold text-[#111827]">درگاه کارت به کارت هوشمند</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-200">
                        فعال
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[12px] text-[#4B5563]">
                        <span>نام بانک مقصد:</span>
                        <span className="font-bold text-[#111827]">بانک ملی ایران</span>
                      </div>
                      <div className="flex justify-between text-[12px] text-[#4B5563]">
                        <span>شماره کارت:</span>
                        <span className="font-mono text-[13px] font-bold text-[#2848d3]" dir="ltr">۶۰۳۷ - ۹۹۱۸ - ۲۴۸۰ - ۸۲۹۴</span>
                      </div>
                      <div className="flex justify-between text-[12px] text-[#4B5563]">
                        <span>صاحب حساب:</span>
                        <span className="font-bold text-[#111827]">فروشنده رخش پی</span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="w-full h-11 rounded-lg bg-[#2848d3] text-white flex items-center justify-center font-bold text-[14px] shadow-xs gap-1.5">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        استعلام خودکار واریز
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= STORE & CATALOG SECTION ================= */}
        <section className="max-w-[1240px] mx-auto px-6 lg:px-8 py-10" id="store">
          <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-xl border border-slate-800">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7 space-y-5 text-right">
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-500/30">
                  فروشگاه و ویترین آنلاین
                </span>
                <h2 className="text-[26px] lg:text-[34px] font-extrabold leading-snug">
                  محصولات اختصاصی خود را بفروشید یا از کاتالوگ آماده تامین کنید
                </h2>
                <p className="text-[15px] text-slate-300 leading-relaxed">
                  فروشندگان به بخش مدیریت جامع محصولات دسترسی دارند. می‌توانید محصول جدید همراه با تصویر، توضیحات، دسته‌بندی، قیمت و موجودی انبار ایجاد کنید و مستقیماً در فروشگاه خود به فروش برسانید. همچنین کاتالوگ محصولات سیستمی نیز در پنل برای شما قابل مشاهده است.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-white text-slate-950 font-bold text-[14px] hover:bg-slate-100 transition-all"
                  >
                    <span>مشاهده پنل محصولات</span>
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">add_box</span>
                  </div>
                  <h4 className="font-bold text-[15px]">افزودن نامحدود</h4>
                  <p className="text-xs text-slate-400">ثبت انواع کالای فیزیکی و دیجیتال با تصویر و دسته‌بندی</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">pending_actions</span>
                  </div>
                  <h4 className="font-bold text-[15px]">سفارشات معلق</h4>
                  <p className="text-xs text-slate-400">پیگیری سفارشات پرداخت‌شده و در انتظار تایید خریداران</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">forum</span>
                  </div>
                  <h4 className="font-bold text-[15px]">چت با مدیریت</h4>
                  <p className="text-xs text-slate-400">ارتباط متنی داخلی و ارسال فایل به مدیر سیستم جهت پشتیبانی</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-xl">campaign</span>
                  </div>
                  <h4 className="font-bold text-[15px]">اطلاعیه‌ها</h4>
                  <p className="text-xs text-slate-400">دریافت سریع اخبار، بخشنامه‌ها و آپدیت‌های درگاه رخش پی</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= DEVELOPERS & WOOCOMMERCE SECTION ================= */}
        <section className="max-w-[1240px] mx-auto px-6 lg:px-8 py-10" id="developers">
          <div className="rounded-3xl bg-[#0F1A2D] border border-white/10 p-8 sm:p-12 lg:p-16 text-white shadow-xl relative overflow-hidden">
            {/* Ambient subtle glow */}
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#2848d3]/30 rounded-full blur-3xl pointer-events-none"></div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
              <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
                {/* Code Block / Terminal Preview */}
                <div className="w-full max-w-md rounded-2xl bg-black/40 border border-white/10 p-6 backdrop-blur-md shadow-2xl font-mono text-xs leading-relaxed text-[#c5ccff] text-left" dir="ltr">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-white/10">
                    <span className="w-3 h-3 rounded-full bg-[#EF4444]"></span>
                    <span className="w-3 h-3 rounded-full bg-[#ffba38]"></span>
                    <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
                    <span className="ml-2 text-[#c5c5d7] text-[11px]">rakhshpay-config.json</span>
                  </div>
                  <p className="text-[#c5c5d7]">// پیکربندی اختصاصی فروشنده</p>
                  <p><span className="text-[#ffba38]">const</span> userConfig = &#123;</p>
                  <p className="pl-4">role: <span className="text-[#10B981]">'seller'</span>,</p>
                  <p className="pl-4">gateway: <span className="text-[#10B981]">'Blupal C2C'</span>,</p>
                  <p className="pl-4">webhook: <span className="text-[#bac3ff]">'/api/blupal/webhook'</span>,</p>
                  <p className="pl-4">wooCommercePlugin: <span className="text-[#d7e2ff]">true</span>,</p>
                  <p className="pl-4">autoVerify: <span className="text-[#d7e2ff]">true</span></p>
                  <p>&#125;;</p>
                  <p className="mt-2 text-[#c5c5d7]">// دانلود خودکار پلاگین وردپرس از تب افزونه</p>
                  <p><span className="text-[#bac3ff]">downloadPluginZip</span>();</p>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col items-start gap-6 text-right order-1 lg:order-2">
                <span className="px-3 py-1 rounded-full bg-white/10 text-[#bac3ff] text-[11px] font-bold border border-white/10">
                  اتصال به وب‌سایت وردپرس
                </span>
                <h2 className="text-[24px] lg:text-[32px] leading-snug font-extrabold text-white">
                  افزونه اختصاصی ووکامرس برای فروشندگان رخش پی
                </h2>
                <p className="text-[16px] text-[#c5c5d7] leading-relaxed">
                  اگر فروشگاه ووکامرسی دارید، نیازی به توسعه اختصاصی ندارید! در تب «افزونه وردپرس» داشبورد فروشندگان، می‌توانید فایل ZIP افزونه درگاه پرداخت کارت به کارت را همراه با کلید وب‌سرویس اختصاصی (WP API Key) دانلود کرده و روی سایت خود فعال نمایید.
                </p>
                <div>
                  <Link
                    className="inline-flex items-center gap-2 px-6 h-12 rounded-xl bg-white text-[#0F1A2D] font-semibold text-[15px] hover:bg-[#F3F4F6] transition-all duration-200"
                    href="/login"
                  >
                    <span>ورود و دانلود افزونه وردپرس</span>
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                  </Link>
                </div>

                {/* Dev Quick Links Pills */}
                <div className="flex flex-wrap gap-3 pt-4 w-full">
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[13px] font-medium">
                    <span className="material-symbols-outlined text-base text-[#bac3ff]">key</span>
                    <span>صدور WP API Key اختصاصی</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[13px] font-medium">
                    <span className="material-symbols-outlined text-base text-[#bac3ff]">domain</span>
                    <span>تعیین دامنه مجاز وب‌سایت</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[13px] font-medium">
                    <span className="material-symbols-outlined text-base text-[#bac3ff]">webhook</span>
                    <span>وب‌هوک هوشمند تایید واریز</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FAQ ACCORDION ================= */}
        <section className="max-w-[860px] mx-auto px-6 lg:px-8 py-12" id="faq">
          <div className="text-center mb-10">
            <h2 className="text-[28px] lg:text-[32px] font-extrabold text-[#111827]">
              سوالات متداول فروشندگان
            </h2>
          </div>

          <div className="space-y-4">
            {/* FAQ 1 */}
            <details className="group rounded-2xl bg-white border border-[#E5E7EB] p-6 transition-all" open>
              <summary className="flex justify-between items-center cursor-pointer list-none text-[#111827] font-bold text-[18px]">
                <span>فروشندگان در رخش پی به چه امکاناتی دسترسی دارند؟</span>
                <span className="material-symbols-outlined transition-transform duration-200 group-open:rotate-180 text-[#4B5563]">keyboard_arrow_down</span>
              </summary>
              <div className="mt-4 pt-4 border-t border-[#E5E7EB] text-[14px] text-[#4B5563] leading-relaxed space-y-2">
                <p>فروشندگان و پذیرندگان به امکانات کامل زیر دسترسی دارند:</p>
                <ul className="list-disc pr-5 space-y-1">
                  <li>درگاه پرداخت کارت به کارت متصل به وب‌سرویس بلوپال</li>
                  <li>تنظیمات شماره کارت مقصد، نام صاحب حساب و سقف و کف پرداخت</li>
                  <li>لینک اشتراک‌گذاری صفحه پرداخت عمومی با اسلاگ اختصاصی</li>
                  <li>دانلود افزونه ووکامرس اختصاصی وردپرس با صدور کلید WP API</li>
                  <li>پیشخوان زنده آمار فروش و جدول ۱۰ تراکنش اخیر با امکان استعلام مجدد</li>
                  <li>مدیریت محصولات، افزودن محصول، لیست سفارشات در انتظار تایید و چت اختصاصی با مدیریت</li>
                </ul>
              </div>
            </details>

            {/* FAQ 2 */}
            <details className="group rounded-2xl bg-white border border-[#E5E7EB] p-6 transition-all">
              <summary className="flex justify-between items-center cursor-pointer list-none text-[#111827] font-bold text-[18px]">
                <span>چگونه درگاه پرداخت کارت به کارت خود را فعال کنم؟</span>
                <span className="material-symbols-outlined transition-transform duration-200 group-open:rotate-180 text-[#4B5563]">keyboard_arrow_down</span>
              </summary>
              <div className="mt-4 pt-4 border-t border-[#E5E7EB] text-[14px] text-[#4B5563] leading-relaxed">
                کافی است پس از ورود به حساب کاربری، به بخش «تنظیمات درگاه» بروید. در تب اول کلید دسترسی (API Key) خود را وارد کرده و دکمه تست اتصال را بزنید. سپس در تب کارت مقصد، شماره کارت بانکی ۱۶ رقمی خود را وارد نمایید. پس از ذخیره، لینک عمومی پرداخت شما بلافاصله فعال خواهد شد.
              </div>
            </details>

            {/* FAQ 3 */}
            <details className="group rounded-2xl bg-white border border-[#E5E7EB] p-6 transition-all">
              <summary className="flex justify-between items-center cursor-pointer list-none text-[#111827] font-bold text-[18px]">
                <span>چگونه درگاه رخش پی را به سایت وردپرس یا ووکامرس متصل کنم؟</span>
                <span className="material-symbols-outlined transition-transform duration-200 group-open:rotate-180 text-[#4B5563]">keyboard_arrow_down</span>
              </summary>
              <div className="mt-4 pt-4 border-t border-[#E5E7EB] text-[14px] text-[#4B5563] leading-relaxed">
                در منوی «تنظیمات درگاه»، به تب «افزونه وردپرس» مراجعه کنید. با کلیک بر روی صدور کلید، WP API Key اختصاصی شما تولید می‌شود. سپس با فشردن دکمه «دانلود فایل ZIP افزونه»، نسخه آماده افزونه را دریافت کرده و در بخش افزونه‌های وردپرس خود نصب و فعال کنید.
              </div>
            </details>

            {/* FAQ 4 */}
            <details className="group rounded-2xl bg-white border border-[#E5E7EB] p-6 transition-all">
              <summary className="flex justify-between items-center cursor-pointer list-none text-[#111827] font-bold text-[18px]">
                <span>در صورت بروز مشکل یا نیاز به راهنمایی چگونه با پشتیبانی ارتباط بگیرم؟</span>
                <span className="material-symbols-outlined transition-transform duration-200 group-open:rotate-180 text-[#4B5563]">keyboard_arrow_down</span>
              </summary>
              <div className="mt-4 pt-4 border-t border-[#E5E7EB] text-[14px] text-[#4B5563] leading-relaxed">
                فروشندگان از بخش «چت با مدیر» در پنل کاربری خود می‌توانند به طور مستقیم و برخط با مدیر سیستم پیام رد و بدل کنند. همچنین ویجت چت آنلاین در گوشه پایین صفحه لندینگ برای پاسخگویی به مهمانان و کاربران فعال است.
              </div>
            </details>
          </div>
        </section>

        {/* ================= BIG ACTION BANNER ================= */}
        <section className="max-w-[1240px] mx-auto px-6 lg:px-8 py-12">
          <div className="rounded-3xl bg-[#2848d3] text-white p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden shadow-2xl">
            {/* Glowing background sphere */}
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#1932B8] rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-6">
              <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <span className="material-symbols-outlined text-3xl text-[#ffba38]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <h2 className="text-[28px] lg:text-[44px] font-black tracking-tight text-white">
                شروع فعالیت در سامانه پذیرندگان رخش پی
              </h2>
              <p className="text-[16px] text-[#c5ccff]">
                همین حالا وارد پنل خود شوید و درگاه کارت به کارت اختصاصی خود را در کمتر از ۵ دقیقه راه‌اندازی کنید
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center px-8 h-12 rounded-xl bg-white text-[#2848d3] font-bold text-[15px] hover:bg-slate-50 shadow-lg active:scale-95 transition-all duration-200"
              >
                ورود به پنل فروشندگان
              </Link>
            </div>
          </div>
        </section>

        {/* ================= 24/7 SUPPORT STRIP ================= */}
        <section className="max-w-[1240px] mx-auto px-6 lg:px-8 pb-12">
          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
            <div className="flex items-center gap-4 text-right">
              <div className="w-12 h-12 rounded-xl bg-[#002db6]/10 text-[#002db6] flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>headset_mic</span>
              </div>
              <div>
                <h4 className="text-[18px] font-bold text-[#111827]">
                  پشتیبانی اختصاصی رخش پی
                </h4>
                <p className="text-[14px] text-[#4B5563] mt-0.5">
                  پاسخگویی آنلاین و چت اختصاصی برای پذیرندگان و خریداران
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 h-11 rounded-xl bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB] font-medium text-[13px] transition-colors"
            >
              <span>ارسال پیام به مدیریت</span>
              <span className="material-symbols-outlined text-lg">arrow_back</span>
            </Link>
          </div>
        </section>
      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white dark:bg-[#0F1A2D] border-t border-[#E5E7EB] dark:border-slate-800 transition-colors">
        <div className="flex flex-col w-full px-6 lg:px-8 py-12 max-w-[1240px] mx-auto">
          {/* Top Columns Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 pb-12 border-b border-[#E5E7EB] dark:border-slate-800 text-right">
            {/* Col 1 */}
            <div className="space-y-4">
              <h4 className="text-[18px] font-bold text-[#111827] dark:text-white">
                امکانات درگاه
              </h4>
              <ul className="space-y-2.5 text-[12px] text-[#4B5563] dark:text-slate-300">
                <li><a className="hover:text-[#002db6] dark:hover:text-[#bac3ff] transition-colors duration-200" href="#gateway">درگاه کارت به کارت</a></li>
                <li><a className="hover:text-[#002db6] dark:hover:text-[#bac3ff] transition-colors duration-200" href="#gateway">استعلام آنی بلوپال</a></li>
                <li><a className="hover:text-[#002db6] dark:hover:text-[#bac3ff] transition-colors duration-200" href="#gateway">لینک پرداخت با اسلاگ</a></li>
                <li><a className="hover:text-[#002db6] dark:hover:text-[#bac3ff] transition-colors duration-200" href="#developers">افزونه ووکامرس</a></li>
              </ul>
            </div>

            {/* Col 2 */}
            <div className="space-y-4">
              <h4 className="text-[18px] font-bold text-[#111827] dark:text-white">
                بخش فروشگاه
              </h4>
              <ul className="space-y-2.5 text-[12px] text-[#4B5563] dark:text-slate-300">
                <li><a className="hover:text-[#002db6] dark:hover:text-[#bac3ff] transition-colors duration-200" href="#store">محصولات فروشنده</a></li>
                <li><a className="hover:text-[#002db6] dark:hover:text-[#bac3ff] transition-colors duration-200" href="#store">افزودن محصول جدید</a></li>
                <li><a className="hover:text-[#002db6] dark:hover:text-[#bac3ff] transition-colors duration-200" href="#store">سفارشات در انتظار تایید</a></li>
                <li><a className="hover:text-[#002db6] dark:hover:text-[#bac3ff] transition-colors duration-200" href="#store">کاتالوگ آماده محصولات</a></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-4">
              <h4 className="text-[18px] font-bold text-[#111827] dark:text-white">
                دسترسی و پشتیبانی
              </h4>
              <ul className="space-y-2.5 text-[12px] text-[#4B5563] dark:text-slate-300">
                <li><Link className="hover:text-[#002db6] dark:hover:text-[#bac3ff] transition-colors duration-200" href="/login">ورود به پنل کاربری</Link></li>
                <li><a className="hover:text-[#002db6] dark:hover:text-[#bac3ff] transition-colors duration-200" href="#faq">سوالات متداول</a></li>
                <li><a className="hover:text-[#002db6] dark:hover:text-[#bac3ff] transition-colors duration-200" href="#features">امکانات فروشندگان</a></li>
                <li><Link className="hover:text-[#002db6] dark:hover:text-[#bac3ff] transition-colors duration-200" href="/login">چت داخلی با مدیریت</Link></li>
              </ul>
            </div>

            {/* Col 4: برند رخش پی و نمادها */}
            <div className="col-span-2 lg:col-span-2 flex flex-col items-start lg:items-end justify-between">
              <div className="space-y-3 text-right lg:text-left">
                <div className="text-[22px] font-extrabold text-[#0F1A2D] dark:text-white">
                  رخش پی
                </div>
                <p className="text-[12px] text-[#4B5563] dark:text-slate-300 max-w-xs leading-relaxed">
                  سامانه یکپارچه درگاه پرداخت کارت به کارت هوشمند، فروشگاه اختصاصی و خدمات فروش برای فروشندگان و پذیرندگان.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-16 h-20 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] flex flex-col items-center justify-center p-2 text-center shadow-inner">
                  <span className="material-symbols-outlined text-[#002db6] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span className="text-[9px] font-bold mt-1 text-[#111827]">رخش پی</span>
                </div>
                <div className="w-16 h-20 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] flex flex-col items-center justify-center p-2 text-center shadow-inner">
                  <span className="material-symbols-outlined text-[#ffba38] text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>security</span>
                  <span className="text-[9px] font-bold mt-1 text-[#111827]">امنیت ۲۵۶</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-[12px] text-[#4B5563] dark:text-slate-300">
              © سامانه رخش پی ۱۴۰۳. تمامی حقوق برای فروشندگان و پذیرندگان محفوظ است.
            </p>
            <div className="flex items-center gap-4 text-[#4B5563] dark:text-slate-300">
              <span className="text-xs font-semibold">پشتیبانی و وب‌سرویس مستقیم بلوپال</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Guest Chat Widget */}
      <GuestChatWidget />
    </div>
  );
}
