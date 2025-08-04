import type { NextApiRequest, NextApiResponse } from "next";
import { tinyws } from "tinyws";
import { setupWSConnection } from "y-websocket/bin/utils";

export const config = {
  api: { bodyParser: false },
};

export default function handler(
  req: NextApiRequest & { ws?: () => Promise<any> },
  res: NextApiResponse,
) {
  tinyws()(req, res, () => {
    if (req.ws) {
      req.ws().then(ws => {
        const docId = req.query.docId as string;
        setupWSConnection(ws, req, { docName: docId });
      });
    } else {
      res.end();
    }
  });
}
