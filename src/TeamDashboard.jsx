/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from "react";
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
import {
  Upload,
  BarChart2,
  Users,
  CheckCircle,
  Award,
  Star,
  Zap,
} from "lucide-react";

// --- MOCK DATA (Dữ liệu mẫu) ---
const MOCK_DATA = [
  {
    id: 1,
    title: "Sprint 1",
    tasks: [
      {
        id: 101,
        title: "Setup Project Structure & Infrastructure",
        done: true,
        created: "2023-10-01T10:00:00Z",
        labels: [{ title: "5 POINTS" }],
        assignees: [{ id: 1, name: "Nguyễn Văn A", username: "anv" }],
      },
      {
        id: 102,
        title: "Design Database Schema",
        done: true,
        created: "2023-10-02T14:00:00Z",
        labels: [{ title: "8 POINTS" }],
        assignees: [{ id: 2, name: "Trần Thị B", username: "btt" }],
      },
    ],
  },
  {
    id: 2,
    title: "Sprint 2",
    tasks: [
      {
        id: 201,
        title: "Implement API Authentication (JWT)",
        done: true,
        updated_at: "2023-10-05T09:00:00Z",
        labels: [{ title: "13 POINTS" }],
        assignees: [{ id: 1, name: "Nguyễn Văn A", username: "anv" }],
      },
      {
        id: 202,
        title: "Frontend Dashboard Layout",
        done: true,
        updated_at: "2023-10-06T16:00:00Z",
        labels: [{ title: "13 POINTS" }],
        assignees: [
          { id: 2, name: "Trần Thị B", username: "btt" },
          { id: 3, name: "Lê Văn C", username: "cvl" },
        ],
      },
      {
        id: 203,
        title: "Fix Login Bug",
        done: true,
        updated_at: "2023-10-07T11:00:00Z",
        labels: [{ title: "2 POINTS" }],
        assignees: [{ id: 3, name: "Lê Văn C", username: "cvl" }],
      },
      {
        id: 204,
        title: "Optimize Query Performance",
        done: true,
        updated_at: "2023-10-08T10:00:00Z",
        labels: [{ title: "8 POINTS" }],
        assignees: [{ id: 1, name: "Nguyễn Văn A", username: "anv" }],
      },
    ],
  },
];

// --- HELPER FUNCTIONS ---

const getPointsFromLabels = (labels) => {
  if (!labels || labels.length === 0) return 0;
  const pointLabel = labels.find(
    (l) => l.title && l.title.toUpperCase().includes("POINT")
  );
  if (pointLabel) {
    const points = parseInt(pointLabel.title.split(" ")[0], 10);
    return isNaN(points) ? 0 : points;
  }
  return 0;
};

const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

const formatDate = (isoString) => {
  if (!isoString) return "";
  const d = new Date(isoString);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

const Dashboard = () => {
  const [jsonInput, setJsonInput] = useState(
    JSON.stringify(MOCK_DATA, null, 2)
  );
  const [parsedData, setParsedData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const data = JSON.parse(jsonInput);
      if (Array.isArray(data)) {
        setParsedData(data);
        setError(null);
      } else {
        setError("Dữ liệu phải là một mảng JSON (Array of Buckets).");
      }
    } catch (e) {
      // Ignore parsing errors while typing
    }
  }, [jsonInput]);

  // --- MAIN ANALYSIS LOGIC ---
  const analysis = useMemo(() => {
    if (!parsedData.length)
      return { chartData: [], userList: [], stats: {}, topTasks: {} };

    const events = [];
    const userMap = {};
    const userTasksMap = {}; // Lưu trữ toàn bộ task của từng user để lọc top 10

    // 1. Flatten Data
    parsedData.forEach((bucket) => {
      if (!bucket.tasks) return;

      bucket.tasks.forEach((task) => {
        // if (!task.done) return; // Chỉ tính task đã Done

        const points = getPointsFromLabels(task.labels);
        const dateRaw =
          task.created || task.created || new Date().toISOString();
        const date = new Date(dateRaw).toISOString().split("T")[0];

        if (task.assignees && task.assignees.length > 0) {
          task.assignees.forEach((user) => {
            // Init User Map
            if (!userMap[user.id]) {
              userMap[user.id] = {
                ...user,
                color: stringToColor(user.username || user.name),
              };
            }

            // Init User Task List
            if (!userTasksMap[user.id]) {
              userTasksMap[user.id] = [];
            }

            // Add to events for Chart
            events.push({
              date,
              userId: user.id,
              username: user.username || user.name,
              points,
              taskCount: 1,
            });

            // Add to Task List for Top 10 Report
            userTasksMap[user.id].push({
              id: task.id,
              title: task.title,
              points: points,
              date: dateRaw,
              bucket: bucket.title,
            });
          });
        }
      });
    });

    // 2. Process Charts (Cumulative)
    events.sort((a, b) => new Date(a.date) - new Date(b.date));
    const timeSeriesMap = {};
    const userTotals = {};

    Object.keys(userMap).forEach((uid) => {
      userTotals[uid] = { totalPoints: 0, totalTasks: 0 };
    });

    events.forEach((event) => {
      const { date, userId, points, taskCount } = event;
      userTotals[userId].totalPoints += points;
      userTotals[userId].totalTasks += taskCount;

      if (!timeSeriesMap[date]) {
        timeSeriesMap[date] = { date };
        Object.keys(userMap).forEach((uid) => {
          timeSeriesMap[date][`points_${uid}`] = userTotals[uid].totalPoints;
          timeSeriesMap[date][`tasks_${uid}`] = userTotals[uid].totalTasks;
        });
      } else {
        timeSeriesMap[date][`points_${userId}`] =
          userTotals[userId].totalPoints;
        timeSeriesMap[date][`tasks_${userId}`] = userTotals[userId].totalTasks;
      }
    });

    const chartData = Object.values(timeSeriesMap).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // 3. Process Top 10 Tasks per User
    const topTasks = {};
    Object.keys(userTasksMap).forEach((uid) => {
      // Sort tasks by Points DESC
      topTasks[uid] = userTasksMap[uid]
        .sort((a, b) => b.points - a.points)
        .slice(0, 10);
    });

    return {
      chartData,
      userList: Object.values(userMap),
      stats: userTotals,
      topTasks,
    };
  }, [parsedData]);

  const { chartData, userList, stats, topTasks } = analysis;

  // Sort users by total points for display order
  const sortedUsers = [...userList].sort((a, b) => {
    const pointsA = stats[a.id]?.totalPoints || 0;
    const pointsB = stats[b.id]?.totalPoints || 0;
    return pointsB - pointsA;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER */}
        <header className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
              <BarChart2 className="w-8 h-8" />
              Team Performance Analytics
            </h1>
          </div>
          <div className="text-right flex gap-2">
            <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-3 py-1 rounded-full">
              {userList.length} Members
            </span>
            <span className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full">
              {chartData.length} Days Tracked
            </span>
          </div>
        </header>

        {/* INPUT DATA */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-700">
            <Upload className="w-5 h-5 text-gray-500" />
            Dữ liệu đầu vào (JSON)
          </h3>
          <textarea
            className="w-full h-24 p-4 text-xs font-mono bg-gray-900 text-green-400 rounded-lg border border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="Paste your JSON here..."
          />
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-6 text-gray-700 flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Tổng điểm tích lũy
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="date"
                    style={{ fontSize: "12px" }}
                    tickFormatter={(str) => str.slice(5)}
                  />
                  <YAxis style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend />
                  {userList.map((user) => (
                    <Line
                      key={user.id}
                      type="monotone"
                      dataKey={`points_${user.id}`}
                      name={user.name}
                      stroke={user.color}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-6 text-gray-700 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              Số lượng Task hoàn thành
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="date"
                    style={{ fontSize: "12px" }}
                    tickFormatter={(str) => str.slice(5)}
                  />
                  <YAxis style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend />
                  {userList.map((user) => (
                    <Line
                      key={user.id}
                      type="monotone"
                      dataKey={`tasks_${user.id}`}
                      name={user.name}
                      stroke={user.color}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* TOP 10 TASKS PER MEMBER REPORT */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-orange-500" />
            Top Task Nổi Bật (High Impact)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedUsers.map((user) => {
              const userTopTasks = topTasks[user.id] || [];
              const totalUserPoints = stats[user.id]?.totalPoints || 0;

              return (
                <div
                  key={user.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col"
                >
                  {/* Card Header */}
                  <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          Total: {totalUserPoints} pts
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Task List */}
                  <div className="flex-1 p-0">
                    {userTopTasks.length > 0 ? (
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 bg-gray-50 uppercase">
                          <tr>
                            <th className="px-4 py-2 font-medium">Task</th>
                            <th className="px-4 py-2 font-medium text-right w-16">
                              Pts
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {userTopTasks.map((task, idx) => (
                            <tr
                              key={`${user.id}-${task.id}`}
                              className="hover:bg-indigo-50/30 transition-colors"
                            >
                              <td className="px-4 py-3">
                                <div
                                  className="text-gray-800 font-medium line-clamp-2"
                                  title={task.title}
                                >
                                  {task.title}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200">
                                    {task.bucket}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    {formatDate(task.date)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span
                                  className={`inline-block font-bold px-2 py-1 rounded text-xs
                                  ${
                                    task.points >= 8
                                      ? "bg-orange-100 text-orange-700"
                                      : task.points >= 5
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-100 text-gray-600"
                                  }
                                `}
                                >
                                  {task.points}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="p-8 text-center text-gray-400 text-sm italic">
                        Chưa có task hoàn thành
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SUMMARY TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-bold text-lg text-gray-700 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Tổng kết bảng xếp hạng
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold border-b">Hạng</th>
                  <th className="p-4 font-semibold border-b">Thành viên</th>
                  <th className="p-4 font-semibold border-b text-right">
                    Tổng điểm
                  </th>
                  <th className="p-4 font-semibold border-b text-right">
                    Task đã xong
                  </th>
                  <th className="p-4 font-semibold border-b text-right">
                    Avg (Pts/Task)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {sortedUsers.map((user, index) => {
                  const userStats = stats[user.id] || {
                    totalPoints: 0,
                    totalTasks: 0,
                  };
                  const avg =
                    userStats.totalTasks > 0
                      ? (userStats.totalPoints / userStats.totalTasks).toFixed(
                          1
                        )
                      : 0;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4 text-gray-500">
                        {index === 0
                          ? "🥇"
                          : index === 1
                          ? "🥈"
                          : index === 2
                          ? "🥉"
                          : `#${index + 1}`}
                      </td>
                      <td className="p-4 font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="p-4 text-right font-bold text-indigo-600">
                        {userStats.totalPoints}
                      </td>
                      <td className="p-4 text-right">{userStats.totalTasks}</td>
                      <td className="p-4 text-right text-gray-500">{avg}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
