import Link from "next/link";

export default function PrivacyPage() {
  return <div className="page container legal-page">
    <p className="eyebrow">Transparência</p>
    <h1>Privacidade e uso de dados</h1>
    <p>O Comunidade Conectada usa dados de conta para vincular cada publicação ao seu responsável e reduzir cadastros duplicados e tentativas de abuso.</p>

    <h2>Dados da conta</h2>
    <p>Nome, e-mail e credenciais de acesso são tratados com o apoio do Supabase Auth. O e-mail não aparece publicamente nos anúncios.</p>

    <h2>CPF e telefone</h2>
    <p>CPF e telefone são obrigatórios no cadastro para vincular uma identidade informada a uma única conta. O sistema valida o formato, mas isso não comprova que os dados pertencem à pessoa. O telefone ainda não é confirmado por código SMS.</p>
    <p>O número completo do CPF e do telefone não é guardado no banco da aplicação. Eles são normalizados e transformados em identificadores criptográficos não reversíveis; ficam disponíveis somente os quatro últimos dígitos para conferência da própria conta.</p>

    <h2>Dados da publicação</h2>
    <p>Título, descrição, bairro, imagem e os dados de contato informados ficam públicos assim que a publicação é enviada. WhatsApp e nome de contato do anúncio são opcionais e não são preenchidos automaticamente com o telefone privado da conta.</p>

    <h2>Controle da pessoa usuária</h2>
    <p>Em <Link href="/minhas">Minhas publicações</Link>, o proprietário pode acompanhar, corrigir e excluir seus anúncios. As alterações em uma publicação ativa aparecem imediatamente.</p>

    <h2>Imagens e dados de terceiros</h2>
    <p>Envie somente imagens que você pode publicar. Não inclua dados ou imagens de outras pessoas, especialmente crianças e adolescentes, sem autorização.</p>

    <h2>Segurança e cuidado com a comunidade</h2>
    <p>Não existe aprovação prévia. A equipe pode encerrar ou excluir uma publicação depois que ela estiver no ar quando houver abuso, fraude ou conteúdo inadequado. Imagens são validadas, convertidas e armazenadas sem os metadados do arquivo original.</p>

    <Link className="button primary" href="/">Voltar ao mural</Link>
  </div>;
}
