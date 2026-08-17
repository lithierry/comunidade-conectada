import { formatBrazilianPhone, formatCpf, normalizeBrazilianPhone, normalizeCpf } from "./identity";

describe("identity helpers", () => {
  it("validates and formats CPF without keeping punctuation", () => {
    expect(normalizeCpf("529.982.247-25")).toBe("52998224725");
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
    expect(normalizeCpf("111.111.111-11")).toBeNull();
    expect(normalizeCpf("529.982.247-24")).toBeNull();
  });

  it("normalizes Brazilian phones to E.164", () => {
    expect(normalizeBrazilianPhone("(11) 91234-5678")).toBe("+5511912345678");
    expect(normalizeBrazilianPhone("+55 11 2345-6789")).toBe("+551123456789");
    expect(formatBrazilianPhone("11912345678")).toBe("(11) 91234-5678");
    expect(normalizeBrazilianPhone("1234")).toBeNull();
  });
});
