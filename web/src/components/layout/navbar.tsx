"use client";

import {
    Activity,
    ArrowUpRight,
    BarChart3,
    BookOpen,
    Bot,
    ChevronRight,
    Code2,
    HelpCircle,
    Landmark,
    Newspaper,
    Plug,
    Rocket,
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

type DropdownItem = {
    title: string;
    href: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
};

type NavItem = {
    label: string;
    href: string;
    primary?: boolean;
    dropdownItems?: DropdownItem[];
};

const DESKTOP_DROPDOWN_META: Record<
    string,
    {
        kicker: string;
        headline: string;
        description: string;
        accentClassName: string;
    }
> = {
    Build: {
        kicker: "Builder Surface",
        headline: "Ship, verify, govern.",
        description: "Protocol workstreams for teams building with Sigil infrastructure.",
        accentClassName: "bg-sage/20",
    },
    Resources: {
        kicker: "Knowledge Base",
        headline: "Learn the system.",
        description: "Guides, operational views, and live protocol references.",
        accentClassName: "bg-lavender/25",
    },
};

function DesktopDropdownPanel({ label, items }: { label: string; items: DropdownItem[] }) {
    const meta = DESKTOP_DROPDOWN_META[label] ?? {
        kicker: "Navigation",
        headline: "Explore",
        description: "Protocol destinations and surfaces.",
        accentClassName: "bg-cream/30",
    };

    const columns = 2;
    const rowCount = Math.ceil(items.length / columns);

    return (
        <NavigationMenuContent className="p-0">
            <div className="w-[min(92vw,760px)] border border-t-0 border-border bg-background/95 shadow-[0_24px_50px_-40px_oklch(var(--foreground)/0.7)] backdrop-blur-sm">
                <div className="grid min-h-[300px] grid-cols-[230px_1fr]">
                    <div className="flex flex-col border-r border-border">
                        <div
                            className={cn(
                                "border-b border-border px-5 py-4",
                                meta.accentClassName,
                            )}
                        >
                            <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                                {meta.kicker}
                            </p>
                        </div>
                        <div className="flex flex-1 flex-col justify-between px-5 py-5">
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold leading-tight text-foreground lowercase">
                                    {meta.headline}
                                </h3>
                                <p className="text-sm leading-relaxed text-muted-foreground">
                                    {meta.description}
                                </p>
                            </div>
                            <div className="mt-5 border border-border bg-background px-3 py-2">
                                <p className="text-[11px] tracking-[0.14em] text-muted-foreground uppercase">
                                    {items.length} destinations
                                </p>
                            </div>
                        </div>
                    </div>

                    <ul className="grid grid-cols-2 bg-background/60">
                        {items.map((item, index) => {
                            const isLastRow = index >= (rowCount - 1) * columns;
                            const isRightColumn = index % columns === 1;

                            return (
                                <li
                                    key={item.title}
                                    className={cn(
                                        "group border-border",
                                        "border-b",
                                        isLastRow && "border-b-0",
                                        isRightColumn && "border-l",
                                    )}
                                >
                                    <NavigationMenuLink asChild>
                                        <Link
                                            href={item.href}
                                            className="flex h-full min-h-[118px] items-start gap-3 px-4 py-4 no-underline outline-none transition-colors hover:bg-sage/15 focus:bg-sage/15"
                                        >
                                            <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center border border-border bg-background transition-colors group-hover:bg-lavender/35 group-focus:bg-lavender/35">
                                                <item.icon className="size-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex min-w-0 flex-1 flex-col">
                                                <p className="text-sm leading-none font-medium text-foreground">
                                                    {item.title}
                                                </p>
                                                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                                                    {item.description}
                                                </p>
                                                <span className="mt-3 inline-flex items-center gap-1 text-[11px] tracking-[0.12em] text-primary uppercase opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100">
                                                    Open
                                                    <ArrowUpRight className="size-3" />
                                                </span>
                                            </div>
                                        </Link>
                                    </NavigationMenuLink>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>
        </NavigationMenuContent>
    );
}

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

    const ITEMS: NavItem[] = [
        { label: "Verify", href: "/verify", primary: true },
        { label: "Dashboard", href: "/dashboard" },
        { label: "Chat", href: "/chat" },
        {
            label: "Build",
            href: "#build",
            dropdownItems: [
                {
                    title: "Launches",
                    href: "/launches",
                    description: "Browse and analyze launched project tokens",
                    icon: Rocket,
                },
                {
                    title: "Agents",
                    href: "/agents",
                    description: "Agent-first workflow for verification and operations",
                    icon: Bot,
                },
                {
                    title: "Governance",
                    href: "/governance",
                    description: "Track and vote on milestone-driven governance",
                    icon: Landmark,
                },
                {
                    title: "Developers",
                    href: "/developers",
                    description: "Builder docs, integration path, and protocol model",
                    icon: Code2,
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
                                                    "h-9 px-3 text-sm font-normal text-foreground",
                                                    "hover:bg-sage/20",
                                                    "focus:bg-sage/20",
                                                    "data-[state=open]:bg-background",
                                                    "hover:shadow-[inset_0_0_0_1px_oklch(var(--border))]",
                                                    "focus:shadow-[inset_0_0_0_1px_oklch(var(--border))]",
                                                    "data-[state=open]:text-foreground data-[state=open]:shadow-[inset_0_0_0_1px_oklch(var(--border))]",
                                                    "transition-colors",
                                                )}
                                            >
                                                {link.label}
                                            </NavigationMenuTrigger>
                                            <DesktopDropdownPanel
                                                label={link.label}
                                                items={link.dropdownItems}
                                            />
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
                                                {link.label}
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
