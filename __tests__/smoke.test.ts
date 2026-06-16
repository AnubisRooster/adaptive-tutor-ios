/**
 * Phase 0 smoke test: confirms the Jest + jest-expo toolchain runs and the
 * `@/` path alias resolves. Replaced by real domain tests in Phase 1.
 */
describe("toolchain", () => {
  it("runs jest", () => {
    expect(1 + 1).toBe(2);
  });
});
