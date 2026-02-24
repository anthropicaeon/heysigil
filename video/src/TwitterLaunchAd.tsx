import {
    AbsoluteFill,
    Img,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
    staticFile,
    Sequence,
    Easing,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
    weights: ["400", "500", "600", "700", "800"],
    subsets: ["latin"],
});

// ─── Design tokens (dark-mode Sigil palette) ────────────────
const C = {
    bg: "#0C0A14",
    purple: "#7E56DA",
    purpleLight: "#A48AE7",
    lavender: "#C5B3F0",
    textPrimary: "#FAF8FF",
    textSecondary: "#9B8FB0",
    textGhost: "#6A5D80",
    twitterBlue: "#1D9BF0",
    twitterBg: "#15202B",
    twitterCard: "#1E2D3D",
    twitterBorder: "#38444D",
};

// ─── Timeline (30fps, 300 frames = 10s) ──────────────────────
const S = {
    // Scene 1: Hero title slam (0–75)
    heroStart: 0,
    heroEnd: 75,
    // Scene 2: Tweet compose w/ typing (60–165)
    tweetStart: 60,
    tweetEnd: 165,
    // Scene 3: Bot reply thread (150–240)
    replyStart: 150,
    replyEnd: 240,
    // Scene 4: Logo outro (225–300)
    outroStart: 225,
    outroEnd: 300,
};

// ─── Background ─────────────────────────────────────────────
const DarkBackground: React.FC<{ frame: number; fps: number }> = ({
    frame,
    fps,
}) => {
    const time = frame / fps;
    const glowX = 50 + Math.sin(time * 0.3) * 8;
    const glowY = 45 + Math.cos(time * 0.25) * 6;

    return (
        <AbsoluteFill>
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
            {/* Floating glow */}
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

// ─── Scene 1: Hero Slam ─────────────────────────────────────
const HeroSlam: React.FC<{ frame: number; fps: number }> = ({
    frame,
    fps,
}) => {
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

    const xMarkIn = spring({
        frame,
        fps,
        config: { damping: 10, stiffness: 200, mass: 0.6 },
        durationInFrames: 18,
        delay: 14,
    });

    const fadeOut = interpolate(frame, [55, 75], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    const scale = interpolate(slamIn, [0, 1], [1.8, 1]);
    const blur = interpolate(slamIn, [0, 1], [12, 0]);

    // Pulsing glow behind 𝕏 mark
    const time = frame / fps;
    const xGlow = Math.sin(time * 4) * 0.15 + 0.35;

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
                    display: "flex",
                    alignItems: "center",
                    gap: 20,
                }}
            >
                LAUNCH VIA{" "}
                <span
                    style={{
                        color: C.textPrimary,
                        fontSize: 80,
                        fontWeight: 800,
                        transform: `scale(${interpolate(xMarkIn, [0, 1], [2.5, 1])})`,
                        opacity: xMarkIn,
                        filter: `drop-shadow(0 0 ${20 * xGlow}px rgba(126, 86, 218, ${xGlow}))`,
                    }}
                >
                    𝕏
                </span>
            </div>

            <div
                style={{
                    fontFamily,
                    fontSize: 20,
                    fontWeight: 500,
                    color: C.textSecondary,
                    marginTop: 20,
                    opacity: subtitleIn * 0.8,
                    transform: `translateY(${(1 - subtitleIn) * 10}px)`,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                }}
            >
                just tweet it
            </div>
        </AbsoluteFill>
    );
};

// ─── Twitter Avatar (placeholder circle) ────────────────────
const Avatar: React.FC<{
    letter: string;
    bgColor: string;
    size?: number;
}> = ({ letter, bgColor, size = 44 }) => (
    <div
        style={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: bgColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily,
            fontSize: size * 0.45,
            fontWeight: 700,
            color: "#fff",
            flexShrink: 0,
        }}
    >
        {letter}
    </div>
);

// ─── Scene 2: Tweet Compose ─────────────────────────────────
const TweetCompose: React.FC<{ frame: number; fps: number }> = ({
    frame,
    fps,
}) => {
    const localFrame = Math.max(0, frame - S.tweetStart);
    const duration = S.tweetEnd - S.tweetStart; // 105 frames

    // Entrance
    const enterProgress = spring({
        frame: localFrame,
        fps,
        config: { damping: 16, stiffness: 100, mass: 0.7 },
        durationInFrames: 25,
    });
    const enterScale = interpolate(enterProgress, [0, 1], [0.92, 1]);
    const enterOpacity = interpolate(enterProgress, [0, 1], [0, 1]);

    // Fade out
    const fadeOut = interpolate(localFrame, [duration - 20, duration], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    // ─── Typing timeline ───
    const tweetText = "@HeySigilBot launch $DEGEN for github.com/user/cool-project";

    // Typing: frames 15–75 (60 frames for full text)
    const charCount = Math.floor(
        interpolate(localFrame, [15, 75], [0, tweetText.length], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        })
    );
    const displayText = tweetText.slice(0, charCount);

    // Blinking cursor
    const blinkPhase = Math.sin(localFrame * 0.4) > 0;
    const showCaret = localFrame >= 15 && localFrame < 82 && blinkPhase;

    // Post button activation: glows after typing finishes
    const postActive = localFrame >= 76;
    const postGlow = postActive
        ? spring({
            frame: localFrame - 76,
            fps,
            config: { damping: 200, stiffness: 80 },
            durationInFrames: 15,
        })
        : 0;

    // Click the post button at frame 85
    const postClicking = localFrame >= 85 && localFrame <= 90;
    const postClickScale = postClicking ? 0.94 : 1;

    // Flash after clicking post
    const postFlash =
        localFrame >= 87 && localFrame <= 95
            ? interpolate(localFrame, [87, 90, 95], [0, 0.5, 0], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
            })
            : 0;

    // Colorize parts of the typed text
    const renderColoredText = (text: string) => {
        const parts: React.ReactNode[] = [];
        let remaining = text;
        let key = 0;

        // Highlight @mention
        const mentionMatch = remaining.match(/^(@\w+)/);
        if (mentionMatch) {
            parts.push(
                <span key={key++} style={{ color: C.twitterBlue }}>
                    {mentionMatch[1]}
                </span>
            );
            remaining = remaining.slice(mentionMatch[1].length);
        }

        // Find $DEGEN (cashtag)
        const cashIdx = remaining.indexOf("$DEGEN");
        if (cashIdx >= 0) {
            parts.push(
                <span key={key++} style={{ color: C.textPrimary }}>
                    {remaining.slice(0, cashIdx)}
                </span>
            );
            parts.push(
                <span key={key++} style={{ color: C.twitterBlue }}>
                    {remaining.slice(cashIdx, cashIdx + 6)}
                </span>
            );
            remaining = remaining.slice(cashIdx + 6);
        }

        // Find github.com link
        const ghIdx = remaining.indexOf("github.com");
        if (ghIdx >= 0) {
            parts.push(
                <span key={key++} style={{ color: C.textPrimary }}>
                    {remaining.slice(0, ghIdx)}
                </span>
            );
            parts.push(
                <span key={key++} style={{ color: C.twitterBlue }}>
                    {remaining.slice(ghIdx)}
                </span>
            );
        } else if (remaining.length > 0) {
            parts.push(
                <span key={key++} style={{ color: C.textPrimary }}>
                    {remaining}
                </span>
            );
        }

        return parts;
    };

    return (
        <AbsoluteFill
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: enterOpacity * fadeOut,
            }}
        >
            <div
                style={{
                    width: 560,
                    background: C.twitterBg,
                    borderRadius: 20,
                    border: `1px solid ${C.twitterBorder}`,
                    overflow: "hidden",
                    transform: `scale(${enterScale})`,
                    boxShadow: `
                        0 20px 80px rgba(126, 86, 218, 0.2),
                        0 0 0 1px rgba(126, 86, 218, 0.1)
                    `,
                }}
            >
                {/* Header bar */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "12px 16px",
                        borderBottom: `1px solid ${C.twitterBorder}`,
                    }}
                >
                    <div
                        style={{
                            fontFamily,
                            fontSize: 14,
                            fontWeight: 600,
                            color: C.textSecondary,
                        }}
                    >
                        ✕
                    </div>
                    <div
                        style={{
                            fontFamily,
                            fontSize: 15,
                            fontWeight: 700,
                            color: C.textPrimary,
                        }}
                    >
                        New post
                    </div>
                    <div style={{ width: 14 }} />
                </div>

                {/* Compose area */}
                <div
                    style={{
                        display: "flex",
                        padding: "16px",
                        gap: 12,
                        minHeight: 140,
                    }}
                >
                    <Avatar letter="D" bgColor="#6366F1" size={40} />
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                fontFamily,
                                fontSize: 18,
                                fontWeight: 400,
                                color: C.textPrimary,
                                lineHeight: 1.5,
                                minHeight: 80,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                            }}
                        >
                            {charCount === 0 ? (
                                <span style={{ color: C.textGhost }}>
                                    What's happening?
                                </span>
                            ) : (
                                <>
                                    {renderColoredText(displayText)}
                                    {showCaret && (
                                        <span
                                            style={{
                                                color: C.twitterBlue,
                                                fontWeight: 300,
                                            }}
                                        >
                                            |
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 16px 12px",
                        borderTop: `1px solid ${C.twitterBorder}`,
                    }}
                >
                    {/* Icons */}
                    <div style={{ display: "flex", gap: 16 }}>
                        {["🖼️", "📊", "😀", "📍"].map((icon, i) => (
                            <div
                                key={i}
                                style={{
                                    fontSize: 16,
                                    opacity: 0.5,
                                }}
                            >
                                {icon}
                            </div>
                        ))}
                    </div>
                    {/* Post button */}
                    <div
                        style={{
                            fontFamily,
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#fff",
                            background: postActive
                                ? C.purple
                                : C.twitterBlue,
                            padding: "8px 20px",
                            borderRadius: 20,
                            opacity: postActive ? 1 : 0.5,
                            transform: `scale(${postClickScale})`,
                            boxShadow: postGlow > 0
                                ? `0 0 ${20 * postGlow}px rgba(126, 86, 218, ${0.6 * postGlow})`
                                : "none",
                        }}
                    >
                        Post
                    </div>
                </div>

                {/* Click flash overlay */}
                {postFlash > 0 && (
                    <div
                        style={{
                            position: "absolute",
                            inset: 0,
                            background: `rgba(126, 86, 218, ${postFlash * 0.25})`,
                            borderRadius: 20,
                            pointerEvents: "none",
                        }}
                    />
                )}
            </div>
        </AbsoluteFill>
    );
};

// ─── Scene 3: Bot Reply Thread ──────────────────────────────
const BotReply: React.FC<{ frame: number; fps: number }> = ({
    frame,
    fps,
}) => {
    const localFrame = Math.max(0, frame - S.replyStart);
    const duration = S.replyEnd - S.replyStart; // 90 frames

    // Card entrance
    const enterProgress = spring({
        frame: localFrame,
        fps,
        config: { damping: 14, stiffness: 90, mass: 0.7 },
        durationInFrames: 25,
    });
    const enterOpacity = interpolate(enterProgress, [0, 1], [0, 1]);
    const enterY = interpolate(enterProgress, [0, 1], [40, 0]);

    // Fade out
    const fadeOut = interpolate(localFrame, [duration - 20, duration], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    // Staggered reply lines
    const replyLines = [
        { emoji: "🚀", text: "$DEGEN launched on Base!" },
        { emoji: "📊", text: "heysigil.fund/token/0xA3f1...c9d2" },
        { emoji: "🔗", text: "basescan.org/token/0xA3f1...c9d2" },
        { emoji: "💰", text: "Dev fees → github.com/user/cool-project" },
        { emoji: "🔑", text: "Claim at heysigil.fund/connect" },
    ];

    const getLineOpacity = (index: number) => {
        const lineStart = 20 + index * 8; // stagger by 8 frames each
        return spring({
            frame: localFrame - lineStart,
            fps,
            config: { damping: 200, stiffness: 80 },
            durationInFrames: 15,
        });
    };

    const getLineY = (index: number) => {
        const lineStart = 20 + index * 8;
        const progress = spring({
            frame: localFrame - lineStart,
            fps,
            config: { damping: 200, stiffness: 80 },
            durationInFrames: 15,
        });
        return interpolate(progress, [0, 1], [12, 0]);
    };

    // Pulsing glow behind reply card
    const time = localFrame / fps;
    const glowPulse = Math.sin(time * 3) * 0.1 + 0.2;

    return (
        <AbsoluteFill
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: enterOpacity * fadeOut,
                transform: `translateY(${enterY}px)`,
            }}
        >
            <div
                style={{
                    width: 560,
                    background: C.twitterBg,
                    borderRadius: 20,
                    border: `1px solid ${C.twitterBorder}`,
                    overflow: "hidden",
                    boxShadow: `
                        0 20px 80px rgba(126, 86, 218, ${glowPulse}),
                        0 0 0 1px rgba(126, 86, 218, 0.1)
                    `,
                }}
            >
                {/* Original tweet (collapsed) */}
                <div
                    style={{
                        display: "flex",
                        padding: "14px 16px",
                        gap: 12,
                        borderBottom: `1px solid ${C.twitterBorder}`,
                        opacity: 0.6,
                    }}
                >
                    <Avatar letter="D" bgColor="#6366F1" size={32} />
                    <div style={{ flex: 1 }}>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: C.textPrimary,
                                }}
                            >
                                degen_dev
                            </span>
                            <span
                                style={{
                                    fontFamily,
                                    fontSize: 13,
                                    color: C.textGhost,
                                }}
                            >
                                @degen_dev · 1m
                            </span>
                        </div>
                        <div
                            style={{
                                fontFamily,
                                fontSize: 13,
                                color: C.textSecondary,
                                marginTop: 2,
                            }}
                        >
                            <span style={{ color: C.twitterBlue }}>
                                @HeySigilBot
                            </span>{" "}
                            launch{" "}
                            <span style={{ color: C.twitterBlue }}>
                                $DEGEN
                            </span>{" "}
                            for github.com/user/cool-project
                        </div>
                    </div>
                </div>

                {/* Thread connector line */}
                <div
                    style={{
                        position: "relative",
                        marginLeft: 32,
                        width: 2,
                        height: 0,
                    }}
                />

                {/* Bot reply */}
                <div
                    style={{
                        display: "flex",
                        padding: "14px 16px",
                        gap: 12,
                    }}
                >
                    {/* Sigil bot avatar */}
                    <div style={{ position: "relative" }}>
                        <Avatar letter="S" bgColor={C.purple} size={44} />
                        {/* Verified badge */}
                        <div
                            style={{
                                position: "absolute",
                                bottom: -2,
                                right: -2,
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                background: C.twitterBlue,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: `2px solid ${C.twitterBg}`,
                                fontSize: 8,
                                color: "#fff",
                            }}
                        >
                            ✓
                        </div>
                    </div>

                    <div style={{ flex: 1 }}>
                        {/* Header */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            <span
                                style={{
                                    fontFamily,
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: C.textPrimary,
                                }}
                            >
                                HeySigilBot
                            </span>
                            <span
                                style={{
                                    fontFamily,
                                    fontSize: 13,
                                    color: C.textGhost,
                                }}
                            >
                                @HeySigilBot · just now
                            </span>
                        </div>

                        {/* Reply lines */}
                        <div style={{ marginTop: 8 }}>
                            {replyLines.map((line, i) => (
                                <div
                                    key={i}
                                    style={{
                                        fontFamily,
                                        fontSize: 15,
                                        color: C.textPrimary,
                                        lineHeight: 1.7,
                                        opacity: getLineOpacity(i),
                                        transform: `translateY(${getLineY(i)}px)`,
                                    }}
                                >
                                    {line.emoji} {line.text}
                                </div>
                            ))}
                        </div>

                        {/* Engagement bar */}
                        <div
                            style={{
                                display: "flex",
                                gap: 36,
                                marginTop: 14,
                                opacity: interpolate(
                                    localFrame,
                                    [65, 75],
                                    [0, 0.5],
                                    {
                                        extrapolateLeft: "clamp",
                                        extrapolateRight: "clamp",
                                    }
                                ),
                            }}
                        >
                            {[
                                { icon: "💬", count: "12" },
                                { icon: "🔁", count: "48" },
                                { icon: "❤️", count: "127" },
                                { icon: "📤", count: "" },
                            ].map((action, i) => (
                                <div
                                    key={i}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 4,
                                        fontFamily,
                                        fontSize: 13,
                                        color: C.textGhost,
                                    }}
                                >
                                    <span style={{ fontSize: 14 }}>
                                        {action.icon}
                                    </span>
                                    {action.count}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AbsoluteFill>
    );
};

// ─── Scene 4: Logo Outro ────────────────────────────────────
const LogoOutro: React.FC<{ frame: number; fps: number }> = ({
    frame,
    fps,
}) => {
    const oFrame = Math.max(0, frame - S.outroStart);

    const entrance = spring({
        frame: oFrame,
        fps,
        config: { damping: 14, stiffness: 80 },
        durationInFrames: 30,
    });

    const rotation = interpolate(oFrame, [0, 75], [0, 360], {
        extrapolateRight: "extend",
    });

    const yFloat = Math.sin((oFrame / fps) * Math.PI * 1.2) * 6;
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
                    width: 160,
                    height: 160,
                    transform: `
                        translateY(${yFloat}px)
                        perspective(600px)
                        rotateY(${rotation}deg)
                    `,
                }}
            >
                {/* Glow behind logo */}
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
                        width: 160,
                        height: 160,
                        borderRadius: 32,
                        position: "relative",
                        zIndex: 1,
                    }}
                />
            </div>

            {/* Tagline */}
            <div
                style={{
                    marginTop: 28,
                    fontFamily,
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.textSecondary,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    opacity: interpolate(oFrame, [20, 40], [0, 0.7], {
                        extrapolateLeft: "clamp",
                        extrapolateRight: "clamp",
                    }),
                    transform: `translateY(${interpolate(
                        oFrame,
                        [20, 40],
                        [10, 0],
                        {
                            extrapolateLeft: "clamp",
                            extrapolateRight: "clamp",
                        }
                    )}px)`,
                }}
            >
                the trust layer for the agentic economy
            </div>

            {/* URL */}
            <div
                style={{
                    marginTop: 10,
                    fontFamily,
                    fontSize: 18,
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

// ─── Main Composition ───────────────────────────────────────
export const TwitterLaunchAd: React.FC = () => {
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
            <DarkBackground frame={frame} fps={fps} />

            {/* Scene 1: Hero slam (0–75) */}
            <Sequence
                from={S.heroStart}
                durationInFrames={S.heroEnd - S.heroStart}
                premountFor={fps}
            >
                <HeroSlam frame={frame} fps={fps} />
            </Sequence>

            {/* Scene 2: Tweet compose with typing (60–165) */}
            <Sequence
                from={S.tweetStart}
                durationInFrames={S.tweetEnd - S.tweetStart}
                premountFor={fps}
            >
                <TweetCompose frame={frame} fps={fps} />
            </Sequence>

            {/* Scene 3: Bot reply thread (150–240) */}
            <Sequence
                from={S.replyStart}
                durationInFrames={S.replyEnd - S.replyStart}
                premountFor={fps}
            >
                <BotReply frame={frame} fps={fps} />
            </Sequence>

            {/* Scene 4: Logo outro (225–300) */}
            <Sequence
                from={S.outroStart}
                durationInFrames={S.outroEnd - S.outroStart}
                premountFor={fps}
            >
                <LogoOutro frame={frame} fps={fps} />
            </Sequence>
        </AbsoluteFill>
    );
};
