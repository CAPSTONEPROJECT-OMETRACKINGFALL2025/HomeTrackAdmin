import React from "react";

const dashboardData = [
  { id: 1, title: "Active Users", value: 1220 },
  { id: 2, title: "Invoices This Month", value: 187 },
  { id: 3, title: "Total Houses", value: 28 },
  { id: 4, title: "Plans Active", value: 11 },
  { id: 5, title: "Sprites Managed", value: 83 }
];

export default function Dashboard() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-6">Dashboard Overview</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-md">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Metric</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
            </tr>
          </thead>
          <tbody>
            {dashboardData.map((item) => (
              <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                <td className="px-6 py-4 whitespace-nowrap font-semibold">{item.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
