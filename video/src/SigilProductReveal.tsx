import {
    AbsoluteFill,
    Img,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
    Easing,
    staticFile,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
    weights: ["400", "500", "600", "700"],
    subsets: ["latin"],
});

// ─── Design tokens (matching Sigil brand) ────────────────────
const COLORS = {
    bg: "#FAF8FF",
    // Pastel panel colors (matching reference image)
    panelGreen: "#E8F5E4",
    panelLavender: "#F0E8F8",
    panelCream: "#F5F0E0",
    panelBlue: "#E0ECF8",
    panelRose: "#F8E8EC",
    // Card & input
    card: "rgba(255, 255, 255, 0.85)",
    cardBorder: "rgba(255, 255, 255, 0.6)",
    inputBg: "rgba(255, 255, 255, 0.7)",
    inputBorder: "rgba(220, 210, 235, 0.5)",
    // Text
    purple: "#7E56DA",
    purpleLight: "#A48AE7",
    purpleDark: "#3D2B6B",
    textPrimary: "#1A0E2E",
    textSecondary: "#9B8FB0",
    textGhost: "#C4BAD4",
    glowPurple: "rgba(126, 86, 218, 0.2)",
};

// ─── Messages: @HeySigil persists, only the action text changes ──
const MESSAGES = [
    "Fund my next innovation…",
    "Verify my repo…",
    "Claim my fees…",
    "Deploy a token for my project…",
    "Stamp my Sigil",
];

// ─── Timing ──────────────────────────────────────────────────
const MESSAGE_HOLD_FRAMES = 42;    // ~1.4s per message
const TRANSITION_FRAMES = 18;      // ~0.6s morph
const CYCLE = MESSAGE_HOLD_FRAMES + TRANSITION_FRAMES; // 60 frames


// ─── Helpers ─────────────────────────────────────────────────

function getMessageState(frame: number) {
    const totalCycle = MESSAGES.length * CYCLE;
    const loopFrame = frame % totalCycle;
    const messageIndex = Math.floor(loopFrame / CYCLE);
    const frameInCycle = loopFrame % CYCLE;

    if (frameInCycle < MESSAGE_HOLD_FRAMES) {
        return {
            currentIndex: messageIndex,
            nextIndex: (messageIndex + 1) % MESSAGES.length,
            prevIndex: (messageIndex - 1 + MESSAGES.length) % MESSAGES.length,
            transitionProgress: 0,
            isTransitioning: false,
        };
    }

    const transitionFrame = frameInCycle - MESSAGE_HOLD_FRAMES;
    const progress = interpolate(transitionFrame, [0, TRANSITION_FRAMES], [0, 1], {
        easing: Easing.inOut(Easing.exp),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    return {
        currentIndex: messageIndex,
        nextIndex: (messageIndex + 1) % MESSAGES.length,
        prevIndex: (messageIndex - 1 + MESSAGES.length) % MESSAGES.length,
        transitionProgress: progress,
        isTransitioning: true,
    };
}

function getPrevIndex(idx: number) {
    return (idx - 1 + MESSAGES.length) % MESSAGES.length;
}

function getNextNext(idx: number) {
    return (idx + 2) % MESSAGES.length;
}


// ─── Components ──────────────────────────────────────────────

/** Pastel background panels (matching reference image) */
const PastelBackground: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
    const time = frame / fps;

    // Entrance fade
    const entrance = interpolate(frame, [0, fps * 1.5], [0, 1], {
        easing: Easing.out(Easing.quad),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    return (
        <AbsoluteFill style={{ opacity: entrance }}>
            {/* Top-left: soft green */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "55%",
                    height: "42%",
                    background: COLORS.panelGreen,
                    borderRadius: "0 0 40px 0",
                    transform: `translate(${Math.sin(time * 0.15) * 3}px, ${Math.cos(time * 0.12) * 2}px)`,
                }}
            />
            {/* Top-right: soft blue */}
            <div
                style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "48%",
                    height: "35%",
                    background: COLORS.panelBlue,
                    borderRadius: "0 0 0 40px",
                    transform: `translate(${Math.cos(time * 0.13) * 2}px, ${Math.sin(time * 0.1) * 2}px)`,
                }}
            />
            {/* Center: lavender (behind card) */}
            <div
                style={{
                    position: "absolute",
                    top: "28%",
                    left: "15%",
                    width: "70%",
                    height: "44%",
                    background: COLORS.panelLavender,
                    borderRadius: 32,
                    transform: `translate(${Math.sin(time * 0.18 + 1) * 2}px, ${Math.cos(time * 0.14 + 1) * 2}px)`,
                }}
            />
            {/* Bottom-left: rose */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "45%",
                    height: "35%",
                    background: COLORS.panelRose,
                    borderRadius: "0 40px 0 0",
                    transform: `translate(${Math.cos(time * 0.16 + 2) * 2}px, ${Math.sin(time * 0.11 + 2) * 2}px)`,
                }}
            />
            {/* Bottom-right: warm cream */}
            <div
                style={{
                    position: "absolute",
                    bottom: 0,
                    right: 0,
                    width: "60%",
                    height: "40%",
                    background: COLORS.panelCream,
                    borderRadius: "40px 0 0 0",
                    transform: `translate(${Math.sin(time * 0.14 + 3) * 2}px, ${Math.cos(time * 0.13 + 3) * 2}px)`,
                }}
            />
        </AbsoluteFill>
    );
};


/** Breathing, glowing Sigil logo — always at top */
const SigilLogo: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
    const breathe = Math.sin((frame / fps) * Math.PI * 0.6) * 0.03 + 1.0;
    const glowIntensity = Math.sin((frame / fps) * Math.PI * 0.8 + 0.5) * 0.5 + 0.5;
    const glowRadius = interpolate(glowIntensity, [0, 1], [15, 40]);
    const glowOpacity = interpolate(glowIntensity, [0, 1], [0.06, 0.2]);

    const entrance = spring({
        frame,
        fps,
        config: { damping: 200, stiffness: 80 },
        durationInFrames: Math.round(fps * 1.5),
    });

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                transform: `scale(${entrance * breathe})`,
                opacity: entrance,
            }}
        >
            <div style={{ position: "relative", width: 48, height: 48 }}>
                {/* Glow */}
                <div
                    style={{
                        position: "absolute",
                        inset: -glowRadius / 2,
                        borderRadius: "50%",
                        background: `radial-gradient(circle, rgba(126, 86, 218, ${glowOpacity}) 0%, transparent 70%)`,
                        filter: `blur(${glowRadius * 0.4}px)`,
                    }}
                />
                <Img
                    src={staticFile("logo-lavender.png")}
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        position: "relative",
                        zIndex: 1,
                    }}
                />
            </div>
            <span
                style={{
                    fontFamily,
                    fontSize: 22,
                    fontWeight: 600,
                    color: COLORS.purpleDark,
                    letterSpacing: "-0.02em",
                    opacity: 0.7,
                }}
            >
                sigil
            </span>
        </div>
    );
};


/** Roller-style input card with persistent @HeySigil */
const RollerCard: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
    const state = getMessageState(frame);
    const t = state.transitionProgress;

    // Card entrance
    const cardEntrance = spring({
        frame,
        fps,
        config: { damping: 200, stiffness: 60 },
        durationInFrames: Math.round(fps * 2),
        delay: Math.round(fps * 0.3),
    });
    const cardY = interpolate(cardEntrance, [0, 1], [50, 0]);

    // Roller offset: each message slot is 44px tall
    const SLOT_HEIGHT = 44;
    // During hold: show current. During transition: slide to next.
    const rollerOffset = -(state.currentIndex + t) * SLOT_HEIGHT;

    // Build the roller items: prev, current, next, next-next for smooth looping
    const prevIdx = getPrevIndex(state.currentIndex);
    const currentIdx = state.currentIndex;
    const nextIdx = state.nextIndex;
    const nextNextIdx = getNextNext(state.currentIndex);

    // We render all 5 messages positioned by index
    const rollerItems = MESSAGES.map((msg, i) => ({
        text: msg,
        y: i * SLOT_HEIGHT,
    }));

    return (
        <div
            style={{
                width: 740,
                transform: `translateY(${cardY}px)`,
                opacity: cardEntrance,
            }}
        >

            {/* Main card */}
            <div
                style={{
                    background: COLORS.card,
                    border: `1px solid ${COLORS.cardBorder}`,
                    borderRadius: 24,
                    padding: "0",
                    boxShadow: `
            0 1px 2px rgba(0, 0, 0, 0.03),
            0 8px 40px rgba(126, 86, 218, 0.07),
            0 0 0 1px rgba(255, 255, 255, 0.8) inset
          `,
                    backdropFilter: "blur(20px)",
                    overflow: "hidden",
                }}
            >
                {/* Input area */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "22px 28px",
                        gap: 12,
                    }}
                >
                    {/* Persistent @HeySigil handle */}
                    <div
                        style={{
                            fontFamily,
                            fontSize: 22,
                            fontWeight: 700,
                            color: COLORS.purpleDark,
                            letterSpacing: "-0.02em",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                        }}
                    >
                        @HeySigil
                    </div>

                    {/* Roller viewport for action text */}
                    <div
                        style={{
                            flex: 1,
                            height: SLOT_HEIGHT,
                            overflow: "hidden",
                            position: "relative",
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                left: 0,
                                top: 0,
                                width: "100%",
                                transform: `translateY(${rollerOffset}px)`,
                            }}
                        >
                            {MESSAGES.map((msg, i) => (
                                <div
                                    key={i}
                                    style={{
                                        height: SLOT_HEIGHT,
                                        display: "flex",
                                        alignItems: "center",
                                        fontFamily,
                                        fontSize: 21,
                                        fontWeight: 500,
                                        color: i === state.currentIndex && !state.isTransitioning
                                            ? COLORS.purpleDark
                                            : i === state.nextIndex && state.isTransitioning
                                                ? interpolateColor(t, COLORS.textSecondary, COLORS.purpleDark)
                                                : COLORS.textSecondary,
                                        letterSpacing: "-0.01em",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {msg}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Blinking cursor */}
                    <div
                        style={{
                            width: 2,
                            height: 24,
                            backgroundColor: COLORS.purple,
                            borderRadius: 1,
                            opacity: interpolate(
                                frame % 20,
                                [0, 10, 20],
                                [0.8, 0, 0.8],
                                { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                            ),
                            flexShrink: 0,
                        }}
                    />
                </div>

                {/* Bottom bar: activity + send */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 28px 16px",
                        borderTop: "1px solid rgba(220, 210, 235, 0.25)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {[0, 1, 2].map((i) => {
                            const pulse = Math.sin((frame / fps) * Math.PI * 1.2 + i * 1.2) * 0.5 + 0.5;
                            return (
                                <div
                                    key={i}
                                    style={{
                                        width: 5,
                                        height: 5,
                                        borderRadius: "50%",
                                        backgroundColor: COLORS.purple,
                                        opacity: interpolate(pulse, [0, 1], [0.15, 0.55]),
                                        transform: `scale(${interpolate(pulse, [0, 1], [0.8, 1.2])})`,
                                    }}
                                />
                            );
                        })}
                        <span
                            style={{
                                fontFamily,
                                fontSize: 11,
                                fontWeight: 500,
                                color: COLORS.textSecondary,
                                marginLeft: 6,
                                letterSpacing: "0.02em",
                            }}
                        >
                            sigil intelligence
                        </span>
                    </div>

                    {/* Send arrow */}
                    <div
                        style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.purpleLight})`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: 0.85,
                            boxShadow: "0 2px 8px rgba(126, 86, 218, 0.2)",
                        }}
                    >
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                            <path
                                d="M14 2L7 9M14 2L9.5 14L7 9M14 2L2 6.5L7 9"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                </div>
            </div>


        </div>
    );
};

/** Simple color interpolation helper */
function interpolateColor(t: number, from: string, to: string): string {
    // Just use opacity crossfade approach — return the target color
    return t > 0.5 ? to : from;
}


/** Subtle floating particles */
const Particles: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
    const time = frame / fps;
    const particles = Array.from({ length: 6 }, (_, i) => ({
        x: 250 + i * 260 + Math.sin(time * 0.4 + i * 1.9) * 50,
        y: 180 + (i % 3) * 300 + Math.cos(time * 0.35 + i * 2.3) * 35,
        size: 2.5 + (i % 3) * 1.2,
        opacity: 0.06 + Math.sin(time * 0.6 + i) * 0.03,
    }));

    return (
        <>
            {particles.map((p, i) => (
                <div
                    key={i}
                    style={{
                        position: "absolute",
                        left: p.x,
                        top: p.y,
                        width: p.size,
                        height: p.size,
                        borderRadius: "50%",
                        backgroundColor: COLORS.purple,
                        opacity: p.opacity,
                    }}
                />
            ))}
        </>
    );
};


/** Tagline */
const Tagline: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
    const entrance = spring({
        frame,
        fps,
        config: { damping: 200 },
        delay: Math.round(fps * 1.4),
        durationInFrames: Math.round(fps * 1.5),
    });

    return (
        <div
            style={{
                marginTop: 48,
                opacity: entrance * 0.5,
                transform: `translateY(${(1 - entrance) * 12}px)`,
                fontFamily,
                fontSize: 13,
                fontWeight: 500,
                color: COLORS.textSecondary,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
            }}
        >
            infrastructure intelligence for builders
        </div>
    );
};


// ─── Main composition ────────────────────────────────────────

export const SigilProductReveal: React.FC = () => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    return (
        <AbsoluteFill
            style={{
                fontFamily,
                overflow: "hidden",
                background: COLORS.bg,
            }}
        >
            {/* Scale 2x for 4K rendering — all child elements designed at 1920×1080 scale */}
            <AbsoluteFill style={{ transform: "scale(2)", transformOrigin: "center center" }}>
                <PastelBackground frame={frame} fps={fps} />
                <Particles frame={frame} fps={fps} />

                {/* Center content */}
                <AbsoluteFill
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {/* Logo at top */}
                    <div style={{ marginBottom: 48 }}>
                        <SigilLogo frame={frame} fps={fps} />
                    </div>

                    {/* Roller card with @HeySigil + morphing text */}
                    <RollerCard frame={frame} fps={fps} />

                    {/* Tagline */}
                    <Tagline frame={frame} fps={fps} />
                </AbsoluteFill>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
