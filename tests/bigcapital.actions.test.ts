describe("bigcapital actions", () => {
  it("exports createInvoice", async () => {
    const { createInvoice } = await import("@/lib/actions/bigcapital.actions");
    expect(typeof createInvoice).toBe("function");
  });
});
