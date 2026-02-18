import SigilAudience from "@/components/sections/sigil-audience";
import SigilContext from "@/components/sections/sigil-context";
import SigilCTA from "@/components/sections/sigil-cta";
import SigilHero from "@/components/sections/sigil-hero";
import SigilInfrastructure from "@/components/sections/sigil-infrastructure";
import SigilLogos from "@/components/sections/sigil-logos";
import SigilProof from "@/components/sections/sigil-proof";
import SigilProtocol from "@/components/sections/sigil-protocol";
import SigilTriptych from "@/components/sections/sigil-triptych";
import SigilTrustLayer from "@/components/sections/sigil-trust-layer";

export default function Home() {
    return (
        <>
            <SigilHero />
            <SigilLogos />
            <SigilTriptych />
            <SigilContext />
            <SigilProtocol />
            <SigilAudience />
            <SigilTrustLayer />
            <SigilInfrastructure />
            <SigilProof />
            <SigilCTA />
        </>
    );
}
