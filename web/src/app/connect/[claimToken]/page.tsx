import ConnectFlow from "@/components/ConnectFlow";

type ConnectClaimPageProps = {
    params: {
        claimToken: string;
    };
};

export default function ConnectClaimPage({ params }: ConnectClaimPageProps) {
    const decodedClaimToken = decodeURIComponent(params.claimToken || "");
    return <ConnectFlow initialClaimToken={decodedClaimToken} />;
}
