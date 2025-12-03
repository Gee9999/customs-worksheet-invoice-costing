import * as XLSX from "xlsx";
import { AirShipmentCosting, CustomsItem } from "@/types/upload";
import { InvoiceItem } from "@/types/shipment";

export async function parseAirShipmentCosting(file: File): Promise<AirShipmentCosting> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  console.log("Parsing costing file, total rows:", jsonData.length);

  // Extract values from the expected positions based on the template
  const invoiceTotal = parseFloat(jsonData[4]?.[5]) || 0;
  const bankCharges = parseFloat(jsonData[11]?.[5]) || 0;
  const clearingCharges = parseFloat(jsonData[13]?.[5]) || 0;
  const duties = parseFloat(jsonData[15]?.[5]) || 0;
  
  const overseasTransport = parseFloat(jsonData[19]?.[5]) || 0;
  const clearingChargesFactor = parseFloat(jsonData[20]?.[5]) || 0;
  const dutiesRate = parseFloat(jsonData[21]?.[5]) || 0;
  const exchangeRate = parseFloat(jsonData[22]?.[5]) || 0;

  // Search for FACTOR rows more flexibly
  const factors: { [key: number]: number } = {};
  
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (row && row[0] && String(row[0]).toUpperCase().includes("FACTOR")) {
      const dutyPercent = parseFloat(row[1]) || 0;

      // Factor value is not in the next column, it is a few columns to the right.
      // Find the first numeric value after the duty column.
      let factorValue = 0;
      for (let j = 2; j < row.length; j++) {
        const val = parseFloat(row[j]);
        if (!Number.isNaN(val) && val !== 0) {
          factorValue = val;
          break;
        }
      }
      
      console.log(`Found FACTOR at row ${i}: Duty ${dutyPercent}%, Factor ${factorValue}`);
      factors[dutyPercent] = factorValue;
    }
  }

  // Fallback to default positions if not found
  if (Object.keys(factors).length === 0) {
    console.log("No FACTOR rows found, using default positions");
    factors[0] = parseFloat(jsonData[26]?.[2]) || 0;
    factors[15] = parseFloat(jsonData[27]?.[2]) || 0;
    factors[20] = parseFloat(jsonData[28]?.[2]) || 0;
    factors[30] = parseFloat(jsonData[29]?.[2]) || 0;
  }

  console.log("Parsed factors:", factors);
  console.log("Factor keys:", Object.keys(factors));
  console.log("Factor values:", Object.values(factors));

  return {
    invoiceTotal,
    bankCharges,
    clearingCharges,
    duties,
    overseasTransport,
    clearingChargesFactor,
    dutiesRate,
    exchangeRate,
    factors,
  };
}

export async function parseInvoice(file: File): Promise<InvoiceItem[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  const items: InvoiceItem[] = [];
  
  // Scan all rows and pick those that look like invoice lines
  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row || !row[0]) continue; // Skip empty rows
    
    const cartonNo = String(row[0] || "");
    const code = String(row[1] || "");
    const description = String(row[2] || "");
    const qty = parseFloat(row[3]) || 0;
    const unit = String(row[4] || "");
    const unitPrice = parseFloat(row[5]) || 0;
    const amount = parseFloat(row[6]) || 0;

    // Include items with amount > 0 OR items with valid unit price
    if (amount > 0 || (unitPrice > 0 && qty > 0)) {
      const finalAmount = amount > 0 ? amount : unitPrice * qty;
      console.log(`Adding item: ${description}, code: ${code}, amount: ${finalAmount}`);
      items.push({
        cartonNo,
        code,
        description,
        qty,
        unit,
        unitPrice,
        amount: finalAmount,
        dutyPercent: 0,
        factor: 0,
      });
    }
  }

  return items;
}

export function extractDutyFromFormula(formula: string): number {
  if (formula.toLowerCase() === "free") return 0;
  
  const match = formula.match(/(\d+)%/);
  return match ? parseInt(match[1]) : 0;
}

export function matchItemToCustomsDuty(
  item: InvoiceItem,
  customsItems: CustomsItem[]
): number {
  const itemDesc = item.description.toUpperCase();
  const itemCode = item.code.toUpperCase();
  
  // Check for specific product codes first
  if (itemCode.includes("8618100373")) {
    return 15; // Assuming this is a bead finding based on tariff pattern
  }
  
  // Check for specific product categories
  // Bead findings (clasps, jumprings) - 15%
  if (itemDesc.includes("CLASP") || itemDesc.includes("JUMP RING") || itemDesc.includes("JUMPRING") || 
      itemDesc.includes("FINDING") || itemDesc.includes("CRIMP")) {
    return 15;
  }
  
  // Colour box - 10% (check both with code and without)
  if (itemDesc.includes("COLOUR BOX") || itemDesc.includes("COLOR BOX") || 
      itemDesc.includes("BOX") || itemCode.includes("BOX")) {
    return 10;
  }
  
  // Tassels - 22%
  if (itemDesc.includes("TASSEL")) {
    return 22;
  }
  
  // Fimo beads - 15%
  if (itemDesc.includes("FIMO")) {
    return 15;
  }
  
  // Try to match by description keywords from customs items
  for (const customs of customsItems) {
    const customsDesc = customs.productCode.toUpperCase();
    
    // Check for keyword matches
    if (itemDesc.includes("JEWEL") && customsDesc.includes("JEWEL")) {
      return customs.dutyPercent;
    }
    if (itemDesc.includes("METAL") && itemDesc.includes("BEAD") && customsDesc.includes("METAL")) {
      return customs.dutyPercent;
    }
    if (itemDesc.includes("GLASS") && itemDesc.includes("BEAD") && customsDesc.includes("GLASS")) {
      return customs.dutyPercent;
    }
    if (itemDesc.includes("SHELL") && customsDesc.includes("SHELL")) {
      return customs.dutyPercent;
    }
  }
  
  return 0; // Default to 0% if no match
}

export function interpolateFactor(
  dutyPercent: number,
  factors: { [key: number]: number }
): number {
  // If exact match exists, return it
  if (factors[dutyPercent] !== undefined) {
    return factors[dutyPercent];
  }
  
  // Find the two closest duty percentages for interpolation
  const sortedDuties = Object.keys(factors).map(Number).sort((a, b) => a - b);
  
  let lower = 0;
  let upper = 0;
  
  for (let i = 0; i < sortedDuties.length; i++) {
    if (sortedDuties[i] < dutyPercent) {
      lower = sortedDuties[i];
    }
    if (sortedDuties[i] > dutyPercent && upper === 0) {
      upper = sortedDuties[i];
      break;
    }
  }
  
  // If we can't interpolate (duty is outside range), use nearest
  if (lower === 0 && upper === 0) {
    return factors[sortedDuties[0]];
  }
  if (upper === 0) {
    return factors[lower];
  }
  
  // Linear interpolation
  const lowerFactor = factors[lower];
  const upperFactor = factors[upper];
  const ratio = (dutyPercent - lower) / (upper - lower);
  const interpolated = lowerFactor + ratio * (upperFactor - lowerFactor);
  
  console.log(`Interpolated factor for ${dutyPercent}% duty: ${interpolated} (between ${lower}%=${lowerFactor} and ${upper}%=${upperFactor})`);
  
  return interpolated;
}
