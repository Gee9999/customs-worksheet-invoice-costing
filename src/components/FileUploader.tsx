import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileSpreadsheet, FileText, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploaderProps {
  onCostingUpload: (file: File) => void;
  onWorksheetUpload: (file: File) => void;
  onInvoiceUpload: (file: File) => void;
  costingFile: File | null;
  worksheetFile: File | null;
  invoiceFile: File | null;
}

export function FileUploader({
  onCostingUpload,
  onWorksheetUpload,
  onInvoiceUpload,
  costingFile,
  worksheetFile,
  invoiceFile,
}: FileUploaderProps) {
  const costingRef = useRef<HTMLInputElement>(null);
  const worksheetRef = useRef<HTMLInputElement>(null);
  const invoiceRef = useRef<HTMLInputElement>(null);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className={cn(costingFile && "border-primary bg-primary/5")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Air Shipment Costing
          </CardTitle>
          <CardDescription>Upload the costing spreadsheet with factors</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={costingRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onCostingUpload(e.target.files[0])}
          />
          <Button
            onClick={() => costingRef.current?.click()}
            variant={costingFile ? "secondary" : "outline"}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {costingFile ? costingFile.name : "Choose File"}
          </Button>
        </CardContent>
      </Card>

      <Card className={cn(worksheetFile && "border-primary bg-primary/5")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Customs Worksheet
          </CardTitle>
          <CardDescription>Upload the customs duty classification PDF</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={worksheetRef}
            type="file"
            accept=".pdf,.xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onWorksheetUpload(e.target.files[0])}
          />
          <Button
            onClick={() => worksheetRef.current?.click()}
            variant={worksheetFile ? "secondary" : "outline"}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {worksheetFile ? worksheetFile.name : "Choose File"}
          </Button>
        </CardContent>
      </Card>

      <Card className={cn(invoiceFile && "border-primary bg-primary/5")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Invoice
          </CardTitle>
          <CardDescription>Upload the invoice with line items</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={invoiceRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onInvoiceUpload(e.target.files[0])}
          />
          <Button
            onClick={() => invoiceRef.current?.click()}
            variant={invoiceFile ? "secondary" : "outline"}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            {invoiceFile ? invoiceFile.name : "Choose File"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
