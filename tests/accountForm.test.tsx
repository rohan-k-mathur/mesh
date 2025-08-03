/** @jest-environment jsdom */
import { act, fireEvent, render } from "@testing-library/react";
import AccountForm from "@/app/(settings)/profile/(client)/AccountForm";

jest.mock("sonner", () => ({ toast: { success: jest.fn() } }));

describe("AccountForm", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    global.fetch = jest.fn(() => Promise.resolve({ ok: true })) as any;
  });

  afterEach(() => {
    jest.useRealTimers();
    (fetch as jest.Mock).mockReset();
  });

  it("debounces changes and calls fetch", async () => {
    const { getByLabelText } = render(<AccountForm initial={{}} />);
    fireEvent.change(getByLabelText("display name"), {
      target: { value: "Alice" },
    });

    await act(async () => {
      jest.advanceTimersByTime(800);
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/settings/me",
      expect.objectContaining({ method: "PATCH" })
    );
  });
});

