import { Composition } from "remotion";
import { SigilProductReveal } from "./SigilProductReveal";

export const RemotionRoot = () => {
    return (
        <Composition
            id="SigilProductReveal"
            component={SigilProductReveal}
            durationInFrames={300}
            fps={30}
            width={3840}
            height={2160}
        />
    );
};
