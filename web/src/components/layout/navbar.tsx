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
import { cn } from "@/lib/utils";

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const pathname = usePathname();

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

    const bgColor = "bg-background";

    return (
        <header
            className={cn("border-b-dark-gray relative z-50 h-20 border-b px-2.5 lg:px-0", bgColor)}
        >
            <div className="border-r-dark-gray border-l-dark-gray container flex h-20 items-center border-x">
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
                                                    "hover:bg-transparent focus:bg-transparent active:bg-transparent",
                                                    "hover:text-primary focus:text-primary",
                                                    "data-[state=open]:text-primary data-[state=open]:bg-transparent",
                                                    "transition-none",
                                                )}
                                            >
                                                {link.label}
                                            </NavigationMenuTrigger>
                                            <NavigationMenuContent className="bg-background border border-border shadow-lg">
                                                <ul className="w-[420px] divide-y divide-border">
                                                    {link.dropdownItems.map((item) => (
                                                        <li key={item.title}>
                                                            <NavigationMenuLink asChild>
                                                                <Link
                                                                    href={item.href}
                                                                    className="group flex items-center px-4 py-3 leading-none no-underline outline-none transition-all duration-200 select-none hover:bg-lavender/50 focus:bg-lavender/50"
                                                                >
                                                                    <div className="flex gap-3">
                                                                        <div className="flex size-10 shrink-0 items-center justify-center bg-lavender/60 transition-colors group-hover:bg-primary/10">
                                                                            <item.icon className="text-primary size-5" />
                                                                        </div>
                                                                        <div className="space-y-1">
                                                                            <div className="text-foreground text-sm leading-none font-medium group-hover:text-primary transition-colors">
                                                                                {item.title}
                                                                            </div>
                                                                            <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
                                                                                {item.description}
                                                                            </p>
                                                                        </div>
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
                                                    pathname === link.href &&
                                                        "text-primary font-medium",
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
                            <Link
                                href="/login"
                                className={`transition-opacity duration-300 ${isMenuOpen ? "max-lg:pointer-events-none max-lg:opacity-0" : "opacity-100"}`}
                            >
                                <Button size="sm">Sign In</Button>
                            </Link>

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
                    "border-t-dark-gray absolute inset-x-0 top-full container flex h-[calc(100vh-80px)] flex-col border-t px-2.5 lg:px-0",
                    "transition duration-300 ease-in-out lg:hidden",
                    isMenuOpen
                        ? "pointer-events-auto translate-y-0 opacity-100"
                        : "pointer-events-none -translate-y-full opacity-0",
                    bgColor,
                )}
            >
                <div className="border-dark-gray h-[calc(100vh-80px)] border-x px-5">
                    <nav className="mt-6 flex flex-1 flex-col gap-6">
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
                                        className="text-foreground flex w-full items-center justify-between text-lg tracking-[-0.36px]"
                                        aria-label={`${link.label} menu`}
                                        aria-expanded={openDropdown === link.label}
                                    >
                                        {link.label}
                                        <ChevronRight
                                            className={cn(
                                                "h-4 w-4 transition-transform",
                                                openDropdown === link.label ? "rotate-90" : "",
                                            )}
                                            aria-hidden="true"
                                        />
                                    </button>
                                    <div
                                        className={cn(
                                            "border-b-dark-gray ml-1 space-y-3 overflow-hidden border-b transition-all",
                                            openDropdown === link.label
                                                ? "mt-3 max-h-[1000px] pb-6 opacity-100"
                                                : "max-h-0 opacity-0",
                                        )}
                                    >
                                        {link.dropdownItems.map((item) => (
                                            <Link
                                                key={item.title}
                                                href={item.href}
                                                onClick={() => {
                                                    setIsMenuOpen(false);
                                                    setOpenDropdown(null);
                                                }}
                                                className="group flex items-start gap-3 p-3 transition-all duration-200 hover:bg-lavender/50 border-border border-b last:border-b-0"
                                            >
                                                <div className="flex size-10 shrink-0 items-center justify-center bg-lavender/60 transition-colors group-hover:bg-primary/10">
                                                    <item.icon className="text-primary size-5" />
                                                </div>
                                                <div>
                                                    <div className="text-foreground font-medium group-hover:text-primary transition-colors">
                                                        {item.title}
                                                    </div>
                                                    <p className="text-muted-foreground text-sm">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className={cn(
                                        "text-foreground text-lg tracking-[-0.36px]",
                                        pathname === link.href && "text-primary font-medium",
                                    )}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ),
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Navbar;
