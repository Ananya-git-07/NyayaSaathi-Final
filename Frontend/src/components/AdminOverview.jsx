import React, { useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';
import Spinner from './Spinner';
import { Users, FileText, Home, LineChart, PieChart } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement
} from 'chart.js';

// Register the components needed for Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement);

const StatCard = ({ icon, title, value, color }) => (
    <div className="bg-slate-800 p-6 rounded-xl flex items-center gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
        </div>
        <div>
            <p className="text-slate-400 text-sm">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const AdminOverview = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await apiClient.get('/admins/stats');
                setStats(response.data);
            } catch (err) {
                setError(err.message || 'Failed to fetch statistics.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <Spinner />;
    if (error) return <div className="text-red-400 p-4">{error}</div>;
    if (!stats) return <div>No stats available.</div>;

    // Prepare data for the line chart
    const lineChartData = {
        labels: stats.issuesLast30Days.map(d => d._id),
        datasets: [{
            label: 'Issues Created',
            data: stats.issuesLast30Days.map(d => d.count),
            borderColor: 'rgb(56, 189, 248)',
            backgroundColor: 'rgba(56, 189, 248, 0.2)',
            fill: true,
            tension: 0.3
        }]
    };

    // Prepare data for the doughnut chart
    const doughnutChartData = {
        labels: stats.issueTypeDistribution.map(d => d._id),
        datasets: [{
            label: 'Issue Types',
            data: stats.issueTypeDistribution.map(d => d.count),
            backgroundColor: ['#06b6d4', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'],
            borderColor: '#1e293b',
            borderWidth: 2,
        }]
    };

    return (
        <div className="space-y-8">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={<Users size={24} />} title="Total Users" value={stats.keyMetrics.totalUsers} color="bg-cyan-500/20 text-cyan-300" />
                <StatCard icon={<FileText size={24} />} title="Total Legal Issues" value={stats.keyMetrics.totalIssues} color="bg-pink-500/20 text-pink-300" />
                <StatCard icon={<Home size={24} />} title="Total Kiosks" value={stats.keyMetrics.totalKiosks} color="bg-purple-500/20 text-purple-300" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-slate-800 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><LineChart size={20}/>Issues Created (Last 30 Days)</h3>
                    <Line data={lineChartData} options={{ maintainAspectRatio: false }} />
                </div>
                <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><PieChart size={20}/>Issue Type Distribution</h3>
                    <Doughnut data={doughnutChartData} options={{ maintainAspectRatio: false }} />
                </div>
            </div>
        </div>
    );
};

export default AdminOverview;