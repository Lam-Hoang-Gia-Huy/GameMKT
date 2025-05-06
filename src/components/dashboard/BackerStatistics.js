import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Dữ liệu mẫu (mock data)
const mockPledges = [
  // Năm 2022
  {
    date: new Date("2022-03-10"),
    amount: 400,
    projectId: "proj1",
    projectName: "Project Alpha",
    backerName: "John Doe",
  },
  {
    date: new Date("2022-06-15"),
    amount: 600,
    projectId: "proj2",
    projectName: "Project Beta",
    backerName: "Jane Smith",
  },
  {
    date: new Date("2022-09-20"),
    amount: 800,
    projectId: "proj3",
    projectName: "Project Gamma",
    backerName: "Alice Brown",
  },
  // Năm 2023
  {
    date: new Date("2023-01-15"),
    amount: 500,
    projectId: "proj1",
    projectName: "Project Alpha",
    backerName: "Bob Wilson",
  },
  {
    date: new Date("2023-02-10"),
    amount: 700,
    projectId: "proj2",
    projectName: "Project Beta",
    backerName: "Charlie Davis",
  },
  {
    date: new Date("2023-03-05"),
    amount: 1000,
    projectId: "proj1",
    projectName: "Project Alpha",
    backerName: "Eve Taylor",
  },
  // Năm 2024
  {
    date: new Date("2024-01-12"),
    amount: 400,
    projectId: "proj3",
    projectName: "Project Gamma",
    backerName: "Frank Moore",
  },
  {
    date: new Date("2024-03-18"),
    amount: 600,
    projectId: "proj2",
    projectName: "Project Beta",
    backerName: "Grace Lee",
  },
  {
    date: new Date("2024-03-22"),
    amount: 800,
    projectId: "proj1",
    projectName: "Project Alpha",
    backerName: "Henry Clark",
  },
  // Năm 2025
  {
    date: new Date("2025-01-10"),
    amount: 1200,
    projectId: "proj4",
    projectName: "Project Delta",
    backerName: "Isabella Adams",
  },
  {
    date: new Date("2025-02-15"),
    amount: 900,
    projectId: "proj1",
    projectName: "Project Alpha",
    backerName: "Jack Turner",
  },
  {
    date: new Date("2025-03-20"),
    amount: 1100,
    projectId: "proj2",
    projectName: "Project Beta",
    backerName: "Kelly White",
  },
];

const BackerStatistics = () => {
  const [monthlyData, setMonthlyData] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);
  const [activeTab, setActiveTab] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    // Xử lý dữ liệu khi startDate hoặc endDate thay đổi
    processChartData(mockPledges);
  }, [startDate, endDate]);

  const processChartData = (pledges) => {
    // Lọc dữ liệu theo khoảng thời gian
    let filteredPledges = pledges;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filteredPledges = pledges.filter(
        (pledge) => pledge.date >= start && pledge.date <= end
      );
    }

    // Sắp xếp theo date
    filteredPledges.sort((a, b) => a.date - b.date);

    // Nhóm theo tháng
    const monthlyGroups = filteredPledges.reduce((acc, pledge) => {
      const monthYear = `${
        pledge.date.getMonth() + 1
      }/${pledge.date.getFullYear()}`;
      const existing = acc.find((item) => item.monthYear === monthYear);

      if (existing) {
        existing.amount += pledge.amount;
        existing.count += 1;
      } else {
        acc.push({
          monthYear,
          date: new Date(pledge.date.getFullYear(), pledge.date.getMonth(), 1),
          amount: pledge.amount,
          count: 1,
        });
      }
      return acc;
    }, []);

    // Nhóm theo năm
    const yearlyGroups = filteredPledges.reduce((acc, pledge) => {
      const year = pledge.date.getFullYear();
      const existing = acc.find((item) => item.year === year);

      if (existing) {
        existing.amount += pledge.amount;
        existing.count += 1;
      } else {
        acc.push({
          year,
          date: new Date(year, 0, 1),
          amount: pledge.amount,
          count: 1,
        });
      }
      return acc;
    }, []);

    // Format data for charts
    setMonthlyData(
      monthlyGroups.map((item) => ({
        name: item.monthYear,
        date: item.date,
        amount: item.amount,
        pledges: item.count,
      }))
    );

    setYearlyData(
      yearlyGroups.map((item) => ({
        name: item.year.toString(),
        date: item.date,
        amount: item.amount,
        pledges: item.count,
      }))
    );
  };

  const renderChart = () => {
    const data = activeTab === "monthly" ? monthlyData : yearlyData;
    const xAxisKey = activeTab === "monthly" ? "name" : "name";

    if (data.length === 0) {
      return <p>No data available for the selected time range.</p>;
    }

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey={xAxisKey}
            label={{
              value: activeTab === "monthly" ? "Month/Year" : "Year",
              position: "insideBottomRight",
              offset: -10,
            }}
          />
          <YAxis
            yAxisId="left"
            label={{ value: "Amount ($)", angle: -90, position: "insideLeft" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            label={{ value: "Pledges", angle: 90, position: "insideRight" }}
          />
          <Tooltip
            formatter={(value, name) =>
              name === "amount"
                ? [`$${value}`, "Total Amount"]
                : [value, "Number of Pledges"]
            }
            labelFormatter={(label) =>
              activeTab === "monthly" ? `Month: ${label}` : `Year: ${label}`
            }
          />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="amount"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
            name="Total Amount"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="pledges"
            stroke="#82ca9d"
            name="Number of Pledges"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="chart-container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h3>
          Pledge Activity ({activeTab === "monthly" ? "Monthly" : "Yearly"})
        </h3>
        <div>
          <button
            onClick={() => setActiveTab("monthly")}
            style={{
              backgroundColor: activeTab === "monthly" ? "#8884d8" : "#eee",
              marginRight: "10px",
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setActiveTab("yearly")}
            style={{
              backgroundColor: activeTab === "yearly" ? "#8884d8" : "#eee",
            }}
          >
            Yearly
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ marginRight: "10px" }}>
          Start Date:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ marginLeft: "5px" }}
          />
        </label>
        <label>
          End Date:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ marginLeft: "5px" }}
          />
        </label>
      </div>

      {renderChart()}
    </div>
  );
};

export default BackerStatistics;
