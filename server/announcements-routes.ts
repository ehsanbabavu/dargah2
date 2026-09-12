import { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { z } from "zod";

const createAnnouncementSchema = z.object({
  title: z.string().min(2, "عنوان اطلاعیه حداقل باید ۲ کاراکتر باشد").max(200, "عنوان بسیار طولانی است"),
  content: z.string().min(5, "متن اطلاعیه حداقل باید ۵ کاراکتر باشد"),
  targetAudience: z.enum(["user_level_1", "all"]).default("user_level_1"),
  priority: z.enum(["normal", "important", "urgent", "info"]).default("normal"),
  isPinned: z.boolean().default(false),
  isPublished: z.boolean().default(true),
});

const updateAnnouncementSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  content: z.string().min(5).optional(),
  targetAudience: z.enum(["user_level_1", "all"]).optional(),
  priority: z.enum(["normal", "important", "urgent", "info"]).optional(),
  isPinned: z.boolean().optional(),
  isPublished: z.boolean().optional(),
});

export function registerAnnouncementsRoutes(
  app: Express,
  authenticateToken: (req: Request, res: Response, next: NextFunction) => void
) {
  // 1. GET ALL / USER ANNOUNCEMENTS
  app.get("/api/announcements", authenticateToken, async (req: any, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "احراز هویت الزامی است" });
      }

      if (user.role === "admin") {
        const announcements = await storage.getAllAnnouncements();
        return res.json(announcements);
      }

      const announcements = await storage.getAnnouncementsForUser(user.id, user.role);
      res.json(announcements);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "خطا در دریافت لیست اطلاعیه‌ها" });
    }
  });

  // 2. GET UNREAD COUNT
  app.get("/api/announcements/unread-count", authenticateToken, async (req: any, res: Response) => {
    try {
      const user = req.user;
      if (!user) {
        return res.json({ unreadCount: 0 });
      }

      const unreadCount = await storage.getUnreadAnnouncementsCount(user.id, user.role);
      res.json({ unreadCount });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.json({ unreadCount: 0 });
    }
  });

  // 3. GET SINGLE ANNOUNCEMENT
  app.get("/api/announcements/:id", authenticateToken, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const announcement = await storage.getAnnouncement(id);
      if (!announcement) {
        return res.status(404).json({ message: "اطلاعیه یافت نشد" });
      }

      // Check permission if not admin
      if (req.user.role !== "admin") {
        if (!announcement.isPublished) {
          return res.status(403).json({ message: "دسترسی غیرمجاز" });
        }
        if (announcement.targetAudience !== "all" && announcement.targetAudience !== req.user.role) {
          return res.status(403).json({ message: "این اطلاعیه برای سطح کاربری شما نیست" });
        }
        // Auto mark as read
        await storage.markAnnouncementAsRead(id, req.user.id);
      }

      res.json(announcement);
    } catch (error) {
      console.error("Error fetching single announcement:", error);
      res.status(500).json({ message: "خطا در دریافت اطلاعیه" });
    }
  });

  // 4. CREATE ANNOUNCEMENT (ADMIN ONLY)
  app.post("/api/announcements", authenticateToken, async (req: any, res: Response) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "فقط مدیر سیستم مجاز به ارسال اطلاعیه است" });
      }

      const parsed = createAnnouncementSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.errors[0]?.message || "اطلاعات ارسالی نامعتبر است",
          errors: parsed.error.errors,
        });
      }

      const authorName = req.user.firstName && req.user.lastName 
        ? `${req.user.firstName} ${req.user.lastName}` 
        : "مدیریت سایت";

      const created = await storage.createAnnouncement({
        ...parsed.data,
        authorId: req.user.id,
        authorName,
      });

      res.status(201).json(created);
    } catch (error) {
      console.error("Error creating announcement:", error);
      res.status(500).json({ message: "خطا در ثبت و ارسال اطلاعیه" });
    }
  });

  // 5. UPDATE ANNOUNCEMENT (ADMIN ONLY)
  app.put("/api/announcements/:id", authenticateToken, async (req: any, res: Response) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "دسترسی غیرمجاز" });
      }

      const { id } = req.params;
      const parsed = updateAnnouncementSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: parsed.error.errors[0]?.message || "اطلاعات ارسالی نامعتبر است",
        });
      }

      const updated = await storage.updateAnnouncement(id, parsed.data);
      if (!updated) {
        return res.status(404).json({ message: "اطلاعیه یافت نشد" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating announcement:", error);
      res.status(500).json({ message: "خطا در ویرایش اطلاعیه" });
    }
  });

  // 6. DELETE ANNOUNCEMENT (ADMIN ONLY)
  app.delete("/api/announcements/:id", authenticateToken, async (req: any, res: Response) => {
    try {
      if (req.user?.role !== "admin") {
        return res.status(403).json({ message: "دسترسی غیرمجاز" });
      }

      const { id } = req.params;
      const deleted = await storage.deleteAnnouncement(id);
      if (!deleted) {
        return res.status(404).json({ message: "اطلاعیه یافت نشد یا قبلا حذف شده است" });
      }

      res.json({ success: true, message: "اطلاعیه با موفقیت حذف شد" });
    } catch (error) {
      console.error("Error deleting announcement:", error);
      res.status(500).json({ message: "خطا در حذف اطلاعیه" });
    }
  });

  // 7. MARK AS READ (AUTHENTICATED USERS)
  app.post("/api/announcements/:id/read", authenticateToken, async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const success = await storage.markAnnouncementAsRead(id, req.user.id);
      res.json({ success });
    } catch (error) {
      console.error("Error marking announcement as read:", error);
      res.status(500).json({ message: "خطا در ثبت وضعیت خوانده شده" });
    }
  });
}
