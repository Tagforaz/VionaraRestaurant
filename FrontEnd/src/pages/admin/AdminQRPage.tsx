import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Download, QrCode, Copy, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/layouts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function AdminQRPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const baseUrl = window.location.origin;
  const menuUrl = `${baseUrl}/menu`;

  const downloadQRCode = () => {
    const svg = document.getElementById('restaurant-qr-code') as unknown as SVGElement;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 512;
      canvas.height = 600;

      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 56, 80, 400, 400);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Restaurant Menu', canvas.width / 2, 40);
        ctx.font = '18px Arial';
        ctx.fillText('Scan to view menu', canvas.width / 2, 520);
      }

      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'Restaurant-Menu-QR.png';
      downloadLink.href = pngFile;
      downloadLink.click();

      toast({
        title: t('admin.qr.downloaded', 'QR Code Downloaded'),
        description: t('admin.qr.downloadSuccess', 'Restaurant menu QR code downloaded successfully'),
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <QrCode className="h-8 w-8" />
              {t('admin.qr.title', 'QR Menu Code')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('admin.qr.description', 'Generate and download QR code for restaurant menu')}
            </p>
          </div>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">{t('admin.qr.settings', 'Restaurant Menu QR Code')}</CardTitle>
            <CardDescription className="text-center">
              {t('admin.qr.settingsDesc', 'Universal QR code for all tables')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white p-6 rounded-lg flex items-center justify-center border-2">
              <QRCodeSVG
                id="restaurant-qr-code"
                value={menuUrl}
                size={300}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="space-y-2">
              <Label>{t('admin.qr.baseUrl', 'Menu URL')}</Label>
              <div className="flex items-center gap-2">
                <Input value={menuUrl} readOnly className="font-mono text-sm" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(menuUrl)}>
                  {copiedUrl === menuUrl ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <Button className="w-full" size="lg" onClick={downloadQRCode}>
                <Download className="mr-2 h-5 w-5" />
                {t('admin.qr.download', 'Download QR Code')}
              </Button>
              <Button variant="outline" className="w-full" onClick={() => copyToClipboard(menuUrl)}>
                {copiedUrl === menuUrl ? (
                  <><Check className="mr-2 h-4 w-4" />{t('admin.qr.copied', 'Link Copied!')}</>
                ) : (
                  <><Copy className="mr-2 h-4 w-4" />{t('admin.qr.copyLink', 'Copy Menu Link')}</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
