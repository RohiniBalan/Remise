import PDFDocument from 'pdfkit';

type ProductRow = { title: string; qty: number; revenue: number };
type CategoryRow = { name: string; revenue: number };
type MonthRow = { month: string; revenue: number };
type BestDay = { date: string; revenue: number; orders: number } | null;

export async function POST(req: Request) {
  const body = await req.json();
  const {
    storeName,
    topProducts,
    leastProducts,
    categoryWise,
    revenueByMonth,
    bestDay,
  }: {
    storeName: string;
    topProducts: ProductRow[];
    leastProducts: ProductRow[];
    categoryWise: CategoryRow[];
    revenueByMonth: MonthRow[];
    bestDay: BestDay;
  } = body;

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });

  doc.fontSize(20).font('Helvetica-Bold').text('Sales Analytics Report', { align: 'center' });
  doc.moveDown().fontSize(12).font('Helvetica').text(`Store: ${storeName}`);
  doc.moveDown();

  doc.fontSize(14).font('Helvetica-Bold').text('Top Selling Products');
  topProducts.forEach((p: ProductRow) =>
    doc.fontSize(10).font('Helvetica').text(`${p.title} — ${p.qty} units — Rs ${Math.round(p.revenue).toLocaleString('en-IN')}`)
  );

  doc.moveDown().fontSize(14).font('Helvetica-Bold').text('Least Selling Products');
  leastProducts.forEach((p: ProductRow) =>
    doc.fontSize(10).font('Helvetica').text(`${p.title} — ${p.qty} units`)
  );

  doc.moveDown().fontSize(14).font('Helvetica-Bold').text('Category-wise Sales');
  categoryWise.forEach((c: CategoryRow) =>
    doc.fontSize(10).font('Helvetica').text(`${c.name} — Rs ${Math.round(c.revenue).toLocaleString('en-IN')}`)
  );

  doc.moveDown().fontSize(14).font('Helvetica-Bold').text('Revenue by Month');
  revenueByMonth.forEach((m: MonthRow) =>
    doc.fontSize(10).font('Helvetica').text(`${m.month} — Rs ${Math.round(m.revenue).toLocaleString('en-IN')}`)
  );

  if (bestDay) {
    doc.moveDown().fontSize(14).font('Helvetica-Bold').text('Best Sales Day');
    doc.fontSize(10).font('Helvetica').text(`${bestDay.date} — Rs ${Math.round(bestDay.revenue).toLocaleString('en-IN')} — ${bestDay.orders} orders`);
  }

  doc.end();
  const buffer = await done;

  // Response requires a BodyInit — a Node Buffer isn't one, so convert to Uint8Array
  const body2 = new Uint8Array(buffer);

  return new Response(body2, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="sales-analytics-report.pdf"',
    },
  });
}