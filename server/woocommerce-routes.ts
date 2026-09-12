import { Express, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import {
  normalizeDomain,
  isDomainAuthorized,
  createPluginZipArchive,
  ensurePluginZipFile,
  notifyWooCommerceWebhook,
} from "./woocommerce-service";

export function registerWooCommerceRoutes(
  app: Express,
  authenticateToken: (req: any, res: Response, next: NextFunction) => void,
  jwtSecret?: string
) {
  try {
    ensurePluginZipFile("http://localhost:3000");
  } catch (e) {
    // Non-blocking
  }

  // CORS middleware for WooCommerce API routes
  app.use("/api/v1/woocommerce", (req: Request, res: Response, next: NextFunction) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, X-WP-API-KEY, Authorization, Origin, Referer");
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

  const requireLevel1 = (req: any, res: Response, next: NextFunction) => {
    if (!req.user || (req.user.role !== "user_level_1" && req.user.role !== "admin")) {
      return res.status(403).json({ message: "دسترسی غیرمجاز. این امکان ویژه کاربران سطح ۱ است." });
    }
    next();
  };

  // -------------------------------------------------------------
  // LEVEL 1 DASHBOARD ENDPOINTS (Authenticated)
  // -------------------------------------------------------------

  /**
   * Generate a fresh WordPress API Key for the authenticated Level 1 user
   */
  app.post(
    "/api/blupal/woocommerce/generate-key",
    authenticateToken,
    requireLevel1,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.id;
        const newKey = await storage.generateWpApiKey(userId);
        res.json({
          success: true,
          message: "کلید وب‌سرویس افزونه وردپرس با موفقیت ایجاد شد.",
          wpApiKey: newKey,
        });
      } catch (error: any) {
        console.error("Error generating WP API Key:", error);
        res.status(500).json({ success: false, message: "خطا در صدور کلید وردپرس: " + error.message });
      }
    }
  );

  /**
   * Save WooCommerce authorized domain and settings
   */
  app.put(
    "/api/blupal/woocommerce/settings",
    authenticateToken,
    requireLevel1,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.id;
        const { wpAuthorizedDomain, wpCallbackUrl } = req.body;

        const existing = await storage.getBlupalGateway(userId);
        let finalDomain = existing?.wpAuthorizedDomain || null;

        if (req.user?.role === "admin") {
          finalDomain = wpAuthorizedDomain ? normalizeDomain(wpAuthorizedDomain) : null;
        } else {
          // Regular merchant
          if (existing?.wpAuthorizedDomain) {
            // Already locked!
            finalDomain = existing.wpAuthorizedDomain;
          } else if (wpAuthorizedDomain) {
            // Initial set and lock
            finalDomain = normalizeDomain(wpAuthorizedDomain);
          }
        }

        const updated = await storage.saveBlupalGateway(userId, {
          wpAuthorizedDomain: finalDomain || undefined,
          wpCallbackUrl: wpCallbackUrl?.trim() || undefined,
        });

        res.json({
          success: true,
          message: existing?.wpAuthorizedDomain && req.user?.role !== "admin"
            ? "تنظیمات ذخیره شد (دامنه به دلیل قفل امنیتی تغییر نیافت)."
            : "تنظیمات افزونه و دامنه مجاز با موفقیت ذخیره و قفل شد.",
          gateway: updated,
        });
      } catch (error: any) {
        console.error("Error saving WooCommerce settings:", error);
        res.status(500).json({ success: false, message: "خطا در ذخیره تنظیمات: " + error.message });
      }
    }
  );

  /**
   * Download the custom configured WordPress / WooCommerce plugin (.zip)
   * Supports authenticated requests, ?token=... query parameters, or falls back gracefully.
   */
  app.get(
    "/api/blupal/woocommerce/download-plugin",
    async (req: any, res: Response) => {
      try {
        let prefilledKey = "";

        // Extract token from Authorization header or ?token= query parameter
        const authHeader = req.headers["authorization"];
        const queryToken = typeof req.query?.token === "string" ? req.query.token : undefined;
        const token = (authHeader && authHeader.split(" ")[1]) || queryToken;

        if (token && jwtSecret) {
          try {
            const decoded = jwt.verify(token, jwtSecret) as { userId: string };
            const user = await storage.getUser(decoded.userId);
            if (user) {
              const gateway = await storage.getBlupalGateway(user.id);
              if (gateway?.wpApiKey) {
                prefilledKey = gateway.wpApiKey;
              }
            }
          } catch (jwtErr) {
            // If token is expired or invalid, we still proceed to generate the plugin package gracefully
          }
        }

        const host = req.get("host") || "localhost:3000";
        const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
        const serverBaseUrl = `${protocol}://${host}`;

        const zipBuffer = createPluginZipArchive(serverBaseUrl, prefilledKey);

        res.setHeader("Content-Type", "application/zip");
        res.setHeader("Content-Disposition", 'attachment; filename="blupal-woocommerce-card-to-card.zip"');
        res.setHeader("Content-Length", zipBuffer.length);
        res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        res.send(zipBuffer);
      } catch (error: any) {
        console.error("Error downloading plugin zip:", error);
        res.status(500).json({ success: false, message: "خطا در ساخت پکیج افزونه: " + error.message });
      }
    }
  );

  /**
   * Public download link for generic plugin zip
   */
  app.get("/api/v1/woocommerce/download-plugin", async (req: Request, res: Response) => {
    try {
      const host = req.get("host") || "localhost:3000";
      const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
      const serverBaseUrl = `${protocol}://${host}`;

      const zipBuffer = createPluginZipArchive(serverBaseUrl);

      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", 'attachment; filename="blupal-woocommerce-card-to-card.zip"');
      res.setHeader("Content-Length", zipBuffer.length);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.send(zipBuffer);
    } catch (error: any) {
      console.error("Error downloading public plugin:", error);
      res.status(500).send("Error downloading plugin");
    }
  });

  // -------------------------------------------------------------
  // PUBLIC WOOCOMMERCE STORE INTEGRATION ENDPOINTS
  // (Called by the client's WordPress site)
  // -------------------------------------------------------------

  /**
   * Helper to extract WP API Key from request headers or body
   */
  function extractApiKey(req: Request): string {
    const fromHeader = req.headers["x-wp-api-key"] || req.headers["x-api-key"];
    if (fromHeader && typeof fromHeader === "string") return fromHeader.trim();

    const auth = req.headers["authorization"];
    if (auth && auth.startsWith("Bearer ")) {
      return auth.substring(7).trim();
    }

    if (req.body && req.body.api_key) {
      return String(req.body.api_key).trim();
    }

    if (req.query && req.query.api_key) {
      return String(req.query.api_key).trim();
    }

    return "";
  }

  /**
   * Helper to extract candidate domain from request
   */
  function extractCandidateDomain(req: Request): string {
    const origin = req.headers["origin"] as string;
    if (origin) {
      const d = normalizeDomain(origin);
      if (d) return d;
    }

    const referer = req.headers["referer"] as string;
    if (referer) {
      const d = normalizeDomain(referer);
      if (d) return d;
    }

    if (req.body?.site_url) {
      const d = normalizeDomain(req.body.site_url);
      if (d) return d;
    }

    if (req.body?.domain) {
      const d = normalizeDomain(req.body.domain);
      if (d) return d;
    }

    return "";
  }

  /**
   * POST /api/v1/woocommerce/create-order
   * Receives checkout order information from WooCommerce, validates API key and domain,
   * creates an isolated invoice, and returns payment URL.
   */
  app.post("/api/v1/woocommerce/create-order", async (req: Request, res: Response) => {
    try {
      const apiKey = extractApiKey(req);
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          message: "کلید اختصاصی API Key در درخواست ارسال نشده است.",
        });
      }

      const gateway = await storage.getBlupalGatewayByWpApiKey(apiKey);
      if (!gateway) {
        return res.status(401).json({
          success: false,
          message: "کلید API معتبر نیست یا درگاهی با این مشخصات یافت نشد.",
        });
      }

      if (!gateway.isActive) {
        return res.status(403).json({
          success: false,
          message: "درگاه پرداخت در حال حاضر غیرفعال است. لطفاً با پشتیبانی سایت تماس حاصل فرمایید.",
        });
      }

      // Automatic Card Discovery & Fallback
      let destCardNumber = gateway.cardNumber;
      let destCardHolder = gateway.cardHolderName || gateway.title;

      if (!destCardNumber) {
        // 1. Try to fetch from user profile
        try {
          const merchantUser = await storage.getUser(gateway.userId);
          if (merchantUser?.bankCardNumber) {
            destCardNumber = merchantUser.bankCardNumber.replace(/\D/g, "");
            destCardHolder = destCardHolder || merchantUser.bankCardHolderName || `${merchantUser.firstName || ''} ${merchantUser.lastName || ''}`.trim();
            await storage.saveBlupalGateway(gateway.userId, {
              cardNumber: destCardNumber,
              cardHolderName: destCardHolder,
            });
            gateway.cardNumber = destCardNumber;
          }
        } catch (e) {
          // ignore
        }
      }

      // 2. If still no card, check if Blupal API Key is configured to query live card
      if (!destCardNumber && gateway.apiKey?.trim()) {
        try {
          const blupalRes = await fetch("https://blupal.net/api/v1/invoices/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "X-API-Key": gateway.apiKey.trim(),
            },
            body: JSON.stringify({ amount: 100000 }),
            signal: AbortSignal.timeout(4000),
          });

          const blupalData = await blupalRes.json().catch(() => ({}));
          if (blupalRes.ok && (blupalData.success || blupalData.invoice_id)) {
            const returnedCard = blupalData.card_number || blupalData.card?.number || blupalData.dest_card || blupalData.cardNumber;
            if (returnedCard) {
              destCardNumber = String(returnedCard).replace(/\D/g, "");
              const returnedHolder = blupalData.card_holder || blupalData.card_holder_name || blupalData.card?.holder_name || blupalData.card?.owner || blupalData.owner_name || blupalData.dest_card_holder || blupalData.merchant_name;
              if (returnedHolder) destCardHolder = String(returnedHolder).trim();
              
              await storage.saveBlupalGateway(gateway.userId, {
                cardNumber: destCardNumber,
                cardHolderName: destCardHolder,
              });
              gateway.cardNumber = destCardNumber;
            }
          }
        } catch (e) {
          // Non-blocking
        }
      }

      // If still no card and no API key, guide user clearly
      if (!destCardNumber && !gateway.apiKey?.trim()) {
        return res.status(400).json({
          success: false,
          message: "شماره کارت پذیرنده در پنل درگاه ثبت نشده است. لطفاً در پنل کاربری (بخش تنظیمات درگاه)، شماره کارت ۱۶ رقمی یا کلید API بلوپال را وارد و ذخیره فرمایید.",
        });
      }

      // Domain Security Validation
      const candidateDomain = extractCandidateDomain(req);
      if (gateway.wpAuthorizedDomain) {
        const isAuth = isDomainAuthorized(candidateDomain, gateway.wpAuthorizedDomain);
        if (!isAuth) {
          console.warn(`WooCommerce domain mismatch! Candidate: ${candidateDomain}, Authorized: ${gateway.wpAuthorizedDomain}`);
          return res.status(403).json({
            success: false,
            message: `دسترسی غیرمجاز: این کلید تنها برای دامنه «${gateway.wpAuthorizedDomain}» مجاز است. دامنه ارسالی: «${candidateDomain || "نامشخص"}»`,
          });
        }
      } else if (candidateDomain) {
        // Auto-lock to first requesting domain for user convenience
        console.log(`Auto-binding domain ${candidateDomain} to gateway for user ${gateway.userId}`);
        await storage.saveBlupalGateway(gateway.userId, { wpAuthorizedDomain: candidateDomain });
        gateway.wpAuthorizedDomain = candidateDomain;
      }

      const {
        order_id,
        amount,
        currency,
        customer_name,
        customer_phone,
        customer_email,
        callback_url,
        description,
      } = req.body;

      if (!order_id) {
        return res.status(400).json({ success: false, message: "شماره سفارش (order_id) الزامی است." });
      }

      const rawAmount = parseFloat(String(amount));
      if (isNaN(rawAmount) || rawAmount <= 0) {
        return res.status(400).json({ success: false, message: "مبلغ سفارش نامعتبر است." });
      }

      // Convert amount accurately based on currency
      const currUpper = (currency && typeof currency === "string") ? currency.trim().toUpperCase() : "IRT";
      const isRialCurrency = ["IRR", "RIAL", "RIALS", "IR_RIAL", "IRR_CURRENCY"].includes(currUpper);
      const isThousandToman = ["IRHR", "THOUSAND_TOMAN", "HEZAR_TOMAN"].includes(currUpper);

      let amountInTomans: number;
      let amountInRials: number;

      if (isThousandToman) {
        amountInTomans = rawAmount * 1000;
        amountInRials = Math.round(amountInTomans * 10);
      } else if (isRialCurrency) {
        // Smart Rial / Toman detection:
        // If rawAmount >= 100,000, it's definitely in Rials (e.g. 190,000 Rials = 19,000 Tomans).
        // If rawAmount < 100,000 (e.g. 19,000 or 15,000), it has already been converted to Tomans by the plugin.
        if (rawAmount >= 100000) {
          amountInRials = Math.round(rawAmount);
          amountInTomans = rawAmount / 10;
        } else {
          amountInTomans = rawAmount;
          amountInRials = Math.round(rawAmount * 10);
        }
      } else {
        // Default: Tomans (IRT)
        if (rawAmount >= 100000000) {
          // Extremely huge amount (e.g. 100,000,000+ passed under IRT by mistake)
          amountInRials = Math.round(rawAmount);
          amountInTomans = rawAmount / 10;
        } else {
          amountInTomans = rawAmount;
          amountInRials = Math.round(rawAmount * 10);
        }
      }

      // Min/Max amount checks (10,000 Tomans = 100,000 Rials minimum for Blupal)
      const minAmount = Math.max(10000, gateway.minAmount ? parseFloat(gateway.minAmount) : 10000);
      const maxAmount = gateway.maxAmount ? parseFloat(gateway.maxAmount) : 50000000;

      if (amountInTomans < minAmount) {
        return res.status(400).json({
          success: false,
          message: `مبلغ کمتر از حداقل مجاز صدور فاکتور درگاه (${minAmount.toLocaleString("fa-IR")} تومان) است. مبلغ محاسبه شده: ${amountInTomans.toLocaleString("fa-IR")} تومان`,
        });
      }

      if (amountInTomans > maxAmount) {
        return res.status(400).json({
          success: false,
          message: `مبلغ بیشتر از حداکثر مجاز (${maxAmount.toLocaleString("fa-IR")} تومان) است.`,
        });
      }

      let blupalInvoiceId: string | null = null;
      let paymentLink: string | null = null;
      let finalAmountTomans: string = String(amountInTomans);
      let finalAmountRials: number = amountInRials;
      let mode: string = "live";

      // Call Official Blupal API (https://blupal.net/api/v1/invoices/create) to register invoice on Blupal
      if (gateway.apiKey?.trim()) {
        const blupalPayload: any = {
          amount: amountInRials,
        };

        if (destCardNumber && destCardNumber.length === 16) {
          blupalPayload.card_number = destCardNumber;
        }

        try {
          console.log(`Sending WooCommerce order #${order_id} invoice to Blupal API:`, {
            amountRials: amountInRials,
            card: destCardNumber ? destCardNumber.slice(0, 6) + "******" : undefined,
          });

          const blupalRes = await fetch("https://blupal.net/api/v1/invoices/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "X-API-Key": gateway.apiKey.trim(),
            },
            body: JSON.stringify(blupalPayload),
            signal: AbortSignal.timeout(8000),
          });

          const blupalData = await blupalRes.json().catch(() => ({}));
          console.log(`Blupal API create invoice for WC order #${order_id} response:`, blupalRes.status, blupalData);

          if (blupalRes.ok && (blupalData.success || blupalData.invoice_id)) {
            blupalInvoiceId = String(blupalData.invoice_id);

            // Extract Card Number from Blupal
            const returnedCard = blupalData.card_number || blupalData.card?.number || blupalData.dest_card || blupalData.cardNumber;
            if (returnedCard) {
              destCardNumber = String(returnedCard).replace(/\D/g, "");
            }

            // Extract Card Holder Name from Blupal
            const returnedHolder = blupalData.card_holder || blupalData.card_holder_name || blupalData.card?.holder_name || blupalData.card?.owner || blupalData.owner_name || blupalData.dest_card_holder || blupalData.merchant_name;
            if (returnedHolder && String(returnedHolder).trim()) {
              destCardHolder = String(returnedHolder).trim();
            }

            if (blupalData.payment_link) {
              paymentLink = blupalData.payment_link;
            }

            // Exactly match what Blupal API generated for this invoice (e.g. final amount in Rials with surcharge)
            if (blupalData.final_amount) {
              finalAmountRials = Number(blupalData.final_amount);
              finalAmountTomans = (finalAmountRials / 10).toString();
            } else if (blupalData.amount) {
              finalAmountRials = Number(blupalData.amount);
              finalAmountTomans = (finalAmountRials / 10).toString();
            }

            if (blupalData.mode) {
              mode = blupalData.mode;
            }

            // Auto update gateway card if returned from Blupal
            if (destCardNumber && gateway.cardNumber !== destCardNumber) {
              storage.saveBlupalGateway(gateway.userId, {
                cardNumber: destCardNumber,
                cardHolderName: destCardHolder,
              }).catch(() => {});
            }
          } else {
            // Blupal returned an error
            console.error("Blupal API returned error on WooCommerce order create:", blupalRes.status, blupalData);
            let userErrMsg = "خطا در ثبت فاکتور در وب‌سرویس بلوپال";
            const errCode = blupalData.error || blupalData.message;
            if (errCode === "unauthorized" || blupalRes.status === 401) {
              userErrMsg = "کلید API بلوپال ثبت شده در تنظیمات نامعتبر است یا در پنل بلوپال فعال نشده است.";
            } else if (errCode === "no_active_card") {
              userErrMsg = "هیچ کارت بانکی فعالی در پنل بلوپال برای این پذیرنده تعریف نشده است. لطفاً کارت خود را در پنل بلوپال ثبت و تایید کنید.";
            } else if (errCode === "amount_too_low") {
              userErrMsg = "مبلغ فاکتور کمتر از حداقل مجاز بلوپال (۱۰،۰۰۰ تومان) است.";
            } else if (errCode === "amount_too_high") {
              userErrMsg = "مبلغ فاکتور بیشتر از سقف مجاز بلوپال (۵۰،۰۰۰،۰۰۰ تومان) است.";
            } else if (typeof blupalData.message === "string") {
              userErrMsg = blupalData.message;
            }

            return res.status(400).json({
              success: false,
              message: userErrMsg,
              blupal_error: blupalData.error,
            });
          }
        } catch (apiErr: any) {
          console.error("Network or timeout error contacting Blupal API:", apiErr);
          return res.status(502).json({
            success: false,
            message: "عدم برقراری ارتباط با سرور رسمی بلوپال (blupal.net). لطفاً مجدداً تلاش فرمایید.",
          });
        }
      }

      // Unique Invoice ID (use Blupal invoice ID if generated, otherwise WC- prefix)
      const primaryInvoiceId = blupalInvoiceId || `WC-${order_id}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Create transaction record
      const createdTx = await storage.createBlupalTransaction({
        userId: gateway.userId,
        invoiceId: primaryInvoiceId,
        blupalInvoiceId: blupalInvoiceId,
        paymentLink,
        mode,
        amount: String(amountInTomans),
        finalAmount: finalAmountTomans,
        payerName: (customer_name && String(customer_name).trim()) || `مشتری سفارش #${order_id}`,
        payerPhone: (customer_phone && String(customer_phone).trim()) || "09000000000",
        destCardNumber: destCardNumber || gateway.cardNumber || "درگاه بلوپال",
        destCardHolder: destCardHolder || gateway.cardHolderName || gateway.title || "پذیرنده",
        status: "pending",
        description: description || `سفارش ووکامرس شماره #${order_id}`,
        sourceDomain: candidateDomain || gateway.wpAuthorizedDomain || null,
        orderId: String(order_id),
        callbackUrl: callback_url || gateway.wpCallbackUrl || null,
        expiresAt: new Date(Date.now() + 20 * 60 * 1000), // 20 minutes
      });

      // Construct payment URL
      const host = req.get("host") || "localhost:3000";
      const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
      const slug = gateway.slug || "pay";
      const returnParam = callback_url ? `&wp_return=${encodeURIComponent(callback_url)}` : "";
      const paymentUrl = `${protocol}://${host}/pay/${slug}?invoice=${primaryInvoiceId}&order_id=${order_id}${returnParam}`;

      res.json({
        success: true,
        invoice_id: primaryInvoiceId,
        blupal_invoice_id: blupalInvoiceId,
        order_id: String(order_id),
        amount: amountInTomans,
        final_amount: parseFloat(finalAmountTomans),
        payment_url: paymentUrl,
        payment_link: paymentLink,
        expires_in_minutes: 20,
      });
    } catch (error: any) {
      console.error("Error creating WooCommerce order invoice:", error);
      res.status(500).json({ success: false, message: "خطای سرور در ایجاد سفارش: " + error.message });
    }
  });

  /**
   * GET /api/v1/woocommerce/verify
   * Called by WordPress plugin callback to verify order payment status
   */
  app.get("/api/v1/woocommerce/verify", async (req: Request, res: Response) => {
    try {
      const apiKey = extractApiKey(req);
      if (!apiKey) {
        return res.status(401).json({ success: false, message: "کلید API ارسال نشده است." });
      }

      const gateway = await storage.getBlupalGatewayByWpApiKey(apiKey);
      if (!gateway) {
        return res.status(401).json({ success: false, message: "کلید API نامعتبر است." });
      }

      const invoiceId = req.query.invoice_id as string;
      const orderId = req.query.order_id as string;

      if (!invoiceId && !orderId) {
        return res.status(400).json({ success: false, message: "شناسه فاکتور یا شماره سفارش الزامی است." });
      }

      let tx;
      if (invoiceId) {
        tx = await storage.getBlupalTransactionByInvoiceId(invoiceId);
      }

      if (!tx && orderId) {
        // Search by orderId for this user
        const allTx = await storage.getBlupalTransactions(gateway.userId, 100);
        tx = allTx.find((t) => t.orderId === String(orderId));
      }

      if (!tx) {
        return res.status(404).json({ success: false, message: "فاکتور مربوط به این سفارش یافت نشد." });
      }

      // Ensure transaction belongs to this gateway
      if (tx.userId !== gateway.userId) {
        return res.status(403).json({ success: false, message: "عدم تطابق دسترسی به فاکتور." });
      }

      const isPaid = tx.status === "paid";

      res.json({
        success: true,
        status: tx.status,
        is_paid: isPaid,
        invoice_id: tx.invoiceId,
        order_id: tx.orderId,
        amount: tx.amount,
        tracking_code: tx.trackingCode || null,
        card_last_four: tx.cardLastFour || null,
        paid_at: tx.paidAt || null,
      });
    } catch (error: any) {
      console.error("Error verifying WooCommerce transaction:", error);
      res.status(500).json({ success: false, message: "خطا در استعلام وضعیت: " + error.message });
    }
  });

  /**
   * ALL /api/v1/woocommerce/test-connection & /api/v1/woocommerce/ping
   * Dedicated automated live connection and diagnostics test for WordPress WooCommerce plugin
   */
  const handleTestConnection = async (req: Request, res: Response) => {
    try {
      const apiKey = extractApiKey(req);
      const candidateDomain = extractCandidateDomain(req);
      const host = req.get("host") || "localhost:3000";
      const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
      const serverUrl = `${protocol}://${host}`;

      if (!apiKey) {
        return res.status(200).json({
          success: true,
          status: "server_online",
          message: "سرور درگاه فعال و آماده پاسخگویی است. لطفاً برای بررسی اعتبار، کلید اختصاصی API Key را در افزونه وارد نمایید.",
          server_url: serverUrl,
          server_time: new Date().toISOString(),
          latency_test: "ok",
        });
      }

      const gateway = await storage.getBlupalGatewayByWpApiKey(apiKey);
      if (!gateway) {
        return res.status(200).json({
          success: false,
          status: "invalid_key",
          message: "کلید API ارسالی در سامانه یافت نشد. لطفاً مطمئن شوید کلید صادرشده در پنل کاربری (با پیشوند Rakhsh_Pay_...) را به درستی کپی کرده‌اید.",
          server_url: serverUrl,
          server_time: new Date().toISOString(),
        });
      }

      const domainAuthorized = !gateway.wpAuthorizedDomain || isDomainAuthorized(candidateDomain, gateway.wpAuthorizedDomain);

      // Auto-bind if not yet locked
      if (!gateway.wpAuthorizedDomain && candidateDomain) {
        await storage.saveBlupalGateway(gateway.userId, { wpAuthorizedDomain: candidateDomain });
        gateway.wpAuthorizedDomain = candidateDomain;
      }

      res.status(200).json({
        success: true,
        status: "connected",
        message: "اتصال به وب‌سرویس و کلید اختصاصی با موفقیت برقرار و تایید شد.",
        details: {
          gateway_title: gateway.title || "درگاه پرداخت کارت به کارت",
          is_active: gateway.isActive !== false,
          has_card_number: Boolean(gateway.cardNumber),
          card_holder: gateway.cardHolderName || (gateway.cardNumber ? "شماره کارت ثبت شده" : "ثبت نشده"),
          card_number_masked: gateway.cardNumber ? gateway.cardNumber.slice(0, 6) + "******" + gateway.cardNumber.slice(-4) : null,
          authorized_domain: gateway.wpAuthorizedDomain || "آزاد (تمامی دامنه‌ها)",
          request_domain: candidateDomain || "تشخیص خودکار",
          domain_authorized: domainAuthorized,
          min_amount: gateway.minAmount || "1000",
          max_amount: gateway.maxAmount || "500000000",
          server_url: serverUrl,
          server_time: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error("Error running WooCommerce connection test:", error);
      res.status(500).json({
        success: false,
        status: "server_error",
        message: "خطای داخلی در تست اتصال سرور: " + error.message,
      });
    }
  };

  app.all("/api/v1/woocommerce/test-connection", handleTestConnection);
  app.all("/api/v1/woocommerce/ping", handleTestConnection);
}
