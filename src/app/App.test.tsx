import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "./App";

function resultLines() {
  return screen
    .getByText("Generated values")
    .closest("section")
    ?.querySelector(".random-result")
    ?.textContent?.split("\n");
}

describe("Random Generator", () => {
  it("generates the full unique integer range in sorted order", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByRole("spinbutton", { name: "Maximum" }));
    await user.type(screen.getByRole("spinbutton", { name: "Maximum" }), "3");
    await user.clear(screen.getByRole("spinbutton", { name: "How many" }));
    await user.type(screen.getByRole("spinbutton", { name: "How many" }), "3");
    await user.click(
      screen.getByRole("checkbox", { name: "Do not repeat values" }),
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Result order" }),
      "ascending",
    );
    await user.click(screen.getByRole("button", { name: "Generate" }));

    expect(resultLines()).toEqual(["1", "2", "3"]);
    expect(screen.getByText(/3 integer values without repeats/u)).toBeInTheDocument();
  });

  it("creates passwords with every selected character group", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("tab", { name: "Passwords" }));
    await user.clear(screen.getByRole("spinbutton", { name: "How many" }));
    await user.type(screen.getByRole("spinbutton", { name: "How many" }), "4");
    await user.click(screen.getByRole("button", { name: "Generate" }));

    const values = resultLines() ?? [];
    expect(values).toHaveLength(4);
    for (const value of values) {
      expect(value).toHaveLength(16);
      expect(value).toMatch(/[a-z]/u);
      expect(value).toMatch(/[A-Z]/u);
      expect(value).toMatch(/[0-9]/u);
      expect(
        Array.from("!@#$%^&*()-_=+[]{}").some((symbol) =>
          value.includes(symbol),
        ),
      ).toBe(true);
    }
    expect(
      within(screen.getByLabelText("Password strength estimate")).getByText(
        /bits/u,
      ),
    ).toBeInTheDocument();
  });
});
