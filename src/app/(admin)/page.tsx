"use client";

import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

type User = {
  userId: string;
  username: string;
  email: string;
  roleId: number;
  roleName: string;
  status: boolean;
  isPremium: boolean;
  isEmailVerified: boolean;
  createdAt?: string;
};

type Order = {
  id: string;
  orderCode: number;
  userId: string;
  subscriptionId: string | null;
  planPriceId: string;
  amountVnd: number;
  status: number;
  createdAt: string;
  paidAt: string | null;
};

type Subscription = {
  id?: string;
  planId: string;
  period: number;
  durationInDays: number;
  amountVnd: number;
  isActive: boolean;
};

type RoomItem = {
  roomItemId: string;
  item: string;
  subName: string;
  roomType: string;
};

export default function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [roomItems, setRoomItems] = useState<RoomItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Bảng Điều Khiển - HomeTrack Admin";
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [usersData, ordersData, subscriptionsData, roomItemsData] = await Promise.allSettled([
        api.get<User[]>("/Auth/Get All User"),
        api.get<Order[]>("/orders"),
        api.get<Subscription[]>("/PlanPrice"),
        api.get<RoomItem[]>("/RoomItem"),
      ]);

      if (usersData.status === "fulfilled") {
        setUsers(Array.isArray(usersData.value) ? usersData.value : []);
      }
      if (ordersData.status === "fulfilled") {
        setOrders(Array.isArray(ordersData.value) ? ordersData.value : []);
      }
      if (subscriptionsData.status === "fulfilled") {
        setSubscriptions(Array.isArray(subscriptionsData.value) ? subscriptionsData.value : []);
      }
      if (roomItemsData.status === "fulfilled") {
        setRoomItems(Array.isArray(roomItemsData.value) ? roomItemsData.value : []);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status).length;
    const premiumUsers = users.filter((u) => u.isPremium).length;
    const verifiedUsers = users.filter((u) => u.isEmailVerified).length;

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + (o.amountVnd || 0), 0);
    const paidOrders = orders.filter((o) => o.paidAt !== null).length;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const ordersThisMonth = orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
    }).length;
    const revenueThisMonth = ordersThisMonth
      ? orders
          .filter((o) => {
            const orderDate = new Date(o.createdAt);
            return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear;
          })
          .reduce((sum, o) => sum + (o.amountVnd || 0), 0)
      : 0;

    const activeSubscriptions = subscriptions.filter((s) => s.isActive).length;
    const totalSubscriptions = subscriptions.length;

    const totalRoomItems = roomItems.length;
    const uniqueRoomTypes = new Set(roomItems.map((r) => r.roomType)).size;

    return {
      totalUsers,
      activeUsers,
      premiumUsers,
      verifiedUsers,
      totalOrders,
      totalRevenue,
      paidOrders,
      ordersThisMonth,
      revenueThisMonth,
      activeSubscriptions,
      totalSubscriptions,
      totalRoomItems,
      uniqueRoomTypes,
    };
  }, [users, orders, subscriptions, roomItems]);

  // Prepare monthly orders data
  const monthlyOrdersData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    const monthlyData = months.map((_, index) => {
      const monthOrders = orders.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate.getMonth() === index && orderDate.getFullYear() === currentYear;
      });
      return {
        count: monthOrders.length,
        revenue: monthOrders.reduce((sum, o) => sum + (o.amountVnd || 0), 0),
      };
    });
    return {
      months,
      counts: monthlyData.map((d) => d.count),
      revenues: monthlyData.map((d) => d.revenue),
    };
  }, [orders]);

  // Prepare user role distribution
  const userRoleData = useMemo(() => {
    const roleCounts: Record<string, number> = {};
    users.forEach((user) => {
      const roleName = user.roleName || `Role ${user.roleId}`;
      roleCounts[roleName] = (roleCounts[roleName] || 0) + 1;
    });
    return {
      labels: Object.keys(roleCounts),
      series: Object.values(roleCounts),
    };
  }, [users]);

  // Prepare subscription status data
  const subscriptionStatusData = useMemo(() => {
    const active = subscriptions.filter((s) => s.isActive).length;
    const inactive = subscriptions.filter((s) => !s.isActive).length;
    return {
      labels: ["Hoạt động", "Không hoạt động"],
      series: [active, inactive],
    };
  }, [subscriptions]);

  // Bar chart options for monthly orders
  const monthlyOrdersChartOptions: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 350,
      toolbar: { show: false },
    },
    colors: ["#465FFF", "#10B981"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: { 
      show: true, 
      width: [0, 3],
      colors: ["transparent", "#10B981"]
    },
    xaxis: {
      categories: monthlyOrdersData.months,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: [
      {
        title: { text: "Số đơn hàng" },
        labels: {
          style: { fontSize: "12px", colors: ["#6B7280"] },
        },
      },
      {
        opposite: true,
        title: { text: "Doanh thu (VND)" },
        labels: {
          style: { fontSize: "12px", colors: ["#6B7280"] },
          formatter: (val: number) => {
            if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
            if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
            return val.toString();
          },
        },
      },
    ],
    fill: { 
      opacity: [1, 0.1],
      type: ["solid", "gradient"],
      gradient: {
        shade: "light",
        type: "vertical",
        shadeIntensity: 0.25,
        gradientToColors: ["#10B981"],
        inverseColors: true,
        opacityFrom: 0.5,
        opacityTo: 0.1,
        stops: [0, 100]
      }
    },
    tooltip: {
      y: {
        formatter: (val: number, opts: { seriesIndex?: number }) => {
          if (opts.seriesIndex === 0) return `${val} đơn hàng`;
          return `${val.toLocaleString("vi-VN")} VND`;
        },
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
    },
    grid: {
      yaxis: { lines: { show: true } },
    },
  };

  const monthlyOrdersSeries: Array<{
    name: string;
    type?: string;
    data: number[];
  }> = [
    {
      name: "Số đơn hàng",
      type: "column",
      data: monthlyOrdersData.counts,
    },
    {
      name: "Doanh thu",
      type: "line",
      data: monthlyOrdersData.revenues,
    },
  ];

  // Line chart options for user growth
  const userGrowthChartOptions: ApexOptions = {
    colors: ["#8B5CF6", "#EC4899"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 350,
      type: "area",
      toolbar: { show: false },
    },
    stroke: { curve: "smooth", width: 2 },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.6,
        opacityTo: 0.1,
      },
    },
    markers: { size: 0, hover: { size: 6 } },
    xaxis: {
      categories: monthlyOrdersData.months,
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: "12px", colors: ["#6B7280"] },
      },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} người dùng`,
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
    },
    grid: {
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
  };

  // Calculate user growth by month
  const userGrowthData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const monthlyUsers = monthlyOrdersData.months.map((_, index) => {
      return users.filter((u) => {
        if (!u.createdAt) return false;
        const userDate = new Date(u.createdAt);
        return userDate.getMonth() === index && userDate.getFullYear() === currentYear;
      }).length;
    });
    // Calculate cumulative
    let cumulative = 0;
    const cumulativeUsers = monthlyUsers.map((count) => {
      cumulative += count;
      return cumulative;
    });
    return {
      newUsers: monthlyUsers,
      totalUsers: cumulativeUsers,
    };
  }, [users, monthlyOrdersData.months]);

  const userGrowthSeries = [
    {
      name: "Người dùng mới",
      data: userGrowthData.newUsers,
    },
    {
      name: "Tổng người dùng",
      data: userGrowthData.totalUsers,
    },
  ];

  // Pie chart options for user roles
  const userRoleChartOptions: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "donut",
      height: 350,
    },
    labels: userRoleData.labels,
    colors: ["#465FFF", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
    legend: {
      position: "bottom",
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} người dùng`,
      },
    },
  };

  // Pie chart options for subscription status
  const subscriptionStatusChartOptions: ApexOptions = {
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "pie",
      height: 350,
    },
    labels: subscriptionStatusData.labels,
    colors: ["#10B981", "#6B7280"],
    legend: {
      position: "bottom",
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `${val} gói đăng ký`,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white/90">Bảng Điều Khiển</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tổng quan về hệ thống HomeTrack</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng Người Dùng</p>
              <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white/90">{stats.totalUsers}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {stats.activeUsers} đang hoạt động
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-500/10">
              <svg
                className="h-6 w-6 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng Đơn Hàng</p>
              <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white/90">{stats.totalOrders}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {stats.ordersThisMonth} trong tháng này
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-500/10">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Revenue Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tổng Doanh Thu</p>
              <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white/90">
                {(stats.totalRevenue / 1000000).toFixed(1)}M
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {(stats.revenueThisMonth / 1000000).toFixed(1)}M trong tháng này
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-500/10">
              <svg
                className="h-6 w-6 text-purple-600 dark:text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Subscriptions Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Gói Đăng Ký</p>
              <p className="mt-2 text-3xl font-bold text-gray-800 dark:text-white/90">
                {stats.activeSubscriptions}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {stats.totalSubscriptions} tổng số gói
              </p>
            </div>
            <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-500/10">
              <svg
                className="h-6 w-6 text-orange-600 dark:text-orange-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Người dùng Premium</p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{stats.premiumUsers}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Đã xác thực Email</p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{stats.verifiedUsers}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Đơn đã thanh toán</p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{stats.paidOrders}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Vật phẩm phòng</p>
          <p className="mt-1 text-2xl font-bold text-gray-800 dark:text-white/90">{stats.totalRoomItems}</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Orders & Revenue Chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Đơn Hàng & Doanh Thu Theo Tháng
          </h3>
          <ReactApexChart
            options={monthlyOrdersChartOptions}
            series={monthlyOrdersSeries}
            type="line"
            height={350}
          />
        </div>

        {/* User Growth Chart */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Tăng Trưởng Người Dùng
          </h3>
          <ReactApexChart
            options={userGrowthChartOptions}
            series={userGrowthSeries}
            type="area"
            height={350}
          />
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* User Role Distribution */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Phân Bố Vai Trò Người Dùng
          </h3>
          {userRoleData.labels.length > 0 ? (
            <ReactApexChart
              options={userRoleChartOptions}
              series={userRoleData.series}
              type="donut"
              height={350}
            />
          ) : (
            <div className="flex items-center justify-center h-[350px] text-gray-500">
              Chưa có dữ liệu
            </div>
          )}
        </div>

        {/* Subscription Status */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
            Trạng Thái Gói Đăng Ký
          </h3>
          {subscriptionStatusData.series.some((s) => s > 0) ? (
            <ReactApexChart
              options={subscriptionStatusChartOptions}
              series={subscriptionStatusData.series}
              type="pie"
              height={350}
            />
          ) : (
            <div className="flex items-center justify-center h-[350px] text-gray-500">
              Chưa có dữ liệu
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
