"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Coffee,
  Building2,
  PackageSearch,
  ShoppingCart,
  Receipt,
  Wallet,
  TrendingUp,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Suppliers", href: "/suppliers", icon: Package },
  { name: "Drinks", href: "/drinks", icon: Coffee },
  { name: "Machines", href: "/machines", icon: Building2 },
  { name: "Inventory", href: "/inventory", icon: PackageSearch },
  { name: "Sales", href: "/sales", icon: ShoppingCart },
  { name: "Forecasts", href: "/forecasts", icon: TrendingUp },
  { name: "Costs", href: "/costs", icon: Receipt },
  { name: "Expenditures", href: "/expenditures", icon: Wallet },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="Z Vending"
              width={180}
              height={48}
              className="h-12 w-auto"
              priority
            />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
