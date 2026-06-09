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
            { label: 'TP 2 : Utiliser les outputs', slug: 'terraform/tp2-outputs' },
            { label: 'TP 3 : Plusieurs conteneurs avec count', slug: 'terraform/tp3-count' },
            { label: 'TP 4 : Plusieurs conteneurs avec for_each', slug: 'terraform/tp4-foreach' },
            { label: 'TP 5 : Les modules', slug: 'terraform/tp5-modules' },
            { label: 'TP 6 : Tester un module avec terraform test', slug: 'terraform/tp6-test' },
            { label: 'TP 7 : Workspaces multi-environnements', slug: 'terraform/tp7-workspaces' },
            { label: 'TP 8 : Détecter une dérive avec Docker', slug: 'terraform/tp8-drift' },
            { label: 'TP 9 : Gérer un dépôt GitHub', slug: 'terraform/tp9-github' },
            { label: 'TP 10 : Gérer un projet GitLab', slug: 'terraform/tp10-gitlab' },
            { label: 'TP 11 : Sécurité IaC avec Trivy', slug: 'terraform/tp11-trivy' },
            { label: "TP 12 : Estimer le coût avec Infracost", slug: 'terraform/tp12-infracost' },
            { label: 'TP 13 : OpenTofu - Nginx en local', slug: 'terraform/tp13-opentofu' },
            { label: 'TP 14 : Kind (Kubernetes in Docker)', slug: 'terraform/tp14-kind' },
            { label: 'TP 15 : Provider Kubernetes de Terraform', slug: 'terraform/tp15-provider-kubernetes' },
            { label: 'TP 16 : Utilisation générique de Helm', slug: 'terraform/tp16-helm-generique' },
            { label: 'TP 17 : Utilisation de Helm', slug: 'terraform/tp17-helm' },
            { label: 'TP 18 : Provider Helm de Terraform', slug: 'terraform/tp18-provider-helm' },
            { label: 'TP 19 : LocalStack', slug: 'terraform/tp19-localstack' },
            { label: 'TP 20 : Intégration de HashiCorp Vault', slug: 'terraform/tp20-vault' },
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
