import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { apiAuth } from "../../api/apiClient";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const ProjectStatusChart = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await apiAuth.get("/api/Project/GetProjectByUserId");
        const projects = response.data.data;

        const statusCounts = projects.reduce((acc, project) => {
          const status = project["transaction-status"];
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        const chartData = Object.keys(statusCounts).map((key) => ({
          name: key,
          value: statusCounts[key],
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
      <h3>Project Status Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ProjectStatusChart;
