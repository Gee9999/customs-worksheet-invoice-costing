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

  // Parse customs items - look for rows with tariff codes and duty formulas
  const customsItems: CustomsItem[] = [];

  for (let i = 0; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row) continue;

    // Columns: LINE | COO | TARIFF | PRODUCT CODE | DUTY FORMULA | ...
    // So: row[0] = line, row[1] = COO, row[2] = tariff, row[3] = product, row[4] = duty formula
    const tariff = String(row[2] || '').trim();
    const productCode = String(row[3] || '').trim();
    const dutyFormula = String(row[4] || '').trim();

    // Check if this looks like a customs entry
    if (tariff && /^\d{6,10}$/.test(tariff) && dutyFormula && productCode) {
      const dutyPercent = extractDutyFromFormula(dutyFormula);
      const value = parseFloat(row[5]) || 0;

      customsItems.push({
        line: customsItems.length + 1,
        tariff,
        productCode,
        dutyFormula,
        dutyPercent,
        value,
      });

      console.log(`Found customs item: Tariff ${tariff}, Product: ${productCode}, Duty: ${dutyFormula} (${dutyPercent}%)`);
    }
  }

  console.log(`Parsed ${customsItems.length} customs items`);

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
    customsItems,
  };
}

export async function parseInvoice(file: File): Promise<InvoiceItem[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true }) as any[][];

  console.log("Invoice file first 10 rows:");
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    console.log(`Row ${i}:`, jsonData[i]);
  }

  const items: InvoiceItem[] = [];

  // Try to detect a header row so we can parse invoices where the first column (carton) is blank.
  const findHeaderIndex = (): number => {
    for (let i = 0; i < Math.min(jsonData.length, 25); i++) {
      const row = jsonData[i] || [];
      const upper = row.map((c) => String(c ?? "").toUpperCase().trim());
      const hasCode = upper.some((c) => c === "CODE" || c.includes("CODE") || c === "ITEM CODE" || c === "PRODUCT CODE");
      const hasDesc = upper.some((c) => c === "DESCRIPTION" || c.includes("DESC") || c.includes("DEC") || c === "ITEM" || c === "PRODUCT");
      const hasQty = upper.some((c) => c === "QTY" || c.includes("QTY") || c === "QUANTITY" || c.includes("QUANTITY"));
      const hasPrice = upper.some((c) => c.includes("PRICE") || c.includes("AMOUNT") || c.includes("VALUE"));

      console.log(`Row ${i} check:`, { hasCode, hasDesc, hasQty, hasPrice, cells: upper });

      if ((hasCode || hasDesc) && (hasQty || hasPrice)) return i;
    }
    return -1;
  };

  const headerIdx = findHeaderIndex();
  const headerRow = headerIdx >= 0 ? (jsonData[headerIdx] || []) : [];
  const headerUpper = headerRow.map((c) => String(c ?? "").toUpperCase().trim());

  console.log("Header detection:", { headerIdx, headerRow });

  const findColumn = (patterns: string[]): number => {
    for (const pattern of patterns) {
      const idx = headerUpper.findIndex((c) => c === pattern || c.includes(pattern));
      if (idx >= 0) return idx;
    }
    return -1;
  };

  const idx = {
    cartonNo: headerIdx >= 0 ? findColumn(["C/NO", "CARTON", "CTN"]) : 0,
    code: headerIdx >= 0 ? findColumn(["CODE", "ITEM CODE", "PRODUCT CODE"]) : 1,
    description: headerIdx >= 0 ? findColumn(["DESCRIPTION", "DESC", "DEC.", "DEC", "ITEM", "PRODUCT"]) : 2,
    qty: headerIdx >= 0 ? findColumn(["QTY", "QUANTITY", "QUAN"]) : 3,
    unit: headerIdx >= 0 ? headerUpper.findIndex((c) => c === "UNIT" && !c.includes("PRICE")) : 4,
    unitPrice: headerIdx >= 0 ? findColumn(["UNIT PRICE", "PRICE", "UNIT_PRICE", "U/PRICE"]) : 5,
    amount: headerIdx >= 0 ? findColumn(["AMOUNT", "TOTAL", "VALUE", "LINE TOTAL"]) : 6,
  };

  console.log("Column indices:", idx);
  console.log("Detected column names:", {
    cartonNo: idx.cartonNo >= 0 ? headerRow[idx.cartonNo] : 'NOT FOUND',
    code: idx.code >= 0 ? headerRow[idx.code] : 'NOT FOUND',
    description: idx.description >= 0 ? headerRow[idx.description] : 'NOT FOUND',
    qty: idx.qty >= 0 ? headerRow[idx.qty] : 'NOT FOUND',
    unit: idx.unit >= 0 ? headerRow[idx.unit] : 'NOT FOUND',
    unitPrice: idx.unitPrice >= 0 ? headerRow[idx.unitPrice] : 'NOT FOUND',
    amount: idx.amount >= 0 ? headerRow[idx.amount] : 'NOT FOUND',
  });
  console.log("All header columns:", headerRow);

  const startRow = headerIdx >= 0 ? headerIdx + 1 : 0;

  const toNum = (v: any) => {
    if (v === null || v === undefined || v === '') return 0;
    const s = String(v).replace(/,/g, '').replace(/\s+/g, '').replace(/#/g, '').trim();
    if (s === '' || s === '-') return 0;
    const n = parseFloat(s);
    return Number.isFinite(n) && !Number.isNaN(n) ? n : 0;
  };

  let skippedRows = 0;
  let validRows = 0;

  for (let i = startRow; i < jsonData.length; i++) {
    const row = jsonData[i];
    if (!row) continue;

    const code = String(row[idx.code] ?? "").trim();
    const description = String(row[idx.description] ?? "").trim();

    if (!code && !description) {
      skippedRows++;
      continue;
    }

    const cartonNo = idx.cartonNo >= 0 ? String(row[idx.cartonNo] ?? "").trim() : "";
    const qty = idx.qty >= 0 ? toNum(row[idx.qty]) : 0;
    const unit = idx.unit >= 0 ? String(row[idx.unit] ?? "").trim() : "";
    const unitPrice = idx.unitPrice >= 0 ? toNum(row[idx.unitPrice]) : 0;
    const amount = idx.amount >= 0 ? toNum(row[idx.amount]) : 0;

    if (validRows === 0) {
      console.log(`First data row (${i}) full contents:`, row);
      console.log(`First data row - checking all columns:`, {
        'Column 0': row[0],
        'Column 1': row[1],
        'Column 2': row[2],
        'Column 3': row[3],
        'Column 4': row[4],
        'Column 5 (unitPrice)': row[5],
        'Column 6': row[6],
        'Column 7': row[7],
        'Column 8': row[8],
        'Column 9': row[9],
        'Column 10': row[10],
      });
      console.log(`First data row parsed:`, {
        code,
        description,
        qty,
        unitPrice,
        amount,
        'raw cell at unitPrice index': row[idx.unitPrice],
        'raw cell at amount index': row[idx.amount],
      });
    }

    const finalAmount = amount > 0 ? amount : (unitPrice > 0 && qty > 0 ? unitPrice * qty : 0);
    const finalQty = qty > 0 ? qty : 1;
    const finalUnitPrice = unitPrice > 0 ? unitPrice : (finalAmount > 0 ? finalAmount / finalQty : 0);

    if (finalAmount > 0 || (code && description && qty > 0)) {
      items.push({
        cartonNo,
        code,
        description,
        qty: finalQty,
        unit,
        unitPrice: finalUnitPrice,
        amount: finalAmount > 0 ? finalAmount : finalUnitPrice * finalQty,
        dutyPercent: 0,
        factor: 0,
      });
      validRows++;
    } else {
      console.log(`Row ${i} skipped - no valid data:`, {
        code,
        description,
        qty,
        unitPrice,
        amount,
        rawQty: row[idx.qty],
        rawPrice: row[idx.unitPrice],
        rawAmount: row[idx.amount]
      });
      skippedRows++;
    }
  }

  console.log("Parsed invoice items:", items.length, "(headerIdx:", headerIdx, "validRows:", validRows, "skippedRows:", skippedRows, ")");
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

  console.log(`Matching item: "${item.description}" against ${customsItems.length} customs items`);

  // First, try to match against customs items from the costing file
  for (const customs of customsItems) {
    const customsDesc = customs.productCode.toUpperCase();

    // Split customs description into significant words (ignore common words)
    const customsWords = customsDesc.split(/\s+/).filter(word =>
      word.length > 2 && !['THE', 'AND', 'FOR', 'WITH'].includes(word)
    );

    // Check if ANY significant word from customs description appears in item description
    for (const word of customsWords) {
      if (itemDesc.includes(word)) {
        console.log(`  ✓ Matched "${word}" from customs "${customsDesc}" -> ${customs.dutyPercent}%`);
        return customs.dutyPercent;
      }
    }

    // Also check if the full customs description is contained in the item
    if (itemDesc.includes(customsDesc)) {
      console.log(`  ✓ Matched full customs desc "${customsDesc}" -> ${customs.dutyPercent}%`);
      return customs.dutyPercent;
    }
  }

  console.log(`  ✗ No match found for "${item.description}", defaulting to 0%`);
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
