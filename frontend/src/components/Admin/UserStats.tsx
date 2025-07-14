import React from 'react';
import { useGetUserStatsQuery } from '../../store/api/adminApi';

const UserStats: React.FC = () => {
  const { data: statsData, isLoading, error } = useGetUserStatsQuery();
  const stats = statsData?.data;

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-sm text-red-700">
          Error loading user statistics. Please try again.
        </div>
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total Users',
      value: stats?.totalUsers?.toLocaleString() || '0',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Active Users',
      value: stats?.activeUsers?.toLocaleString() || '0',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'New Users Today',
      value: stats?.newUsersToday?.toString() || '0',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'New This Week',
      value: stats?.newUsersThisWeek?.toString() || '0',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${card.bgColor} ${card.color} p-3 rounded-md`}>
                    {card.icon}
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {card.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {card.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* User Role Distribution */}
      {stats?.usersByRole && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              User Role Distribution
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.usersByRole.user || 0}
                </div>
                <div className="text-sm text-gray-600">Regular Users</div>
                <div className="text-xs text-gray-500 mt-1">
                  {stats.totalUsers > 0 
                    ? `${((stats.usersByRole.user || 0) / stats.totalUsers * 100).toFixed(1)}%`
                    : '0%'
                  }
                </div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.usersByRole.moderator || 0}
                </div>
                <div className="text-sm text-gray-600">Moderators</div>
                <div className="text-xs text-gray-500 mt-1">
                  {stats.totalUsers > 0 
                    ? `${((stats.usersByRole.moderator || 0) / stats.totalUsers * 100).toFixed(1)}%`
                    : '0%'
                  }
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.usersByRole.admin || 0}
                </div>
                <div className="text-sm text-gray-600">Administrators</div>
                <div className="text-xs text-gray-500 mt-1">
                  {stats.totalUsers > 0 
                    ? `${((stats.usersByRole.admin || 0) / stats.totalUsers * 100).toFixed(1)}%`
                    : '0%'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              User Growth
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Today</span>
                <span className="text-sm font-medium text-gray-900">
                  +{stats?.newUsersToday || 0} users
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">This Week</span>
                <span className="text-sm font-medium text-gray-900">
                  +{stats?.newUsersThisWeek || 0} users
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">This Month</span>
                <span className="text-sm font-medium text-gray-900">
                  +{stats?.newUsersThisMonth || 0} users
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              User Status
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Users</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-green-600">
                    {stats?.activeUsers || 0}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({stats?.totalUsers > 0 
                      ? `${((stats.activeUsers || 0) / stats.totalUsers * 100).toFixed(1)}%`
                      : '0%'
                    })
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Inactive Users</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-red-600">
                    {(stats?.totalUsers || 0) - (stats?.activeUsers || 0)}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    ({stats?.totalUsers > 0 
                      ? `${(((stats.totalUsers - stats.activeUsers) || 0) / stats.totalUsers * 100).toFixed(1)}%`
                      : '0%'
                    })
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserStats;
