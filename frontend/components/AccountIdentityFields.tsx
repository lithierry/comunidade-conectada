import { formatBrazilianPhone, formatCpf } from "@/lib/identity";

type AccountIdentityFieldsProps = {
  cpf: string;
  phone: string;
  onCpfChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  idPrefix?: string;
};

export function AccountIdentityFields({ cpf, phone, onCpfChange, onPhoneChange, idPrefix = "account" }: AccountIdentityFieldsProps) {
  const cpfId = `${idPrefix}-cpf`;
  const phoneId = `${idPrefix}-phone`;
  return <>
    <div className="form-field">
      <label htmlFor={cpfId}>CPF</label>
      <input id={cpfId} name="cpf" type="text" inputMode="numeric" autoComplete="off" required maxLength={14} value={cpf} onChange={(event) => onCpfChange(formatCpf(event.target.value))} />
    </div>
    <div className="form-field">
      <label htmlFor={phoneId}>Telefone com DDD</label>
      <input id={phoneId} name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={15} value={phone} onChange={(event) => onPhoneChange(formatBrazilianPhone(event.target.value))} />
    </div>
  </>;
}
