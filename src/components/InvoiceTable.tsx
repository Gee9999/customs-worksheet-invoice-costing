import { InvoiceItem } from "@/types/shipment";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

interface InvoiceTableProps {
  items: InvoiceItem[];
}

export function InvoiceTable({ items }: InvoiceTableProps) {
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
              <TableHead className="text-right">% Duty</TableHead>
              <TableHead className="text-right">Factor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{item.cartonNo}</TableCell>
                <TableCell>{item.code}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell className="text-right">{item.qty}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell className="text-right">${item.unitPrice.toFixed(3)}</TableCell>
                <TableCell className="text-right">${item.amount.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold text-primary">
                  {item.dutyPercent}%
                </TableCell>
                <TableCell className="text-right font-semibold text-primary">
                  {item.factor.toFixed(8)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
