import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'

export default defineConfig({
  integrations: [
    starlight({
      title: 'Formation AWS',
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'Français',
          lang: 'fr',
        },
      },
      sidebar: [
        {
          label: 'Sécurité du cloud',
          items: [
            { label: 'TP : Gestion des identités IAM', slug: 'securite-cloud/iam-free-tier' },
            { label: 'TP : Analyser les chemins IAM avec PMapper', slug: 'securite-cloud/tp-pmapper-iam' },
            { label: 'TP 2 : Escalade IAM contrôlée', slug: 'securite-cloud/tp2-escalade-iam-controlee' },
            { label: 'TP : Détection de secrets dans un dépôt Git', slug: 'securite-cloud/detection-secrets-git' },
            { label: 'TP : IaC sécurisée avec Terraform, Checkov et Trivy', slug: 'securite-cloud/terraform-checkov-trivy' },
          ],
        },
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
          label: 'Stockage & Serverless',
          items: [
            { label: "TP : Traitement d'images avec Lambda et S3", slug: 'stockage/s3-lambda' },
            { label: 'TP : Site web statique sur S3', slug: 'stockage/s3-site-statique' },
          ],
        },
        {
          label: 'Bases de données',
          items: [
            { label: 'TP : RDS MySQL Free Tier', slug: 'bases-de-donnees/rds-mysql' },
          ],
        },
        {
          label: 'Messaging',
          items: [
            { label: 'TP : SQS Free Tier', slug: 'messaging/sqs' },
          ],
        },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
  ],
})
