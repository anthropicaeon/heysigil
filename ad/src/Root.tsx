import { Composition } from "remotion";
import { SigilAd } from "./SigilAd";

export const RemotionRoot: React.FC = () => {
    return (
        <Composition
            id="SigilAd"
            component={SigilAd}
            durationInFrames={450} // 15 seconds at 30fps
            fps={30}
            width={1920}
            height={1080}
        />
    );
};
