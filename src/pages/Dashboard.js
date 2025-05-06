import React from "react";
import ProjectStatusChart from "../components/dashboard/ProjectStatusChart";
import FundingProgressChart from "../components/dashboard/FundingProgressChart";
import BackerStatistics from "../components/dashboard/BackerStatistics";
import RecentProjects from "../components/dashboard/RecentProjects";

const Dashboard = () => {
  return (
    <div className="dashboard">
      <h1>Project Dashboard</h1>

      <div className="dashboard-grid">
        <div className="grid-item wide">
          <BackerStatistics />
        </div>

        <div className="grid-item narrow">
          <RecentProjects />
        </div>

        <div className="grid-item full-width">
          <FundingProgressChart />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
