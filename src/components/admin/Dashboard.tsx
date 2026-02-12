import { UsersTable } from "./UsersTable";
import PaymentsView from "./PaymentsView";
import { Overview } from "./Overview";
import Payout from "./PayoutPage";
import ProjectsView from "./ProjectsView";
import EscrowView from "./EscrowView";
import SettingsView from "./SettingsView";
import ContentView from "./ContentView";
import ReviewsView from "./ReviewsView";
import ReportsView from "./ReportsView";
import ActivityLogsView from "./ActivityLogsView";
import { DisputesView } from "./DisputesView";
import PerformanceView from "./PerformanceView";

export const Dashboard = ({ currentView }: { currentView: string }) => {
  const renderView = () => {
    switch (currentView) {
      case "users":
        return <UsersTable />;
      case "payments":
        return <PaymentsView />;
      case "payout":
        return <Payout />;
      case "projects":
        return <ProjectsView />;
      case "escrow":
        return <EscrowView />;
      case "settings":
        return <SettingsView />;
      case "content":
        return <ContentView />;
      case "reviews":
        return <ReviewsView />;
      case "reports":
        return <ReportsView />;
      case "logs":
        return <ActivityLogsView />;
      case "disputes":
        return <DisputesView />;
      case "performance":
        return <PerformanceView />;
      default:
        return <Overview />;
    }
  };

  return renderView();
};