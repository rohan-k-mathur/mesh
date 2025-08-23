 import { createSign, createVerify } from "crypto";
 import { canonicalize } from "./jcs";
 
 const KEY_ID = process.env.MESH_SIGNING_KEY_ID || "mesh";
 const PRIVATE_PEM = process.env.MESH_SIGNING_PRIVATE_KEY_PEM || "";
 
 export function signReceipt(obj: any): { signature: string; keyId: string } {
   if (!PRIVATE_PEM) return { signature: "", keyId: KEY_ID };
   const canon = canonicalize(obj);
   // Ed25519 in Node is 'Ed25519' with sign() using KeyObject in newer APIs, but
   // for broad compatibility we use PKCS#8 private key with createSign on SHA256 over canon.
   // If you supply an Ed25519 key, swap to crypto.sign('null', Buffer.from(canon), key).
   const signer = createSign("sha256");
   signer.update(canon);
   signer.end();
   const sig = signer.sign(PRIVATE_PEM).toString("base64");
   return { signature: `sig:${sig}`, keyId: KEY_ID };
 }