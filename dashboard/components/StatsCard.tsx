interface StatsCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: string;
  color: 'blue' | 'purple' | 'green' | 'red';
}

const colorClasses = {
  blue: 'bg-blue-50 text-blue-900 border-blue-200',
  purple: 'bg-purple-50 text-purple-900 border-purple-200',
  green: 'bg-green-50 text-green-900 border-green-200',
  red: 'bg-red-50 text-red-900 border-red-200',
};

const changeColorClasses = {
  positive: 'text-green-600',
  negative: 'text-red-600',
};

export default function StatsCard({ title, value, change, icon, color }: StatsCardProps) {
  return (
    <div className={`card ${colorClasses[color]} border-2`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
          <p className={`text-sm mt-2 ${change >= 0 ? changeColorClasses.positive : changeColorClasses.negative}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from last month
          </p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );
}
