/**
 * Builds a minimal, uncompressed born-digital PDF with one text-bearing page per
 * supplied string. Used so the extraction adapter is exercised against real PDF
 * bytes rather than a stub. Passing an empty string for a page produces a page
 * with no text layer, which stands in for a scanned page.
 */
export function buildBornDigitalPdf(pageTexts: string[]): Uint8Array {
  const encoder = new TextEncoder();
  const objects: string[] = [];
  const fontObjectNumber = 3 + pageTexts.length * 2;

  const pageObjectNumbers = pageTexts.map((_, index) => 3 + index * 2);
  objects.push(`<< /Type /Catalog /Pages 2 0 R >>`);
  objects.push(`<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${pageTexts.length} >>`);

  for (const [index, pageText] of pageTexts.entries()) {
    const contentsNumber = 4 + index * 2;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents ${contentsNumber} 0 R ` +
      `/Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> >>`,
    );
    const escaped = pageText.replace(/([\\()])/g, "\\$1");
    const stream = pageText ? `BT /F1 12 Tf 72 720 Td (${escaped}) Tj ET\n` : "";
    objects.push(`<< /Length ${encoder.encode(stream).length} >>\nstream\n${stream}endstream`);
  }

  objects.push(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`);

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  for (const [index, body] of objects.entries()) {
    offsets.push(encoder.encode(pdf).length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  }

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return encoder.encode(pdf);
}
