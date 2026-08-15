
booking-infra/
├── bootstrap/                    
│   ├── main.tf                   # S3 bucket + DynamoDB lock
│   └── terraform.tf
│
├── modules/
│   ├── networking/               
│   │   ├── main.tf               # VPC, subnets, IGW, NAT, SGs
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── eks/                      
│   │   ├── main.tf               # EKS cluster, node groups, IRSA
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── postgres/                 
│   │   ├── main.tf               # RDS PostgreSQL, parameter group, SG
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── pgbouncer/                
│   │   ├── main.tf               # PgBouncer K8s sidecar config + secret
│   │   ├── userlist.tf           # SCRAM-SHA-256 userlist.txt generation
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── redis/                    
│   │   ├── main.tf               # ElastiCache Redis with Sentinel
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── rabbitmq/                 
│   │   ├── main.tf               # Amazon MQ RabbitMQ broker
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── elasticsearch/            
│   │   ├── main.tf               # OpenSearch domain, index policy
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   ├── secrets/                  
│   │   ├── main.tf               # AWS Secrets Manager, all app secrets
│   │   ├── variables.tf
│   │   └── outputs.tf
│   │
│   └── ecr/                      
│       ├── main.tf               # ECR repos per service
│       ├── variables.tf
│       └── outputs.tf
│
├── k8s/
│   ├── backend/                  0
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   └── configmap.yaml
│   │
│   ├── workers/                  1
│   │   ├── audit-worker/
│   │   │   ├── deployment.yaml
│   │   │   └── hpa.yaml
│   │   ├── campaign-worker/
│   │   │   ├── deployment.yaml
│   │   │   └── hpa.yaml          # KEDA RabbitMQ queue depth
│   │   ├── csv-room-import-worker/
│   │   │   ├── deployment.yaml
│   │   │   └── hpa.yaml          # KEDA queue depth
│   │   ├── availability-worker/
│   │   │   └── deployment.yaml
│   │   ├── booking-expiry-worker/
│   │   │   └── deployment.yaml
│   │   └── seller-notification-worker/
│   │       └── deployment.yaml

    ├── monitoring/                    # Phase 11b
│   ├── namespace.yaml
│   ├── prometheus/
│   │   ├── values.yaml            # kube-prometheus-stack Helm values
│   │   └── prometheusrule.yaml    # Booking platform alert rules
│   ├── grafana/
│   │   ├── datasources.yaml       # Prometheus + Loki datasources
│   │   └── dashboards/
│   │       ├── cluster-overview.yaml    # What you see in the photo
│   │       ├── booking-api.yaml         # Request rate, latency, errors
│   │       ├── workers.yaml             # Queue depth, processing rate
│   │       └── postgres.yaml            # Connection pool, query time
│   ├── loki/
│   │   ├── values.yaml            # Loki stack Helm values
│   │   └── promtail.yaml          # DaemonSet scraping all pod logs
│   └── alerts/
│       ├── booking-api.yaml       # 5xx rate, p99 latency
│       ├── workers.yaml           # Queue depth, consumer lag
│       ├── postgres.yaml          # Connection pool exhaustion
│       └── redis.yaml             # Memory usage, evictions
│
│   ── ingress/                  2
│       ├── ingress.yaml          # AWS ALB ingress
│       └── cert.yaml             # ACM cert
│
├── envs/
│   ├── dev/                      3
│   │   ├── main.tf               # Composes all modules, dev sizing
│   │   ├── terraform.tf          # Backend config
│   │   └── terraform.tfvars
│   │
│   ├── staging/
│   │   ├── main.tf
│   │   ├── terraform.tf
│   │   └── terraform.tfvars
│   │
│   └── prod/
│       ├── main.tf
│       ├── terraform.tf
│       └── terraform.tfvars
│
└── .github/
    └── workflows/
        ├── terraform-plan.yml    4 - PR check
        └── terraform-apply.yml   4 - merge to main