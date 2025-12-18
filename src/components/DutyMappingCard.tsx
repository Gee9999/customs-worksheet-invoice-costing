import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X, Upload } from "lucide-react";
import { CustomsItem } from "@/types/upload";
import * as XLSX from "xlsx";

interface DutyMappingCardProps {
  customsItems: CustomsItem[];
  onCustomsItemsChange: (items: CustomsItem[]) => void;
}

export function DutyMappingCard({ customsItems, onCustomsItemsChange }: DutyMappingCardProps) {
  const [newProduct, setNewProduct] = useState("");
  const [newDuty, setNewDuty] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (!newProduct.trim()) return;

    const dutyPercent = newDuty.toLowerCase() === "free" ? 0 : parseInt(newDuty) || 0;

    const newItem: CustomsItem = {
      line: customsItems.length + 1,
      tariff: "",
      productCode: newProduct.trim(),
      dutyFormula: newDuty.toLowerCase() === "free" ? "FREE" : `${dutyPercent}%`,
      dutyPercent,
      value: 0,
    };

    onCustomsItemsChange([...customsItems, newItem]);
    setNewProduct("");
    setNewDuty("");
  };

  const handleRemove = (index: number) => {
    const updated = customsItems.filter((_, i) => i !== index);
    onCustomsItemsChange(updated);
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as Record<string, any>[];

        if (jsonData.length === 0) {
          console.log("No data found in Excel file");
          return;
        }

        const firstRow = jsonData[0];
        const columnNames = Object.keys(firstRow).map(k => k.toLowerCase());

        let productColumn = "";
        let dutyColumn = "";

        for (const col of Object.keys(firstRow)) {
          const colLower = col.toLowerCase();
          if (colLower.includes("product") || colLower.includes("code") || colLower.includes("item")) {
            productColumn = col;
          }
          if (colLower.includes("duty") || colLower.includes("rate") || colLower.includes("percent") || colLower.includes("formula")) {
            dutyColumn = col;
          }
        }

        if (!productColumn || !dutyColumn) {
          console.log("Could not find product and duty columns. Columns found:", Object.keys(firstRow));
          alert("Could not find product code and duty rate columns. Please ensure your Excel file has columns like 'Product Code' and 'Duty Rate'.");
          return;
        }

        const importedItems: CustomsItem[] = jsonData
          .filter(row => row[productColumn] && row[dutyColumn])
          .map((row, index) => {
            const productCode = String(row[productColumn]).trim();
            const dutyValue = String(row[dutyColumn]).trim();
            const dutyPercent = dutyValue.toLowerCase() === "free" ? 0 : parseInt(dutyValue.replace(/[^0-9]/g, "")) || 0;

            return {
              line: customsItems.length + index + 1,
              tariff: "",
              productCode,
              dutyFormula: dutyPercent === 0 ? "FREE" : `${dutyPercent}%`,
              dutyPercent,
              value: 0,
            };
          });

        console.log(`Imported ${importedItems.length} items from Excel file`);
        onCustomsItemsChange([...customsItems, ...importedItems]);
      } catch (error) {
        console.error("Error parsing Excel file:", error);
        alert("Error parsing Excel file. Please ensure it's a valid Excel file.");
      }
    };

    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <CardTitle>Customs Duty Mapping</CardTitle>
            <CardDescription>
              Upload customs worksheet to auto-populate, import Excel, or add items manually. Review and edit before calculating.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0"
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Excel
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {customsItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No mappings yet. Upload your customs worksheet PDF above, import an Excel file, or add keywords manually below.
            </p>
          ) : (
            customsItems.map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{item.productCode}</p>
                </div>
                <Badge variant={item.dutyPercent === 0 ? "secondary" : "default"}>
                  {item.dutyFormula}
                </Badge>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => handleRemove(index)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="product">Product Keyword</Label>
              <Input
                id="product"
                placeholder="e.g., WALL CLOCK, OPP BAG, SCARF"
                value={newProduct}
                onChange={(e) => setNewProduct(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAdd()}
              />
              <p className="text-xs text-muted-foreground">
                Enter a keyword that appears in your invoice items (e.g., "SCARF" will match "SCARF TO ANDRE")
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duty">Duty Rate</Label>
              <Input
                id="duty"
                placeholder="0, 15, 20, 30, or FREE"
                value={newDuty}
                onChange={(e) => setNewDuty(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
          </div>
          <Button onClick={handleAdd} className="w-full" disabled={!newProduct.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Mapping
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
