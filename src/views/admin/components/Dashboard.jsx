import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  DollarSign,
  Home,
  Users,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { supabase } from '@/lib/supabaseClient';

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const numberKeys = ['pago', 'total_amount', 'totalAmount', 'amount', 'price', 'total', 'monto_total', 'monto'];
const bookingDateKeys = ['fecha_inicio', 'created_at', 'createdAt', 'check_in', 'checkIn', 'date', 'booking_date', 'fecha_reserva'];
const propertyStatusKeys = ['estado', 'status'];
const statusKeys = ['status', 'estado'];
const propertyNameKeys = ['descripcion', 'title', 'name', 'nombre', 'property_name', 'propertyName'];

// Devuelve el primer valor no vacío encontrado en una lista de llaves candidatas.
const getFirstValue = (row, keys, fallback = undefined) => {
  for (const key of keys) {
    if (row?.[key] !== undefined && row?.[key] !== null && row?.[key] !== '') {
      return row[key];
    }
  }
  return fallback;
};

// Normaliza cualquier campo numérico posible para cálculos de ingresos.
const parseAmount = (row) => {
  const raw = getFirstValue(row, numberKeys, 0);
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

// Convierte un campo de fecha potencial en Date válida o null.
const parseDate = (row, keys) => {
  const raw = getFirstValue(row, keys, null);
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

// Formatea valores monetarios para mostrar en tarjetas.
const toCurrency = (value) => `$${Math.round(value).toLocaleString('es-MX')}`;

// Genera buckets mensuales base para construir la serie de reservas.
const getMonthBuckets = (months = 6) => {
  const now = new Date();
  const buckets = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      month: MONTHS_ES[d.getMonth()],
      year: d.getFullYear(),
      reservas: 0,
    });
  }

  return buckets;
};

export function Dashboard({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [monthlyBookingsData, setMonthlyBookingsData] = useState([]);
  const [propertyTypesData, setPropertyTypesData] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Define el contenido de tarjetas principales según el estado de métricas.
  const statCards = useMemo(
    () => [
      {
        key: 'users',
        label: 'Usuarios',
        value: stats.totalUsers.toLocaleString('es-MX'),
        icon: Users,
        change: 'Datos en vivo',
        trend: 'up',
      },
      {
        key: 'properties',
        label: 'Propiedades',
        value: stats.totalProperties.toLocaleString('es-MX'),
        icon: Home,
        change: 'Datos en vivo',
        trend: 'up',
      },
      {
        key: 'bookings',
        label: 'Reservas',
        value: stats.totalBookings.toLocaleString('es-MX'),
        icon: Calendar,
        change: 'Datos en vivo',
        trend: 'up',
      },
      {
        key: 'revenue',
        label: 'Ingresos',
        value: toCurrency(stats.totalRevenue),
        icon: DollarSign,
        change: 'Total acumulado',
        trend: 'up',
      },
    ],
    [stats]
  );

  // Carga y consolida datos del dashboard desde tablas principales.
  const loadDashboardData = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const [tenantsResult, landlordsResult, propertiesResult, bookingsResult] = await Promise.all([
        supabase.from('inquilino').select('id_inquilino,nombre'),
        supabase.from('arrendatario').select('id_arrendatario,nombre'),
        supabase.from('propiedad').select('id_propiedad,estado,descripcion'),
        supabase
          .from('reserva')
          .select('id_propiedad,id_inquilino,fecha_inicio,fecha_fin,estado,pago,propiedad:propiedad(descripcion),inquilino:inquilino(nombre)'),
      ]);

      const tenants = tenantsResult.data || [];
      const landlords = landlordsResult.data || [];
      const properties = propertiesResult.data || [];
      const bookings = bookingsResult.data || [];

      const hasSupabaseErrors = [
        tenantsResult.error,
        landlordsResult.error,
        propertiesResult.error,
        bookingsResult.error,
      ].some(Boolean);

      if (hasSupabaseErrors) {
        const messages = [
          tenantsResult.error,
          landlordsResult.error,
          propertiesResult.error,
          bookingsResult.error,
        ]
          .filter(Boolean)
          .map((err) => err.message);
        setErrorMessage(`Se cargó el dashboard parcialmente. ${messages.join(' | ')}`);
      }

      const totalRevenue = bookings.reduce((sum, booking) => sum + parseAmount(booking), 0);

      setStats({
        totalUsers: tenants.length + landlords.length,
        totalProperties: properties.length,
        totalBookings: bookings.length,
        totalRevenue,
      });

      const monthBuckets = getMonthBuckets(6);
      const monthMap = new Map(monthBuckets.map((bucket) => [bucket.key, { ...bucket }]));

      bookings.forEach((booking) => {
        const date = parseDate(booking, bookingDateKeys);
        if (!date) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthMap.has(key)) {
          const bucket = monthMap.get(key);
          bucket.reservas += 1;
          monthMap.set(key, bucket);
        }
      });

      setMonthlyBookingsData(Array.from(monthMap.values()));

      const statusCounter = properties.reduce((acc, property) => {
        const statusRaw = getFirstValue(property, propertyStatusKeys, 'sin_estado');
        const statusLabel = String(statusRaw).trim() || 'sin_estado';
        acc[statusLabel] = (acc[statusLabel] || 0) + 1;
        return acc;
      }, {});

      const normalizedTypes = Object.entries(statusCounter).map(([tipo, cantidad]) => ({
        tipo: tipo.replaceAll('_', ' '),
        cantidad,
      }));
      setPropertyTypesData(normalizedTypes);

      const latestBookings = [...bookings]
        .sort((a, b) => {
          const aDate = parseDate(a, bookingDateKeys)?.getTime() || 0;
          const bDate = parseDate(b, bookingDateKeys)?.getTime() || 0;
          return bDate - aDate;
        })
        .slice(0, 6)
        .map((booking, index) => {
          const statusRaw = String(getFirstValue(booking, statusKeys, 'pendiente')).toLowerCase();
          const isWarning =
            statusRaw.includes('cancel') ||
            statusRaw.includes('rechaz') ||
            statusRaw.includes('suspend');
          const status = isWarning ? 'warning' : 'success';
          const propertyName =
            getFirstValue(booking.propiedad, propertyNameKeys, null) ||
            `Propiedad #${booking.id_propiedad || index + 1}`;
          const tenantName = getFirstValue(booking.inquilino, ['nombre'], `Inquilino #${booking.id_inquilino || '-'}`);
          const timeDate = parseDate(booking, bookingDateKeys);

          return {
            id: `${booking.id_propiedad || 'p'}-${booking.id_inquilino || 'i'}-${booking.fecha_inicio || index}`,
            type: `Reserva ${statusRaw}`,
            user: `${String(propertyName)} · ${String(tenantName)}`,
            time: timeDate ? timeDate.toLocaleDateString('es-MX') : 'Sin fecha',
            status,
          };
        });

      setRecentActivity(latestBookings);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      setErrorMessage(error.message || 'No fue posible cargar los datos del dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-['Poppins'] font-semibold text-[#5F5F5F] mb-2">Dashboard Administrativo</h1>
          <p className="text-[#5F5F5F]/70">Resumen general con datos de la base de datos</p>
        </div>
        <Button
          onClick={loadDashboardData}
          variant="outline"
          className="border-gray-200"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar datos
        </Button>
      </div>

      {errorMessage && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-800">{errorMessage}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.key} className="bg-[#F2E8CF] border-none">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#5F5F5F]/70">{stat.label}</p>
                    <p className="text-2xl font-['Poppins'] font-semibold text-[#5F5F5F] mt-1">
                      {loading ? '...' : stat.value}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="font-['Poppins'] text-[#5F5F5F]">Reservas Mensuales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyBookingsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="month" stroke="#5F5F5F" />
                <YAxis stroke="#5F5F5F" allowDecimals={false} />
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

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="font-['Poppins'] text-[#5F5F5F]">Estado de Propiedades</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={propertyTypesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
                <XAxis dataKey="tipo" stroke="#5F5F5F" />
                <YAxis stroke="#5F5F5F" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="cantidad" fill="#6B8E23" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="font-['Poppins'] text-[#5F5F5F]">Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length === 0 && !loading && (
              <p className="text-sm text-[#5F5F5F]/60">No hay actividad reciente para mostrar.</p>
            )}

            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.status === 'success' ? 'bg-[#6B8E23]' : 'bg-yellow-500'
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

      <div className="flex flex-wrap gap-2">
        <Badge className="bg-[#6B8E23] text-white">Fuente: inquilino + arrendatario</Badge>
        <Badge className="bg-[#A67C52] text-white">Fuente: propiedad</Badge>
        <Badge className="bg-[#5F5F5F] text-white">Fuente: reserva</Badge>
      </div>
    </div>
  );
}
