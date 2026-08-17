export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeCpf(value: string): string | null {
  const cpf = digitsOnly(value);
  if (cpf.length !== 11 || cpf === cpf[0]?.repeat(11)) return null;
  for (const digitIndex of [9, 10]) {
    const factor = digitIndex + 1;
    const total = [...cpf.slice(0, digitIndex)].reduce((sum, digit, index) => sum + Number(digit) * (factor - index), 0);
    const remainder = (total * 10) % 11;
    const expected = remainder === 10 ? 0 : remainder;
    if (Number(cpf[digitIndex]) !== expected) return null;
  }
  return cpf;
}

export function formatCpf(value: string): string {
  const cpf = digitsOnly(value).slice(0, 11);
  if (cpf.length <= 3) return cpf;
  if (cpf.length <= 6) return `${cpf.slice(0, 3)}.${cpf.slice(3)}`;
  if (cpf.length <= 9) return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6)}`;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

export function normalizeBrazilianPhone(value: string): string | null {
  let phone = digitsOnly(value);
  if (phone.startsWith("55") && [12, 13].includes(phone.length)) phone = phone.slice(2);
  if (![10, 11].includes(phone.length)) return null;
  const areaCode = Number(phone.slice(0, 2));
  const subscriber = phone.slice(2);
  if (areaCode < 11 || areaCode > 99) return null;
  if (phone.length === 11 && !subscriber.startsWith("9")) return null;
  if (phone.length === 10 && !"2345".includes(subscriber[0])) return null;
  return `+55${phone}`;
}

export function formatBrazilianPhone(value: string): string {
  let phone = digitsOnly(value);
  if (phone.startsWith("55") && phone.length > 11) phone = phone.slice(2);
  phone = phone.slice(0, 11);
  if (!phone) return "";
  if (phone.length <= 2) return `(${phone}`;
  const area = phone.slice(0, 2);
  const subscriber = phone.slice(2);
  if (subscriber.length <= 4) return `(${area}) ${subscriber}`;
  const split = phone.length === 11 ? 5 : 4;
  return `(${area}) ${subscriber.slice(0, split)}-${subscriber.slice(split)}`.replace(/-$/, "");
}
