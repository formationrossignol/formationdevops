import { withMermaid } from 'vitepress-plugin-mermaid'

export default withMermaid({
  title: 'VitePress Cloud',
  description: 'Documentation site',
  appearance: 'dark',

  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Sécurité du cloud', link: '/securite-cloud/tp2-escalade-iam-controlee' },
      { text: 'Infrastructure', link: '/infrastructure/vpc-terraform' },
      { text: 'Compute', link: '/compute/instance-ec2' }
    ],
    sidebar: [
      {
        text: 'Sécurité du cloud',
        items: [
          { text: 'TP : Gestion des identités IAM', link: '/securite-cloud/iam-free-tier' },
          { text: 'TP : Analyser les chemins IAM avec PMapper', link: '/securite-cloud/tp-pmapper-iam' },
          { text: 'TP 2 : Escalade IAM contrôlée', link: '/securite-cloud/tp2-escalade-iam-controlee' },
          { text: 'TP : Détection de secrets dans un dépôt Git', link: '/securite-cloud/detection-secrets-git' },
          { text: 'TP : IaC sécurisée avec Terraform, Checkov et Trivy', link: '/securite-cloud/terraform-checkov-trivy' }
        ]
      },
      {
        text: 'Infrastructure',
        items: [
          { text: '[TP] Créer un VPC avec Terraform', link: '/infrastructure/vpc-terraform' },
          { text: 'TP : Infrastructure as Code avec CloudFormation', link: '/infrastructure/cloudformation' },
          { text: 'TP : Créer des AMI avec Packer', link: '/infrastructure/packer' }
        ]
      },
      {
        text: 'Compute',
        items: [
          { text: 'TP : Lancer une instance EC2', link: '/compute/instance-ec2' },
          { text: 'TP : Automatiser EC2 avec User Data', link: '/compute/ec2-user-data' }
        ]
      },
      {
        text: 'Containers',
        items: [
          { text: 'TP : Registry Docker privé avec ECR', link: '/containers/ecr' }
        ]
      },
      {
        text: 'Stockage & Serverless',
        items: [
          { text: 'TP : Traitement d\'images avec Lambda et S3', link: '/stockage/s3-lambda' },
          { text: 'TP : Site web statique sur S3', link: '/stockage/s3-site-statique' }
        ]
      },
      {
        text: 'Bases de données',
        items: [
          { text: 'TP : RDS MySQL Free Tier', link: '/bases-de-donnees/rds-mysql' }
        ]
      },
      {
        text: 'Messaging',
        items: [
          { text: 'TP : SQS Free Tier', link: '/messaging/sqs' }
        ]
      }
    ],
    socialLinks: []
  },

  mermaid: {
    theme: 'dark',
    themeVariables: {
      primaryColor: '#1e3a5f',
      primaryTextColor: '#e0e0e0',
      primaryBorderColor: '#4a9eed',
      lineColor: '#4a9eed',
      secondaryColor: '#2d4a3e',
      tertiaryColor: '#2d2d3d',
      background: '#1a1a2e',
      mainBkg: '#1e3a5f',
      nodeBorder: '#4a9eed',
      clusterBkg: '#16213e',
      titleColor: '#e0e0e0',
      edgeLabelBackground: '#1a1a2e'
    }
  }
})
