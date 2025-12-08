import { useState } from "react";
import { AirShipmentCosting, CustomsItem, ProcessedInvoiceItem } from "@/types/upload";
import { parseAirShipmentCosting, parseInvoice, extractDutyFromFormula, matchItemToCustomsDuty, interpolateFactor } from "@/utils/fileParser";
import { FileUploader } from "@/components/FileUploader";
import { CostSummary } from "@/components/CostSummary";
import { ProcessedInvoiceTable } from "@/components/ProcessedInvoiceTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, Calculator, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";

interface DepartmentItem {
  code: string;
  description: string;
  unit: string;
  department: string;
}

const Index = () => {
  const [costingFile, setCostingFile] = useState<File | null>(null);
  const [worksheetFile, setWorksheetFile] = useState<File | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [departmentFile, setDepartmentFile] = useState<File | null>(null);
  
  const [costing, setCosting] = useState<AirShipmentCosting | null>(null);
  const [processedItems, setProcessedItems] = useState<ProcessedInvoiceItem[]>([]);
  const [departmentItems, setDepartmentItems] = useState<DepartmentItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isParsingDepartment, setIsParsingDepartment] = useState(false);
  
  const { toast } = useToast();

  const handleCostingUpload = (file: File) => {
    setCostingFile(file);
    toast({
      title: "Costing file uploaded",
      description: file.name,
    });
  };

  const handleWorksheetUpload = (file: File) => {
    setWorksheetFile(file);
    toast({
      title: "Customs worksheet uploaded",
      description: file.name,
    });
  };

  const handleInvoiceUpload = (file: File) => {
    setInvoiceFile(file);
    toast({
      title: "Invoice uploaded",
      description: file.name,
    });
  };

  const handleDepartmentUpload = async (file: File) => {
    setDepartmentFile(file);
    setIsParsingDepartment(true);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false }) as any[][];
      
      console.log("Department file first 3 rows:", JSON.stringify(rows.slice(0, 3)));
      
      // Find column indices from header row
      const headerRow = rows[0] as string[];
      const codeIdx = headerRow.findIndex(h => String(h || '').toUpperCase().includes('CODE'));
      const descIdx = headerRow.findIndex(h => String(h || '').toUpperCase().includes('DEC'));
      const unitIdx = headerRow.findIndex(h => String(h || '').toUpperCase() === 'UNIT');
      const deptIdx = headerRow.findIndex(h => String(h || '').toUpperCase().includes('DEPARTMENT'));
      
      console.log("Column indices - CODE:", codeIdx, "DEC:", descIdx, "UNIT:", unitIdx, "DEPT:", deptIdx);
      
      const items: DepartmentItem[] = [];
      // Skip header row (index 0)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row && row[codeIdx]) {
          const deptValue = String(row[deptIdx] || '').trim();
          items.push({
            code: String(row[codeIdx] || '').trim(),
            description: String(row[descIdx] || '').trim(),
            unit: String(row[unitIdx] || '').trim(),
            department: deptValue.padStart(2, '0'),
          });
        }
      }
      
      console.log("Parsed department items:", items.length, "First item:", JSON.stringify(items[0]));
      
      setDepartmentItems(items);
      toast({
        title: "Department invoice uploaded",
        description: `${items.length} items loaded from ${file.name}`,
      });
    } catch (error) {
      console.error("Error parsing department file:", error);
      toast({
        title: "Error parsing file",
        description: "Please check the file format",
        variant: "destructive",
      });
    } finally {
      setIsParsingDepartment(false);
    }
  };

  const handleExportToCSV = () => {
    if (processedItems.length === 0 || departmentItems.length === 0) {
      toast({
        title: "Missing data",
        description: "Please ensure costs are calculated and department file is uploaded",
        variant: "destructive",
      });
      return;
    }

    const formatNum = (num: number, decimals: number = 2) => 
      num.toFixed(decimals).replace(',', '.');

    const csvRows: string[] = [];
    // Header row
    csvRows.push("CODE,Description,UNIT,Department,Cost Excl,Selling Price Incl");
    
    // Match processed items with department items by code
    for (const deptItem of departmentItems) {
      const processedItem = processedItems.find(
        p => p.code.trim().toLowerCase() === deptItem.code.trim().toLowerCase()
      );
      
      if (processedItem) {
        const row = [
          deptItem.code,
          deptItem.description.replace(/,/g, ''),
          deptItem.unit,
          `="${deptItem.department}"`,
          formatNum(processedItem.landedCost),
          formatNum(processedItem.sellingPrice),
        ];
        csvRows.push(row.join(','));
      }
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `department_costs_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "CSV exported",
      description: `Exported ${csvRows.length - 1} items`,
    });
  };

  const handleCalculate = async () => {
    if (!costingFile || !invoiceFile) {
      toast({
        title: "Missing files",
        description: "Please upload both the costing file and invoice",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Parse costing file
      const costingData = await parseAirShipmentCosting(costingFile);
      setCosting(costingData);

      // Parse invoice
      const invoiceItems = await parseInvoice(invoiceFile);

      // Create a simple customs mapping based on description
      const customsItems: CustomsItem[] = [
        { line: 1, tariff: "481920", productCode: "FLAT COLOUR CARTON", dutyFormula: "10%", dutyPercent: 10, value: 0 },
        { line: 2, tariff: "711790", productCode: "FASHION JEWELLERY", dutyFormula: "20%", dutyPercent: 20, value: 0 },
        { line: 3, tariff: "83089020", productCode: "METAL BEADS", dutyFormula: "FREE", dutyPercent: 0, value: 0 },
        { line: 4, tariff: "701810", productCode: "GLASS BEADS", dutyFormula: "20%", dutyPercent: 20, value: 0 },
        { line: 5, tariff: "96019090", productCode: "SHELL", dutyFormula: "FREE", dutyPercent: 0, value: 0 },
        { line: 6, tariff: "83089020", productCode: "BEAD FINDINGS", dutyFormula: "15%", dutyPercent: 15, value: 0 },
        { line: 7, tariff: "580610", productCode: "TASSELS", dutyFormula: "22%", dutyPercent: 22, value: 0 },
        { line: 8, tariff: "39269099", productCode: "FIMO BEADS", dutyFormula: "15%", dutyPercent: 15, value: 0 },
      ];

      // Helper function to round to nearest 0.25 (R0.25, R0.50, R0.75, R1.00, etc.)
      const roundToQuarter = (value: number): number => {
        return Math.round(value * 4) / 4;
      };

      // Process items
      console.log("Available factors:", costingData.factors);
      const processed: ProcessedInvoiceItem[] = invoiceItems.map(item => {
        // Calculate duty from customs worksheet matching
        const dutyPercent = matchItemToCustomsDuty(item, customsItems);
        // Calculate factor from costing file using interpolation
        const factor = interpolateFactor(dutyPercent, costingData.factors);
        
        console.log(`Item: ${item.description}, Duty: ${dutyPercent}%, Factor: ${factor}`);
        
        // Landed cost = Unit Price × Factor (per unit in ZAR)
        const landedCost = item.unitPrice * factor;
        const finalCost = landedCost * item.qty; // Total line value
        
        // Calculate selling price: 45% GP margin + 15% VAT, rounded to nearest R0.50
        // Selling = (Landed / 0.55) × 1.15
        const rawSellingPrice = (landedCost / 0.55) * 1.15;
        const sellingPrice = roundToQuarter(rawSellingPrice);

        console.log(`Processing ${item.description}: duty=${dutyPercent}%, factor=${factor}, landedCost=${landedCost.toFixed(2)}, sellingPrice=${sellingPrice}`);

        return {
          cartonNo: item.cartonNo,
          code: item.code,
          description: item.description,
          qty: item.qty,
          unit: item.unit,
          unitPrice: item.unitPrice,
          amount: item.amount,
          dutyPercent,
          factor,
          landedCost,
          finalCost,
          sellingPrice,
        };
      });

      setProcessedItems(processed);

      toast({
        title: "Calculation complete",
        description: `Processed ${processed.length} items with duties and factors`,
      });
    } catch (error) {
      console.error("Error processing files:", error);
      toast({
        title: "Processing error",
        description: "Failed to process files. Please check the file formats.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportToExcel = () => {
    if (processedItems.length === 0) {
      toast({
        title: "No data to export",
        description: "Please calculate costs first",
        variant: "destructive",
      });
      return;
    }

    // Format numbers with "." as decimal separator
    const formatNum = (num: number, decimals: number = 2) => 
      num.toFixed(decimals).replace(',', '.');
    
    const worksheet = XLSX.utils.json_to_sheet(
      processedItems.map(item => ({
        "C/NO.": item.cartonNo,
        "CODE": item.code,
        "DESCRIPTION": item.description.replace(/,/g, ''),
        "QTY": item.qty,
        "UNIT": item.unit,
        "UNIT PRICE": formatNum(item.unitPrice, 4),
        "AMOUNT": formatNum(item.amount, 2),
        "DUTY %": item.dutyPercent,
        "FACTOR": formatNum(item.factor, 8),
        "LANDED": formatNum(item.landedCost, 2),
        "VALUE": formatNum(item.finalCost, 2),
        "SELLING PRICE": formatNum(item.sellingPrice, 2),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Processed Invoice");
    XLSX.writeFile(workbook, `invoice_with_costs_${Date.now()}.xlsx`);

    toast({
      title: "Export successful",
      description: "Processed invoice exported to Excel",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="mb-3 text-5xl font-bold tracking-tight">
            Automated Air Shipment Cost Calculator
          </h1>
          <p className="text-lg text-muted-foreground">
            Upload your documents and automatically calculate costs with duty allocations
          </p>
        </div>

        <div className="mb-8">
          <FileUploader
            onCostingUpload={handleCostingUpload}
            onWorksheetUpload={handleWorksheetUpload}
            onInvoiceUpload={handleInvoiceUpload}
            costingFile={costingFile}
            worksheetFile={worksheetFile}
            invoiceFile={invoiceFile}
          />
        </div>

        <div className="mb-8 flex gap-4 justify-center">
          <Button 
            onClick={handleCalculate} 
            size="lg" 
            className="gap-2"
            disabled={!costingFile || !invoiceFile || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Calculator className="h-5 w-5" />
                Calculate Costs
              </>
            )}
          </Button>
          <Button
            onClick={handleExportToExcel}
            size="lg"
            variant="outline"
            className="gap-2"
            disabled={processedItems.length === 0}
          >
            <Download className="h-5 w-5" />
            Export to Excel
          </Button>
        </div>

        {costing && processedItems.length > 0 && (
          <>
            <div className="mb-8">
              <CostSummary costing={costing} items={processedItems} />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Processed Invoice Items</h2>
                <p className="text-muted-foreground">{processedItems.length} items</p>
              </div>
              <ProcessedInvoiceTable items={processedItems} />
            </div>

            {/* Department Export Section */}
            <Card className="mt-8">
              <CardContent className="py-6">
                <h3 className="text-xl font-semibold mb-4">Export with Departments</h3>
                <p className="text-muted-foreground mb-4">
                  Upload the Department Invoice to match departments and export as CSV
                </p>
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={(e) => e.target.files?.[0] && handleDepartmentUpload(e.target.files[0])}
                      className="hidden"
                      id="department-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() => document.getElementById('department-upload')?.click()}
                      disabled={isParsingDepartment}
                      className="w-full"
                    >
                      {isParsingDepartment ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Parsing...</>
                      ) : departmentFile ? (
                        departmentFile.name
                      ) : (
                        "Upload Department Invoice"
                      )}
                    </Button>
                  </div>
                  <Button
                    onClick={handleExportToCSV}
                    disabled={departmentItems.length === 0}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export to CSV
                  </Button>
                </div>
                {departmentItems.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {departmentItems.length} department items loaded
                  </p>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {processedItems.length === 0 && !isProcessing && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Calculator className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">Ready to calculate</h3>
              <p className="text-muted-foreground">
                Upload your files and click "Calculate Costs" to process the shipment
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
