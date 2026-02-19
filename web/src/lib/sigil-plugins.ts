export type SigilPluginKind = "container" | "assistant";

export interface SigilPluginOption {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  kind: SigilPluginKind;
}

export const SIGIL_PLUGIN_OPTIONS: SigilPluginOption[] = [
  {
    id: "openclaw-agent",
    name: "OpenClaw Agent",
    subtitle: "Container",
    description: "Deploy an OpenClaw agent container linked to this Sigil token.",
    kind: "container",
  },
  {
    id: "sigilbot",
    name: "SigilBot",
    subtitle: "Alternative",
    description: "Enable SigilBot workflows for token-aware automation.",
    kind: "assistant",
  },
];

export function getSigilPluginById(pluginId: string | null) {
  if (!pluginId) return null;
  return SIGIL_PLUGIN_OPTIONS.find((plugin) => plugin.id === pluginId) ?? null;
}
