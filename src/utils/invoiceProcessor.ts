import { InvoiceItem, CUSTOMS_MAPPINGS, DUTY_FACTORS } from "@/types/shipment";

export function getDutyPercentage(description: string): number {
  const upperDesc = description.toUpperCase();
  
  for (const mapping of CUSTOMS_MAPPINGS) {
    if (upperDesc.includes(mapping.description.toUpperCase())) {
      return mapping.dutyPercent;
    }
  }
  
  // Default to 0% if no match found
  return 0;
}

export function getFactorForDuty(dutyPercent: number): number {
  if (dutyPercent in DUTY_FACTORS) {
    return DUTY_FACTORS[dutyPercent as keyof typeof DUTY_FACTORS];
  }
  // Default to 0% factor if not found
  return DUTY_FACTORS[0];
}

export function processInvoiceItems(items: InvoiceItem[]): InvoiceItem[] {
  return items.map(item => {
    const dutyPercent = getDutyPercentage(item.description);
    const factor = getFactorForDuty(dutyPercent);
    
    return {
      ...item,
      dutyPercent,
      factor,
    };
  });
}
