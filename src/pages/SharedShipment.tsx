import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getShipment, ShipmentData } from '@/lib/supabase';
import { ProcessedInvoiceTable } from '@/components/ProcessedInvoiceTable';
import { CostSummary } from '@/components/CostSummary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

export function SharedShipment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [shipment, setShipment] = useState<ShipmentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Invalid shipment ID');
      setLoading(false);
      return;
    }

    getShipment(id)
      .then((data) => {
        if (data) {
          setShipment(data);
        } else {
          setError('Shipment not found');
        }
      })
      .catch((err) => {
        console.error('Error loading shipment:', err);
        setError('Failed to load shipment');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-slate-600">Loading shipment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error || 'Shipment not found'}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} variant="outline" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-6 flex items-center gap-4">
          <Button onClick={() => navigate('/')} variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Shared Shipment</h1>
            <p className="text-sm text-slate-600 mt-1">View-only shared calculation</p>
          </div>
        </div>

        <div className="space-y-6">
          <CostSummary costing={shipment.costingData} items={shipment.processedItems} />
          <ProcessedInvoiceTable items={shipment.processedItems} />
        </div>
      </div>
    </div>
  );
}
