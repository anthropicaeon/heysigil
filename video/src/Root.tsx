import { Composition } from "remotion";
import { SigilProductReveal } from "./SigilProductReveal";
import { QuickLaunchSpot } from "./QuickLaunchSpot";
import { TwitterLaunchAd } from "./TwitterLaunchAd";

export const RemotionRoot = () => {
    return (
        <>
            <Composition
                id="SigilProductReveal"
                component={SigilProductReveal}
                durationInFrames={300}
                fps={30}
                width={3840}
                height={2160}
            />
            <Composition
                id="QuickLaunchSpot"
                component={QuickLaunchSpot}
                durationInFrames={300}
                fps={30}
                width={1920}
                height={1080}
            />
            <Composition
                id="TwitterLaunchAd"
                component={TwitterLaunchAd}
                durationInFrames={300}
                fps={30}
                width={1920}
                height={1080}
            />
        </>
    );
};
