describe("bigcapital actions", () => {
  afterEach(() => {
    delete process.env.BIGCAPITAL_URL;
  });

  it("throws when BIGCAPITAL_URL lacks protocol", async () => {
    process.env.BIGCAPITAL_URL = "localhost:4000";
    const { createInvoice } = await import("@/lib/actions/bigcapital.actions");
    await expect(
      createInvoice({ token: "t", invoice: {} })
    ).rejects.toThrow("http:// or https://");
  });
});
