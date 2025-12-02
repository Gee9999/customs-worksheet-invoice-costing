export interface InvoiceItem {
  cartonNo: string;
  code: string;
  description: string;
  qty: number;
  unit: string;
  unitPrice: number;
  amount: number;
  dutyPercent: number;
  factor: number;
}

export interface CustomsMapping {
  description: string;
  tariff: string;
  dutyFormula: string;
  dutyPercent: number;
}

export const DUTY_FACTORS = {
  0: 28.56480776,
  15: 31.20630776,
  20: 32.08680776,
  30: 33.84780776,
} as const;

export const CUSTOMS_MAPPINGS: CustomsMapping[] = [
  { description: "COLOUR BOX", tariff: "481920", dutyFormula: "10%", dutyPercent: 15 },
  { description: "FASHION JEWELRY", tariff: "711790", dutyFormula: "20%", dutyPercent: 20 },
  { description: "METAL BEADS", tariff: "83089020", dutyFormula: "FREE", dutyPercent: 0 },
  { description: "GLASS BEADS", tariff: "701810", dutyFormula: "20%", dutyPercent: 20 },
  { description: "SHELL", tariff: "96019090", dutyFormula: "FREE", dutyPercent: 0 },
];
