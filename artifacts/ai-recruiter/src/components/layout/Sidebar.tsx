import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Briefcase, 
  Users, 
  Trophy,
  Menu,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const [location] = useLocation();

  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/jobs", label: "Jobs", icon: Briefcase },
    { href: "/candidates", label: "Candidates", icon: Users },
    { href: "/rankings", label: "Rankings", icon: Trophy },
  ];

  return (
    <div className="flex flex-col w-64 border-r border-border bg-sidebar h-full min-h-screen">
      <div className="p-6 flex items-center gap-3 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
          <Sparkles className="w-5 h-5" />
        </div>
        <span className="font-mono font-bold text-lg tracking-tight">AI RECRUITER</span>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {links.map((link) => {
          const isActive = location === link.href || (link.href !== "/" && location.startsWith(link.href));
          return (
            <Link key={link.href} href={link.href}>
              <div className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors cursor-pointer ${
                isActive 
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              }`}>
                <link.icon className="w-5 h-5" />
                <span>{link.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
