// server/trust/receipt.ts
import nacl from 'tweetnacl';

export function createReceipt(payload: Record<string, any>) {
  const secret = Buffer.from(process.env.MESH_EXPORT_SECRET_KEY!, 'base64');
  const msg = Buffer.from(JSON.stringify(payload));
  const sig = nacl.sign.detached(msg, secret);
  return { payload, signature: Buffer.from(sig).toString('base64'), alg: 'Ed25519', keyId: 'mesh-export-key-1' };
}

export function verifyReceipt(receipt: { payload: any; signature: string }) {
  const pub = Buffer.from(process.env.MESH_EXPORT_PUBLIC_KEY!, 'base64');
  const ok = nacl.sign.detached.verify(Buffer.from(JSON.stringify(receipt.payload)), Buffer.from(receipt.signature, 'base64'), pub);
  return ok;
}
