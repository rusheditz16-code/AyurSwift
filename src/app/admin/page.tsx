import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AyurSwift Merchant Hub | Dark Store Management',
  description: 'Manage home dark store inventory, margins & Rapido parcel rider dispatch.',
};

export default function AdminPage() {
  return <AdminDashboard />;
}
