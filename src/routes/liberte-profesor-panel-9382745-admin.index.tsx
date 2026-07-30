import { createFileRoute } from "@tanstack/react-router";
import { AdminAnalytics } from "@/components/AdminAnalytics";
import { ApprovalQueue } from "@/components/ApprovalQueue";

export const Route = createFileRoute("/liberte-profesor-panel-9382745-admin/")({
  component: AnalyticsTab,
});

function AnalyticsTab() {
  return (
    <>
      <ApprovalQueue />
      <AdminAnalytics />
    </>
  );
}
