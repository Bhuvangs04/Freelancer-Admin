import { UsersTable } from "./UsersTable";
import { PaymentsView } from "./PaymentsView";
import { ReportsView } from "./ReportsView";
import { EmailView } from "./EmailView";
import { Overview } from "./Overview";

export const Dashboard = ({ currentView }: { currentView: string }) => {
  const renderView = () => {
    switch (currentView) {
      case "users":
        return <UsersTable />;
      case "payments":
        return <PaymentsView />;
      case "reports":
        return <ReportsView />;
      case "email":
        return <EmailView />;
      default:
        return <Overview />;
    }
  };

  return renderView();
};