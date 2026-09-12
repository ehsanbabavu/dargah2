import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { cleanupService } from "./cleanup-service";
import { storage } from "./storage";
import path from "path";
import fs from "fs";

const app = express();

// Trust proxy - برای دریافت صحیح IP واقعی کاربر از طریق پروکسی Replit
app.set('trust proxy', true);

// JSON parsing middleware - با بررسی content-type و افزایش محدودیت سایز برای فاکتورها
app.use((req, res, next) => {
  if (req.headers['content-type']?.startsWith('multipart/form-data')) {
    // برای multipart requests، JSON parsing را نادیده می‌گیریم
    return next();
  }
  express.json({ limit: '50mb' })(req, res, next);
});
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Static serving for uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Static serving for stamp images (مهر و امضا)
app.use('/stamppic', express.static(path.join(process.cwd(), 'stamppic')));

// Static serving for public files (invoices, etc.)
app.use('/invoices', express.static(path.join(process.cwd(), 'public', 'invoices')));

// Static serving for custom landing template files
app.use('/custom-landing', express.static(path.join(process.cwd(), 'public', 'custom-landing')));
app.use('/landing-templates', express.static(path.join(process.cwd(), 'public', 'landing-templates')));

// Static serving for custom 404 template files
app.use('/custom-not-found', express.static(path.join(process.cwd(), 'public', 'custom-not-found')));
app.use('/not-found-templates', express.static(path.join(process.cwd(), 'public', 'not-found-templates')));

// Static serving for landing and 404 preview screenshots
app.use('/landing-previews', express.static(path.join(process.cwd(), 'public', 'landing-previews')));
app.use('/not-found-previews', express.static(path.join(process.cwd(), 'public', 'not-found-previews')));

// Explicit 404 for missing static files under template paths to prevent falling through to SPA index.html
app.use([
  '/landing-templates/*',
  '/custom-landing/*',
  '/not-found-templates/*',
  '/custom-not-found/*',
  '/landing-previews/*',
  '/not-found-previews/*',
], (_req, res) => {
  res.status(404).type('text/plain').send('Template asset not found');
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // In production (e.g. running from compiled dist bundle or NODE_ENV=production), serve static files.
  // In development, mount Vite middleware.
  const isProd = process.env.NODE_ENV === "production" || process.argv[1]?.includes("dist");
  if (isProd) {
    serveStatic(app);
  } else {
    await setupVite(app, server);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 3000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '3000', 10);
  server.listen(port, "0.0.0.0", async () => {
    log(`serving on port ${port}`);
    // بارگذاری پلاگین‌های پیش‌فرض
    await storage.initializeDefaultPlugins();
    // سرویس پاکسازی فایل‌های موقت رو شروع کن
    cleanupService.start();
  });
})();
