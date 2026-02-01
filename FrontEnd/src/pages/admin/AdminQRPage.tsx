import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode, Table as TableIcon, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/layouts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function AdminQRPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [tableNumber, setTableNumber] = useState('1');
  const [numberOfTables, setNumberOfTables] = useState(10);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Base URL - bu real production URL ilə əvəz edilməlidir
  const baseUrl = window.location.origin;
  const generateQRUrl = (table: string) => `${baseUrl}/qr-menu?table=${table}`;

  const downloadQRCode = (tableNum: string) => {
    const svg = document.getElementById(`qr-code-${tableNum}`) as unknown as SVGElement;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = 512;
      canvas.height = 600; // Extra space for table label
      
      if (ctx) {
        // White background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw QR code
        ctx.drawImage(img, 56, 80, 400, 400);
        
        // Draw table number
        ctx.fillStyle = '#000';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Table ${tableNum}`, canvas.width / 2, 40);
        
        // Draw instruction
        ctx.font = '18px Arial';
        ctx.fillText('Scan to view menu', canvas.width / 2, 520);
      }
      
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-Table-${tableNum}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      
      toast({
        title: t('admin.qr.downloaded', 'QR Code Downloaded'),
        description: t('admin.qr.downloadSuccess', `QR code for table ${tableNum} downloaded successfully`),
      });
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const downloadAllQRCodes = async () => {
    for (let i = 1; i <= numberOfTables; i++) {
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay between downloads
      downloadQRCode(i.toString());
    }
  };

  const copyToClipboard = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
      
      toast({
        title: t('admin.qr.copied', 'Link Copied'),
        description: t('admin.qr.copySuccess', 'QR menu link copied to clipboard'),
      });
    } catch (err) {
      toast({
        title: t('admin.qr.copyError', 'Copy Failed'),
        description: t('admin.qr.copyErrorDesc', 'Failed to copy link'),
        variant: 'destructive',
      });
    }
  };

  const tables = Array.from({ length: numberOfTables }, (_, i) => (i + 1).toString());

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <QrCode className="h-8 w-8" />
              {t('admin.qr.title', 'QR Menu Codes')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('admin.qr.description', 'Generate and download QR codes for table menus')}
            </p>
          </div>
          <Button onClick={downloadAllQRCodes} size="lg">
            <Download className="mr-2 h-4 w-4" />
            {t('admin.qr.downloadAll', 'Download All')}
          </Button>
        </div>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin.qr.settings', 'QR Code Settings')}</CardTitle>
            <CardDescription>
              {t('admin.qr.settingsDesc', 'Configure QR code generation settings')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfTables">
                  {t('admin.qr.numberOfTables', 'Number of Tables')}
                </Label>
                <Input
                  id="numberOfTables"
                  type="number"
                  min="1"
                  max="100"
                  value={numberOfTables}
                  onChange={(e) => setNumberOfTables(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="previewTable">
                  {t('admin.qr.previewTable', 'Preview Table Number')}
                </Label>
                <Input
                  id="previewTable"
                  type="number"
                  min="1"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('admin.qr.baseUrl', 'Menu URL')}</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={generateQRUrl(tableNumber)}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(generateQRUrl(tableNumber))}
                >
                  {copiedUrl === generateQRUrl(tableNumber) ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Codes Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TableIcon className="h-5 w-5" />
            {t('admin.qr.allTables', 'All Table QR Codes')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {tables.map((table) => (
              <Card key={table} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {t('admin.qr.table', 'Table')} {table}
                    </CardTitle>
                    <Badge variant="secondary">{table}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white p-4 rounded-lg flex items-center justify-center">
                    <QRCodeSVG
                      id={`qr-code-${table}`}
                      value={generateQRUrl(table)}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => downloadQRCode(table)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      {t('admin.qr.download', 'Download')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => copyToClipboard(generateQRUrl(table))}
                    >
                      {copiedUrl === generateQRUrl(table) ? (
                        <>
                          <Check className="mr-2 h-3 w-3" />
                          {t('admin.qr.copied', 'Copied')}
                        </>
                      ) : (
                        <>
                          <Copy className="mr-2 h-3 w-3" />
                          {t('admin.qr.copyLink', 'Copy Link')}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
