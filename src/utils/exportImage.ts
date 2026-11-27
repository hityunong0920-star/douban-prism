import { toPng } from 'html-to-image';

export async function exportElementAsPng(
  element: HTMLElement,
  fileName: string,
  backgroundColor: string
): Promise<void> {
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor,
    style: {
      margin: '0',
    },
  });

  const link = document.createElement('a');
  link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
  link.href = dataUrl;
  link.click();
}
