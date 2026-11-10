# Dieta (PWA)

React + Vite + Supabase. Instalável pelo Chrome.

## Rodar / publicar
    npm install
    npm run dev        # desenvolvimento
    npm run build      # gera a pasta dist/ (é ela que vai para a hospedagem)

O arquivo `.env` já tem a URL e a chave pública (publishable) do Supabase.

## Hospedagem (HTTPS é obrigatório para instalar como app)
Qualquer hospedagem estática serve: Netlify (arraste a pasta `dist` em app.netlify.com/drop), Vercel ou Cloudflare Pages.
`public/_redirects` (Netlify/Cloudflare) e `vercel.json` já cuidam das rotas do app.

## Depois de publicar
No Supabase: Authentication → URL Configuration → coloque o endereço do app em "Site URL"
e em "Redirect URLs" (usado nos links de convite e de recuperação de senha).
