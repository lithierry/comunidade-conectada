import { authErrorMessage, safeNextPath } from "./auth";

describe("auth helpers", () => {
  it("never exposes object coercion as an error message", () => {
    expect(authErrorMessage({ detail: { reason: "invalid" } }, "Falha segura")).toBe("Falha segura");
    expect(authErrorMessage(new Error("Invalid login credentials"), "Falha segura")).toBe("E-mail ou senha incorretos.");
    expect(authErrorMessage(new Error("Unexpected upstream error"), "Falha segura")).toBe("Falha segura");
  });

  it("accepts only internal redirect paths", () => {
    expect(safeNextPath("/publicar")).toBe("/publicar");
    expect(safeNextPath("//site-malicioso.example")).toBe("/minhas");
    expect(safeNextPath("https://site-malicioso.example")).toBe("/minhas");
  });
});
