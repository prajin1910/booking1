import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
    FiCalendar,
    FiDollarSign,
    FiEye,
    FiNavigation,
    FiPlus,
    FiRefreshCw,
    FiTrendingUp,
    FiUsers
} from 'react-icons/fi';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../utils/api';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Redirect if not admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const fetchDashboardData = async () => {
    try {
      const [statsRes, bookingsRes, usersRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getRecentBookings(),
        adminAPI.getRecentUsers()
      ]);
      
      setStats(statsRes.data);
      setRecentBookings(bookingsRes.data.bookings);
      setRecentUsers(usersRes.data.users);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="spinner mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage your flight booking system</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('flights')}
            className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'flights'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Flights
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'bookings'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Bookings
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Users
          </button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100">
                  <FiUsers className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.users?.total || 0}</p>
                  <div className="flex items-center mt-1">
                    <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500">+{stats?.users?.thisMonth || 0} this month</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100">
                  <FiNavigation className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Flights</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.flights?.total || 0}</p>
                  <div className="flex items-center mt-1">
                    <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500">{stats?.flights?.active || 0} active</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-100">
                  <FiCalendar className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.bookings?.total || 0}</p>
                  <div className="flex items-center mt-1">
                    <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500">+{stats?.bookings?.thisMonth || 0} this month</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-yellow-100">
                  <FiDollarSign className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.revenue?.total || 0)}</p>
                  <div className="flex items-center mt-1">
                    <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-500">{formatCurrency(stats?.revenue?.thisMonth || 0)} this month</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Bookings */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Bookings</h2>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                {recentBookings.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent bookings</p>
                ) : (
                  <div className="space-y-4">
                    {recentBookings.slice(0, 5).map((booking) => (
                      <div key={booking._id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{booking.bookingId}</p>
                          <p className="text-sm text-gray-600">
                            {booking.flight.route.departure.airport.code} → {booking.flight.route.arrival.airport.code}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{formatCurrency(booking.pricing.totalAmount)}</p>
                          <p className="text-sm text-gray-500">{formatDate(booking.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View All
                  </button>
                </div>
              </div>
              <div className="p-6">
                {recentUsers.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No recent users</p>
                ) : (
                  <div className="space-y-4">
                    {recentUsers.slice(0, 5).map((user) => (
                      <div key={user._id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="font-medium text-gray-900">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{formatDate(user.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setActiveTab('flights')}
            className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiPlus className="w-5 h-5" />
            <span>Add New Flight</span>
          </button>
          
          <button
            onClick={fetchDashboardData}
            className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiRefreshCw className="w-5 h-5" />
            <span>Refresh Data</span>
          </button>
          
          <button
            onClick={() => setActiveTab('bookings')}
            className="flex items-center justify-center space-x-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <FiEye className="w-5 h-5" />
            <span>View All Bookings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;