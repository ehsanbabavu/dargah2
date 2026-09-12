import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import ariyaBotImage from "@assets/image_1765732617867_1767460337176.jpeg";
import instaLogo from "@assets/insta-logo.png";

export function DefaultFooter() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number>(380);

  const { data: config } = useQuery<{ activeFooterHtml?: string | null; mode?: string }>({
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
      if (event.data && event.data.type === "TEMPLATE_SECTION_HEIGHT" && event.data.section === "footer") {
        if (event.data.height && event.data.height > 50) {
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
          if (h > 50) {
            setIframeHeight(h);
          }
        }
      }
    } catch (e) {}
  };

  if (config?.activeFooterHtml || config?.mode === "custom") {
    return (
      <footer className="w-full relative z-40 mt-12 overflow-hidden bg-[#ecf0f1]" id="custom-template-footer">
        <iframe
          ref={iframeRef}
          src="/api/landing/template-section?section=footer"
          title="فوتر قالب اختصاصی"
          onLoad={handleIframeLoad}
          className="w-full border-0 block"
          style={{ height: `${iframeHeight}px`, minHeight: "280px", overflow: "hidden" }}
          scrolling="no"
        />
      </footer>
    );
  }

  return (
    <footer className="relative bg-black text-white pt-10 md:pt-16 pb-4 px-4 mt-16 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-20"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-blue-600 rounded-full blur-3xl opacity-20"></div>
      </div>

      <div className="container mx-auto relative z-10">
        {/* Top Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-10 pb-10 border-b border-white/10">
          {/* Brand & Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-4 mb-4">
              <motion.img 
                src={ariyaBotImage}
                alt="Rakhsh"
                className="w-16 h-16 rounded-full object-cover"
                whileHover={{ scale: 1.1 }}
                animate={{ y: [0, -2, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              />
              <h3 className="text-2xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Rakhsh</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              دستیار هوشمند ۲۴/۷ برای رفع تمام نیازهای کسب و کار شما با تکنولوژی AI پیشرفته
            </p>
          </motion.div>

          {/* Contact & Social */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-right"
          >
            <h5 className="text-white font-bold mb-6 text-sm uppercase tracking-widest">تماس</h5>
            <div className="space-y-4 mb-8">
              <div>
                <a href="mailto:support@ariyabot.com" className="text-gray-400 hover:text-white transition-colors text-sm">
                  support@ariyabot.com
                </a>
              </div>
              <div>
                <a href="tel:+989134336627" className="text-gray-400 hover:text-white transition-colors text-sm">
                  ۰۹۱۳۴۳۳۶۶۲۷
                </a>
              </div>
            </div>

            {/* Social Icons */}
            <div className="flex gap-4 justify-start mt-8 pt-6 border-t border-gray-700">
              <a 
                href="#" 
                className="inline-block transition-transform hover:scale-110"
              >
                <img src={instaLogo} alt="Instagram" className="w-8 h-8 object-cover" />
              </a>
            </div>
          </motion.div>

          {/* Samandehi Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex items-center justify-center"
          >
            <a href="https://samandehi.ir" target="_blank" rel="noopener noreferrer" className="inline-block hover:opacity-80 transition-opacity">
              <img src="/samandehi-logo.jpg" alt="Samandehi" className="w-24 h-24 object-contain" />
            </a>
          </motion.div>
        </div>

      </div>
    </footer>
  );
}

export default DefaultFooter;
