import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Users, Home, Calendar, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const statsData = [
  {
    title: 'Total Usuarios',
    value: '2,847',
    change: '+12.5%',
    trend: 'up',
    icon: Users,
  },
  {
    title: 'Propiedades Activas',
    value: '342',
    change: '+8.2%',
    trend: 'up',
    icon: Home,
  },
  {
    title: 'Reservas Activas',
    value: '156',
    change: '-3.1%',
    trend: 'down',
    icon: Calendar,
  },
  {
    title: 'Ingresos del Mes',
    value: '$45,230',
    change: '+18.9%',
    trend: 'up',
    icon: TrendingUp,
  },
];

const monthlyBookingsData = [
  { month: 'Ene', reservas: 45 },
  { month: 'Feb', reservas: 52 },
  { month: 'Mar', reservas: 61 },
  { month: 'Abr', reservas: 58 },
  { month: 'May', reservas: 73 },
  { month: 'Jun', reservas: 89 },
];

const propertyTypesData = [
  { tipo: 'Casa', cantidad: 120 },
  { tipo: 'Apartamento', cantidad: 180 },
  { tipo: 'Villa', cantidad: 42 },
];

const recentActivity = [
  { id: 1, type: 'Nueva reserva', user: 'María González', time: 'Hace 5 min', status: 'success' },
  { id: 2, type: 'Registro usuario', user: 'Carlos Ruiz', time: 'Hace 12 min', status: 'info' },
  { id: 3, type: 'Propiedad publicada', user: 'Ana Martínez', time: 'Hace 1 hora', status: 'success' },
  { id: 4, type: 'Cancelación', user: 'Luis Pérez', time: 'Hace 2 horas', status: 'warning' },
  { id: 5, type: 'Nueva propiedad', user: 'Sofia López', time: 'Hace 3 horas', status: 'info' },
];

export function Dashboard({ onNavigate }) {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="font-['Poppins'] font-semibold text-[#5F5F5F] mb-2">Dashboard</h1>
        <p className="text-[#5F5F5F]/70">Resumen general de la plataforma</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-[#F2E8CF] border-none">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#5F5F5F]/70 mb-1">{stat.title}</p>
                    <p className="font-['Poppins'] font-semibold text-2xl text-[#5F5F5F] mb-2">
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-1">
                      {stat.trend === 'up' ? (
                        <ArrowUp className="w-4 h-4 text-[#6B8E23]" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-red-500" />
                      )}
                      <span
                        className={`text-sm ${
                          stat.trend === 'up' ? 'text-[#6B8E23]' : 'text-red-500'
                        }`}
                      >
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-[#A67C52] flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Bookings Chart */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="font-['Poppins'] text-[#5F5F5F]">
              Reservas Mensuales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyBookingsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="month" stroke="#5F5F5F" />
                <YAxis stroke="#5F5F5F" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="reservas"
                  stroke="#6B8E23"
                  strokeWidth={2}
                  dot={{ fill: '#6B8E23' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Property Types Chart */}
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="font-['Poppins'] text-[#5F5F5F]">
              Tipos de Propiedades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={propertyTypesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="tipo" stroke="#5F5F5F" />
                <YAxis stroke="#5F5F5F" />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#6B8E23" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="font-['Poppins'] text-[#5F5F5F]">
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.status === 'success'
                        ? 'bg-[#6B8E23]'
                        : activity.status === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}
                  />
                  <div>
                    <p className="text-[#5F5F5F]">{activity.type}</p>
                    <p className="text-sm text-[#5F5F5F]/60">{activity.user}</p>
                  </div>
                </div>
                <span className="text-sm text-[#5F5F5F]/60">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => onNavigate('users')}
          className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="text-2xl mb-2">👥</div>
          <h3 className="font-['Poppins'] font-semibold text-[#5F5F5F] mb-1">Usuarios</h3>
          <p className="text-sm text-[#5F5F5F]/60">Gestionar usuarios del sistema</p>
        </button>
        <button
          onClick={() => onNavigate('properties')}
          className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="text-2xl mb-2">🏠</div>
          <h3 className="font-['Poppins'] font-semibold text-[#5F5F5F] mb-1">Propiedades</h3>
          <p className="text-sm text-[#5F5F5F]/60">Administrar propiedades listadas</p>
        </button>
        <button
          onClick={() => onNavigate('bookings')}
          className="p-6 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="text-2xl mb-2">📅</div>
          <h3 className="font-['Poppins'] font-semibold text-[#5F5F5F] mb-1">Reservas</h3>
          <p className="text-sm text-[#5F5F5F]/60">Ver y gestionar reservas</p>
        </button>
      </div>
    </div>
  );
}
