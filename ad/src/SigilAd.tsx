import React from "react";
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
    Sequence,
    Easing,
} from "remotion";

/* ─── Brand Tokens ─── */
const PURPLE = "#482863";
const PURPLE_LIGHT = "#5e3680";
const SAGE = "#EAF4E8";
const ROSE = "#F4EAE8";
const CREAM = "#F4F3E8";
const LAVENDER = "#F2E8F4";
const WHITE = "#ffffff";
const GRAY_100 = "#f5f5f7";
const GRAY_600 = "#6e6e73";
const GRAY_800 = "#1d1d1f";

const FONT = `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif`;

/* ─── Helper: fade-slide-up entrance ─── */
function useEntrance(frame: number, delay: number, fps: number) {
    const opacity = interpolate(frame - delay, [0, 12], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
    });
    const y = interpolate(frame - delay, [0, 18], [40, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
    });
    return { opacity, transform: `translateY(${y}px)` };
}

/* ═══════════════════════════════════════════════
   Scene 1: Logo Reveal (frames 0–89, ~3s)
   Dark background → logo fades in → tagline appears
   ═══════════════════════════════════════════════ */
const Scene1: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Logo scales up with spring
    const logoScale = spring({ frame, fps, from: 0.6, to: 1, durationInFrames: 30, config: { damping: 12 } });
    const logoOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

    // Sigil text fades in after logo
    const textStyle = useEntrance(frame, 25, fps);

    // Tagline fades in last
    const tagStyle = useEntrance(frame, 45, fps);

    // Scene fade out
    const fadeOut = interpolate(frame, [70, 89], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    return (
        <AbsoluteFill
            style={{
                backgroundColor: GRAY_800,
                justifyContent: "center",
                alignItems: "center",
                fontFamily: FONT,
                opacity: fadeOut,
            }}
        >
            {/* Radial gradient glow */}
            <div
                style={{
                    position: "absolute",
                    width: 600,
                    height: 600,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${PURPLE}44 0%, transparent 70%)`,
                    opacity: logoOpacity * 0.6,
                    transform: `scale(${logoScale})`,
                }}
            />

            {/* Logo mark */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 24,
                }}
            >
                {/* Sigil icon — stylized ✦ */}
                <div
                    style={{
                        opacity: logoOpacity,
                        transform: `scale(${logoScale})`,
                        fontSize: 80,
                        color: LAVENDER,
                        lineHeight: 1,
                    }}
                >
                    ✦
                </div>

                {/* "Sigil" wordmark */}
                <div
                    style={{
                        ...textStyle,
                        fontSize: 96,
                        fontWeight: 700,
                        color: WHITE,
                        letterSpacing: "-0.03em",
                    }}
                >
                    Sigil
                </div>

                {/* Tagline */}
                <div
                    style={{
                        ...tagStyle,
                        fontSize: 28,
                        fontWeight: 400,
                        color: GRAY_600,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                    }}
                >
                    the verification standard
                </div>
            </div>
        </AbsoluteFill>
    );
};

/* ═══════════════════════════════════════════════
   Scene 2: Problem → Solution (frames 90–179, ~3s)
   Text morphs from problem to solution
   ═══════════════════════════════════════════════ */
const Scene2: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const line1 = useEntrance(frame, 0, fps);
    const line2 = useEntrance(frame, 12, fps);
    const line3 = useEntrance(frame, 24, fps);

    // Transition: problem text fades, solution appears
    const problemOpacity = interpolate(frame, [40, 50], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const solutionOpacity = interpolate(frame, [50, 62], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const solutionY = interpolate(frame, [50, 68], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

    const fadeOut = interpolate(frame, [75, 89], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    return (
        <AbsoluteFill
            style={{
                backgroundColor: WHITE,
                justifyContent: "center",
                alignItems: "center",
                fontFamily: FONT,
                opacity: fadeOut,
            }}
        >
            {/* Problem text */}
            <div
                style={{
                    position: "absolute",
                    textAlign: "center",
                    opacity: problemOpacity,
                    padding: "0 200px",
                }}
            >
                <div style={{ ...line1, fontSize: 26, color: GRAY_600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 24 }}>
                    the agentic economy is scaling
                </div>
                <div style={{ ...line2, fontSize: 64, fontWeight: 600, color: GRAY_800, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                    the infrastructure isn't.
                </div>
                <div style={{ ...line3, fontSize: 22, color: GRAY_600, marginTop: 20, maxWidth: 700, margin: "20px auto 0" }}>
                    no accountability. no verification. single points of failure.
                </div>
            </div>

            {/* Solution text */}
            <div
                style={{
                    position: "absolute",
                    textAlign: "center",
                    opacity: solutionOpacity,
                    transform: `translateY(${solutionY}px)`,
                    padding: "0 200px",
                }}
            >
                <div style={{ fontSize: 26, color: PURPLE, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 24 }}>
                    until now
                </div>
                <div style={{ fontSize: 64, fontWeight: 600, color: GRAY_800, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                    sigil changes everything.
                </div>
            </div>
        </AbsoluteFill>
    );
};

/* ═══════════════════════════════════════════════
   Scene 3: Triptych — Verify · Fund · Govern (frames 180–269, ~3s)
   Three pillars animate in with stagger
   ═══════════════════════════════════════════════ */
const Scene3: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const pillars = [
        { label: "verify", title: "multi-channel trust", color: SAGE, icon: "🔐" },
        { label: "fund", title: "capital routed to builders", color: ROSE, icon: "💰" },
        { label: "govern", title: "milestone accountability", color: LAVENDER, icon: "🏛" },
    ];

    const fadeOut = interpolate(frame, [75, 89], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    return (
        <AbsoluteFill
            style={{
                backgroundColor: GRAY_100,
                fontFamily: FONT,
                justifyContent: "center",
                alignItems: "center",
                opacity: fadeOut,
            }}
        >
            <div style={{ display: "flex", gap: 40, width: 1600, justifyContent: "center" }}>
                {pillars.map((p, i) => {
                    const delay = i * 10;
                    const scale = spring({ frame: frame - delay, fps, from: 0.85, to: 1, durationInFrames: 20, config: { damping: 12 } });
                    const opacity = interpolate(frame - delay, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

                    return (
                        <div
                            key={p.label}
                            style={{
                                width: 480,
                                backgroundColor: WHITE,
                                borderRadius: 20,
                                padding: "60px 48px",
                                opacity,
                                transform: `scale(${scale})`,
                                boxShadow: "0 2px 40px rgba(0,0,0,0.06)",
                                textAlign: "center",
                            }}
                        >
                            <div
                                style={{
                                    width: 72,
                                    height: 72,
                                    borderRadius: 18,
                                    backgroundColor: p.color,
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    fontSize: 36,
                                    margin: "0 auto 28px",
                                }}
                            >
                                {p.icon}
                            </div>
                            <div
                                style={{
                                    fontSize: 16,
                                    fontWeight: 600,
                                    color: PURPLE,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.15em",
                                    marginBottom: 12,
                                }}
                            >
                                {p.label}
                            </div>
                            <div
                                style={{
                                    fontSize: 26,
                                    fontWeight: 600,
                                    color: GRAY_800,
                                    lineHeight: 1.3,
                                }}
                            >
                                {p.title}
                            </div>
                        </div>
                    );
                })}
            </div>
        </AbsoluteFill>
    );
};

/* ═══════════════════════════════════════════════
   Scene 4: Five Channels (frames 270–359, ~3s)
   5 circles animate in showing verification channels
   ═══════════════════════════════════════════════ */
const Scene4: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const channels = [
        { name: "GitHub", abbr: "GH", method: "OAuth" },
        { name: "X", abbr: "X", method: "zkTLS" },
        { name: "Facebook", abbr: "FB", method: "OAuth" },
        { name: "Instagram", abbr: "IG", method: "OAuth" },
        { name: "Domain", abbr: "◎", method: "DNS" },
    ];

    const headerStyle = useEntrance(frame, 0, fps);

    const fadeOut = interpolate(frame, [75, 89], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    return (
        <AbsoluteFill
            style={{
                backgroundColor: GRAY_800,
                fontFamily: FONT,
                justifyContent: "center",
                alignItems: "center",
                opacity: fadeOut,
            }}
        >
            <div style={{ textAlign: "center" }}>
                <div
                    style={{
                        ...headerStyle,
                        fontSize: 16,
                        fontWeight: 600,
                        color: LAVENDER,
                        textTransform: "uppercase",
                        letterSpacing: "0.15em",
                        marginBottom: 16,
                    }}
                >
                    trust layer
                </div>
                <div
                    style={{
                        ...headerStyle,
                        fontSize: 52,
                        fontWeight: 600,
                        color: WHITE,
                        lineHeight: 1.2,
                        letterSpacing: "-0.02em",
                        marginBottom: 60,
                    }}
                >
                    five channels.
                    <br />
                    no single point of failure.
                </div>

                <div style={{ display: "flex", gap: 32, justifyContent: "center" }}>
                    {channels.map((ch, i) => {
                        const delay = 20 + i * 8;
                        const scale = spring({ frame: frame - delay, fps, from: 0, to: 1, durationInFrames: 20, config: { damping: 10, mass: 0.5 } });
                        const opacity = interpolate(frame - delay, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

                        // Check mark appears after all circles
                        const checkDelay = delay + 15;
                        const checkOpacity = interpolate(frame - checkDelay, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
                        const checkScale = spring({ frame: frame - checkDelay, fps, from: 0, to: 1, durationInFrames: 12, config: { damping: 8 } });

                        return (
                            <div
                                key={ch.abbr}
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    gap: 12,
                                    opacity,
                                    transform: `scale(${scale})`,
                                }}
                            >
                                <div
                                    style={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: "50%",
                                        border: `2px solid ${PURPLE_LIGHT}`,
                                        backgroundColor: `${PURPLE}33`,
                                        display: "flex",
                                        justifyContent: "center",
                                        alignItems: "center",
                                        fontSize: 28,
                                        fontWeight: 700,
                                        color: WHITE,
                                        position: "relative",
                                    }}
                                >
                                    {ch.abbr}
                                    {/* Check overlay */}
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: -4,
                                            right: -4,
                                            width: 28,
                                            height: 28,
                                            borderRadius: "50%",
                                            backgroundColor: "#1a7f37",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            fontSize: 14,
                                            color: WHITE,
                                            opacity: checkOpacity,
                                            transform: `scale(${checkScale})`,
                                        }}
                                    >
                                        ✓
                                    </div>
                                </div>
                                <div style={{ fontSize: 16, color: GRAY_600 }}>{ch.name}</div>
                                <div
                                    style={{
                                        fontSize: 12,
                                        color: LAVENDER,
                                        backgroundColor: `${PURPLE}44`,
                                        padding: "4px 12px",
                                        borderRadius: 100,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                    }}
                                >
                                    {ch.method}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </AbsoluteFill>
    );
};

/* ═══════════════════════════════════════════════
   Scene 5: CTA — Claim Your Sigil (frames 360–449, ~3s)
   Final brand moment with CTA
   ═══════════════════════════════════════════════ */
const Scene5: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const iconScale = spring({ frame, fps, from: 0.5, to: 1, durationInFrames: 25, config: { damping: 10 } });
    const iconOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

    const headingStyle = useEntrance(frame, 15, fps);
    const subStyle = useEntrance(frame, 28, fps);
    const ctaStyle = useEntrance(frame, 40, fps);
    const urlStyle = useEntrance(frame, 52, fps);

    return (
        <AbsoluteFill
            style={{
                backgroundColor: WHITE,
                fontFamily: FONT,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            {/* Background accent gradient */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `linear-gradient(135deg, ${SAGE}88 0%, ${WHITE} 40%, ${LAVENDER}88 100%)`,
                }}
            />

            <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
                {/* Sigil icon */}
                <div
                    style={{
                        fontSize: 60,
                        opacity: iconOpacity,
                        transform: `scale(${iconScale})`,
                        marginBottom: 24,
                        color: PURPLE,
                    }}
                >
                    ✦
                </div>

                {/* Heading */}
                <div
                    style={{
                        ...headingStyle,
                        fontSize: 72,
                        fontWeight: 700,
                        color: GRAY_800,
                        letterSpacing: "-0.03em",
                        lineHeight: 1.1,
                        marginBottom: 20,
                    }}
                >
                    claim your sigil.
                </div>

                {/* Sub */}
                <div
                    style={{
                        ...subStyle,
                        fontSize: 24,
                        color: GRAY_600,
                        maxWidth: 600,
                        margin: "0 auto",
                        lineHeight: 1.5,
                    }}
                >
                    five channels. onchain attestation.
                    <br />
                    milestone governance. dev projects only.
                </div>

                {/* CTA button */}
                <div
                    style={{
                        ...ctaStyle,
                        marginTop: 48,
                    }}
                >
                    <div
                        style={{
                            display: "inline-block",
                            backgroundColor: PURPLE,
                            color: WHITE,
                            fontSize: 20,
                            fontWeight: 600,
                            padding: "16px 48px",
                            borderRadius: 12,
                            letterSpacing: "0.03em",
                        }}
                    >
                        Stamp Your Sigil →
                    </div>
                </div>

                {/* URL */}
                <div
                    style={{
                        ...urlStyle,
                        marginTop: 32,
                        fontSize: 18,
                        color: GRAY_600,
                        letterSpacing: "0.05em",
                    }}
                >
                    heysigil.fund
                </div>
            </div>
        </AbsoluteFill>
    );
};

/* ═══════════════════════════════════════════════
   Main Composition
   ═══════════════════════════════════════════════ */
export const SigilAd: React.FC = () => {
    return (
        <AbsoluteFill>
            {/* Scene 1: Logo Reveal — 0 to 2.97s */}
            <Sequence from={0} durationInFrames={90}>
                <Scene1 />
            </Sequence>

            {/* Scene 2: Problem → Solution — 3s to 5.97s */}
            <Sequence from={90} durationInFrames={90}>
                <Scene2 />
            </Sequence>

            {/* Scene 3: Triptych — 6s to 8.97s */}
            <Sequence from={180} durationInFrames={90}>
                <Scene3 />
            </Sequence>

            {/* Scene 4: Five Channels — 9s to 11.97s */}
            <Sequence from={270} durationInFrames={90}>
                <Scene4 />
            </Sequence>

            {/* Scene 5: CTA — 12s to 14.97s */}
            <Sequence from={360} durationInFrames={90}>
                <Scene5 />
            </Sequence>
        </AbsoluteFill>
    );
};
