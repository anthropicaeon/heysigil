import ProfileDashboard from "@/components/ProfileDashboard";

export const metadata = {
    title: "Dashboard | Sigil",
    description:
        "Manage your Sigil tokens, track USDC fees, and access governance for your projects and holdings.",
};

export default function DashboardPage() {
    return <ProfileDashboard />;
}
