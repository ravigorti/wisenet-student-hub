import { Bell, MessageCircle, ToggleLeft, ToggleRight, BookOpen } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getRole } from "@/hooks/useRole";

const DashboardHeader = () => {
  const [editMode, setEditMode] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const role = getRole();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-6">
        <span
          className="text-xl font-bold wisenet-gradient-text tracking-tight cursor-pointer"
          onClick={() => navigate("/")}
        >
          WiseNet
        </span>
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => navigate("/")}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              location.pathname === "/"
                ? "text-foreground"
                : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-3 py-1.5 text-sm font-medium text-muted-foreground rounded-md hover:bg-secondary transition-colors"
          >
            My courses
          </button>
          {role === "ta" && (
            <button
              onClick={() => navigate("/ta/pre-reads")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                location.pathname === "/ta/pre-reads"
                  ? "text-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              Manage Pre-reads
            </button>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs font-medium px-2 py-1 rounded-full bg-secondary text-muted-foreground uppercase">
          {role === "ta" ? "TA" : "Student"}
        </span>
        <button className="relative p-2 rounded-full hover:bg-secondary transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </button>
        <button className="relative p-2 rounded-full hover:bg-secondary transition-colors">
          <MessageCircle className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
          RG
        </div>
        <button
          onClick={() => setEditMode(!editMode)}
          className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {editMode ? (
            <ToggleRight className="h-5 w-5 text-primary" />
          ) : (
            <ToggleLeft className="h-5 w-5" />
          )}
          <span>Edit mode</span>
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
