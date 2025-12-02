import { useState } from "react";
import { InvoiceItem } from "@/types/shipment";
import { processInvoiceItems } from "@/utils/invoiceProcessor";
import { InvoiceTable } from "@/components/InvoiceTable";
import { DutyMappingCard } from "@/components/DutyMappingCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

const SAMPLE_INVOICE_DATA: InvoiceItem[] = [
  { cartonNo: "7#", code: "", description: "COLOUR BOX FOR 8621300079", qty: 800, unit: "PCS", unitPrice: 0.0141, amount: 11.28, dutyPercent: 0, factor: 0 },
  { cartonNo: "8#", code: "8618100373", description: "FASHION JEWELRY", qty: 20, unit: "PCS", unitPrice: 0.961, amount: 19.22, dutyPercent: 0, factor: 0 },
  { cartonNo: "8#", code: "8618100504", description: "FASHION JEWELRY", qty: 12, unit: "PCS", unitPrice: 1.503, amount: 18.036, dutyPercent: 0, factor: 0 },
  { cartonNo: "3#", code: "8610400807", description: "METAL BEADS +-20PCS", qty: 79, unit: "PKS", unitPrice: 0.486, amount: 38.394, dutyPercent: 0, factor: 0 },
  { cartonNo: "10#", code: "8612200173", description: "GLASS BEADS 6MM", qty: 10, unit: "STRS", unitPrice: 0.875, amount: 8.75, dutyPercent: 0, factor: 0 },
  { cartonNo: "9#", code: "8621300079", description: "SHELL", qty: 20, unit: "PKS", unitPrice: 1.121, amount: 22.42, dutyPercent: 0, factor: 0 },
];

const Index = () => {
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const { toast } = useToast();

  const handleLoadSampleData = () => {
    const processed = processInvoiceItems(SAMPLE_INVOICE_DATA);
    setInvoiceItems(processed);
    toast({
      title: "Sample data loaded",
      description: "Invoice items processed with duty allocations and factors",
    });
  };

  const handleExportToExcel = () => {
    if (invoiceItems.length === 0) {
      toast({
        title: "No data to export",
        description: "Please load sample data first",
        variant: "destructive",
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      invoiceItems.map(item => ({
        "C/NO.": item.cartonNo,
        "CODE": item.code,
        "DESCRIPTION": item.description,
        "QTY": item.qty,
        "UNIT": item.unit,
        "UNIT PRICE": item.unitPrice,
        "AMOUNT": item.amount,
        "% DUTY": item.dutyPercent,
        "FACTOR": item.factor,
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoice");
    XLSX.writeFile(workbook, `invoice_with_duties_${Date.now()}.xlsx`);

    toast({
      title: "Export successful",
      description: "Invoice exported to Excel with duty allocations",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-5xl font-bold tracking-tight">
            Air Shipment Costing Calculator
          </h1>
          <p className="text-lg text-muted-foreground">
            Automatically allocate customs duties and markup factors to invoice items
          </p>
        </div>

        <div className="mb-8 flex gap-4 justify-center">
          <Button onClick={handleLoadSampleData} size="lg" className="gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Load Sample Data
          </Button>
          <Button
            onClick={handleExportToExcel}
            size="lg"
            variant="outline"
            className="gap-2"
            disabled={invoiceItems.length === 0}
          >
            <Download className="h-5 w-5" />
            Export to Excel
          </Button>
        </div>

        <div className="mb-8">
          <DutyMappingCard />
        </div>

        {invoiceItems.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Processed Invoice Items</h2>
              <p className="text-muted-foreground">{invoiceItems.length} items</p>
            </div>
            <InvoiceTable items={invoiceItems} />
          </div>
        )}

        {invoiceItems.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FileSpreadsheet className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">No invoice data loaded</h3>
              <p className="text-muted-foreground">
                Click "Load Sample Data" to see the duty allocation system in action
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
