export const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "Data não informada";
export const whatsappUrl = (phone: string, title: string) => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Vi o anúncio “${title}” na Comunidade Conectada.`)}`;
