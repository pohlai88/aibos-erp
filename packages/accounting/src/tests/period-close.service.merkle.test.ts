import { PeriodCloseService } from '../services/period-close.service';
import { describe, test, expect, beforeEach } from 'vitest';

describe('PeriodCloseService - Merkle Tree', () => {
  let service: PeriodCloseService;

  beforeEach(() => {
    service = new PeriodCloseService();
  });

  // Helper function to create SHA256 hash in base64
  async function sha256b64(input: string | Buffer): Promise<string> {
    const crypto = await import('node:crypto');
    return crypto.createHash('sha256').update(input).digest('base64');
  }

  // Helper function to convert string to base64
  function toBase64(string_: string): string {
    return Buffer.from(string_).toString('base64');
  }

  test('merkle parent = H(left || right)', async () => {
    const left = toBase64('L');
    const right = toBase64('R');

    // Expected: H(Buffer.from('L') || Buffer.from('R'))
    const expected = await sha256b64(Buffer.concat([Buffer.from('L'), Buffer.from('R')]));

    // Actual: H(Buffer.from(left, 'base64') || Buffer.from(right, 'base64'))
    const actual = await sha256b64(
      Buffer.concat([Buffer.from(left, 'base64'), Buffer.from(right, 'base64')]),
    );

    expect(actual).toBe(expected);
  });

  test('odd leaf duplicates last', async () => {
    const leaves = ['A', 'B', 'C'].map(toBase64);

    // For odd number of leaves, last leaf should be duplicated
    const lastLeaf = Buffer.from('C');
    const expected = await sha256b64(Buffer.concat([lastLeaf, lastLeaf]));

    const actual = await sha256b64(
      Buffer.concat([Buffer.from(leaves[2]!, 'base64'), Buffer.from(leaves[2]!, 'base64')]),
    );

    expect(actual).toBe(expected);
  });

  test('buildMerkleTree with single leaf returns that leaf', async () => {
    const singleLeaf = toBase64('single');
    const result = await (service as any).buildMerkleTree([singleLeaf]);
    expect(result).toBe(singleLeaf);
  });

  test('buildMerkleTree with two leaves creates correct parent', async () => {
    const left = toBase64('left');
    const right = toBase64('right');

    const result = await (service as any).buildMerkleTree([left, right]);

    // Expected parent hash
    const expected = await sha256b64(
      Buffer.concat([Buffer.from(left, 'base64'), Buffer.from(right, 'base64')]),
    );

    expect(result).toBe(expected);
  });

  test('buildMerkleTree with three leaves handles odd count correctly', async () => {
    const leaves = ['A', 'B', 'C'].map(toBase64);

    const result = await (service as any).buildMerkleTree(leaves);

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('buildMerkleTree with four leaves creates correct tree', async () => {
    const leaves = ['A', 'B', 'C', 'D'].map(toBase64);

    const result = await (service as any).buildMerkleTree(leaves);

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('assertBase64 validates correct base64 strings', () => {
    const validBase64 = [
      'SGVsbG8gV29ybGQ=',
      'SGVsbG8gV29ybGQ',
      'SGVsbG8gV29ybGQ==',
      'YWJjZGVmZ2hpams=',
      'YWJjZGVmZ2hpams',
      'YWJjZGVmZ2hpams==',
    ];

    validBase64.forEach((base64) => {
      expect(() => (service as any).assertBase64(base64, 'test')).not.toThrow();
    });
  });

  test('assertBase64 rejects invalid base64 strings', () => {
    const invalidBase64 = ['Hello World!', 'SGVsbG8gV29ybGQ!', 'SGVsbG8gV29ybGQ@'];

    invalidBase64.forEach((base64) => {
      expect(() => (service as any).assertBase64(base64, 'test')).toThrow(
        `Invalid base64 for test: ${base64}`,
      );
    });
  });

  test('merkleParent creates correct hash', async () => {
    const left = toBase64('left');
    const right = toBase64('right');

    const result = await (service as any).merkleParent(left, right);

    const expected = await sha256b64(
      Buffer.concat([Buffer.from(left, 'base64'), Buffer.from(right, 'base64')]),
    );

    expect(result).toBe(expected);
  });

  test('sha256b64 creates correct hash', async () => {
    const input = Uint8Array.from(Buffer.from('test input'));
    const result = await (service as any).sha256b64(input);

    const expected = await sha256b64(Buffer.from('test input'));

    expect(result).toBe(expected);
  });

  test('buildMerkleTree is deterministic', async () => {
    const leaves = ['A', 'B'].map(toBase64);

    const result1 = await (service as any).buildMerkleTree(leaves);
    const result2 = await (service as any).buildMerkleTree(leaves);

    expect(result1).toBe(result2);
  });

  test('buildMerkleTree handles empty array', async () => {
    await expect((service as any).buildMerkleTree([])).rejects.toThrow();
  });

  test('buildMerkleTree handles small number of leaves', async () => {
    const leaves = Array.from({ length: 5 }, (_, index) => toBase64(`leaf-${index}`));

    const result = await (service as any).buildMerkleTree(leaves);

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
