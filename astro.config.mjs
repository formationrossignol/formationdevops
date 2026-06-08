import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  integrations: [
    starlight({
      title: 'Formation Terraform',
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/formationrossignol' },
        { icon: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/loicrossignol/' },
      ],
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'Français',
          lang: 'fr',
        },
      },
      sidebar: [
        { label: 'Introduction', slug: '' },
        {
          label: 'Terraform',
          items: [
            { label: 'TP 0 : Mise en place de l\'environnement', slug: 'terraform/tp0-mise-en-place' },
            { label: 'TP 1 : Kind (Kubernetes in Docker)', slug: 'terraform/tp1-kind' },
            { label: 'TP 2 : Utilisation générique de Helm', slug: 'terraform/tp2-helm-generique' },
            { label: 'TP 3 : Utilisation de Helm', slug: 'terraform/tp3-helm' },
            { label: 'TP 4 : Provider Helm de Terraform', slug: 'terraform/tp4-provider-helm' },
            { label: 'TP 5 : Provider Docker de Terraform', slug: 'terraform/tp5-provider-docker' },
            { label: 'TP 6 : Provider Kubernetes de Terraform', slug: 'terraform/tp6-provider-kubernetes' },
            { label: 'TP 7 : LocalStack', slug: 'terraform/tp7-localstack' },
            { label: 'TP 8 : Les modules', slug: 'terraform/tp8-modules' },
            { label: 'TP 9 : Intégration de HashiCorp Vault', slug: 'terraform/tp9-vault' },
            { label: 'TP 10 : Gérer un dépôt GitHub', slug: 'terraform/tp10-github' },
          ],
        },
      ],
      lastUpdated: true,
      components: {
        Head: './src/components/Head.astro',
        PageTitle: './src/components/PageTitle.astro',
        Footer: './src/components/Footer.astro',
        ThemeSelect: './src/components/ThemeSelect.astro',
      },
      customCss: ['./src/styles/custom.css'],
      head: [
        { tag: 'script', attrs: { src: '/reading-progress.js', defer: true } },
        { tag: 'script', attrs: { src: '/enhancements.js', defer: true } },
      ],
    }),
  ],
})
