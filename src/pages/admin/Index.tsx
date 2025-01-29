import { Sidebar } from "@/components/admin/Sidebar";
import { Header } from "@/components/admin/Header";
import { Dashboard } from "@/components/admin/Dashboard";
import { useState } from "react";

const AdminPage = () => {
  const [currentView, setCurrentView] = useState("dashboard");

  return (
    <div className="min-h-screen flex w-full bg-gray-50">
      <Sidebar setCurrentView={setCurrentView} currentView={currentView} />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <Dashboard currentView={currentView} />
        </main>
      </div>
    </div>
  );
};

export default AdminPage;