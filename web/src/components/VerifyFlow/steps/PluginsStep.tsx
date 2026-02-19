/**
 * PluginsStep Component
 *
 * Step 3: Optional plugin selection before challenge generation.
 */

"use client";

import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PixelCard } from "@/components/ui/pixel-card";
import { SIGIL_PLUGIN_OPTIONS } from "@/lib/sigil-plugins";
import { cn } from "@/lib/utils";

interface PluginsStepProps {
    selectedPluginId: string | null;
    loading: boolean;
    error: string;
    onSelect: (pluginId: string | null) => void;
    onBack: () => void;
    onContinue: () => void;
    onClearError: () => void;
}

export function PluginsStep({
    selectedPluginId,
    loading,
    error,
    onSelect,
    onBack,
    onContinue,
    onClearError,
}: PluginsStepProps) {
    return (
        <div className="flex-1 flex flex-col bg-background">
            <div className="px-6 py-3 lg:px-12 border-b border-border bg-secondary/30">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Step 3 - Optional Plugins
                </span>
            </div>

            <div className="px-6 py-6 lg:px-12 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground lowercase mb-1">
                    choose optional plugin setup
                </h2>
                <p className="text-sm text-muted-foreground">
                    Enable OpenClaw Agent container or SigilBot now, or skip and add later.
                </p>
            </div>

            <div className="px-6 py-2 lg:px-12 border-b border-border bg-lavender/30">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                    plugin options
                </span>
            </div>

            <div className="border-b border-border">
                {SIGIL_PLUGIN_OPTIONS.map((plugin, index) => {
                    const isSelected = selectedPluginId === plugin.id;
                    const rowBorderClass =
                        index < SIGIL_PLUGIN_OPTIONS.length - 1 ? "border-b border-border" : "";

                    const content = (
                        <>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-sm font-medium text-foreground">{plugin.name}</span>
                                <Badge variant="outline" className="text-[10px]">
                                    {plugin.subtitle}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{plugin.description}</p>
                        </>
                    );

                    if (isSelected) {
                        return (
                            <PixelCard
                                key={plugin.id}
                                variant="lavender"
                                active
                                centerFade
                                noFocus
                                className={cn("bg-lavender/35", rowBorderClass)}
                            >
                                <button
                                    type="button"
                                    onClick={() => onSelect(plugin.id)}
                                    className="w-full px-6 py-4 lg:px-12 text-left"
                                >
                                    {content}
                                </button>
                            </PixelCard>
                        );
                    }

                    return (
                        <button
                            key={plugin.id}
                            type="button"
                            onClick={() => onSelect(plugin.id)}
                            className={cn(
                                "w-full px-6 py-4 lg:px-12 text-left transition-colors bg-background hover:bg-lavender/20",
                                rowBorderClass,
                            )}
                        >
                            {content}
                        </button>
                    );
                })}
            </div>

            <div className="px-6 py-3 lg:px-12 border-b border-border bg-cream/25">
                <button
                    type="button"
                    onClick={() => onSelect(null)}
                    className="text-xs uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
                >
                    {selectedPluginId ? "Clear plugin selection" : "No plugin selected"}
                </button>
            </div>

            {error && (
                <div className="px-6 py-4 lg:px-12 bg-red-50 border-b border-border">
                    <div className="flex items-start justify-between">
                        <p className="text-sm text-red-700">{error}</p>
                        <button
                            type="button"
                            onClick={onClearError}
                            className="text-red-700 hover:text-red-900"
                        >
                            x
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col px-6 py-6 lg:px-12 bg-sage/20">
                <div className="flex-1" />
                <div className="flex gap-3">
                    <Button variant="outline" onClick={onBack}>
                        <ArrowLeft className="size-4 mr-2" />
                        Back
                    </Button>
                    <Button onClick={onContinue} disabled={loading} className="flex-1">
                        {loading ? (
                            <>
                                <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                                Creating...
                            </>
                        ) : (
                            "Continue to Verification"
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
