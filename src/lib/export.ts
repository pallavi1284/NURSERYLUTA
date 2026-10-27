/**
 * Export utility for CSV, Excel, and PDF formats
 * Uses lightweight implementations without heavy dependencies
 */

export interface ExportData {
  filename: string;
  headers: string[];
  rows: (string | number | boolean | null)[][];
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: ExportData): void {
  const { filename, headers, rows } = data;

  // Escape CSV values
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV content
  const csvContent = [
    headers.map(escapeCSV).join(','),
    ...rows.map((row) => row.map(escapeCSV).join(',')),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `${filename}.csv`);
}

/**
 * Export data to Excel format (XLSX)
 * Uses simple XLSX format compatible with Excel
 */
export function exportToExcel(data: ExportData): void {
  const { filename, headers, rows } = data;

  // Convert to XLSX format using SheetJS-like approach
  // For simplicity, we'll create a basic XLSX by converting to CSV and offering download
  // A production app would use a library like 'xlsx' or 'exceljs'

  const escapeXML = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Create a simple XLSX via HTML (Excel can read HTML)
  // For a proper solution, consider installing 'xlsx' library
  let htmlContent = '<table>';
  htmlContent += '<thead><tr>';
  headers.forEach((h) => {
    htmlContent += `<th>${escapeXML(h)}</th>`;
  });
  htmlContent += '</tr></thead>';
  htmlContent += '<tbody>';
  rows.forEach((row) => {
    htmlContent += '<tr>';
    row.forEach((cell) => {
      htmlContent += `<td>${escapeXML(cell)}</td>`;
    });
    htmlContent += '</tr>';
  });
  htmlContent += '</tbody></table>';

  // Create blob with proper Excel MIME type
  const blob = new Blob([htmlContent], {
    type: 'application/vnd.ms-excel;charset=utf-8;',
  });
  downloadFile(blob, `${filename}.xlsx`);
}

/**
 * Export data to PDF format
 * Creates a simple text-based PDF
 */
export function exportToPDF(data: ExportData): void {
  const { filename, headers, rows } = data;

  // Create PDF content using basic PDF structure
  let pdfContent = generatePDF(filename, headers, rows);

  const blob = new Blob([pdfContent], { type: 'application/pdf;charset=utf-8;' });
  downloadFile(blob, `${filename}.pdf`);
}

/**
 * Generate basic PDF content
 */
function generatePDF(
  title: string,
  headers: string[],
  rows: (string | number | boolean | null)[][]
): string {
  // This creates a very basic PDF structure
  // For production, use a library like 'pdfkit' or 'jsPDF'

  const escapeText = (text: any): string => {
    if (text === null || text === undefined) return '';
    return String(text).replace(/[\n\r]/g, ' ');
  };

  let content = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
4 0 obj
<< /Length ${calculatePDFContent(title, headers, rows).length} >>
stream
`;

  content += calculatePDFContent(title, headers, rows);
  content += `
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000222 00000 n 
0000000317 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
${content.length + 100}
%%EOF`;

  return content;
}

/**
 * Calculate PDF content stream
 */
function calculatePDFContent(
  title: string,
  headers: string[],
  rows: (string | number | boolean | null)[][]
): string {
  let content = 'BT\n/F1 12 Tf\n50 750 Td\n';

  // Add title
  content += `(${title}) Tj\n0 -30 Td\n`;

  // Add headers
  content += '/F1 10 Tf\n';
  content += `(${headers.join('  |  ')}) Tj\n`;
  content += '0 -20 Td\n';

  // Add rows
  rows.forEach((row) => {
    content += `(${row.join('  |  ')}) Tj\n`;
    content += '0 -15 Td\n';
  });

  content += 'ET\n';
  return content;
}

/**
 * Helper function to download file
 */
function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Prepare nursery data for export
 */
export function prepareNurseriesExport(
  nurseries: any[],
  format: 'csv' | 'excel' | 'pdf' = 'csv'
): ExportData {
  const headers = [
    'Nursery Name',
    'Owner Name',
    'Email',
    'Phone',
    'City',
    'State',
    'Status',
    'Rating',
    'Reviews',
    'Plants Count',
    'Joined Date',
  ];

  const rows = nurseries.map((n) => [
    n.name,
    n.ownerName,
    n.email,
    n.phone,
    n.city,
    n.state,
    n.status,
    n.rating || 0,
    n.reviewCount || 0,
    n.totalPlants || 0,
    new Date(n.joinedDate).toLocaleDateString('en-IN'),
  ]);

  return {
    filename: `registered_nurseries_${new Date().toISOString().split('T')[0]}`,
    headers,
    rows,
  };
}

/**
 * Prepare plant data for export
 */
export function preparePlantsExport(
  plants: any[],
  inventory: any[],
  nurseries: any[],
  format: 'csv' | 'excel' | 'pdf' = 'csv'
): ExportData {
  const headers = [
    'Plant Name',
    'Variety',
    'Category',
    'Description',
    'Nursery',
    'Price',
    'Stock',
    'Min Order Qty',
    'Sunlight',
    'Watering',
    'Difficulty',
  ];

  const rows = plants.map((p) => {
    const plantInv = inventory.find((inv) => inv.plantId === p.id);
    const nursery = nurseries.find((n) => n.id === plantInv?.nurseryId);
    const price = plantInv?.price || 0;
    const stock = plantInv?.quantity || 0;
    const minOrder = plantInv?.minOrderQuantity || 1;

    return [
      p.name,
      p.variety,
      p.categoryId,
      p.description,
      nursery?.name || 'Unknown',
      price,
      stock,
      minOrder,
      p.sunlight || 'Not specified',
      p.watering || 'Not specified',
      p.difficulty || 'Not specified',
    ];
  });

  return {
    filename: `plants_inventory_${new Date().toISOString().split('T')[0]}`,
    headers,
    rows,
  };
}

/**
 * Prepare orders data for export
 */
export function prepareOrdersExport(orders: any[], format: 'csv' | 'excel' | 'pdf' = 'csv'): ExportData {
  const headers = [
    'Order Number',
    'Customer Name',
    'Date',
    'Status',
    'Total',
    'Payment Status',
    'Delivery Address',
    'Items Count',
  ];

  const rows = orders.map((o) => [
    o.orderNumber,
    o.customerName,
    new Date(o.createdAt).toLocaleDateString('en-IN'),
    o.status,
    o.total,
    o.paymentStatus,
    `${o.address.line1}, ${o.address.city}`,
    o.items.length,
  ]);

  return {
    filename: `orders_report_${new Date().toISOString().split('T')[0]}`,
    headers,
    rows,
  };
}
