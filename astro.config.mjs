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
            { label: 'TP 1 : Provider Docker de Terraform', slug: 'terraform/tp1-provider-docker' },
            { label: 'TP 2 : Plusieurs conteneurs avec count', slug: 'terraform/tp2-count' },
            { label: 'TP 3 : Plusieurs conteneurs avec for_each', slug: 'terraform/tp3-foreach' },
            { label: 'TP 4 : Les modules', slug: 'terraform/tp4-modules' },
            { label: 'TP 5 : Gérer un dépôt GitHub', slug: 'terraform/tp5-github' },
            { label: 'TP 6 : Gérer un projet GitLab', slug: 'terraform/tp6-gitlab' },
            { label: 'TP 7 : OpenTofu - Nginx en local', slug: 'terraform/tp7-opentofu' },
            { label: 'TP 8 : Kind (Kubernetes in Docker)', slug: 'terraform/tp8-kind' },
            { label: 'TP 9 : Provider Kubernetes de Terraform', slug: 'terraform/tp9-provider-kubernetes' },
            { label: 'TP 10 : Utilisation générique de Helm', slug: 'terraform/tp10-helm-generique' },
            { label: 'TP 11 : Utilisation de Helm', slug: 'terraform/tp11-helm' },
            { label: 'TP 12 : Provider Helm de Terraform', slug: 'terraform/tp12-provider-helm' },
            { label: 'TP 13 : LocalStack', slug: 'terraform/tp13-localstack' },
            { label: 'TP 14 : Intégration de HashiCorp Vault', slug: 'terraform/tp14-vault' },
            { label: 'TP : Utiliser les outputs', slug: 'terraform/tp-outputs' },
            { label: 'TP : Workspaces multi-environnements', slug: 'terraform/tp-workspaces' },
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
