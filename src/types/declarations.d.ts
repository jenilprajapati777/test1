declare module "heic2any" {
  export default function heic2any(options: {
    blob: Blob;
    toType?: string;
    quality?: number;
    multiple?: boolean;
  }): Promise<Blob | Blob[]>;
}

declare module "jsqr" {
  export interface QRCodePoint {
    x: number;
    y: number;
  }
  export interface QRCodeLocation {
    topRightCorner: QRCodePoint;
    topLeftCorner: QRCodePoint;
    bottomRightCorner: QRCodePoint;
    bottomLeftCorner: QRCodePoint;
    topRightFinderPattern: QRCodePoint;
    topLeftFinderPattern: QRCodePoint;
    bottomLeftFinderPattern: QRCodePoint;
  }
  export interface QRCode {
    binaryData: number[];
    data: string;
    chunks: unknown[];
    version: number;
    location: QRCodeLocation;
  }
  export default function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options?: {
      inversionAttempts?:
        "dontInvert" | "onlyInvert" | "attemptBoth" | "invertFirst";
    },
  ): QRCode | null;
}
