import QRCode from 'qrcode';

export interface DrawQrCodeOptions {
  width?: number;
  margin?: number;
}

export async function drawQrCode(
  canvas: HTMLCanvasElement,
  value: string,
  options: DrawQrCodeOptions = {},
): Promise<void> {
  await QRCode.toCanvas(canvas, value, {
    errorCorrectionLevel: 'M',
    margin: options.margin ?? 4,
    width: options.width ?? 256,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

export async function createQrSvg(value: string): Promise<string> {
  return QRCode.toString(value, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 6,
    width: 1024,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}
