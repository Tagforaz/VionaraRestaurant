import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QrCode, Download, Plus, Edit, Trash2, ArrowLeft } from 'lucide-react';

const mockQRCodes = [
  {
    id: '1',
    name: 'Masa 1',
    type: 'table',
    url: 'https://restaurant.com/qr/table-1',
    isActive: true,
    scans: 145,
  },
  {
    id: '2',
    name: 'Masa 2',
    type: 'table',
    url: 'https://restaurant.com/qr/table-2',
    isActive: true,
    scans: 98,
  },
  {
    id: '3',
    name: 'Çatdırılma Menyusu',
    type: 'delivery',
    url: 'https://restaurant.com/qr/delivery-menu',
    isActive: true,
    scans: 523,
  },
  {
    id: '4',
    name: 'Masa 5',
    type: 'table',
    url: 'https://restaurant.com/qr/table-5',
    isActive: false,
    scans: 67,
  },
];

export const ModeratorQRCodes = () => {
  const navigate = useNavigate();
  const [qrCodes, setQRCodes] = useState(mockQRCodes);

  const toggleStatus = (id: string) => {
    setQRCodes(prev =>
      prev.map(qr => (qr.id === id ? { ...qr, isActive: !qr.isActive } : qr))
    );
  };

  const deleteQR = (id: string) => {
    if (confirm('QR kodu silmək istədiyinizdən əminsiniz?')) {
      setQRCodes(prev => prev.filter(qr => qr.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/moderator')}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">QR Kodlar</h1>
            <p className="text-muted-foreground">QR kodları idarə edin</p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Yeni QR Kod
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {qrCodes.map(qr => (
          <Card key={qr.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{qr.name}</CardTitle>
                {qr.isActive ? (
                  <Badge className="bg-green-600">Aktiv</Badge>
                ) : (
                  <Badge variant="secondary">Deaktiv</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* QR Code Placeholder */}
              <div className="flex items-center justify-center bg-muted rounded-lg p-8">
                <QrCode className="h-24 w-24 text-muted-foreground" />
              </div>

              {/* Stats */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tip:</span>
                  <span className="font-medium">
                    {qr.type === 'table' ? 'Masa' : 'Çatdırılma'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Skan sayı:</span>
                  <span className="font-medium">{qr.scans}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    // Download QR code logic
                    alert('QR kod yüklənir...');
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Yüklə
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Edit logic
                    alert('Redaktə');
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={qr.isActive ? 'secondary' : 'default'}
                  size="sm"
                  className="flex-1"
                  onClick={() => toggleStatus(qr.id)}
                >
                  {qr.isActive ? 'Deaktiv et' : 'Aktiv et'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteQR(qr.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
