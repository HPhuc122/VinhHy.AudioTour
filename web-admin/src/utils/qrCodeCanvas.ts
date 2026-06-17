// QR bit placement is easier to keep readable without defensive index noise.
// Bounds are controlled by the fixed version matrix and function pattern helpers.
// @ts-nocheck
const VERSION = 5;
const SIZE = 17 + VERSION * 4;
const DATA_CODEWORDS = 108;
const EC_CODEWORDS = 26;

type Module = boolean | null;

export function drawQrCode(canvas: HTMLCanvasElement, value: string, scale = 4): void {
  const matrix = createQrMatrix(value);
  const quiet = 4;
  const size = matrix.length + quiet * 2;
  canvas.width = size * scale;
  canvas.height = size * scale;

  const context = canvas.getContext('2d');
  if (!context) {
    return;
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#111827';

  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix.length; x++) {
      if (matrix[y][x]) {
        context.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale);
      }
    }
  }
}

function createQrMatrix(value: string): boolean[][] {
  const data = new TextEncoder().encode(value);
  if (data.length > 106) {
    throw new Error('QR value is too long for the built-in generator.');
  }

  const matrix: Module[][] = Array.from({ length: SIZE }, () => Array<Module>(SIZE).fill(null));
  const reserved: boolean[][] = Array.from({ length: SIZE }, () => Array<boolean>(SIZE).fill(false));

  drawFunctionPatterns(matrix, reserved);

  const codewords = createCodewords(data);
  placeData(matrix, reserved, codewords);

  let bestMatrix = matrix;
  let bestPenalty = Number.POSITIVE_INFINITY;
  let bestMask = 0;

  for (let mask = 0; mask < 8; mask++) {
    const candidate = cloneMatrix(matrix);
    applyMask(candidate, reserved, mask);
    drawFormatBits(candidate, reserved, mask);
    const penalty = calculatePenalty(candidate);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMatrix = candidate;
      bestMask = mask;
    }
  }

  drawFormatBits(bestMatrix, reserved, bestMask);
  return bestMatrix.map((row) => row.map(Boolean));
}

function createCodewords(data: Uint8Array): number[] {
  const bits: number[] = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, data.length, 8);
  for (const byte of data) {
    appendBits(bits, byte, 8);
  }

  const maxBits = DATA_CODEWORDS * 8;
  appendBits(bits, 0, Math.min(4, maxBits - bits.length));
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  const dataCodewords: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    dataCodewords.push(bitsToByte(bits.slice(i, i + 8)));
  }

  for (let pad = 0xec; dataCodewords.length < DATA_CODEWORDS; pad = pad === 0xec ? 0x11 : 0xec) {
    dataCodewords.push(pad);
  }

  return [...dataCodewords, ...createErrorCorrection(dataCodewords, EC_CODEWORDS)];
}

function appendBits(bits: number[], value: number, length: number): void {
  for (let i = length - 1; i >= 0; i--) {
    bits.push((value >>> i) & 1);
  }
}

function bitsToByte(bits: number[]): number {
  return bits.reduce((value, bit) => (value << 1) | bit, 0);
}

function createErrorCorrection(data: number[], count: number): number[] {
  const generator = reedSolomonGenerator(count);
  const result = Array<number>(count).fill(0);

  for (const byte of data) {
    const factor = byte ^ result.shift()!;
    result.push(0);

    for (let i = 0; i < count; i++) {
      result[i] ^= gfMultiply(generator[i], factor);
    }
  }

  return result;
}

function reedSolomonGenerator(degree: number): number[] {
  let result = [1];
  for (let i = 0; i < degree; i++) {
    result = polynomialMultiply(result, [1, gfPow(2, i)]);
  }

  return result.slice(1);
}

function polynomialMultiply(a: number[], b: number[]): number[] {
  const result = Array<number>(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      result[i + j] ^= gfMultiply(a[i], b[j]);
    }
  }

  return result;
}

function gfMultiply(a: number, b: number): number {
  let result = 0;
  while (b > 0) {
    if ((b & 1) !== 0) {
      result ^= a;
    }
    a <<= 1;
    if ((a & 0x100) !== 0) {
      a ^= 0x11d;
    }
    b >>>= 1;
  }

  return result;
}

function gfPow(value: number, power: number): number {
  let result = 1;
  for (let i = 0; i < power; i++) {
    result = gfMultiply(result, value);
  }
  return result;
}

function drawFunctionPatterns(matrix: Module[][], reserved: boolean[][]): void {
  drawFinder(matrix, reserved, 0, 0);
  drawFinder(matrix, reserved, SIZE - 7, 0);
  drawFinder(matrix, reserved, 0, SIZE - 7);

  for (let i = 0; i < SIZE; i++) {
    setFunction(matrix, reserved, i, 6, i % 2 === 0);
    setFunction(matrix, reserved, 6, i, i % 2 === 0);
  }

  for (const y of [6, 30]) {
    for (const x of [6, 30]) {
      if ((x === 6 && y === 6) || (x === 30 && y === 6) || (x === 6 && y === 30)) {
        continue;
      }
      drawAlignment(matrix, reserved, x, y);
    }
  }

  setFunction(matrix, reserved, 8, SIZE - 8, true);

  for (let i = 0; i < 9; i++) {
    reserve(reserved, 8, i);
    reserve(reserved, i, 8);
  }
  for (let i = SIZE - 8; i < SIZE; i++) {
    reserve(reserved, 8, i);
    reserve(reserved, i, 8);
  }
}

function drawFinder(matrix: Module[][], reserved: boolean[][], left: number, top: number): void {
  for (let y = -1; y <= 7; y++) {
    for (let x = -1; x <= 7; x++) {
      const xx = left + x;
      const yy = top + y;
      if (xx < 0 || yy < 0 || xx >= SIZE || yy >= SIZE) {
        continue;
      }

      const dark =
        x >= 0 &&
        x <= 6 &&
        y >= 0 &&
        y <= 6 &&
        (x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4));
      setFunction(matrix, reserved, xx, yy, dark);
    }
  }
}

function drawAlignment(matrix: Module[][], reserved: boolean[][], centerX: number, centerY: number): void {
  for (let y = -2; y <= 2; y++) {
    for (let x = -2; x <= 2; x++) {
      setFunction(
        matrix,
        reserved,
        centerX + x,
        centerY + y,
        Math.max(Math.abs(x), Math.abs(y)) !== 1,
      );
    }
  }
}

function setFunction(
  matrix: Module[][],
  reserved: boolean[][],
  x: number,
  y: number,
  value: boolean,
): void {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) {
    return;
  }
  matrix[y][x] = value;
  reserved[y][x] = true;
}

function reserve(reserved: boolean[][], x: number, y: number): void {
  if (x >= 0 && y >= 0 && x < SIZE && y < SIZE) {
    reserved[y][x] = true;
  }
}

function placeData(matrix: Module[][], reserved: boolean[][], codewords: number[]): void {
  const bits = codewords.flatMap((byte) =>
    Array.from({ length: 8 }, (_, bit) => (byte >>> (7 - bit)) & 1),
  );
  let bitIndex = 0;
  let upward = true;

  for (let right = SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) {
      right--;
    }

    for (let vertical = 0; vertical < SIZE; vertical++) {
      const y = upward ? SIZE - 1 - vertical : vertical;
      for (let column = 0; column < 2; column++) {
        const x = right - column;
        if (!reserved[y][x]) {
          matrix[y][x] = bitIndex < bits.length ? bits[bitIndex] === 1 : false;
          bitIndex++;
        }
      }
    }

    upward = !upward;
  }
}

function applyMask(matrix: Module[][], reserved: boolean[][], mask: number): void {
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (!reserved[y][x] && maskBit(mask, x, y)) {
        matrix[y][x] = !matrix[y][x];
      }
    }
  }
}

function maskBit(mask: number, x: number, y: number): boolean {
  switch (mask) {
    case 0:
      return (x + y) % 2 === 0;
    case 1:
      return y % 2 === 0;
    case 2:
      return x % 3 === 0;
    case 3:
      return (x + y) % 3 === 0;
    case 4:
      return (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0;
    case 5:
      return ((x * y) % 2) + ((x * y) % 3) === 0;
    case 6:
      return (((x * y) % 2) + ((x * y) % 3)) % 2 === 0;
    default:
      return (((x + y) % 2) + ((x * y) % 3)) % 2 === 0;
  }
}

function drawFormatBits(matrix: Module[][], reserved: boolean[][], mask: number): void {
  const bits = getFormatBits(mask);
  for (let i = 0; i <= 5; i++) setFormat(matrix, reserved, 8, i, getBit(bits, i));
  setFormat(matrix, reserved, 8, 7, getBit(bits, 6));
  setFormat(matrix, reserved, 8, 8, getBit(bits, 7));
  setFormat(matrix, reserved, 7, 8, getBit(bits, 8));
  for (let i = 9; i < 15; i++) setFormat(matrix, reserved, 14 - i, 8, getBit(bits, i));

  for (let i = 0; i < 8; i++) setFormat(matrix, reserved, SIZE - 1 - i, 8, getBit(bits, i));
  for (let i = 8; i < 15; i++) setFormat(matrix, reserved, 8, SIZE - 15 + i, getBit(bits, i));
}

function getFormatBits(mask: number): number {
  let data = (1 << 3) | mask;
  let bits = data << 10;
  const generator = 0b10100110111;
  for (let i = 14; i >= 10; i--) {
    if (((bits >>> i) & 1) !== 0) {
      bits ^= generator << (i - 10);
    }
  }
  return (((data << 10) | bits) ^ 0b101010000010010) & 0x7fff;
}

function getBit(value: number, index: number): boolean {
  return ((value >>> index) & 1) !== 0;
}

function setFormat(
  matrix: Module[][],
  reserved: boolean[][],
  x: number,
  y: number,
  value: boolean,
): void {
  matrix[y][x] = value;
  reserved[y][x] = true;
}

function calculatePenalty(matrix: Module[][]): number {
  let penalty = 0;
  for (let y = 0; y < SIZE; y++) {
    penalty += linePenalty(matrix[y].map(Boolean));
  }
  for (let x = 0; x < SIZE; x++) {
    penalty += linePenalty(matrix.map((row) => Boolean(row[x])));
  }

  for (let y = 0; y < SIZE - 1; y++) {
    for (let x = 0; x < SIZE - 1; x++) {
      const color = matrix[y][x];
      if (
        color === matrix[y][x + 1] &&
        color === matrix[y + 1][x] &&
        color === matrix[y + 1][x + 1]
      ) {
        penalty += 3;
      }
    }
  }

  const dark = matrix.flat().filter(Boolean).length;
  const percent = (dark * 100) / (SIZE * SIZE);
  penalty += Math.floor(Math.abs(percent - 50) / 5) * 10;
  return penalty;
}

function linePenalty(line: boolean[]): number {
  let penalty = 0;
  let runColor = line[0];
  let runLength = 1;

  for (let i = 1; i < line.length; i++) {
    if (line[i] === runColor) {
      runLength++;
    } else {
      if (runLength >= 5) {
        penalty += 3 + (runLength - 5);
      }
      runColor = line[i];
      runLength = 1;
    }
  }

  if (runLength >= 5) {
    penalty += 3 + (runLength - 5);
  }

  return penalty;
}

function cloneMatrix(matrix: Module[][]): Module[][] {
  return matrix.map((row) => [...row]);
}
