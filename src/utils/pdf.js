// Qog'ozdagi joylashuv (mm) — chop etish bilan bir xil: A4 ning tepasida
export const PAGE_LAYOUT = { top: 6, left: 10, width: 190 };

/** Kvitansiyani A4 PDF ning tepa qismiga (190 mm kenglikda) joylab yuklab beradi */
export async function downloadPdf(element, filename) {
  if (!element) return;
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  if (document.fonts?.ready) await document.fonts.ready;
  const canvas = await html2canvas(element, { scale: 3, backgroundColor: '#ffffff' });
  const img = canvas.toDataURL('image/png');

  const pdf = new jsPDF('p', 'mm', 'a4');
  const { top, left, width } = PAGE_LAYOUT;
  const height = (canvas.height * width) / canvas.width;

  pdf.addImage(img, 'PNG', left, top, width, height);
  pdf.save(filename);
}
