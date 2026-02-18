import React from "react";
import {
    AbsoluteFill,
    useCurrentFrame,
    useVideoConfig,
    interpolate,
    spring,
    Sequence,
    Easing,
    Img,
    staticFile,
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
    const opacity = interpolate(frame - delay, [0, 14], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
    });
    const y = interpolate(frame - delay, [0, 20], [50, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
    });
    return { opacity, transform: `translateY(${y}px)` };
}

/* ═══════════════════════════════════════════════
   Scene 1: Cinematic Logo Reveal (0–89, ~3s)
   Dark bg with particle network → Sigil logo → @HeySigil
   ═══════════════════════════════════════════════ */
const Scene1: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Background image ken burns effect — slow zoom
    const bgScale = interpolate(frame, [0, 89], [1, 1.08], {
        extrapolateRight: "clamp",
    });
    const bgOpacity = interpolate(frame, [0, 15], [0, 0.6], {
        extrapolateRight: "clamp",
    });

    // Logo animation
    const logoScale = spring({
        frame,
        fps,
        from: 0.4,
        to: 1,
        durationInFrames: 35,
        config: { damping: 14, mass: 0.8 },
    });
    const logoOpacity = interpolate(frame, [0, 20], [0, 1], {
        extrapolateRight: "clamp",
    });

    // Glow pulse behind logo
    const glowScale = spring({
        frame,
        fps,
        from: 0.3,
        to: 1,
        durationInFrames: 40,
        config: { damping: 10 },
    });
    const glowPulse = interpolate(frame, [40, 60, 80], [1, 1.1, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    // "Sigil" wordmark
    const wordmark = useEntrance(frame, 22, fps);

    // @HeySigil handle
    const handle = useEntrance(frame, 38, fps);

    // Scene fade out
    const fadeOut = interpolate(frame, [72, 89], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

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
            {/* Background particle network image */}
            <Img
                src={staticFile("assets/backgrounds/dark-particles-network.png")}
                style={{
                    position: "absolute",
                    width: "120%",
                    height: "120%",
                    objectFit: "cover",
                    opacity: bgOpacity,
                    transform: `scale(${bgScale})`,
                    top: "-10%",
                    left: "-10%",
                }}
            />

            {/* Radial glow */}
            <div
                style={{
                    position: "absolute",
                    width: 700,
                    height: 700,
                    borderRadius: "50%",
                    background: `radial-gradient(circle, ${PURPLE}55 0%, ${PURPLE}22 35%, transparent 70%)`,
                    opacity: logoOpacity * 0.8,
                    transform: `scale(${glowScale * glowPulse})`,
                }}
            />

            {/* Content */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 20,
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {/* Sigil logo mark */}
                <div
                    style={{
                        opacity: logoOpacity,
                        transform: `scale(${logoScale})`,
                    }}
                >
                    <Img
                        src={staticFile("assets/icons/logo-lavender.png")}
                        style={{
                            width: 120,
                            height: 120,
                            borderRadius: 28,
                        }}
                    />
                </div>

                {/* "sigil" wordmark — lowercase, premium */}
                <div
                    style={{
                        ...wordmark,
                        fontSize: 108,
                        fontWeight: 700,
                        color: WHITE,
                        letterSpacing: "-0.04em",
                        lineHeight: 1,
                    }}
                >
                    sigil
                </div>

                {/* @HeySigil handle */}
                <div
                    style={{
                        ...handle,
                        fontSize: 24,
                        fontWeight: 500,
                        color: LAVENDER,
                        letterSpacing: "0.08em",
                    }}
                >
                    @HeySigil
                </div>
            </div>
        </AbsoluteFill>
    );
};

/* ═══════════════════════════════════════════════
   Scene 2: Problem → Shield Reveal (90–179, ~3s)
   Problem statement → verification shield asset appears
   ═══════════════════════════════════════════════ */
const Scene2: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const line1 = useEntrance(frame, 0, fps);
    const line2 = useEntrance(frame, 10, fps);

    // Problem fades, shield appears
    const problemOpacity = interpolate(frame, [35, 45], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    // Shield reveal
    const shieldOpacity = interpolate(frame, [42, 55], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
    const shieldScale = spring({
        frame: frame - 42,
        fps,
        from: 0.5,
        to: 1,
        durationInFrames: 25,
        config: { damping: 12 },
    });
    const shieldGlow = interpolate(frame, [55, 70, 85], [0, 0.6, 0.3], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    const solutionText = useEntrance(frame, 55, fps);

    const fadeOut = interpolate(frame, [75, 89], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

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
            {/* Subtle purple gradient bg */}
            <Img
                src={staticFile("assets/backgrounds/purple-gradient-dark.png")}
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.4,
                }}
            />

            {/* Problem text */}
            <div
                style={{
                    position: "absolute",
                    textAlign: "center",
                    opacity: problemOpacity,
                    padding: "0 200px",
                }}
            >
                <div
                    style={{
                        ...line1,
                        fontSize: 22,
                        color: GRAY_600,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        marginBottom: 20,
                    }}
                >
                    the agentic economy is scaling
                </div>
                <div
                    style={{
                        ...line2,
                        fontSize: 68,
                        fontWeight: 600,
                        color: WHITE,
                        lineHeight: 1.1,
                        letterSpacing: "-0.02em",
                    }}
                >
                    but who do you trust?
                </div>
            </div>

            {/* Shield + Solution */}
            <div
                style={{
                    position: "absolute",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 24,
                    opacity: shieldOpacity,
                }}
            >
                {/* Shield glow */}
                <div
                    style={{
                        position: "absolute",
                        width: 400,
                        height: 400,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, ${PURPLE}66 0%, transparent 70%)`,
                        opacity: shieldGlow,
                        top: -60,
                    }}
                />
                {/* SVG Shield Icon */}
                <div
                    style={{
                        transform: `scale(${shieldScale})`,
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    <svg width="200" height="240" viewBox="0 0 200 240" fill="none">
                        {/* Shield body */}
                        <path
                            d="M100 8L12 52V120C12 176 48 224 100 236C152 224 188 176 188 120V52L100 8Z"
                            fill={`${PURPLE}33`}
                            stroke={LAVENDER}
                            strokeWidth="3"
                        />
                        {/* Inner shield */}
                        <path
                            d="M100 28L28 64V120C28 168 58 210 100 220C142 210 172 168 172 120V64L100 28Z"
                            fill={`${PURPLE}55`}
                            stroke={`${LAVENDER}88`}
                            strokeWidth="1.5"
                        />
                        {/* Checkmark */}
                        <path
                            d="M72 120L92 140L132 96"
                            stroke={LAVENDER}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </div>
                <div
                    style={{
                        ...solutionText,
                        fontSize: 48,
                        fontWeight: 600,
                        color: WHITE,
                        letterSpacing: "-0.02em",
                        position: "relative",
                        zIndex: 1,
                    }}
                >
                    sigil is the answer.
                </div>
            </div>
        </AbsoluteFill>
    );
};

/* ═══════════════════════════════════════════════
   Scene 3: Three Pillars with Asset Imagery (180–269, ~3s)
   Verify (shield) · Fund (flow) · Govern (timeline)
   ═══════════════════════════════════════════════ */
const Scene3: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const pillars = [
        {
            label: "verify",
            title: "multi-channel trust",
            color: SAGE,
            imgSrc: "assets/overlays/trust-channels-row.png",
        },
        {
            label: "fund",
            title: "capital routed\nto builders",
            color: ROSE,
            imgSrc: "assets/overlays/funding-flow.png",
        },
        {
            label: "govern",
            title: "milestone\naccountability",
            color: LAVENDER,
            imgSrc: "assets/overlays/milestone-timeline.png",
        },
    ];

    const headerStyle = useEntrance(frame, 0, fps);
    const fadeOut = interpolate(frame, [75, 89], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

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
            {/* Blockchain bg */}
            <Img
                src={staticFile("assets/backgrounds/blockchain-network.png")}
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.15,
                }}
            />

            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 40,
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {/* Header */}
                <div
                    style={{
                        ...headerStyle,
                        fontSize: 18,
                        fontWeight: 600,
                        color: LAVENDER,
                        textTransform: "uppercase",
                        letterSpacing: "0.2em",
                    }}
                >
                    verify · fund · govern
                </div>

                {/* Cards row */}
                <div
                    style={{
                        display: "flex",
                        gap: 36,
                        justifyContent: "center",
                    }}
                >
                    {pillars.map((p, i) => {
                        const delay = 8 + i * 10;
                        const scale = spring({
                            frame: frame - delay,
                            fps,
                            from: 0.8,
                            to: 1,
                            durationInFrames: 22,
                            config: { damping: 12 },
                        });
                        const opacity = interpolate(
                            frame - delay,
                            [0, 15],
                            [0, 1],
                            {
                                extrapolateLeft: "clamp",
                                extrapolateRight: "clamp",
                            }
                        );

                        return (
                            <div
                                key={p.label}
                                style={{
                                    width: 460,
                                    backgroundColor: `${GRAY_800}ee`,
                                    border: `1px solid ${PURPLE_LIGHT}44`,
                                    borderRadius: 24,
                                    padding: "36px 32px",
                                    opacity,
                                    transform: `scale(${scale})`,
                                    textAlign: "center",
                                    backdropFilter: "blur(20px)",
                                }}
                            >
                                {/* Asset preview */}
                                <Img
                                    src={staticFile(p.imgSrc)}
                                    style={{
                                        width: "100%",
                                        height: 140,
                                        objectFit: "contain",
                                        marginBottom: 20,
                                        borderRadius: 12,
                                    }}
                                />

                                {/* Label */}
                                <div
                                    style={{
                                        display: "inline-block",
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: WHITE,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.15em",
                                        backgroundColor: `${PURPLE}88`,
                                        padding: "6px 16px",
                                        borderRadius: 100,
                                        marginBottom: 14,
                                    }}
                                >
                                    {p.label}
                                </div>

                                {/* Title */}
                                <div
                                    style={{
                                        fontSize: 22,
                                        fontWeight: 600,
                                        color: WHITE,
                                        lineHeight: 1.3,
                                        whiteSpace: "pre-line",
                                    }}
                                >
                                    {p.title}
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
   Scene 4: Trust Layer — Five Channels (270–359, ~3s)
   Uses trust-channels-row asset + animated checkmarks
   ═══════════════════════════════════════════════ */
const Scene4: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const headerStyle = useEntrance(frame, 0, fps);

    // Trust channels image reveal
    const imgOpacity = interpolate(frame, [15, 30], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
    const imgScale = spring({
        frame: frame - 15,
        fps,
        from: 0.85,
        to: 1,
        durationInFrames: 25,
        config: { damping: 12 },
    });

    // Stats counter
    const channelCount = Math.min(
        5,
        Math.floor(interpolate(frame, [30, 55], [0, 5], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        }))
    );

    const statsStyle = useEntrance(frame, 40, fps);

    const fadeOut = interpolate(frame, [75, 89], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

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
            <Img
                src={staticFile("assets/backgrounds/dark-particles-network.png")}
                style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    opacity: 0.3,
                }}
            />

            <div
                style={{
                    textAlign: "center",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {/* Header */}
                <div
                    style={{
                        ...headerStyle,
                        fontSize: 16,
                        fontWeight: 600,
                        color: LAVENDER,
                        textTransform: "uppercase",
                        letterSpacing: "0.18em",
                        marginBottom: 14,
                    }}
                >
                    trust layer
                </div>
                <div
                    style={{
                        ...headerStyle,
                        fontSize: 56,
                        fontWeight: 600,
                        color: WHITE,
                        lineHeight: 1.15,
                        letterSpacing: "-0.02em",
                        marginBottom: 50,
                    }}
                >
                    five channels.
                    <br />
                    no single point of failure.
                </div>

                {/* Trust channel icons image */}
                <div
                    style={{
                        opacity: imgOpacity,
                        transform: `scale(${imgScale})`,
                        marginBottom: 40,
                    }}
                >
                    <Img
                        src={staticFile("assets/overlays/trust-channels-row.png")}
                        style={{
                            width: 800,
                            height: 200,
                            objectFit: "contain",
                        }}
                    />
                </div>

                {/* Channel counter */}
                <div
                    style={{
                        ...statsStyle,
                        display: "flex",
                        gap: 60,
                        justifyContent: "center",
                    }}
                >
                    <div style={{ textAlign: "center" }}>
                        <div
                            style={{
                                fontSize: 48,
                                fontWeight: 700,
                                color: LAVENDER,
                            }}
                        >
                            {channelCount}/5
                        </div>
                        <div
                            style={{
                                fontSize: 14,
                                color: GRAY_600,
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                marginTop: 4,
                            }}
                        >
                            channels verified
                        </div>
                    </div>
                    <div style={{ textAlign: "center" }}>
                        <div
                            style={{
                                fontSize: 48,
                                fontWeight: 700,
                                color: LAVENDER,
                            }}
                        >
                            onchain
                        </div>
                        <div
                            style={{
                                fontSize: 14,
                                color: GRAY_600,
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                marginTop: 4,
                            }}
                        >
                            attestation
                        </div>
                    </div>
                </div>
            </div>
        </AbsoluteFill>
    );
};

/* ═══════════════════════════════════════════════
   Scene 5: CTA — Claim Your Sigil (360–449, ~3s)
   Logo + tagline + @HeySigil + heysigil.fund
   ═══════════════════════════════════════════════ */
const Scene5: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Logo
    const logoScale = spring({
        frame,
        fps,
        from: 0.5,
        to: 1,
        durationInFrames: 25,
        config: { damping: 10 },
    });
    const logoOpacity = interpolate(frame, [0, 15], [0, 1], {
        extrapolateRight: "clamp",
    });

    const headingStyle = useEntrance(frame, 12, fps);
    const subStyle = useEntrance(frame, 24, fps);
    const ctaStyle = useEntrance(frame, 36, fps);
    const urlStyle = useEntrance(frame, 48, fps);

    // Subtle bg animation
    const bgShift = interpolate(frame, [0, 89], [0, 15], {
        extrapolateRight: "clamp",
    });

    return (
        <AbsoluteFill
            style={{
                backgroundColor: GRAY_800,
                fontFamily: FONT,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            {/* Gradient mesh background */}
            <Img
                src={staticFile("assets/backgrounds/gradient-mesh-light.png")}
                style={{
                    position: "absolute",
                    width: "130%",
                    height: "130%",
                    objectFit: "cover",
                    opacity: 0.12,
                    transform: `translateY(${bgShift}px)`,
                    top: "-15%",
                    left: "-15%",
                }}
            />

            {/* Purple gradient overlay */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: `radial-gradient(ellipse at center, ${PURPLE}22 0%, transparent 60%)`,
                }}
            />

            <div
                style={{
                    textAlign: "center",
                    position: "relative",
                    zIndex: 1,
                }}
            >
                {/* Logo */}
                <div
                    style={{
                        opacity: logoOpacity,
                        transform: `scale(${logoScale})`,
                        marginBottom: 28,
                        display: "flex",
                        justifyContent: "center",
                    }}
                >
                    <Img
                        src={staticFile("assets/icons/logo-lavender.png")}
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: 20,
                        }}
                    />
                </div>

                {/* Headline */}
                <div
                    style={{
                        ...headingStyle,
                        fontSize: 80,
                        fontWeight: 700,
                        color: WHITE,
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
                        fontSize: 22,
                        color: GRAY_600,
                        maxWidth: 650,
                        margin: "0 auto",
                        lineHeight: 1.5,
                    }}
                >
                    verify across five channels. fund with onchain attestation.
                    <br />
                    milestone governance for dev projects.
                </div>

                {/* CTA button */}
                <div
                    style={{
                        ...ctaStyle,
                        marginTop: 44,
                    }}
                >
                    <div
                        style={{
                            display: "inline-block",
                            background: `linear-gradient(135deg, ${PURPLE} 0%, ${PURPLE_LIGHT} 100%)`,
                            color: WHITE,
                            fontSize: 20,
                            fontWeight: 600,
                            padding: "18px 52px",
                            borderRadius: 14,
                            letterSpacing: "0.03em",
                            boxShadow: `0 8px 32px ${PURPLE}66`,
                        }}
                    >
                        Stamp Your Sigil →
                    </div>
                </div>

                {/* URL + handle */}
                <div
                    style={{
                        ...urlStyle,
                        marginTop: 28,
                        display: "flex",
                        justifyContent: "center",
                        gap: 32,
                        alignItems: "center",
                    }}
                >
                    <span
                        style={{
                            fontSize: 18,
                            color: LAVENDER,
                            fontWeight: 500,
                        }}
                    >
                        @HeySigil
                    </span>
                    <span
                        style={{
                            width: 4,
                            height: 4,
                            borderRadius: "50%",
                            backgroundColor: GRAY_600,
                            display: "inline-block",
                        }}
                    />
                    <span
                        style={{
                            fontSize: 18,
                            color: GRAY_600,
                            letterSpacing: "0.05em",
                        }}
                    >
                        heysigil.fund
                    </span>
                </div>
            </div>
        </AbsoluteFill>
    );
};

/* ═══════════════════════════════════════════════
   Main Composition
   ═══════════════════════════════════════════════ */
export const SigilAdV2: React.FC = () => {
    return (
        <AbsoluteFill>
            {/* Scene 1: Logo Reveal — 0 to 2.97s */}
            <Sequence from={0} durationInFrames={90}>
                <Scene1 />
            </Sequence>

            {/* Scene 2: Problem → Shield — 3s to 5.97s */}
            <Sequence from={90} durationInFrames={90}>
                <Scene2 />
            </Sequence>

            {/* Scene 3: Triptych with Assets — 6s to 8.97s */}
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
