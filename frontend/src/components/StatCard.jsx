import React from 'react';

export default function StatCard({ icon: Icon, title, value, colorClass }) {
  return (
    <div className={`stat-card ${colorClass}`}>
      <div className="flex items-center">
        <Icon className="h-8 w-8" />
        <div className="ml-4">
          <p className="text-sm opacity-90">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
}