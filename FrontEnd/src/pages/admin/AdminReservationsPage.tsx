import { useState } from 'react';
import { Search, CheckCircle, XCircle, Calendar } from 'lucide-react';
import { AdminLayout } from '@/layouts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

// Demo data
const demoReservations = [
  { id: 'RES-001', customer: 'John Doe', phone: '+1234567890', date: '2024-01-20', time: '19:00', guests: 4, status: 'pending' },
  { id: 'RES-002', customer: 'Jane Smith', phone: '+1234567891', date: '2024-01-20', time: '20:00', guests: 2, status: 'confirmed' },
  { id: 'RES-003', customer: 'Bob Wilson', phone: '+1234567892', date: '2024-01-21', time: '18:30', guests: 6, status: 'confirmed' },
  { id: 'RES-004', customer: 'Alice Brown', phone: '+1234567893', date: '2024-01-21', time: '19:30', guests: 3, status: 'cancelled' },
  { id: 'RES-005', customer: 'Charlie Davis', phone: '+1234567894', date: '2024-01-22', time: '20:30', guests: 8, status: 'pending' },
];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-gray-100 text-gray-800',
};

const AdminReservationsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredReservations = demoReservations.filter(res => {
    const matchesSearch = res.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      res.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || res.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">Reservations</h1>
            <p className="text-muted-foreground">Manage table reservations</p>
          </div>
          <Button>
            <Calendar className="mr-2 h-4 w-4" />
            Calendar View
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search reservations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reservations Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Guests</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((res) => (
                  <TableRow key={res.id}>
                    <TableCell className="font-medium">{res.id}</TableCell>
                    <TableCell>{res.customer}</TableCell>
                    <TableCell>{res.phone}</TableCell>
                    <TableCell>{res.date}</TableCell>
                    <TableCell>{res.time}</TableCell>
                    <TableCell>{res.guests} guests</TableCell>
                    <TableCell>
                      <Badge className={statusColors[res.status]}>
                        {res.status.charAt(0).toUpperCase() + res.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {res.status === 'pending' && (
                          <>
                            <Button variant="ghost" size="icon" className="text-green-600" title="Confirm">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" title="Cancel">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminReservationsPage;
