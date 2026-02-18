import { Search, HelpCircle, LogOut, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export const Header = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="border-b bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {/* <div className="relative w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users, payments, or reports..."
              className="pl-8"
            />
          </div> */}
        </div>
        <div className="flex items-center gap-4">
          {admin && (
            <div className="flex items-center gap-2 mr-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-100">
                <User className="h-3.5 w-3.5 text-violet-600" />
                <span className="text-sm font-medium text-violet-700">
                  {admin.username}
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 h-4 border-violet-200 text-violet-600 capitalize"
                >
                  {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                </Badge>
              </div>
            </div>
          )}
          {/* <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5" />
          </Button> */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
            title="Logout"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

