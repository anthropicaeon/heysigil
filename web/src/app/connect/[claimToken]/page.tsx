import ConnectFlow from "@/components/ConnectFlow";

type ConnectClaimPageProps = {
    params: Promise<{
        claimToken: string;
    }>;
};

export default async function ConnectClaimPage({ params }: ConnectClaimPageProps) {
    const { claimToken } = await params;
    const decodedClaimToken = decodeURIComponent(claimToken || "");
    return <ConnectFlow initialClaimToken={decodedClaimToken} />;
}
