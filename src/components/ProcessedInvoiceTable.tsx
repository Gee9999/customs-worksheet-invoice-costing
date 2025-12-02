import { ProcessedInvoiceItem } from "@/types/upload";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProcessedInvoiceTableProps {
  items: ProcessedInvoiceItem[];
}

export function ProcessedInvoiceTable({ items }: ProcessedInvoiceTableProps) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>C/NO.</TableHead>
              <TableHead>CODE</TableHead>
              <TableHead>DESCRIPTION</TableHead>
              <TableHead className="text-right">QTY</TableHead>
              <TableHead>UNIT</TableHead>
              <TableHead className="text-right">UNIT PRICE</TableHead>
              <TableHead className="text-right">AMOUNT</TableHead>
              <TableHead className="text-right">DUTY %</TableHead>
              <TableHead className="text-right">FACTOR</TableHead>
              <TableHead className="text-right">FINAL COST (ZAR)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.cartonNo}</TableCell>
                <TableCell className="font-mono text-xs">{item.code}</TableCell>
                <TableCell className="max-w-[200px]">{item.description}</TableCell>
                <TableCell className="text-right">{item.qty}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell className="text-right">${item.unitPrice.toFixed(3)}</TableCell>
                <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant={item.dutyPercent === 0 ? "secondary" : "default"}
                    className="font-semibold"
                  >
                    {item.dutyPercent}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {item.factor.toFixed(6)}
                </TableCell>
                <TableCell className="text-right font-bold text-primary">
                  R{item.finalCost.toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
