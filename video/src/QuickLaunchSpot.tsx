import {
    AbsoluteFill,
    Img,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
    Easing,
    staticFile,
    Sequence,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
    weights: ["400", "500", "600", "700", "800"],
    subsets: ["latin"],
});

// ─── Design tokens ───────────────────────────────────────────
const C = {
    bg: "#0C0A14",
    bgCard: "rgba(22, 18, 36, 0.95)",
    purple: "#7E56DA",
    purpleLight: "#A48AE7",
    purpleMuted: "#5A3DAA",
    lavender: "#C5B3F0",
    textPrimary: "#FAF8FF",
    textSecondary: "#9B8FB0",
    textGhost: "#6A5D80",
    border: "rgba(126, 86, 218, 0.25)",
    borderBright: "rgba(126, 86, 218, 0.5)",
    green: "#4ADE80",
    greenDark: "rgba(74, 222, 128, 0.15)",
};

// ─── Sections (frame ranges at 30fps, 300 total = 10s) ──────
const SCENE = {
    // 0–90: Hero intro — "Quick Launch" text slam
    heroStart: 0,
    heroEnd: 90,
    // 45–180: UI card with form fields animating in
    cardStart: 45,
    cardEnd: 180,
    // 140–220: Plugin badges fly in (OpenClaw, SigilBot)
    pluginStart: 140,
    pluginEnd: 220,
    // 180–260: "Launch" button press + success burst
    launchStart: 180,
    launchEnd: 260,
    // 220–300: 3D logo spin + tagline fade
    outroStart: 220,
    outroEnd: 300,
};


// ─── Components ──────────────────────────────────────────────

/** Dark grid background with subtle purple glow */
const DarkBackground: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
    const time = frame / fps;
    const glowX = 50 + Math.sin(time * 0.3) * 8;
    const glowY = 45 + Math.cos(time * 0.25) * 6;

    return (
        <AbsoluteFill>
            {/* Base */}
            <AbsoluteFill style={{ background: C.bg }} />

            {/* Grid overlay */}
            <AbsoluteFill
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(126, 86, 218, 0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(126, 86, 218, 0.04) 1px, transparent 1px)
                    `,
                    backgroundSize: "60px 60px",
                    opacity: 0.7,
                }}
            />

            {/* Purple glow center */}
            <div
                style={{
                    position: "absolute",
                    left: `${glowX}%`,
                    top: `${glowY}%`,
                    width: 800,
                    height: 800,
                    transform: "translate(-50%, -50%)",
                    background: `radial-gradient(circle, rgba(126, 86, 218, 0.12) 0%, transparent 70%)`,
                    filter: "blur(60px)",
                }}
            />
        </AbsoluteFill>
    );
};


/** Hero text — "QUICK LAUNCH" with slam-in effect */
const HeroText: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
    const slamIn = spring({
        frame,
        fps,
        config: { damping: 12, stiffness: 180, mass: 0.8 },
        durationInFrames: 20,
        delay: 8,
    });

    const subtitleIn = spring({
        frame,
        fps,
        config: { damping: 200, stiffness: 60 },
        durationInFrames: 30,
        delay: 22,
    });

    // Fade out when card comes in
    const fadeOut = interpolate(frame, [70, 90], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    const scale = interpolate(slamIn, [0, 1], [1.8, 1]);
    const blur = interpolate(slamIn, [0, 1], [12, 0]);

    return (
        <AbsoluteFill
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                opacity: fadeOut,
            }}
        >
            <div
                style={{
                    fontFamily,
                    fontSize: 72,
                    fontWeight: 800,
                    color: C.textPrimary,
                    letterSpacing: "-0.04em",
                    transform: `scale(${scale})`,
                    filter: `blur(${blur}px)`,
                    opacity: slamIn,
                    textAlign: "center",
                }}
            >
                <span style={{ color: C.purple }}>QUICK</span> LAUNCH
            </div>

            <div
                style={{
                    fontFamily,
                    fontSize: 18,
                    fontWeight: 500,
                    color: C.textSecondary,
                    marginTop: 16,
                    opacity: subtitleIn * 0.8,
                    transform: `translateY(${(1 - subtitleIn) * 10}px)`,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                }}
            >
                launch instantly — claim ownership later
            </div>
        </AbsoluteFill>
    );
};


/** Token form card that slides up */
const LaunchCard: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
    const cardFrame = Math.max(0, frame - SCENE.cardStart);

    const slideUp = spring({
        frame: cardFrame,
        fps,
        config: { damping: 16, stiffness: 100, mass: 0.7 },
        durationInFrames: 30,
    });

    const cardY = interpolate(slideUp, [0, 1], [120, 0]);
    const cardOpacity = interpolate(slideUp, [0, 1], [0, 1]);

    // Token name typing animation
    const LABEL = "sigil: my-agent-project";
    const typeProgress = interpolate(cardFrame, [20, 60], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
    });
    const typedChars = Math.round(typeProgress * LABEL.length);
    const typedText = LABEL.slice(0, typedChars);

    // Owner typing
    const OWNER = "github.com/heysigil";
    const ownerProgress = interpolate(cardFrame, [40, 75], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
    });
    const ownerChars = Math.round(ownerProgress * OWNER.length);
    const ownerText = OWNER.slice(0, ownerChars);

    // Cursor blink
    const cursorOpacity = interpolate(
        cardFrame % 16,
        [0, 8, 16],
        [1, 0, 1],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );

    // Card fade out at outro
    const exitFade = interpolate(frame, [SCENE.outroStart, SCENE.outroStart + 20], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    return (
        <AbsoluteFill
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: cardOpacity * exitFade,
                transform: `translateY(${cardY}px)`,
            }}
        >
            <div
                style={{
                    width: 620,
                    background: C.bgCard,
                    border: `1px solid ${C.border}`,
                    borderRadius: 20,
                    overflow: "hidden",
                    boxShadow: `
                        0 4px 60px rgba(126, 86, 218, 0.15),
                        0 0 0 1px rgba(126, 86, 218, 0.1) inset
                    `,
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "20px 28px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        borderBottom: `1px solid ${C.border}`,
                    }}
                >
                    <div
                        style={{
                            fontFamily,
                            fontSize: 10,
                            fontWeight: 700,
                            color: C.purple,
                            letterSpacing: "0.14em",
                            textTransform: "uppercase",
                        }}
                    >
                        QUICK LAUNCH
                    </div>
                    <div
                        style={{
                            fontFamily,
                            fontSize: 10,
                            fontWeight: 500,
                            color: C.textGhost,
                            marginLeft: "auto",
                        }}
                    >
                        unclaimed mode
                    </div>
                </div>

                {/* Form fields */}
                <div style={{ padding: "20px 28px", display: "flex", flexDirection: "column", gap: 14 }}>
                    {/* Token Name */}
                    <div>
                        <div
                            style={{
                                fontFamily,
                                fontSize: 10,
                                fontWeight: 600,
                                color: C.textGhost,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                marginBottom: 6,
                            }}
                        >
                            TOKEN NAME
                        </div>
                        <div
                            style={{
                                background: "rgba(255, 255, 255, 0.04)",
                                border: `1px solid ${C.border}`,
                                borderRadius: 10,
                                padding: "12px 16px",
                                fontFamily,
                                fontSize: 16,
                                fontWeight: 500,
                                color: typedChars > 0 ? C.textPrimary : C.textGhost,
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            {typedText || "sigil: your project"}
                            {cardFrame < 65 && (
                                <span
                                    style={{
                                        width: 2,
                                        height: 18,
                                        backgroundColor: C.purple,
                                        marginLeft: 1,
                                        opacity: cursorOpacity,
                                        borderRadius: 1,
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Owner */}
                    <div>
                        <div
                            style={{
                                fontFamily,
                                fontSize: 10,
                                fontWeight: 600,
                                color: C.textGhost,
                                letterSpacing: "0.1em",
                                textTransform: "uppercase",
                                marginBottom: 6,
                            }}
                        >
                            OWNER / SOURCE
                        </div>
                        <div
                            style={{
                                background: "rgba(255, 255, 255, 0.04)",
                                border: `1px solid ${C.border}`,
                                borderRadius: 10,
                                padding: "12px 16px",
                                fontFamily,
                                fontSize: 16,
                                fontWeight: 500,
                                color: ownerChars > 0 ? C.textPrimary : C.textGhost,
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            {ownerText || "github.com/org/repo"}
                            {cardFrame >= 35 && cardFrame < 80 && (
                                <span
                                    style={{
                                        width: 2,
                                        height: 18,
                                        backgroundColor: C.purple,
                                        marginLeft: 1,
                                        opacity: cursorOpacity,
                                        borderRadius: 1,
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Plugins section */}
                <PluginBadges frame={frame} fps={fps} />

                {/* Launch button */}
                <LaunchButton frame={frame} fps={fps} />
            </div>
        </AbsoluteFill>
    );
};


/** Plugin badges that fly in */
const PluginBadges: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
    const pFrame = Math.max(0, frame - SCENE.pluginStart);

    const badge1In = spring({
        frame: pFrame,
        fps,
        config: { damping: 14, stiffness: 160 },
        durationInFrames: 18,
    });

    const badge2In = spring({
        frame: pFrame,
        fps,
        config: { damping: 14, stiffness: 160 },
        durationInFrames: 18,
        delay: 8,
    });

    const badges = [
        { name: "OpenClaw Agent", tag: "Container", progress: badge1In },
        { name: "SigilBot", tag: "Alternative", progress: badge2In },
    ];

    return (
        <div
            style={{
                padding: "0 28px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
            }}
        >
            <div
                style={{
                    fontFamily,
                    fontSize: 10,
                    fontWeight: 700,
                    color: C.purple,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginBottom: 4,
                    opacity: badge1In,
                }}
            >
                PLUGINS (OPTIONAL)
            </div>
            {badges.map((b, i) => (
                <div
                    key={i}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 14px",
                        border: `1px solid ${C.border}`,
                        borderRadius: 10,
                        background: "rgba(126, 86, 218, 0.04)",
                        opacity: b.progress,
                        transform: `translateX(${(1 - b.progress) * 40}px)`,
                    }}
                >
                    {/* Checkbox */}
                    <div
                        style={{
                            width: 18,
                            height: 18,
                            borderRadius: 4,
                            border: `2px solid ${C.borderBright}`,
                            background: b.progress > 0.8 ? C.purple : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "background 0.2s",
                        }}
                    >
                        {b.progress > 0.8 && (
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                <path
                                    d="M2 6L5 9L10 3"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        )}
                    </div>
                    <span
                        style={{
                            fontFamily,
                            fontSize: 14,
                            fontWeight: 600,
                            color: C.textPrimary,
                        }}
                    >
                        {b.name}
                    </span>
                    <span
                        style={{
                            fontFamily,
                            fontSize: 9,
                            fontWeight: 600,
                            color: C.textSecondary,
                            background: "rgba(255, 255, 255, 0.06)",
                            border: `1px solid ${C.border}`,
                            borderRadius: 4,
                            padding: "2px 8px",
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                        }}
                    >
                        {b.tag}
                    </span>
                </div>
            ))}
        </div>
    );
};


/** Launch button with press + success flash */
const LaunchButton: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
    const lFrame = Math.max(0, frame - SCENE.launchStart);

    // Button press animation
    const pressDown = spring({
        frame: lFrame,
        fps,
        config: { damping: 8, stiffness: 300 },
        durationInFrames: 6,
        delay: 8,
    });

    const pressUp = spring({
        frame: lFrame,
        fps,
        config: { damping: 12, stiffness: 200 },
        durationInFrames: 10,
        delay: 14,
    });

    const pressScale = 1 - pressDown * 0.06 + pressUp * 0.06;

    // Success state
    const showSuccess = lFrame > 24;
    const successIn = spring({
        frame: lFrame,
        fps,
        config: { damping: 14, stiffness: 120 },
        durationInFrames: 20,
        delay: 24,
    });

    // Success flash
    const flashOpacity = interpolate(lFrame, [22, 26, 40], [0, 0.6, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    const buttonBg = showSuccess
        ? `linear-gradient(135deg, ${C.green}, #22C55E)`
        : `linear-gradient(135deg, ${C.purple}, ${C.purpleLight})`;

    const buttonText = showSuccess ? "✓ LAUNCHED" : "Launch Unclaimed Token";

    return (
        <div style={{ padding: "4px 28px 22px" }}>
            {/* Flash overlay */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(circle at 50% 80%, rgba(126, 86, 218, ${flashOpacity}), transparent 60%)`,
                    pointerEvents: "none",
                }}
            />
            <div
                style={{
                    background: buttonBg,
                    borderRadius: 12,
                    padding: "14px 0",
                    textAlign: "center",
                    fontFamily,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "white",
                    letterSpacing: "0.04em",
                    cursor: "pointer",
                    transform: `scale(${pressScale})`,
                    boxShadow: showSuccess
                        ? `0 4px 20px rgba(74, 222, 128, 0.3)`
                        : `0 4px 20px rgba(126, 86, 218, 0.25)`,
                }}
            >
                {buttonText}
            </div>
        </div>
    );
};


/** Spinning 3D logo using the static PNG with CSS 3D transform */
const SpinningLogo: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
    const oFrame = Math.max(0, frame - SCENE.outroStart);

    const entrance = spring({
        frame: oFrame,
        fps,
        config: { damping: 14, stiffness: 80 },
        durationInFrames: 30,
    });

    const rotation = interpolate(oFrame, [0, 80], [0, 360], {
        extrapolateRight: "extend",
    });

    // Slight Y-float
    const yFloat = Math.sin((oFrame / fps) * Math.PI * 1.2) * 6;

    // Glow pulse
    const glowPulse = Math.sin((oFrame / fps) * Math.PI * 2) * 0.3 + 0.7;

    return (
        <AbsoluteFill
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                opacity: entrance,
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: 200,
                    height: 200,
                    transform: `
                        translateY(${yFloat}px)
                        perspective(600px)
                        rotateY(${rotation}deg)
                    `,
                }}
            >
                {/* Glow behind */}
                <div
                    style={{
                        position: "absolute",
                        inset: -40,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, rgba(126, 86, 218, ${0.25 * glowPulse}) 0%, transparent 70%)`,
                        filter: "blur(30px)",
                    }}
                />
                <Img
                    src={staticFile("logo-lavender.png")}
                    style={{
                        width: 200,
                        height: 200,
                        borderRadius: 40,
                        position: "relative",
                        zIndex: 1,
                    }}
                />
            </div>

            {/* Tagline */}
            <div
                style={{
                    marginTop: 36,
                    fontFamily,
                    fontSize: 16,
                    fontWeight: 600,
                    color: C.textSecondary,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    opacity: interpolate(oFrame, [20, 40], [0, 0.7], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                    }),
                    transform: `translateY(${interpolate(oFrame, [20, 40], [10, 0], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                    })}px)`,
                }}
            >
                the trust layer for the agentic economy
            </div>

            {/* URL */}
            <div
                style={{
                    marginTop: 12,
                    fontFamily,
                    fontSize: 20,
                    fontWeight: 700,
                    color: C.purple,
                    opacity: interpolate(oFrame, [30, 50], [0, 1], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                    }),
                }}
            >
                heysigil.fund
            </div>
        </AbsoluteFill>
    );
};


// ─── Main composition ────────────────────────────────────────

export const QuickLaunchSpot: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    return (
        <AbsoluteFill
            style={{
                fontFamily,
                overflow: "hidden",
                background: C.bg,
            }}
        >
            {/* Scale 2x for 4K rendering */}
            <AbsoluteFill style={{ transform: "scale(2)", transformOrigin: "center center" }}>
                <DarkBackground frame={frame} fps={fps} />

                {/* Scene 1: Hero slam text (frames 0–90) */}
                <Sequence from={SCENE.heroStart} durationInFrames={SCENE.heroEnd - SCENE.heroStart}>
                    <HeroText frame={frame} fps={fps} />
                </Sequence>

                {/* Scene 2–4: Card with form, plugins, launch (frames 45–260) */}
                <Sequence from={SCENE.cardStart} durationInFrames={SCENE.outroStart + 20 - SCENE.cardStart}>
                    <LaunchCard frame={frame} fps={fps} />
                </Sequence>

                {/* Scene 5: Spinning logo + tagline (frames 220–300) */}
                <Sequence from={SCENE.outroStart} durationInFrames={SCENE.outroEnd - SCENE.outroStart}>
                    <SpinningLogo frame={frame} fps={fps} />
                </Sequence>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
