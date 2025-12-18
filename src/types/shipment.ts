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
  0: 22.70,
  10: 24.50,
  15: 25.40,
  20: 26.25,
  22: 26.60,
  30: 28.00,
} as const;

export const CUSTOMS_MAPPINGS: CustomsMapping[] = [
  { description: "COLOUR BOX", tariff: "481920", dutyFormula: "10%", dutyPercent: 10 },
  { description: "FASHION JEWELRY", tariff: "711790", dutyFormula: "20%", dutyPercent: 20 },
  { description: "METAL BEADS", tariff: "83089020", dutyFormula: "FREE", dutyPercent: 0 },
  { description: "GLASS BEADS", tariff: "701810", dutyFormula: "20%", dutyPercent: 20 },
  { description: "SHELL", tariff: "96019090", dutyFormula: "FREE", dutyPercent: 0 },
  { description: "BEAD FINDINGS", tariff: "83089020", dutyFormula: "15%", dutyPercent: 15 },
  { description: "TASSELS", tariff: "580610", dutyFormula: "22%", dutyPercent: 22 },
  { description: "FIMO BEADS", tariff: "39269099", dutyFormula: "15%", dutyPercent: 15 },
  { description: "SCARF", tariff: "621430", dutyFormula: "30%", dutyPercent: 30 },
];
