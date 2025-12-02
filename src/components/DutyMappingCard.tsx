import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CUSTOMS_MAPPINGS, DUTY_FACTORS } from "@/types/shipment";

export function DutyMappingCard() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Customs Duty Mapping</CardTitle>
          <CardDescription>Based on customs worksheet classification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {CUSTOMS_MAPPINGS.map((mapping, index) => (
            <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
              <div>
                <p className="font-medium">{mapping.description}</p>
                <p className="text-sm text-muted-foreground">Tariff: {mapping.tariff}</p>
              </div>
              <Badge variant={mapping.dutyPercent === 0 ? "secondary" : "default"}>
                {mapping.dutyPercent}%
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Markup Factors</CardTitle>
          <CardDescription>Applied based on duty percentage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(DUTY_FACTORS).map(([duty, factor]) => (
            <div key={duty} className="flex items-center justify-between border-b pb-2 last:border-0">
              <div>
                <p className="font-medium">Duty: {duty}%</p>
              </div>
              <Badge variant="outline" className="font-mono">
                {factor.toFixed(8)}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
