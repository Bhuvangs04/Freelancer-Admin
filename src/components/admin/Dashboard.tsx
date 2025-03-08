import { UsersTable } from "./UsersTable";
import PaymentsView from "./PaymentsView";
import { Overview } from "./Overview";
import Payout from "./PayoutPage";

export const Dashboard = ({ currentView }: { currentView: string }) => {
  const renderView = () => {
    switch (currentView) {
      case "users":
        return <UsersTable />;
      case "payments":
        return <PaymentsView />;
      case "payout":
        return <Payout />;
      default:
        return <Overview />;
    }
  };

  return renderView();
};