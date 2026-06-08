import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  integrations: [
    starlight({
      title: 'Formation AWS',
      social: {
        github: 'https://github.com/formationrossignol',
        linkedin: 'https://www.linkedin.com/in/loicrossignol/',
      },
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'Français',
          lang: 'fr',
        },
      },
      sidebar: [
        { label: 'Introduction au Cloud', slug: '' },
        {
          label: 'Cours',
          items: [
            { label: 'Fondations du Cloud AWS', slug: 'cours/cloud-foundation' },
            { label: 'Sécurité AWS', slug: 'cours/securite-aws' },
          ],
        },
        {
          label: 'Fondamentaux du Cloud',
          items: [
            {
              label: 'Infrastructure',
              items: [
                { label: 'TP : Créer un VPC avec Terraform', slug: 'infrastructure/vpc-terraform' },
                { label: 'TP : Infrastructure as Code avec CloudFormation', slug: 'infrastructure/cloudformation' },
                { label: 'TP : Créer des AMI avec Packer', slug: 'infrastructure/packer' },
              ],
            },
            {
              label: 'Compute',
              items: [
                { label: 'TP : Lancer une instance EC2', slug: 'compute/instance-ec2' },
                { label: 'TP : Automatiser EC2 avec User Data', slug: 'compute/ec2-user-data' },
              ],
            },
            {
              label: 'Containers',
              items: [
                { label: 'TP : Registry Docker privé avec ECR', slug: 'containers/ecr' },
              ],
            },
            {
              label: 'Messaging',
              items: [
                { label: 'TP : SQS Free Tier', slug: 'messaging/sqs' },
              ],
            },
          ],
        },
        {
          label: 'Sécurité dans le Cloud',
          items: [
            { label: 'TP : Gestion des identités IAM', slug: 'securite-cloud/iam-free-tier' },
            { label: 'TP : Analyser les chemins IAM avec PMapper', slug: 'securite-cloud/tp-pmapper-iam' },
            { label: 'TP 2 : Escalade IAM contrôlée', slug: 'securite-cloud/tp2-escalade-iam-controlee' },
            { label: 'TP : Détection de secrets dans un dépôt Git', slug: 'securite-cloud/detection-secrets-git' },
            { label: 'TP : IaC sécurisée avec Terraform, Checkov et Trivy', slug: 'securite-cloud/terraform-checkov-trivy' },
            { label: 'TP : Serverless sécurisé avec SAM, cfn-lint et Checkov', slug: 'securite-cloud/sam-cfn-lint-checkov' },
            { label: 'TP : Inventaire sécurité AWS avec Prowler', slug: 'securite-cloud/prowler' },
            { label: 'TP : Cartographie sécurité AWS avec CloudFox', slug: 'securite-cloud/cloudfox' },
            { label: 'TP : Gouvernance AWS Organizations avec IAM et SCP', slug: 'securite-cloud/tp-organizations-iam-scp' },
          ],
        },
        {
          label: 'Stockage cloud',
          items: [
            { label: "TP : Traitement d'images avec Lambda et S3", slug: 'stockage/s3-lambda' },
            { label: 'TP : Site web statique sur S3', slug: 'stockage/s3-site-statique' },
            { label: 'TP : RDS MySQL Free Tier', slug: 'bases-de-donnees/rds-mysql' },
          ],
        },
        {
          label: 'FinOps & Conformité',
          items: [
            { label: 'TP : Estimation FinOps avec Infracost', slug: 'finops/infracost' },
          ],
        },
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
          ],
        },
      ],
      lastUpdated: true,
      components: {
        Head: './src/components/Head.astro',
        PageTitle: './src/components/PageTitle.astro',
        Footer: './src/components/Footer.astro',
      },
      customCss: ['./src/styles/custom.css'],
      head: [
        { tag: 'script', attrs: { src: '/reading-progress.js', defer: true } },
        { tag: 'script', attrs: { src: '/enhancements.js', defer: true } },
      ],
    }),
  ],
})
