import React, { useState } from "react";
import { Link } from "wouter";
import { GuestChatWidget } from "@/components/guest-chat-widget";

export default function Home() {
  return (
    <div className="bg-[#f8f9fa] text-[#111827] antialiased min-h-screen flex flex-col justify-between selection:bg-[#bac3ff] selection:text-[#002db6] pt-16 sm:pt-20 overflow-x-hidden" dir="rtl">
      {/* ================= FIXED NAVBAR ================= */}
      <header className="fixed top-0 right-0 left-0 z-50 bg-white/95 dark:bg-[#0F1A2D]/95 backdrop-blur-md shadow-xs border-b border-[#E5E7EB] dark:border-slate-800 transition-all duration-200">
        <div className="flex justify-between items-center w-full px-4 sm:px-6 lg:px-8 max-w-[1240px] mx-auto h-16 sm:h-20">
          {/* Logo & Navigation Links Group */}
          <div className="flex items-center gap-4 md:gap-8 lg:gap-10 min-w-0">
            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0 min-w-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden shadow-sm group-hover:scale-105 transition-transform duration-200 shrink-0 border border-amber-500/20">
                <img 
                  src="/images/rakhsh_logo.jpg" 
                  alt="رخش پی" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[17px] sm:text-[20px] font-extrabold text-[#0F1A2D] dark:text-white tracking-wider leading-tight font-mono uppercase">
                  RAKHSH-PAY
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
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 sm:px-6 sm:h-12 rounded-xl bg-[#2848d3] text-white font-semibold text-[13px] sm:text-[15px] shadow-xs hover:bg-[#1932B8] hover:shadow-[0_8px_20px_rgba(40,72,211,0.28)] active:scale-95 transition-all duration-200 whitespace-nowrap"
            >
              <span className="sm:hidden">ورود</span>
              <span className="hidden sm:inline">ورود به پنل فروشندگان</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full flex-1">
        {/* ================= HERO SECTION ================= */}
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-10 sm:pb-16">
          <div className="relative rounded-2xl sm:rounded-3xl bg-[#0F1A2D] overflow-hidden p-5 sm:p-8 md:p-12 lg:p-16 border border-white/10 shadow-2xl">
            {/* Soft Background Light Bleeds */}
            <div className="absolute top-0 right-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-[#2848d3]/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-10 -left-10 w-60 sm:w-80 h-60 sm:h-80 bg-[#ffba38]/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              {/* Hero Text Content */}
              <div className="lg:col-span-7 flex flex-col items-start gap-4 sm:gap-6 text-right">
                <h1 className="text-[22px] sm:text-[28px] md:text-[36px] lg:text-[44px] font-black leading-[34px] sm:leading-[42px] md:leading-[50px] lg:leading-[60px] text-white tracking-tight">
                  سامانه یکپارچه درگاه پرداخت، فروشگاه آنلاین و مدیریت فروش
                </h1>

                <p className="text-[13px] sm:text-[15px] lg:text-[16px] leading-[24px] sm:leading-[27px] lg:leading-[28px] text-[#c5c5d7] max-w-xl leading-relaxed">
                  رخش پی بستری جامع برای فروشندگان فراهم کرده تا بدون نیاز به دانش فنی، درگاه پرداخت اختصاصی کارت به کارت با لینک اختصاصی، افزونه ووکامرس، فروشگاه اینترنتی مستقل و ابزار مدیریت سفارش‌ها را در یک پنل هوشمند دریافت کنند.
                </p>
              </div>

              {/* Hero Graphic Card Mockup & Action */}
              <div className="lg:col-span-5 flex flex-col justify-center items-center relative w-full gap-4 sm:gap-5">
                <div className="relative w-full max-w-[300px] sm:max-w-[340px] aspect-[1.586/1] rounded-2xl bg-gradient-to-br from-white/15 via-white/10 to-white/5 p-4 sm:p-5 border border-white/15 backdrop-blur-xl shadow-xl flex flex-col justify-between overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#2848d3]/30 rounded-full blur-2xl pointer-events-none"></div>
                  
                  {/* Card Top Row */}
                  <div className="flex justify-between items-center z-10">
                    <div className="flex items-center gap-2 text-white">
                      <span className="material-symbols-outlined text-xl sm:text-2xl text-[#ffba38]" style={{ fontVariationSettings: "'FILL' 1" }}>credit_card</span>
                      <span className="text-[14px] sm:text-[15px] font-bold tracking-tight">RakhshPay C2C</span>
                    </div>
                    <span className="material-symbols-outlined text-white/70 text-lg sm:text-xl">contactless</span>
                  </div>

                  {/* Card Middle: Pan Number */}
                  <div className="my-auto py-1 z-10 flex justify-center items-center w-full">
                    <div className="font-mono text-sm sm:text-base text-white tracking-widest font-semibold drop-shadow-sm text-center" dir="ltr">
                      ۶۰۳۷ •••• •••• ۸۲۹۴
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex justify-between items-end text-[#c5c5d7] text-[10px] font-bold z-10 pt-1 border-t border-white/10">
                    <div>
                      <div className="text-[9px] uppercase text-white/60">وضعیت درگاه</div>
                      <div className="text-white font-medium text-[11px] mt-0.5">فروشنده تاییدشده</div>
                    </div>
                    <div className="text-left">
                      <div className="text-[9px] uppercase text-white/60">تایید خودکار</div>
                      <div className="text-[#10B981] font-semibold text-[11px] mt-0.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">check_circle</span>
                        استعلام آنی
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call to action button placed directly under the card */}
                <div className="w-full max-w-[300px] sm:max-w-[340px] z-10">
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center w-full px-6 sm:px-8 h-11 sm:h-12 rounded-xl bg-[#2848d3] text-white font-semibold text-[14px] sm:text-[15px] hover:bg-[#1932B8] hover:shadow-[0_8px_20px_rgba(40,72,211,0.35)] active:scale-98 transition-all duration-200 text-center shadow-lg"
                  >
                    ورود به پنل فروشندگان
                  </Link>
                </div>
              </div>
            </div>

            {/* Indicator Notch */}
            <div className="hidden sm:block absolute bottom-2 left-1/2 -translate-x-1/2 text-white/40 hover:text-white transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-2xl animate-bounce">expand_more</span>
            </div>
          </div>
        </section>

        {/* ================= BRAND & INTEGRATION STRIP ================= */}
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="grid grid-cols-2 min-[540px]:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 items-center justify-items-center gap-4 sm:gap-6 lg:gap-4 xl:gap-6 py-4 sm:py-6 opacity-90 lg:opacity-80 hover:opacity-100 transition-all duration-300 border-y border-[#E5E7EB] dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-[#4B5563] dark:text-slate-300 text-[13px] sm:text-[14px] lg:text-[13.5px] xl:text-[15px] whitespace-nowrap">
              <span className="material-symbols-outlined text-[#002db6] dark:text-[#bac3ff] text-xl sm:text-2xl shrink-0">credit_card</span>
              <span>کارت به کارت شتاب</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-[#4B5563] dark:text-slate-300 text-[13px] sm:text-[14px] lg:text-[13.5px] xl:text-[15px] whitespace-nowrap">
              <span className="material-symbols-outlined text-[#002db6] dark:text-[#bac3ff] text-xl sm:text-2xl shrink-0">api</span>
              <span>وب‌سرویس بلوپال</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-[#4B5563] dark:text-slate-300 text-[13px] sm:text-[14px] lg:text-[13.5px] xl:text-[15px] whitespace-nowrap">
              <span className="material-symbols-outlined text-[#002db6] dark:text-[#bac3ff] text-xl sm:text-2xl shrink-0">shopping_cart</span>
              <span>افزونه ووکامرس وردپرس</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-[#4B5563] dark:text-slate-300 text-[13px] sm:text-[14px] lg:text-[13.5px] xl:text-[15px] whitespace-nowrap">
              <span className="material-symbols-outlined text-[#002db6] dark:text-[#bac3ff] text-xl sm:text-2xl shrink-0">storefront</span>
              <span>فروشگاه اختصاصی</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-[#4B5563] dark:text-slate-300 text-[13px] sm:text-[14px] lg:text-[13.5px] xl:text-[15px] whitespace-nowrap">
              <span className="material-symbols-outlined text-[#002db6] dark:text-[#bac3ff] text-xl sm:text-2xl shrink-0">share</span>
              <span>پرداخت با اسلاگ</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-[#4B5563] dark:text-slate-300 text-[13px] sm:text-[14px] lg:text-[13.5px] xl:text-[15px] whitespace-nowrap">
              <span className="material-symbols-outlined text-[#002db6] dark:text-[#bac3ff] text-xl sm:text-2xl shrink-0">chat</span>
              <span>پشتیبانی و چت</span>
            </div>
          </div>
        </section>

        {/* ================= 4 KEY PILLARS: SELLER CAPABILITIES ================= */}
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12" id="features">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-[22px] sm:text-[28px] lg:text-[32px] font-extrabold text-[#111827] dark:text-white">
              امکانات و ابزارهای فروشندگان رخش پی
            </h2>
            <p className="text-[13px] sm:text-[15px] text-[#4B5563] dark:text-slate-400 mt-2 max-w-2xl mx-auto px-2">
              تمام ابزارهایی که برای فروش اینترنتی، دریافت پول و مدیریت کسب‌وکار خود نیاز دارید، در داشبورد فروشندگان آماده استفاده است.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Pillar 1: درگاه اختصاصی کارت به کارت */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0F1A2D] border border-[#E5E7EB] dark:border-slate-800 shadow-xs hover:shadow-md hover:border-[#bac3ff] transition-all duration-200 flex flex-col items-start gap-3 sm:gap-4 text-right">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#F3F4F6] dark:bg-slate-800 text-[#002db6] dark:text-[#bac3ff] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>credit_score</span>
              </div>
              <h3 className="text-[16px] sm:text-[18px] text-[#111827] dark:text-white font-bold">
                درگاه کارت به کارت خودکار
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#4B5563] dark:text-slate-400 leading-relaxed">
                اتصال مستقیم به وب‌سرویس بلوپال با ثبت API Key، تشخیص خودکار نام بانک از شماره کارت، استعلام لحظه‌ای و تایید خودکار واریز مشتریان.
              </p>
            </div>

            {/* Pillar 2: صفحه پرداخت و لینک اشتراک‌گذاری */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0F1A2D] border border-[#E5E7EB] dark:border-slate-800 shadow-xs hover:shadow-md hover:border-[#bac3ff] transition-all duration-200 flex flex-col items-start gap-3 sm:gap-4 text-right">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#F3F4F6] dark:bg-slate-800 text-[#002db6] dark:text-[#bac3ff] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>link</span>
              </div>
              <h3 className="text-[16px] sm:text-[18px] text-[#111827] dark:text-white font-bold">
                صفحه پرداخت اختصاصی
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#4B5563] dark:text-slate-400 leading-relaxed">
                لینک اختصاصی بر اساس نام کاربری یا اسلاگ دلخواه همراه با تنظیم نام درگاه، پیام تشکر، شماره پشتیبانی و تعیین سقف و کف مبالغ تراکنش.
              </p>
            </div>

            {/* Pillar 3: فروشگاه و مدیریت محصولات */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0F1A2D] border border-[#E5E7EB] dark:border-slate-800 shadow-xs hover:shadow-md hover:border-[#bac3ff] transition-all duration-200 flex flex-col items-start gap-3 sm:gap-4 text-right">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#F3F4F6] dark:bg-slate-800 text-[#002db6] dark:text-[#bac3ff] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
              </div>
              <h3 className="text-[16px] sm:text-[18px] text-[#111827] dark:text-white font-bold">
                مدیریت محصولات و سفارشات
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#4B5563] dark:text-slate-400 leading-relaxed">
                امکان افزودن و ویرایش محصولات، تنظیم قیمت و موجودی، مشاهده سفارشات در انتظار تایید، و دسترسی به کاتالوگ محصولات سیستمی.
              </p>
            </div>

            {/* Pillar 4: افزونه ووکامرس و چت اختصاصی */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#0F1A2D] border border-[#E5E7EB] dark:border-slate-800 shadow-xs hover:shadow-md hover:border-[#bac3ff] transition-all duration-200 flex flex-col items-start gap-3 sm:gap-4 text-right">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-[#F3F4F6] dark:bg-slate-800 text-[#002db6] dark:text-[#bac3ff] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>integration_instructions</span>
              </div>
              <h3 className="text-[16px] sm:text-[18px] text-[#111827] dark:text-white font-bold">
                افزونه ووکامرس و چت با مدیر
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#4B5563] dark:text-slate-400 leading-relaxed">
                دانلود مستقیم افزونه آماده وردپرس با تنظیمات از پیش‌پیکربندی‌شده برای سایت شما، به همراه چت اختصاصی داخلی با مدیریت سامانه.
              </p>
            </div>
          </div>
        </section>

        {/* ================= CORE PRODUCT SECTION: IPG & DASHBOARD ================= */}
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10" id="gateway">
          <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0F1A2D] border border-[#E5E7EB] dark:border-slate-800 p-5 sm:p-8 md:p-12 lg:p-16 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
              {/* Content Left (RTL Right) */}
              <div className="lg:col-span-7 flex flex-col items-start gap-4 sm:gap-6 text-right">
                <div className="text-[#002db6] dark:text-[#bac3ff] text-[12px] sm:text-[13px] font-bold tracking-wide">
                  پیشخوان مالی و درگاه شتابی رخش پی
                </div>
                <h2 className="text-[22px] sm:text-[28px] lg:text-[32px] leading-[34px] sm:leading-[42px] lg:leading-[46px] text-[#111827] dark:text-white font-extrabold">
                  گزارش‌گیری زنده و استعلام آنی تراکنش‌های بلوپال
                </h2>
                <p className="text-[13px] sm:text-[15px] lg:text-[16px] leading-[24px] sm:leading-[27px] lg:leading-[28px] text-[#4B5563] dark:text-slate-400 leading-relaxed">
                  در پیشخوان فروشندگان، وضعیت لحظه‌ای تراکنش‌های دریافتی، مبالغ کل فروش، درآمد امروز، تعداد تراکنش‌های موفق و تراکنش‌های معلق نمایش داده می‌شود. در صورت نیاز به بررسی مجدد هر فاکتور، دکمه استعلام و تایید دستی از سرور بلوپال در اختیار شما قرار دارد.
                </p>

                {/* Bullet Matrix */}
                <div className="w-full grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-6 sm:pt-8 border-t border-[#E5E7EB] dark:border-slate-800 mt-2 sm:mt-4">
                  <div className="flex items-center gap-2 text-[#111827] dark:text-slate-200 font-medium text-[13px] sm:text-[14px]">
                    <span className="material-symbols-outlined text-[#2848d3] dark:text-[#bac3ff] text-xl font-bold shrink-0">check</span>
                    <span>استعلام مجدد وب‌سرویس</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#111827] dark:text-slate-200 font-medium text-[13px] sm:text-[14px]">
                    <span className="material-symbols-outlined text-[#2848d3] dark:text-[#bac3ff] text-xl font-bold shrink-0">check</span>
                    <span>۱۰ تراکنش اخیر زنده</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#111827] dark:text-slate-200 font-medium text-[13px] sm:text-[14px]">
                    <span className="material-symbols-outlined text-[#2848d3] dark:text-[#bac3ff] text-xl font-bold shrink-0">check</span>
                    <span>کپی سریع شماره کارت</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#111827] dark:text-slate-200 font-medium text-[13px] sm:text-[14px]">
                    <span className="material-symbols-outlined text-[#2848d3] dark:text-[#bac3ff] text-xl font-bold shrink-0">check</span>
                    <span>تست اتصال به بلوپال</span>
                  </div>
                </div>
              </div>

              {/* Graphic Terminal Preview */}
              <div className="lg:col-span-5 flex justify-center w-full">
                <div className="relative w-full max-w-[320px] sm:max-w-sm rounded-2xl bg-[#F3F4F6] dark:bg-slate-800/80 p-4 sm:p-6 border border-[#E5E7EB] dark:border-slate-700 shadow-md">
                  <div className="rounded-xl bg-white dark:bg-[#0F1A2D] p-4 sm:p-5 border border-[#E5E7EB] dark:border-slate-800 shadow-xs space-y-3 sm:space-y-4">
                    <div className="flex justify-between items-center border-b border-[#E5E7EB] dark:border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] sm:text-[11px] font-bold text-[#9CA3AF] block">پیش‌نمایش پرداخت رخش پی</span>
                        <span className="text-[12px] sm:text-[13px] font-bold text-[#111827] dark:text-white">درگاه کارت به کارت هوشمند</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                        فعال
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[11px] sm:text-[12px] text-[#4B5563] dark:text-slate-300">
                        <span>نام بانک مقصد:</span>
                        <span className="font-bold text-[#111827] dark:text-white">بانک ملی ایران</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] sm:text-[12px] text-[#4B5563] dark:text-slate-300">
                        <span>شماره کارت:</span>
                        <span className="font-mono text-[11px] sm:text-[13px] font-bold text-[#2848d3] dark:text-[#bac3ff]" dir="ltr">۶۰۳۷ - ۹۹۱۸ - ۲۴۸۰ - ۸۲۹۴</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] sm:text-[12px] text-[#4B5563] dark:text-slate-300">
                        <span>صاحب حساب:</span>
                        <span className="font-bold text-[#111827] dark:text-white">فروشنده رخش پی</span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <div className="w-full h-10 sm:h-11 rounded-lg bg-[#2848d3] text-white flex items-center justify-center font-bold text-[13px] sm:text-[14px] shadow-xs gap-1.5">
                        <span className="material-symbols-outlined text-base sm:text-lg">check_circle</span>
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
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10" id="store">
          <div className="rounded-2xl sm:rounded-3xl bg-slate-900 text-white p-5 sm:p-8 md:p-12 lg:p-16 relative overflow-hidden shadow-xl border border-slate-800">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
              <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-right">
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] sm:text-[11px] font-bold border border-indigo-500/30">
                  فروشگاه و ویترین آنلاین
                </span>
                <h2 className="text-[20px] sm:text-[26px] lg:text-[34px] font-extrabold leading-snug">
                  محصولات اختصاصی خود را بفروشید یا از کاتالوگ آماده تامین کنید
                </h2>
                <p className="text-[13px] sm:text-[15px] text-slate-300 leading-relaxed">
                  فروشندگان به بخش مدیریت جامع محصولات دسترسی دارند. می‌توانید محصول جدید همراه با تصویر، توضیحات، دسته‌بندی، قیمت و موجودی انبار ایجاد کنید و مستقیماً در فروشگاه خود به فروش برسانید. همچنین کاتالوگ محصولات سیستمی نیز در پنل برای شما قابل مشاهده است.
                </p>
              </div>

              <div className="lg:col-span-5 grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4 w-full">
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 space-y-1.5 sm:space-y-2">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-lg sm:text-xl">add_box</span>
                  </div>
                  <h4 className="font-bold text-[14px] sm:text-[15px]">افزودن نامحدود</h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">ثبت انواع کالای فیزیکی و دیجیتال با تصویر و دسته‌بندی</p>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 space-y-1.5 sm:space-y-2">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-lg sm:text-xl">pending_actions</span>
                  </div>
                  <h4 className="font-bold text-[14px] sm:text-[15px]">سفارشات معلق</h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">پیگیری سفارشات پرداخت‌شده و در انتظار تایید خریداران</p>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 space-y-1.5 sm:space-y-2">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-lg sm:text-xl">forum</span>
                  </div>
                  <h4 className="font-bold text-[14px] sm:text-[15px]">چت با مدیریت</h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">ارتباط متنی داخلی و ارسال فایل به مدیر سیستم جهت پشتیبانی</p>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 space-y-1.5 sm:space-y-2">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined text-lg sm:text-xl">campaign</span>
                  </div>
                  <h4 className="font-bold text-[14px] sm:text-[15px]">اطلاعیه‌ها</h4>
                  <p className="text-[11px] sm:text-xs text-slate-400 leading-relaxed">دریافت سریع اخبار، بخشنامه‌ها و آپدیت‌های درگاه رخش پی</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= DEVELOPERS & WOOCOMMERCE SECTION ================= */}
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10" id="developers">
          <div className="rounded-2xl sm:rounded-3xl bg-[#0F1A2D] border border-white/10 p-5 sm:p-8 md:p-12 lg:p-16 text-white shadow-xl relative overflow-hidden">
            {/* Ambient subtle glow */}
            <div className="absolute -top-20 -left-20 w-72 sm:w-80 h-72 sm:h-80 bg-[#2848d3]/30 rounded-full blur-3xl pointer-events-none"></div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
              <div className="lg:col-span-5 flex justify-center order-2 lg:order-1 w-full">
                {/* Code Block / Terminal Preview */}
                <div className="w-full max-w-full sm:max-w-md rounded-2xl bg-black/50 border border-white/10 p-4 sm:p-6 backdrop-blur-md shadow-2xl font-mono text-[11px] sm:text-xs leading-relaxed text-[#c5ccff] text-left overflow-x-auto" dir="ltr">
                  <div className="flex items-center gap-2 mb-3 sm:mb-4 pb-2 border-b border-white/10">
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#EF4444]"></span>
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#ffba38]"></span>
                    <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#10B981]"></span>
                    <span className="ml-2 text-[#c5c5d7] text-[10px] sm:text-[11px]">rakhshpay-config.json</span>
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

              <div className="lg:col-span-7 flex flex-col items-start gap-4 sm:gap-6 text-right order-1 lg:order-2">
                <span className="px-3 py-1 rounded-full bg-white/10 text-[#bac3ff] text-[10px] sm:text-[11px] font-bold border border-white/10">
                  اتصال به وب‌سایت وردپرس
                </span>
                <h2 className="text-[20px] sm:text-[24px] lg:text-[32px] leading-snug font-extrabold text-white">
                  افزونه اختصاصی ووکامرس برای فروشندگان رخش پی
                </h2>
                <p className="text-[13px] sm:text-[15px] lg:text-[16px] text-[#c5c5d7] leading-relaxed">
                  اگر فروشگاه ووکامرسی دارید، نیازی به توسعه اختصاصی ندارید! در تب «افزونه وردپرس» داشبورد فروشندگان، می‌توانید فایل ZIP افزونه درگاه پرداخت کارت به کارت را همراه با کلید وب‌سرویس اختصاصی (WP API Key) دانلود کرده و روی سایت خود فعال نمایید.
                </p>

                {/* Dev Quick Links Pills */}
                <div className="flex flex-col min-[420px]:flex-row flex-wrap gap-2 sm:gap-3 pt-3 sm:pt-4 w-full">
                  <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[12px] sm:text-[13px] font-medium">
                    <span className="material-symbols-outlined text-base text-[#bac3ff] shrink-0">key</span>
                    <span>صدور WP API Key اختصاصی</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[12px] sm:text-[13px] font-medium">
                    <span className="material-symbols-outlined text-base text-[#bac3ff] shrink-0">domain</span>
                    <span>تعیین دامنه مجاز وب‌سایت</span>
                  </div>
                  <div className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-[12px] sm:text-[13px] font-medium">
                    <span className="material-symbols-outlined text-base text-[#bac3ff] shrink-0">webhook</span>
                    <span>وب‌هوک هوشمند تایید واریز</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FAQ ACCORDION ================= */}
        <section className="max-w-[860px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12" id="faq">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-[22px] sm:text-[28px] lg:text-[32px] font-extrabold text-[#111827] dark:text-white">
              سوالات متداول فروشندگان
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {/* FAQ 1 */}
            <details className="group rounded-xl sm:rounded-2xl bg-white dark:bg-[#0F1A2D] border border-[#E5E7EB] dark:border-slate-800 p-4 sm:p-6 transition-all" open>
              <summary className="flex justify-between items-center cursor-pointer list-none text-[#111827] dark:text-white font-bold text-[15px] sm:text-[18px] leading-snug gap-3">
                <span>فروشندگان در رخش پی به چه امکاناتی دسترسی دارند؟</span>
                <span className="material-symbols-outlined transition-transform duration-200 group-open:rotate-180 text-[#4B5563] dark:text-slate-400 shrink-0 text-xl sm:text-2xl">keyboard_arrow_down</span>
              </summary>
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#E5E7EB] dark:border-slate-800 text-[13px] sm:text-[14px] text-[#4B5563] dark:text-slate-400 leading-relaxed space-y-2">
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
            <details className="group rounded-xl sm:rounded-2xl bg-white dark:bg-[#0F1A2D] border border-[#E5E7EB] dark:border-slate-800 p-4 sm:p-6 transition-all">
              <summary className="flex justify-between items-center cursor-pointer list-none text-[#111827] dark:text-white font-bold text-[15px] sm:text-[18px] leading-snug gap-3">
                <span>چگونه درگاه پرداخت کارت به کارت خود را فعال کنم؟</span>
                <span className="material-symbols-outlined transition-transform duration-200 group-open:rotate-180 text-[#4B5563] dark:text-slate-400 shrink-0 text-xl sm:text-2xl">keyboard_arrow_down</span>
              </summary>
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#E5E7EB] dark:border-slate-800 text-[13px] sm:text-[14px] text-[#4B5563] dark:text-slate-400 leading-relaxed">
                کافی است پس از ورود به حساب کاربری، به بخش «تنظیمات درگاه» بروید. در تب اول کلید دسترسی (API Key) خود را وارد کرده و دکمه تست اتصال را بزنید. سپس در تب کارت مقصد، شماره کارت بانکی ۱۶ رقمی خود را وارد نمایید. پس از ذخیره، لینک عمومی پرداخت شما بلافاصله فعال خواهد شد.
              </div>
            </details>

            {/* FAQ 3 */}
            <details className="group rounded-xl sm:rounded-2xl bg-white dark:bg-[#0F1A2D] border border-[#E5E7EB] dark:border-slate-800 p-4 sm:p-6 transition-all">
              <summary className="flex justify-between items-center cursor-pointer list-none text-[#111827] dark:text-white font-bold text-[15px] sm:text-[18px] leading-snug gap-3">
                <span>چگونه درگاه رخش پی را به سایت وردپرس یا ووکامرس متصل کنم؟</span>
                <span className="material-symbols-outlined transition-transform duration-200 group-open:rotate-180 text-[#4B5563] dark:text-slate-400 shrink-0 text-xl sm:text-2xl">keyboard_arrow_down</span>
              </summary>
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#E5E7EB] dark:border-slate-800 text-[13px] sm:text-[14px] text-[#4B5563] dark:text-slate-400 leading-relaxed">
                در منوی «تنظیمات درگاه»، به تب «افزونه وردپرس» مراجعه کنید. با کلیک بر روی صدور کلید، WP API Key اختصاصی شما تولید می‌شود. سپس با فشردن دکمه «دانلود فایل ZIP افزونه»، نسخه آماده افزونه را دریافت کرده و در بخش افزونه‌های وردپرس خود نصب و فعال کنید.
              </div>
            </details>

            {/* FAQ 4 */}
            <details className="group rounded-xl sm:rounded-2xl bg-white dark:bg-[#0F1A2D] border border-[#E5E7EB] dark:border-slate-800 p-4 sm:p-6 transition-all">
              <summary className="flex justify-between items-center cursor-pointer list-none text-[#111827] dark:text-white font-bold text-[15px] sm:text-[18px] leading-snug gap-3">
                <span>در صورت بروز مشکل یا نیاز به راهنمایی چگونه با پشتیبانی ارتباط بگیرم؟</span>
                <span className="material-symbols-outlined transition-transform duration-200 group-open:rotate-180 text-[#4B5563] dark:text-slate-400 shrink-0 text-xl sm:text-2xl">keyboard_arrow_down</span>
              </summary>
              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-[#E5E7EB] dark:border-slate-800 text-[13px] sm:text-[14px] text-[#4B5563] dark:text-slate-400 leading-relaxed">
                فروشندگان از بخش «چت با مدیر» در پنل کاربری خود می‌توانند به طور مستقیم و برخط با مدیر سیستم پیام رد و بدل کنند. همچنین ویجت چت آنلاین در گوشه پایین صفحه لندینگ برای پاسخگویی به مهمانان و کاربران فعال است.
              </div>
            </details>
          </div>
        </section>

        {/* ================= BIG ACTION BANNER ================= */}
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="rounded-2xl sm:rounded-3xl bg-[#2848d3] text-white p-6 sm:p-10 lg:p-16 text-center relative overflow-hidden shadow-2xl">
            {/* Glowing background sphere */}
            <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 sm:w-96 h-80 sm:h-96 bg-[#1932B8] rounded-full blur-3xl opacity-60 pointer-events-none"></div>
            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-4 sm:gap-6">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                <span className="material-symbols-outlined text-2xl sm:text-3xl text-[#ffba38]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <h2 className="text-[22px] sm:text-[28px] lg:text-[44px] font-black tracking-tight text-white leading-tight sm:leading-snug">
                شروع فعالیت در سامانه پذیرندگان رخش پی
              </h2>
              <p className="text-[13px] sm:text-[15px] lg:text-[16px] text-[#c5ccff] max-w-xl">
                همین حالا وارد پنل خود شوید و درگاه کارت به کارت اختصاصی خود را در کمتر از ۵ دقیقه راه‌اندازی کنید
              </p>
              <Link
                href="/login"
                className="inline-flex items-center justify-center w-full sm:w-auto px-6 sm:px-8 h-11 sm:h-12 rounded-xl bg-white text-[#2848d3] font-bold text-[14px] sm:text-[15px] hover:bg-slate-50 shadow-lg active:scale-98 transition-all duration-200 text-center"
              >
                ورود به پنل فروشندگان
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ================= FOOTER ================= */}
      <footer className="bg-white dark:bg-[#0F1A2D] border-t border-[#E5E7EB] dark:border-slate-800 transition-colors">
        <div className="flex flex-col w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-[1240px] mx-auto">
          {/* Top Brand & Badges */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-6 pb-8 sm:pb-10 border-b border-[#E5E7EB] dark:border-slate-800 text-center sm:text-right">
            <div className="space-y-2 text-center sm:text-right">
              <p className="text-[12px] text-[#4B5563] dark:text-slate-300 max-w-md leading-relaxed">
                سامانه یکپارچه درگاه پرداخت کارت به کارت هوشمند، فروشگاه اختصاصی و خدمات فروش برای فروشندگان و پذیرندگان.
              </p>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-4 w-full sm:w-auto">
              <a
                href="https://blubank.com/"
                target="_blank"
                rel="noopener noreferrer"
                title="بلوبانک"
                className="transition-transform hover:scale-105 active:scale-95 shrink-0"
              >
                <img
                  src="/images/blubank.webp"
                  alt="بلوبانک"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = "/images/blubank.png";
                  }}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shadow-md object-cover"
                />
              </a>
              <a
                href="https://www.blupal.net/"
                target="_blank"
                rel="noopener noreferrer"
                title="blupal"
                className="transition-transform hover:scale-105 active:scale-95 shrink-0 flex items-center justify-center"
              >
                <img
                  src="/images/blupal.svg"
                  alt="blupal"
                  referrerPolicy="no-referrer"
                  className="h-10 sm:h-12 w-auto object-contain"
                />
              </a>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="pt-6 sm:pt-8 flex flex-col items-center justify-center text-center">
            <p className="text-[11px] sm:text-[12px] text-[#4B5563] dark:text-slate-300 text-center">
              © سامانه رخش پی ۱۴۰۳. تمامی حقوق برای فروشندگان و پذیرندگان محفوظ است.
            </p>
          </div>
        </div>
      </footer>

      {/* Guest Chat Widget */}
      <GuestChatWidget />
    </div>
  );
}
