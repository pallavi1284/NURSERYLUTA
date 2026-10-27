/**
 * Import utilities for CSV and Excel files
 */

import { parseCSV, parseExcel } from './export';
import type { Nursery, Plant, InventoryItem } from '@/types';

export interface ImportValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: ImportValidationError[];
  preview: any[];
}

/**
 * Validate import file (CSV or Excel)
 */
export async function validateImportFile(
  file: File,
  requiredFields: string[]
): Promise<{ valid: boolean; data: any[]; errors: string[] }> {
  const errors: string[] = [];

  if (!file) {
    errors.push('No file selected');
    return { valid: false, data: [], errors };
  }

  const isCSV = file.name.endsWith('.csv');
  const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

  if (!isCSV && !isExcel) {
    errors.push('File must be CSV or Excel (.xlsx)');
    return { valid: false, data: [], errors };
  }

  try {
    const data = isCSV ? await parseCSV(file) : await parseExcel(file);

    if (data.length === 0) {
      errors.push('File is empty');
      return { valid: false, data: [], errors };
    }

    // Check required fields
    const headers = Object.keys(data[0]);
    const missingFields = requiredFields.filter(f => !headers.includes(f));

    if (missingFields.length > 0) {
      errors.push(`Missing required columns: ${missingFields.join(', ')}`);
      return { valid: false, data, errors };
    }

    return { valid: true, data, errors };
  } catch (error) {
    errors.push(`Failed to parse file: ${error instanceof Error ? error.message : String(error)}`);
    return { valid: false, data: [], errors };
  }
}

/**
 * Detect and report duplicate records
 */
export function detectDuplicates(
  data: any[],
  keyField: string,
  existingRecords: any[] = []
): { duplicates: number[]; rowsWithExisting: number[] } {
  const existingKeys = new Set(existingRecords.map(r => r[keyField]));
  const importedKeys = new Set<string>();
  const duplicates: number[] = [];
  const rowsWithExisting: number[] = [];

  data.forEach((row, index) => {
    const key = String(row[keyField] ?? '').trim();
    if (!key) return;

    if (existingKeys.has(key)) {
      rowsWithExisting.push(index);
    } else if (importedKeys.has(key)) {
      duplicates.push(index);
    } else {
      importedKeys.add(key);
    }
  });

  return { duplicates, rowsWithExisting };
}

/**
 * Validate plant import data
 */
export function validatePlantImportData(data: any[]): ImportValidationError[] {
  const errors: ImportValidationError[] = [];

  data.forEach((row, index) => {
    const rowNum = index + 2; // +2 because 1-indexed and header row

    if (!row['Name'] || !String(row['Name']).trim()) {
      errors.push({ row: rowNum, field: 'Name', message: 'Plant name is required' });
    }

    if (!row['Variety'] || !String(row['Variety']).trim()) {
      errors.push({ row: rowNum, field: 'Variety', message: 'Variety is required' });
    }

    if (!row['Category'] || !String(row['Category']).trim()) {
      errors.push({ row: rowNum, field: 'Category', message: 'Category is required' });
    }

    if (row['Price'] !== undefined && row['Price'] !== null) {
      const price = Number(row['Price']);
      if (isNaN(price) || price < 0) {
        errors.push({ row: rowNum, field: 'Price', message: 'Price must be a valid number' });
      }
    }

    if (row['Quantity'] !== undefined && row['Quantity'] !== null) {
      const qty = Number(row['Quantity']);
      if (isNaN(qty) || qty < 0) {
        errors.push({ row: rowNum, field: 'Quantity', message: 'Quantity must be a valid number' });
      }
    }
  });

  return errors;
}

/**
 * Validate nursery import data
 */
export function validateNurseryImportData(data: any[]): ImportValidationError[] {
  const errors: ImportValidationError[] = [];

  data.forEach((row, index) => {
    const rowNum = index + 2;

    if (!row['Name'] || !String(row['Name']).trim()) {
      errors.push({ row: rowNum, field: 'Name', message: 'Nursery name is required' });
    }

    if (!row['Owner'] || !String(row['Owner']).trim()) {
      errors.push({ row: rowNum, field: 'Owner', message: 'Owner name is required' });
    }

    if (!row['Email'] || !String(row['Email']).trim()) {
      errors.push({ row: rowNum, field: 'Email', message: 'Email is required' });
    } else if (!isValidEmail(String(row['Email']))) {
      errors.push({ row: rowNum, field: 'Email', message: 'Invalid email format' });
    }

    if (!row['Phone'] || !String(row['Phone']).trim()) {
      errors.push({ row: rowNum, field: 'Phone', message: 'Phone number is required' });
    }

    if (!row['City'] || !String(row['City']).trim()) {
      errors.push({ row: rowNum, field: 'City', message: 'City is required' });
    }

    if (!row['State'] || !String(row['State']).trim()) {
      errors.push({ row: rowNum, field: 'State', message: 'State is required' });
    }
  });

  return errors;
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Map import data to plant objects
 */
export function mapImportDataToPlants(
  data: any[],
  sellerUID: string,
  nurseryId: string
): Plant[] {
  return data
    .filter(row => {
      // Filter out empty rows
      return row['Name'] && String(row['Name']).trim();
    })
    .map(row => {
      const plant: Plant = {
        id: `plant-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        sellerUID,
        nurseryId,
        name: String(row['Name']).trim(),
        variety: String(row['Variety']).trim(),
        categoryId: String(row['Category']).trim(),
        description: String(row['Description'] || '').trim(),
        image: row['Image URL'] ? String(row['Image URL']).trim() : '',
        sunlight: (row['Sunlight'] as any) || 'Full Sun',
        watering: (row['Watering'] as any) || 'Medium',
        difficulty: (row['Difficulty'] as any) || 'Easy',
        height: String(row['Height'] || '').trim(),
        heightUnit: (row['Height Unit'] as any) || 'cm',
        plantType: String(row['Plant Type'] || '').trim(),
        subtype: String(row['Subtype'] || '').trim(),
        propagationMethod: String(row['Propagation Method'] || '').trim(),
        age: String(row['Age'] || '').trim(),
        ageUnit: (row['Age Unit'] as any) || 'Months',
        rootType: String(row['Root Type'] || '').trim(),
        rootstock: String(row['Rootstock'] || '').trim(),
        condition: (row['Condition'] as any) || 'Healthy',
        soilRequirement: String(row['Soil Requirement'] || '').trim(),
        climate: String(row['Climate'] || '').trim(),
        plantingSeason: String(row['Planting Season'] || '').trim(),
        maturityPeriod: String(row['Maturity Period'] || '').trim(),
        careInstructions: String(row['Care Instructions'] || '').trim(),
      };
      return plant;
    });
}

/**
 * Map import data to inventory items
 */
export function mapImportDataToInventory(
  data: any[],
  plants: Plant[],
  sellerUID: string,
  nurseryId: string
): InventoryItem[] {
  return data
    .filter(row => row['SKU'] && String(row['SKU']).trim())
    .map(row => {
      // Find the plant by SKU or name
      const sku = String(row['SKU']).trim();
      const existingPlant = plants.find(p => p.id === sku);

      const inventory: InventoryItem = {
        id: `inv-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        sellerUID,
        nurseryId,
        plantId: existingPlant?.id || '',
        price: Number(row['Price']) || 0,
        quantity: Number(row['Quantity']) || 0,
        sku,
        minOrderQuantity: Number(row['Min Order'] || 1),
        status: (row['Status'] as any) || 'active',
        initialQuantity: Number(row['Quantity']) || 0,
      };
      return inventory;
    });
}

/**
 * Generate import preview
 */
export function generateImportPreview(data: any[], limit: number = 5): any[] {
  return data.slice(0, limit);
}
