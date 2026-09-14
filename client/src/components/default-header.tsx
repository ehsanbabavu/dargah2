import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Menu, X, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import ariyaBotImage from "@assets/image_1765732617867_1767460337176.jpeg";

interface DefaultHeaderProps {
  forceDefault?: boolean;
}

export function DefaultHeader({ forceDefault = false }: DefaultHeaderProps = {}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [location, setLocation] = useLocation();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(80);

  const { data: config } = useQuery<{ activeHeaderHtml?: string | null; mode?: string }>({
    queryKey: ["/api/landing/public-config"],
    queryFn: async () => {
      const res = await fetch("/api/landing/public-config");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30000,
  });

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === "TEMPLATE_SECTION_HEIGHT" && event.data.section === "header") {
        if (event.data.height && event.data.height > 20) {
          setIframeHeight(event.data.height);
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const handleIframeLoad = () => {
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const doc = iframeRef.current.contentWindow.document;
        if (doc && doc.body) {
          const h = Math.max(
            doc.body.scrollHeight || 0,
            doc.documentElement.scrollHeight || 0,
            doc.body.offsetHeight || 0
          );
          if (h > 20) {
            setIframeHeight(h);
          }
        }
      }
    } catch (e) {}
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // If a custom template is active and has an extracted header and not forced default, render it pure
  if (!forceDefault && (config?.activeHeaderHtml || config?.mode === "custom")) {
    return (
      <header className="w-full relative z-50 overflow-hidden" id="custom-template-header">
        <iframe
          ref={iframeRef}
          src="/api/landing/template-section?section=header"
          title="هدر قالب اختصاصی"
          onLoad={handleIframeLoad}
          className="w-full border-0 block"
          style={{ height: `${iframeHeight}px`, minHeight: "68px", overflow: "hidden" }}
          scrolling="no"
        />
      </header>
    );
  }

  const navItems = [
    { name: "خانه", href: "#home" },
    { name: "درباره", href: "#videos-section" },
    { name: "خدمات", href: "#services" },
    { name: "اشتراک ها", href: "#news" },
    { name: "اخرین اخبار", href: "#pricing" },
    { name: "سوالات متداول", href: "#faq" },
    { name: "ارتباط با ما", href: "#contact" },
  ];

  const handleNavClick = (href: string) => {
    if (href === "#home" || href === "#" || href === "#top") {
      if (location === "/" || location === "/public-landing" || location === "/preview-landing") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setLocation("/");
      return;
    }
    if (location === "/" || location === "/public-landing" || location === "/preview-landing") {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    setLocation("/" + href);
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-gray-100/95 backdrop-blur-md border-b border-gray-300 shadow-lg"
          : "bg-white/80 backdrop-blur-md"
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 cursor-pointer">
            <motion.img
              src="/images/rakhsh_logo.jpg"
              alt="رخش پی"
              className="w-10 h-10 rounded-xl object-cover shadow-md border border-amber-500/20"
              whileHover={{ scale: 1.05 }}
              referrerPolicy="no-referrer"
            />
            <span className="text-xl font-bold text-gray-900 tracking-tight">رخش پی</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavClick(item.href)}
                className="text-gray-600 hover:text-purple-600 font-medium transition-colors relative group bg-none border-none cursor-pointer"
              >
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-purple-600 transition-all group-hover:w-full"></span>
              </button>
            ))}
          </div>

          {/* Signup Button - Desktop */}
          <div className="hidden md:block">
            <Link href="/login">
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-2.5 rounded-lg shadow-md shadow-green-500/20 transition-all hover:shadow-green-500/40 hover:-translate-y-0.5 font-bold text-sm cursor-pointer">
                ورود و ثبت نام
              </Button>
            </Link>
          </div>

          {/* Mobile Menu - Signup Icon + Toggle */}
          <div className="md:hidden flex items-center gap-3">
            <Link href="/login" className="block">
              <button className="p-2 text-gray-600 hover:text-green-600 transition-colors">
                <User className="w-6 h-6" />
              </button>
            </Link>
            <button
              className="p-2 text-gray-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-white border-b border-gray-100 p-4 shadow-xl animate-in slide-in-from-top-5">
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  handleNavClick(item.href);
                  setIsMenuOpen(false);
                }}
                className="text-gray-600 font-medium p-3 hover:bg-purple-50 hover:text-purple-600 rounded-lg transition-colors text-right bg-none border-none cursor-pointer w-full"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

export default DefaultHeader;
