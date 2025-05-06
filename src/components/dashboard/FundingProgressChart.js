import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { apiAuth } from "../../api/apiClient";

const FundingProgressChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await apiAuth.get("/api/Project/GetProjectByUserId");
        const projects = response.data.data.filter(
          (p) => p.status === "VISIBLE"
        );

        const chartData = projects.map((project) => ({
          name:
            project.title.length > 15
              ? `${project.title.substring(0, 15)}...`
              : project.title,
          amount: project["total-amount"],
          goal: 1000, // Assuming a goal amount, you might want to get this from your API
          endDate: new Date(project["end-datetime"]).toLocaleDateString(),
        }));

        setData(chartData);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="chart-container">
      <h3>Funding Progress (Visible Projects)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="amount" fill="#8884d8" name="Raised" />
          <Bar dataKey="goal" fill="#82ca9d" name="Goal" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default FundingProgressChart;
