import GovernanceDashboard from "@/components/GovernanceDashboard";

export const metadata = {
    title: "Governance | Sigil",
    description:
        "Vote on milestone proposals, track developer progress, and unlock tokens through community governance.",
};

export default function GovernancePage() {
    return <GovernanceDashboard />;
}
