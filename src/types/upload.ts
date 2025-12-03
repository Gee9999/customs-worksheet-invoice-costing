export interface AirShipmentCosting {
  invoiceTotal: number;
  bankCharges: number;
  clearingCharges: number;
  duties: number;
  overseasTransport: number;
  clearingChargesFactor: number;
  dutiesRate: number;
  exchangeRate: number;
  factors: {
    [key: number]: number;
  };
}

export interface CustomsItem {
  line: number;
  tariff: string;
  productCode: string;
  dutyFormula: string;
  dutyPercent: number;
  value: number;
}

export interface ProcessedInvoiceItem {
  cartonNo: string;
  code: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
  amount: number;
  dutyPercent: number;
  factor: number;
  landedCost: number;  // Per unit landed cost (Unit Price × Factor)
  finalCost: number;   // Total line value (Landed × Qty)
  sellingPrice: number;
}
