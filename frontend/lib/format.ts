export const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "Data não informada";
export const whatsappUrl = (phone: string, title: string) => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá! Vi o anúncio “${title}” na Comunidade Conectada.`)}`;

export const formatRelativeDate = (value?: string) => {
    if (!value) {
        return "Data não informada";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Data não informada";
    }

    const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return "Publicado agora";
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);

    if (diffInMinutes < 60) {
        return `Publicado há ${diffInMinutes} ${
            diffInMinutes === 1 ? "minuto" : "minutos"
        }`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);

    if (diffInHours < 24) {
        return `Publicado há ${diffInHours} ${
            diffInHours === 1 ? "hora" : "horas"
        }`;
    }

    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays < 30) {
        return `Publicado há ${diffInDays} ${
            diffInDays === 1 ? "dia" : "dias"
        }`;
    }

    const diffInMonths = Math.floor(diffInDays / 30);

    if (diffInMonths < 12) {
        return `Publicado há ${diffInMonths} ${
            diffInMonths === 1 ? "mês" : "meses"
        }`;
    }

    const diffInYears = Math.floor(diffInDays / 365);

    return `Publicado há ${diffInYears} ${
        diffInYears === 1 ? "ano" : "anos"
    }`;
};
