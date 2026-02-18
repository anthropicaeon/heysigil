import { Composition } from "remotion";
import { SigilAd } from "./SigilAd";
import { SigilAdV2 } from "./SigilAdV2";

export const RemotionRoot: React.FC = () => {
    return (
        <>
            <Composition
                id="SigilAd"
                component={SigilAd}
                durationInFrames={450} // 15 seconds at 30fps
                fps={30}
                width={1920}
                height={1080}
            />
            <Composition
                id="SigilAdV2"
                component={SigilAdV2}
                durationInFrames={450} // 15 seconds at 30fps
                fps={30}
                width={1920}
                height={1080}
            />
        </>
    );
};
