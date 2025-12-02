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
  
  const dutyBreakdown = items.reduce((acc, item) => {
    acc[item.dutyPercent] = (acc[item.dutyPercent] || 0) + item.finalCost;
    return acc;
  }, {} as Record<number, number>);

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

      <Card>
        <CardHeader className="pb-3">
          <CardDescription>Duty Breakdown</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {Object.entries(dutyBreakdown)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([duty, amount]) => (
              <div key={duty} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{duty}% duty:</span>
                <span className="font-medium">R{amount.toFixed(2)}</span>
              </div>
            ))}
        </CardContent>
      </Card>
    </div>
  );
}
