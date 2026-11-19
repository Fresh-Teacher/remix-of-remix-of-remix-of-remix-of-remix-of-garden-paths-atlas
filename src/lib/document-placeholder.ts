import { archiveExtensions, documentExtension } from '@/lib/document-formats';
const pdf = { url: '/__l5e/assets-v1/84184577-c11c-41df-937b-6cea81810ee9/e3f2c139-pdf.webp' };
const word = { url: '/__l5e/assets-v1/43d43e72-7466-4e9e-b475-4498bf6b4c61/cd164d7b-word.webp' };
const excel = { url: '/__l5e/assets-v1/7b1cb7c8-4ea9-4928-a48d-4bb8df76e081/76c3c917-excel.webp' };
const powerpoint = { url: '/__l5e/assets-v1/c614f16e-3866-44ad-8c30-c85d0fe2b977/995dbb07-powerpoint.webp' };
const archive = { url: '/__l5e/assets-v1/dd7fa982-ed5e-4eab-9c86-10ce46ff1268/e3e38388-archive.webp' };
const rtf = { url: '/__l5e/assets-v1/950fc957-72ec-4691-a88c-9d7555e36555/03dc7ab4-rtf.png' };
const txt = { url: '/__l5e/assets-v1/fd76b642-ec4c-4f31-8ee3-c7d6b8e2d637/cd7794b8-txt.webp' };

const placeholders = { pdf, word, excel, powerpoint, archive, rtf, txt };

export function documentPlaceholder(url: string) {
  const extension = documentExtension(url);
  if (extension === 'pdf') return placeholders.pdf;
  if (['doc', 'docx'].includes(extension)) return placeholders.word;
  if (['xls', 'xlsx'].includes(extension)) return placeholders.excel;
  if (['ppt', 'pptx', 'pps', 'ppsx'].includes(extension)) return placeholders.powerpoint;
  if (extension === 'rtf') return placeholders.rtf;
  if (extension === 'txt') return placeholders.txt;
  if (archiveExtensions.includes(extension)) return placeholders.archive;
  return null;
}
