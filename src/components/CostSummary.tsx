import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AirShipmentCosting } from "@/types/upload";
import { ProcessedInvoiceItem } from "@/types/upload";

interface CostSummaryProps {
  costing: AirShipmentCosting;
  items: ProcessedInvoiceItem[];
}

export function CostSummary({ costing, items }: CostSummaryProps) {
  const totalInvoiceAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const totalFinalCost = items.reduce((sum, item) => sum + item.finalCost, 0);
  
  // Calculate detailed breakdown by duty percentage
  const dutyBreakdown = items.reduce((acc, item) => {
    if (!acc[item.dutyPercent]) {
      acc[item.dutyPercent] = {
        count: 0,
        invoiceAmount: 0,
        finalCost: 0,
        factor: item.factor,
      };
    }
    acc[item.dutyPercent].count += 1;
    acc[item.dutyPercent].invoiceAmount += item.amount;
    acc[item.dutyPercent].finalCost += item.finalCost;
    return acc;
  }, {} as Record<number, { count: number; invoiceAmount: number; finalCost: number; factor: number }>);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Invoice Total</CardDescription>
          <CardTitle className="text-3xl">${totalInvoiceAmount.toFixed(2)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{items.length} items</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Total Final Cost (ZAR)</CardDescription>
          <CardTitle className="text-3xl text-primary">R{totalFinalCost.toFixed(2)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            +R{(totalFinalCost - totalInvoiceAmount).toFixed(2)} markup
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Exchange Rate</CardDescription>
          <CardTitle className="text-3xl">{costing.exchangeRate.toFixed(4)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">USD to ZAR</p>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader className="pb-3">
          <CardTitle>Duty Percentage Breakdown</CardTitle>
          <CardDescription>Detailed calculation by duty percentage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(dutyBreakdown)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([duty, data]) => (
                <div key={duty} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-lg">{duty}% Duty</h4>
                    <span className="text-sm text-muted-foreground">{data.count} items</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Invoice Amount</p>
                      <p className="font-medium">${data.invoiceAmount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Factor</p>
                      <p className="font-medium">{data.factor.toFixed(6)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Calculation</p>
                      <p className="font-mono text-xs">${data.invoiceAmount.toFixed(2)} × {data.factor.toFixed(3)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Subtotal</p>
                      <p className="font-semibold text-primary">R{data.finalCost.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total (Sum of all subtotals)</span>
                <span className="text-primary">R{totalFinalCost.toFixed(2)}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Effective average factor: {(totalFinalCost / totalInvoiceAmount).toFixed(6)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
