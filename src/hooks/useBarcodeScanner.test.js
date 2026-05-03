import React from "react";
import { fireEvent, render } from "@testing-library/react";
import useBarcodeScanner from "./useBarcodeScanner";

function Harness({ onScan, options }) {
  useBarcodeScanner(onScan, options);
  return <input data-testid="scanner-input" type="text" />;
}

describe("useBarcodeScanner", () => {
  let nowSpy;
  let focusSpy;

  beforeEach(() => {
    let now = 0;
    nowSpy = jest.spyOn(Date, "now").mockImplementation(() => now);
    focusSpy = jest.spyOn(document, "hasFocus").mockReturnValue(true);
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    nowSpy.set = (next) => {
      now = next;
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("detects a fast scanner-like key sequence followed by Enter", () => {
    const onScan = jest.fn();
    render(<Harness onScan={onScan} />);

    nowSpy.set(0);
    fireEvent.keyDown(window, { key: "1" });
    nowSpy.set(50);
    fireEvent.keyDown(window, { key: "2" });
    nowSpy.set(100);
    fireEvent.keyDown(window, { key: "3" });
    nowSpy.set(150);
    fireEvent.keyDown(window, { key: "Enter" });

    expect(onScan).toHaveBeenCalledTimes(1);
    expect(onScan).toHaveBeenCalledWith("123");
  });

  it("does not scan when typing is too slow", () => {
    const onScan = jest.fn();
    render(<Harness onScan={onScan} />);

    nowSpy.set(0);
    fireEvent.keyDown(window, { key: "A" });
    nowSpy.set(500);
    fireEvent.keyDown(window, { key: "B" });
    nowSpy.set(1100);
    fireEvent.keyDown(window, { key: "C" });
    nowSpy.set(1600);
    fireEvent.keyDown(window, { key: "Enter" });

    expect(onScan).not.toHaveBeenCalled();
  });

  it("scans pasted value when Enter is pressed within paste window", () => {
    const onScan = jest.fn();
    const { getByTestId } = render(
      <Harness
        onScan={onScan}
        options={{ allowManualInputEnter: true, manualInputMinLength: 3 }}
      />
    );

    const input = getByTestId("scanner-input");

    nowSpy.set(1000);
    fireEvent.paste(window, {
      clipboardData: {
        getData: () => "ABC123",
      },
    });
    fireEvent.keyDown(input, { key: "Enter", target: input });

    expect(onScan).toHaveBeenCalledTimes(1);
    expect(onScan).toHaveBeenCalledWith("ABC123");
  });

  it("blocks duplicate scan values inside cooldown window", () => {
    const onScan = jest.fn();
    render(<Harness onScan={onScan} />);

    nowSpy.set(0);
    fireEvent.keyDown(window, { key: "9" });
    nowSpy.set(10);
    fireEvent.keyDown(window, { key: "9" });
    nowSpy.set(20);
    fireEvent.keyDown(window, { key: "9" });
    nowSpy.set(30);
    fireEvent.keyDown(window, { key: "Enter" });

    nowSpy.set(150);
    fireEvent.keyDown(window, { key: "9" });
    nowSpy.set(160);
    fireEvent.keyDown(window, { key: "9" });
    nowSpy.set(170);
    fireEvent.keyDown(window, { key: "9" });
    nowSpy.set(180);
    fireEvent.keyDown(window, { key: "Enter" });

    expect(onScan).toHaveBeenCalledTimes(1);
    expect(onScan).toHaveBeenCalledWith("999");
  });
});
