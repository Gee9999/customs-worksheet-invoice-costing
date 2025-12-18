import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { CustomsItem } from "@/types/upload";

interface DutyMappingCardProps {
  customsItems: CustomsItem[];
  onCustomsItemsChange: (items: CustomsItem[]) => void;
}

export function DutyMappingCard({ customsItems, onCustomsItemsChange }: DutyMappingCardProps) {
  const [newProduct, setNewProduct] = useState("");
  const [newDuty, setNewDuty] = useState("");

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customs Duty Mapping</CardTitle>
        <CardDescription>
          Add product keywords and their duty rates. The system will automatically match items.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {customsItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No mappings yet. Add keywords below to match against your invoice items.
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
