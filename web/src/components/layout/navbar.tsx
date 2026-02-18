"use client";

import {
    Activity,
    BarChart3,
    BookOpen,
    ChevronRight,
    HelpCircle,
    Newspaper,
    Plug,
    Shield,
    Trophy,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { getUserDisplay, useOptionalPrivy } from "@/hooks/useOptionalPrivy";
import { cn } from "@/lib/utils";

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const pathname = usePathname();
    const privy = useOptionalPrivy();

    const userInfo = getUserDisplay(privy);
    const displayName = userInfo
        ? userInfo.provider === "Email"
            ? userInfo.name.split("@")[0]
            : userInfo.name
        : null;

    useEffect(() => {
        if (isMenuOpen) {
            document.body.classList.add("overflow-hidden");
        } else {
            document.body.classList.remove("overflow-hidden");
        }

        return () => {
            document.body.classList.remove("overflow-hidden");
        };
    }, [isMenuOpen]);

    const ITEMS = [
        { label: "Verify", href: "/verify", primary: true },
        { label: "Dashboard", href: "/dashboard" },
        { label: "Launches", href: "/launches" },
        { label: "Chat", href: "/chat" },
        { label: "Governance", href: "/governance" },
        { label: "Developers", href: "/developers" },
        {
            label: "Resources",
            href: "#resources",
            dropdownItems: [
                {
                    title: "Features",
                    href: "/features",
                    description: "Multi-channel verification, fee routing, milestone governance",
                    icon: Shield,
                },
                {
                    title: "FAQ",
                    href: "/faq",
                    description: "Common questions about Sigil answered",
                    icon: HelpCircle,
                },
                {
                    title: "Blog",
                    href: "/blog",
                    description: "Protocol updates and announcements",
                    icon: Newspaper,
                },
                {
                    title: "About",
                    href: "/about",
                    description: "Our mission and team",
                    icon: BookOpen,
                },
                {
                    title: "Leaderboard",
                    href: "/leaderboard",
                    description: "Top verified builders and rankings",
                    icon: Trophy,
                },
                {
                    title: "Stats",
                    href: "/stats",
                    description: "Protocol analytics and metrics",
                    icon: BarChart3,
                },
                {
                    title: "Integrations",
                    href: "/integrations",
                    description: "SDKs, APIs, and ecosystem",
                    icon: Plug,
                },
                {
                    title: "Status",
                    href: "/status",
                    description: "System health and uptime",
                    icon: Activity,
                },
            ],
        },
    ];

    return (
        <header className="relative z-50 h-20 border-b border-border bg-background px-2.5 lg:px-0">
            <div className="container flex h-20 items-center border-x border-border">
                <div className="flex w-full items-center justify-between py-3">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <Image
                            src="/logo-sage.png"
                            alt="Sigil"
                            width={32}
                            height={32}
                            className="rounded"
                        />
                        <span className="text-xl font-semibold text-foreground">Sigil</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="flex items-center justify-center">
                        <NavigationMenu className="mr-4 hidden items-center gap-8 lg:flex">
                            <NavigationMenuList>
                                {ITEMS.map((link) =>
                                    link.dropdownItems ? (
                                        <NavigationMenuItem key={link.label} className="text-sm">
                                            <NavigationMenuTrigger
                                                className={cn(
                                                    "text-foreground bg-transparent text-sm font-normal",
                                                    "hover:bg-sage/30 focus:bg-sage/30 active:bg-sage/30",
                                                    "hover:text-foreground focus:text-foreground",
                                                    "data-[state=open]:text-foreground data-[state=open]:bg-sage/40",
                                                    "transition-colors",
                                                )}
                                            >
                                                {link.label}
                                            </NavigationMenuTrigger>
                                            <NavigationMenuContent>
                                                {/* Dropdown Header */}
                                                <div className="px-4 py-2 border-b border-border bg-sage/20">
                                                    <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                                        Resources
                                                    </span>
                                                </div>
                                                {/* Dropdown Items */}
                                                <ul className="w-[420px] divide-y divide-border">
                                                    {link.dropdownItems.map((item) => (
                                                        <li key={item.title}>
                                                            <NavigationMenuLink asChild>
                                                                <Link
                                                                    href={item.href}
                                                                    className="group flex items-center gap-3 px-4 py-3 leading-none no-underline outline-none transition-colors select-none hover:bg-sage/20 focus:bg-sage/20"
                                                                >
                                                                    <div className="size-9 shrink-0 flex items-center justify-center bg-sage/30 border border-border transition-colors group-hover:bg-lavender/30">
                                                                        <item.icon className="size-4 text-muted-foreground" />
                                                                    </div>
                                                                    <div className="space-y-0.5">
                                                                        <div className="text-sm leading-none font-medium text-foreground">
                                                                            {item.title}
                                                                        </div>
                                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                                            {item.description}
                                                                        </p>
                                                                    </div>
                                                                </Link>
                                                            </NavigationMenuLink>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </NavigationMenuContent>
                                        </NavigationMenuItem>
                                    ) : (
                                        <NavigationMenuItem key={link.label}>
                                            <Link
                                                href={link.href}
                                                className={cn(
                                                    "text-foreground hover:text-primary p-2 text-sm transition-colors",
                                                    pathname === link.href && "text-primary font-medium",
                                                    link.primary && "font-medium",
                                                )}
                                            >
                                                {link.label}
                                            </Link>
                                        </NavigationMenuItem>
                                    ),
                                )}
                            </NavigationMenuList>
                        </NavigationMenu>

                        {/* Auth Button */}
                        <div className="flex items-center gap-2.5">
                            <div
                                className={`transition-opacity duration-300 ${isMenuOpen ? "max-lg:pointer-events-none max-lg:opacity-0" : "opacity-100"}`}
                            >
                                {privy.authenticated ? (
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 border border-border px-2.5 py-1 bg-sage/20">
                                            <div className="flex size-6 items-center justify-center bg-lavender/50 text-[10px] font-semibold text-foreground border border-border">
                                                {displayName ? displayName.charAt(0).toUpperCase() : "U"}
                                            </div>
                                            <span className="text-sm font-medium text-foreground max-w-[100px] truncate">
                                                {displayName || "User"}
                                            </span>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => privy.logout?.()}
                                            className="text-xs"
                                        >
                                            Log out
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        size="sm"
                                        onClick={() => privy.login?.()}
                                        disabled={!privy.ready}
                                        style={!privy.ready ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
                                    >
                                        Sign In
                                    </Button>
                                )}
                            </div>

                            {/* Hamburger Menu Button (Mobile Only) */}
                            <button
                                type="button"
                                className="text-foreground relative flex size-8 lg:hidden"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                <span className="sr-only">Open main menu</span>
                                <div className="absolute top-1/2 left-1/2 block w-[18px] -translate-x-1/2 -translate-y-1/2">
                                    <span
                                        aria-hidden="true"
                                        className={`absolute block h-0.5 w-full rounded-full bg-current transition duration-500 ease-in-out ${isMenuOpen ? "rotate-45" : "-translate-y-1.5"}`}
                                    ></span>
                                    <span
                                        aria-hidden="true"
                                        className={`absolute block h-0.5 w-full rounded-full bg-current transition duration-500 ease-in-out ${isMenuOpen ? "opacity-0" : ""}`}
                                    ></span>
                                    <span
                                        aria-hidden="true"
                                        className={`absolute block h-0.5 w-full rounded-full bg-current transition duration-500 ease-in-out ${isMenuOpen ? "-rotate-45" : "translate-y-1.5"}`}
                                    ></span>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div
                className={cn(
                    "absolute inset-x-0 top-full container flex h-[calc(100vh-80px)] flex-col border-t border-border px-2.5 lg:px-0",
                    "transition duration-300 ease-in-out lg:hidden",
                    isMenuOpen
                        ? "pointer-events-auto translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-full opacity-0",
                    "bg-background",
                )}
            >
                <div className="h-[calc(100vh-80px)] border-x border-border">
                    <nav className="flex flex-col divide-y divide-border">
                        {ITEMS.map((link) =>
                            link.dropdownItems ? (
                                <div key={link.label}>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenDropdown(
                                                openDropdown === link.label ? null : link.label,
                                            )
                                        }
                                        className={cn(
                                            "w-full flex items-center justify-between px-6 py-4 text-foreground text-base",
                                            openDropdown === link.label && "bg-sage/20",
                                        )}
                                        aria-label={`${link.label} menu`}
                                        aria-expanded={openDropdown === link.label}
                                    >
                                        {link.label}
                                        <ChevronRight
                                            className={cn(
                                                "size-4 transition-transform text-muted-foreground",
                                                openDropdown === link.label ? "rotate-90" : "",
                                            )}
                                            aria-hidden="true"
                                        />
                                    </button>
                                    <div
                                        className={cn(
                                            "overflow-hidden transition-all bg-background",
                                            openDropdown === link.label
                                                ? "max-h-[1000px] opacity-100"
                                                : "max-h-0 opacity-0",
                                        )}
                                    >
                                        {/* Section Header */}
                                        <div className="px-6 py-2 border-b border-border bg-sage/10">
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                                Resources
                                            </span>
                                        </div>
                                        {/* Items */}
                                        <div className="divide-y divide-border">
                                            {link.dropdownItems.map((item) => (
                                                <Link
                                                    key={item.title}
                                                    href={item.href}
                                                    onClick={() => {
                                                        setIsMenuOpen(false);
                                                        setOpenDropdown(null);
                                                    }}
                                                    className="group flex items-center gap-3 px-6 py-3 transition-colors hover:bg-sage/20"
                                                >
                                                    <div className="size-9 shrink-0 flex items-center justify-center bg-cream/50 border border-border">
                                                        <item.icon className="size-4 text-muted-foreground" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-foreground">
                                                            {item.title}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className={cn(
                                        "px-6 py-4 text-foreground text-base",
                                        pathname === link.href && "text-primary font-medium bg-primary/5",
                                        "hover:bg-sage/20 transition-colors",
                                    )}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ),
                        )}
                    </nav>
                    {/* Mobile Footer */}
                    <div className="flex-1 bg-sage/10" />
                </div>
            </div>
        </header>
    );
};

export default Navbar;
