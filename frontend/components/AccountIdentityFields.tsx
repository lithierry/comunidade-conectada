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
    <div className="identity-note">
      <strong>Dados privados da conta</strong>
      <span>Usamos CPF e telefone para limitar contas duplicadas. Eles não aparecem nas publicações e não serão enviados ao perfil público do Supabase.</span>
    </div>
    <div className="form-field">
      <label htmlFor={cpfId}>CPF</label>
      <input id={cpfId} name="cpf" type="text" inputMode="numeric" autoComplete="off" required maxLength={14} value={cpf} onChange={(event) => onCpfChange(formatCpf(event.target.value))} aria-describedby={`${cpfId}-help`} />
      <small id={`${cpfId}-help`}>Informe os 11 dígitos. O sistema guarda somente uma identificação protegida e os quatro últimos dígitos.</small>
    </div>
    <div className="form-field">
      <label htmlFor={phoneId}>Telefone com DDD</label>
      <input id={phoneId} name="phone" type="tel" inputMode="tel" autoComplete="tel" required maxLength={15} value={phone} onChange={(event) => onPhoneChange(formatBrazilianPhone(event.target.value))} aria-describedby={`${phoneId}-help`} />
      <small id={`${phoneId}-help`}>O número fica vinculado à conta e não será publicado. Nesta etapa, ele ainda não é verificado por SMS.</small>
    </div>
  </>;
}
