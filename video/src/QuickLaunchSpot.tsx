import {
    AbsoluteFill,
    Img,
    interpolate,
    spring,
    useCurrentFrame,
    useVideoConfig,
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
    purple: "#7E56DA",
    purpleLight: "#A48AE7",
    lavender: "#C5B3F0",
    textPrimary: "#FAF8FF",
    textSecondary: "#9B8FB0",
    textGhost: "#6A5D80",
};

// ─── Timeline (30fps, 300 frames = 10s) ──────────────────────
const S = {
    // 0–60:   Hero text slam
    heroStart: 0,
    heroEnd: 60,
    // 45–130:  Full-page screenshot, zoom toward Quick Launch, cursor clicks it
    zoomStart: 45,
    zoomEnd: 130,
    // 120–240: Zoomed Quick Launch form – cursor fills fields, clicks Launch
    formStart: 120,
    formEnd: 240,
    // 230–300: Logo spin outro
    outroStart: 230,
    outroEnd: 300,
};


// ─── Animated cursor ─────────────────────────────────────────
const Cursor: React.FC<{
    x: number;
    y: number;
    clicking: boolean;
    opacity: number;
}> = ({ x, y, clicking, opacity }) => {
    const clickScale = clicking ? 0.85 : 1;
    return (
        <div
            style={{
                position: "absolute",
                left: x,
                top: y,
                zIndex: 100,
                opacity,
                transform: `scale(${clickScale})`,
                transition: "transform 0.08s",
                pointerEvents: "none",
            }}
        >
            {/* macOS-style cursor arrow */}
            <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
                <path
                    d="M3 2L3 22L8.5 16.5L13.5 25L16.5 23.5L11.5 14.5L19 14.5L3 2Z"
                    fill="white"
                    stroke="#333"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
            </svg>
            {/* Click ripple */}
            {clicking && (
                <div
                    style={{
                        position: "absolute",
                        left: 3,
                        top: 2,
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        border: `2px solid rgba(126, 86, 218, 0.6)`,
                        transform: "translate(-50%, -50%)",
                        animation: "none",
                    }}
                />
            )}
        </div>
    );
};


// ─── Components ──────────────────────────────────────────────

/** Dark grid background with animated purple glow */
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


/** Hero text – "QUICK LAUNCH" slam-in */
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

    const fadeOut = interpolate(frame, [45, 60], [1, 0], {
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


/**
 * Scene 2: Full-page screenshot → zoom into Quick Launch → cursor clicks it
 * The page starts at full view and zooms to the Quick Launch section header.
 * A cursor glides in and clicks "Quick Launch".
 */
const ZoomToQuickLaunch: React.FC<{ frame: number; fps: number }> = ({
    frame,
    fps,
}) => {
    const localFrame = Math.max(0, frame - S.zoomStart);
    const duration = S.zoomEnd - S.zoomStart; // 85 frames

    // Fade/slide in
    const enterProgress = spring({
        frame: localFrame,
        fps,
        config: { damping: 18, stiffness: 80, mass: 0.7 },
        durationInFrames: 25,
    });
    const slideY = interpolate(enterProgress, [0, 1], [60, 0]);
    const enterOpacity = interpolate(enterProgress, [0, 1], [0, 1]);

    // Zoom: start at full view, zoom into Quick Launch area
    // The Quick Launch header is about 70% down from the top of the page
    const zoomProgress = interpolate(localFrame, [10, 65], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
    const scale = interpolate(zoomProgress, [0, 1], [0.75, 1.8]);

    // Pan upward as we zoom to keep Quick Launch area centered
    // The Quick Launch section is in the lower portion of the screenshot
    const panY = interpolate(zoomProgress, [0, 1], [0, -140]);

    // Cursor: appears mid-way through zoom, moves toward Quick Launch header
    const cursorAppear = interpolate(localFrame, [35, 45], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
    // Cursor glides from center-right to the Quick Launch area
    const cursorX = interpolate(localFrame, [35, 60], [550, 370], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
    const cursorY = interpolate(localFrame, [35, 60], [200, 310], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
    // Click happens at frame 60
    const isClicking = localFrame >= 60 && localFrame <= 65;

    // Click ripple flash
    const clickFlash = localFrame >= 60 && localFrame <= 68
        ? interpolate(localFrame, [60, 64, 68], [0, 0.4, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        })
        : 0;

    // Fade out
    const fadeOut = interpolate(localFrame, [duration - 20, duration], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    return (
        <AbsoluteFill
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: enterOpacity * fadeOut,
                transform: `translateY(${slideY}px)`,
            }}
        >
            {/* Browser frame */}
            <div
                style={{
                    position: "relative",
                    width: 820,
                    borderRadius: 16,
                    overflow: "hidden",
                    boxShadow: `
                        0 12px 60px rgba(126, 86, 218, 0.25),
                        0 0 0 1px rgba(126, 86, 218, 0.15)
                    `,
                    border: `1px solid rgba(126, 86, 218, 0.2)`,
                    background: "#1A1527",
                }}
            >
                {/* Browser chrome */}
                <div
                    style={{
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        padding: "0 12px",
                        gap: 6,
                        background: "rgba(22, 18, 36, 0.9)",
                        borderBottom: "1px solid rgba(126, 86, 218, 0.12)",
                    }}
                >
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FEBC2E" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
                    <div
                        style={{
                            flex: 1,
                            marginLeft: 12,
                            background: "rgba(255,255,255,0.05)",
                            borderRadius: 6,
                            height: 18,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily,
                            fontSize: 9,
                            fontWeight: 500,
                            color: C.textGhost,
                            letterSpacing: "0.02em",
                        }}
                    >
                        heysigil.fund
                    </div>
                </div>

                {/* Screenshot with zoom/pan */}
                <div
                    style={{
                        overflow: "hidden",
                        height: 460,
                        position: "relative",
                    }}
                >
                    <Img
                        src={staticFile("real-ui-full.png")}
                        style={{
                            width: "100%",
                            display: "block",
                            transform: `scale(${scale}) translateY(${panY}px)`,
                            transformOrigin: "center 65%",
                        }}
                    />

                    {/* Click flash overlay */}
                    {clickFlash > 0 && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: `rgba(126, 86, 218, ${clickFlash})`,
                                pointerEvents: "none",
                            }}
                        />
                    )}
                </div>

                {/* Cursor overlay */}
                <Cursor
                    x={cursorX}
                    y={cursorY}
                    clicking={isClicking}
                    opacity={cursorAppear}
                />
            </div>
        </AbsoluteFill>
    );
};


/**
 * Scene 3: The Quick Launch form – interactive demo
 * 1. Zoomed view of the form appears
 * 2. Cursor moves to Token Name → text types in
 * 3. Cursor moves to Owner/Source → text types in
 * 4. Cursor moves to "Launch Unclaimed Token" → clicks it
 */
const FormInteraction: React.FC<{ frame: number; fps: number }> = ({
    frame,
    fps,
}) => {
    const localFrame = Math.max(0, frame - S.formStart);
    const duration = S.formEnd - S.formStart; // 120 frames

    // Entrance
    const enterProgress = spring({
        frame: localFrame,
        fps,
        config: { damping: 16, stiffness: 100, mass: 0.7 },
        durationInFrames: 25,
    });
    const enterScale = interpolate(enterProgress, [0, 1], [0.95, 1]);
    const enterOpacity = interpolate(enterProgress, [0, 1], [0, 1]);

    // Fade out at end
    const fadeOut = interpolate(localFrame, [duration - 20, duration], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    // ─── Interaction timeline (relative to formStart) ───
    // Phase 1: Cursor moves to Token Name field (frames 10–25)
    // Phase 2: Text types into Token Name (frames 25–55)
    // Phase 3: Cursor moves to Owner/Source (frames 55–65)
    // Phase 4: Text types into Owner/Source (frames 65–85)
    // Phase 5: Cursor moves to Launch button (frames 85–95)
    // Phase 6: Click Launch (frames 95–105)

    // ─── Cursor position ───
    // Token Name field: approximately x=300, y=310
    // Owner/Source field: approximately x=540, y=310
    // Launch button: approximately x=530, y=365

    const cursorAppear = interpolate(localFrame, [5, 12], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    // Cursor phases
    let cursorX: number;
    let cursorY: number;

    if (localFrame < 25) {
        // Moving to Token Name field
        cursorX = interpolate(localFrame, [5, 20], [600, 300], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        });
        cursorY = interpolate(localFrame, [5, 20], [200, 313], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        });
    } else if (localFrame < 55) {
        // Resting on Token Name while typing
        cursorX = 300;
        cursorY = 313;
    } else if (localFrame < 65) {
        // Moving to Owner/Source
        cursorX = interpolate(localFrame, [55, 62], [300, 550], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        });
        cursorY = 313;
    } else if (localFrame < 85) {
        // Resting on Owner/Source while typing
        cursorX = 550;
        cursorY = 313;
    } else if (localFrame < 95) {
        // Moving to Launch button
        cursorX = interpolate(localFrame, [85, 93], [550, 530], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        });
        cursorY = interpolate(localFrame, [85, 93], [313, 370], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        });
    } else {
        // On the launch button
        cursorX = 530;
        cursorY = 370;
    }

    // Click on Token Name (frame 22)
    const tokenClick = localFrame >= 22 && localFrame <= 25;
    // Click on Owner/Source (frame 63)
    const ownerClick = localFrame >= 63 && localFrame <= 66;
    // Click on Launch (frame 95)
    const launchClick = localFrame >= 95 && localFrame <= 100;

    const isClicking = tokenClick || ownerClick || launchClick;

    // ─── Typing animation ───
    const tokenName = "SIGIL";
    const ownerSource = "github.com/anthropicaeon";

    // Token Name typing: frames 25–50 (25 frames for the text)
    const tokenChars = Math.floor(
        interpolate(localFrame, [26, 42], [0, tokenName.length], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        })
    );
    const tokenText = tokenName.slice(0, tokenChars);

    // Owner/Source typing: frames 65–83
    const ownerChars = Math.floor(
        interpolate(localFrame, [66, 82], [0, ownerSource.length], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        })
    );
    const ownerText = ownerSource.slice(0, ownerChars);

    // Blinking cursor at active field
    const blinkPhase = Math.sin(localFrame * 0.4) > 0;
    const showTokenCaret = localFrame >= 23 && localFrame < 55 && blinkPhase;
    const showOwnerCaret = localFrame >= 63 && localFrame < 85 && blinkPhase;

    // Launch button glow after click
    const launchGlow = localFrame >= 95
        ? interpolate(localFrame, [95, 105, 115], [0, 1, 0.6], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        })
        : 0;

    // Subtle zoom on the card
    const cardZoom = interpolate(localFrame, [0, duration], [1, 1.04], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    // The form card uses the Quick Launch screenshot as a base, with text overlays
    // positioned over the input fields. We need proper positioning relative to the
    // quicklaunch screenshot dimensions.

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
                    position: "relative",
                    width: 820,
                    borderRadius: 16,
                    overflow: "visible",
                    boxShadow: `
                        0 12px 60px rgba(126, 86, 218, 0.25),
                        0 0 0 1px rgba(126, 86, 218, 0.15)
                    `,
                    border: `1px solid rgba(126, 86, 218, 0.2)`,
                    background: "#1A1527",
                    transform: `scale(${enterScale * cardZoom})`,
                }}
            >
                {/* Browser chrome */}
                <div
                    style={{
                        height: 32,
                        display: "flex",
                        alignItems: "center",
                        padding: "0 12px",
                        gap: 6,
                        background: "rgba(22, 18, 36, 0.9)",
                        borderBottom: "1px solid rgba(126, 86, 218, 0.12)",
                    }}
                >
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FEBC2E" }} />
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
                    <div
                        style={{
                            flex: 1,
                            marginLeft: 12,
                            background: "rgba(255,255,255,0.05)",
                            borderRadius: 6,
                            height: 18,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily,
                            fontSize: 9,
                            fontWeight: 500,
                            color: C.textGhost,
                            letterSpacing: "0.02em",
                        }}
                    >
                        heysigil.fund
                    </div>
                </div>

                {/* Screenshot */}
                <div
                    style={{
                        overflow: "hidden",
                        position: "relative",
                    }}
                >
                    <Img
                        src={staticFile("real-ui-quicklaunch.png")}
                        style={{
                            width: "100%",
                            display: "block",
                        }}
                    />

                    {/* ─── Text overlays on form fields ─── */}

                    {/* Token Name overlay – positioned over the input field */}
                    {tokenChars > 0 && (
                        <div
                            style={{
                                position: "absolute",
                                // Token Name input field position in the quicklaunch screenshot
                                // The input is about 26% from left, 67% from top
                                left: "26.5%",
                                top: "67.5%",
                                fontFamily,
                                fontSize: 11,
                                fontWeight: 500,
                                color: "#1a1a2e",
                                letterSpacing: "0.01em",
                                whiteSpace: "nowrap",
                                pointerEvents: "none",
                            }}
                        >
                            {tokenText}
                            {showTokenCaret && (
                                <span style={{ color: C.purple, fontWeight: 300 }}>|</span>
                            )}
                        </div>
                    )}

                    {/* Owner/Source overlay */}
                    {ownerChars > 0 && (
                        <div
                            style={{
                                position: "absolute",
                                // Owner/Source field: about 49% from left, 67.5% from top
                                left: "49.5%",
                                top: "67.5%",
                                fontFamily,
                                fontSize: 11,
                                fontWeight: 500,
                                color: "#1a1a2e",
                                letterSpacing: "0.01em",
                                whiteSpace: "nowrap",
                                pointerEvents: "none",
                            }}
                        >
                            {ownerText}
                            {showOwnerCaret && (
                                <span style={{ color: C.purple, fontWeight: 300 }}>|</span>
                            )}
                        </div>
                    )}

                    {/* Launch button glow overlay */}
                    {launchGlow > 0 && (
                        <div
                            style={{
                                position: "absolute",
                                // Launch Unclaimed Token button: ~56% left, ~78% top
                                left: "55%",
                                top: "77%",
                                width: "18%",
                                height: "6%",
                                background: `rgba(126, 86, 218, ${launchGlow * 0.4})`,
                                borderRadius: 8,
                                boxShadow: `0 0 30px rgba(126, 86, 218, ${launchGlow * 0.6})`,
                                pointerEvents: "none",
                            }}
                        />
                    )}
                </div>

                {/* Cursor */}
                <Cursor
                    x={cursorX}
                    y={cursorY}
                    clicking={isClicking}
                    opacity={cursorAppear}
                />
            </div>
        </AbsoluteFill>
    );
};


/** Spinning 3D logo outro with tagline */
const SpinningLogo: React.FC<{ frame: number; fps: number }> = ({
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

    const rotation = interpolate(oFrame, [0, 70], [0, 360], {
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
                    width: 200,
                    height: 200,
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
            {/* Scale 2x for 4K output from 1080p comp */}
            <AbsoluteFill style={{ transform: "scale(2)", transformOrigin: "center center" }}>
                <DarkBackground frame={frame} fps={fps} />

                {/* Scene 1: Hero slam text (0–60) */}
                <Sequence from={S.heroStart} durationInFrames={S.heroEnd - S.heroStart}>
                    <HeroText frame={frame} fps={fps} />
                </Sequence>

                {/* Scene 2: Zoom into page, cursor clicks Quick Launch (45–130) */}
                <Sequence from={S.zoomStart} durationInFrames={S.zoomEnd - S.zoomStart}>
                    <ZoomToQuickLaunch frame={frame} fps={fps} />
                </Sequence>

                {/* Scene 3: Form interaction – type fields, click Launch (120–240) */}
                <Sequence from={S.formStart} durationInFrames={S.formEnd - S.formStart}>
                    <FormInteraction frame={frame} fps={fps} />
                </Sequence>

                {/* Scene 4: Spinning logo + tagline (230–300) */}
                <Sequence from={S.outroStart} durationInFrames={S.outroEnd - S.outroStart}>
                    <SpinningLogo frame={frame} fps={fps} />
                </Sequence>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};
