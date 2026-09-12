import { useAuth } from "@/hooks/use-auth";
import AdminDashboard from "@/pages/admin/dashboard";
import UserDashboard from "@/pages/user/dashboard";

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === "admin") {
    return <AdminDashboard />;
  }

  return <UserDashboard />;
}

