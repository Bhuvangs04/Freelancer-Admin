import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-4">
        <h1 className="text-4xl font-bold text-center">Welcome to Your Dashboard</h1>
        <p className="text-muted-foreground text-center max-w-md">
          Manage your profile and account settings easily
        </p>
        <div className="flex gap-4">
          <Button asChild>
            <Link to="/profile">Client Profile</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/freelancer-profile">Freelancer Profile</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin">Admin Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;