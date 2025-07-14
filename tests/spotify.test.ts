import { exchangeCode, refreshToken, uploadRaw } from "@/lib/spotify";
import axios from "axios";
import { supabase } from "@/lib/supabaseclient";

jest.mock("axios");

const mockFrom = supabase.storage.from as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
  global.fetch = jest.fn(async () => ({ ok: true })) as any;
});

test("exchangeCode returns tokens", async () => {
  (axios.post as jest.Mock).mockResolvedValue({ data: { access_token: "a", refresh_token: "r", expires_in: 1 } });
  const t = await exchangeCode("code");
  expect(t.access_token).toBe("a");
});

test("refreshToken failure throws", async () => {
  (axios.post as jest.Mock).mockRejectedValue(new Error("bad"));
  await expect(refreshToken("x")).rejects.toThrow("bad");
});

test("uploadRaw uses storage path", async () => {
  const upload = jest.fn();
  mockFrom.mockReturnValue({ createSignedUploadUrl: jest.fn(async () => ({ data: "u" })), upload });
  await uploadRaw(1, []);
  expect(mockFrom).toHaveBeenCalledWith("favorites_raw");
});
