# Comunidade Conectada

Mural digital para divulgar iniciativas, serviços e oportunidades de uma comunidade.

## Funcionalidades

- consulta pública de anúncios publicados;
- busca por título e descrição;
- filtros por categoria e bairro;
- página de detalhes com responsável, local e WhatsApp;
- envio de anúncios com descrição, contato e imagem opcional;
- análise administrativa antes da publicação;
- login da equipe por Supabase Auth ou senha local;
- painel para editar, aprovar, rejeitar, encerrar e excluir anúncios;
- controle de status: pendente, publicado, rejeitado e encerrado;
- validação e conversão de imagens para WebP;
- layout responsivo, navegação por teclado e suporte a movimento reduzido.

## Perfis de uso

### Visitante

Pode pesquisar, filtrar, abrir anúncios, iniciar contato por WhatsApp e enviar uma nova publicação para análise.

### Equipe

Pode entrar na área restrita, consultar o resumo do mural, filtrar anúncios por status ou bairro e realizar a moderação.

## Integrações

- Supabase Postgres para persistência em produção;
- Supabase Auth para autenticação por e-mail e senha;
- SQLite e senha local como alternativa de desenvolvimento;
- FastAPI para a API e Next.js para a interface web.
