import inquirer from "inquirer";
import { ProviderType, AnyProviderConfig } from "../providers/types";

const PROVIDERS = [
    { name: "AWS S3", value: "s3" },
    { name: "Cloudflare R2", value: "r2" },
    { name: "Google Cloud Storage (GCS)", value: "gcs" },
    { name: "Azure Blob Storage", value: "azure" },
    { name: "Oracle Cloud (OCI)", value: "oracle" },
    { name: "Backblaze B2", value: "backblaze" },
    { name: "Wasabi", value: "wasabi" },
    { name: "DigitalOcean Spaces", value: "digitalocean" },
    { name: "MinIO", value: "minio" },
    { name: "Linode Object Storage", value: "linode" },
];

async function promptS3Compatible(
    type: ProviderType,
    label: string
): Promise<AnyProviderConfig> {
    const endpointRequired = ["r2", "minio", "backblaze", "wasabi", "digitalocean", "linode"].includes(type);
    
    // Nomenclaturas específicas para não confundir o usuário
    let bucketTerm = "bucket";
    if (type === "digitalocean") bucketTerm = "Space (nome do bucket)";
    else if (type === "r2") bucketTerm = "bucket R2";
    else if (type === "minio") bucketTerm = "bucket MinIO";

    const answers = await inquirer.prompt([
        {
            type: "input",
            name: "bucket",
            message: `[${label}] Nome do ${bucketTerm}:`,
            validate: (v: string) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "region",
            message: `[${label}] Região (ex: us-east-1):`,
            default: "us-east-1",
            // R2, MinIO e Backblaze não exigem preenchimento manual de região na maioria dos casos
            when: () => !["r2", "minio", "backblaze"].includes(type),
        },
        ...(endpointRequired
            ? [
                {
                    type: "input",
                    name: "endpoint",
                    message: `[${label}] Endpoint URL completo (fornecido pelo provedor):`,
                    validate: (v: string) => (v ? true : "Obrigatório"),
                },
            ]
            : []),
        {
            type: "input",
            name: "accessKeyId",
            message: `[${label}] Access Key ID:`,
            validate: (v: string) => (v ? true : "Obrigatório"),
        },
        {
            type: "password",
            name: "secretAccessKey",
            message: `[${label}] Secret Access Key:`,
            mask: "*",
            validate: (v: string) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "prefix",
            message: `[${label}] Prefixo/pasta (opcional, Enter para raiz):`,
            default: "",
        },
    ]);

    // Garante que a região não fique vazia nos provedores que pularam a pergunta
    if (!answers.region) answers.region = "auto";

    return { type, label, ...answers } as AnyProviderConfig;
}

async function promptGCS(label: string): Promise<AnyProviderConfig> {
    const answers = await inquirer.prompt([
        {
            type: "input",
            name: "bucket",
            message: `[${label}] Nome do bucket GCS:`,
            validate: (v: string) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "projectId",
            message: `[${label}] Project ID:`,
            validate: (v: string) => (v ? true : "Obrigatório"),
        },
        {
            type: "list",
            name: "authType",
            message: `[${label}] Método de autenticação:`,
            choices: [
                { name: "Caminho do arquivo de credenciais JSON", value: "file" },
                { name: "Colar o JSON das credenciais", value: "json" },
            ],
        },
        {
            type: "input",
            name: "keyFilePath",
            message: `[${label}] Caminho para o arquivo JSON:`,
            when: (a: Record<string, string>) => a.authType === "file",
        },
        {
            type: "editor",
            name: "keyFileJson",
            message: `[${label}] Cole o JSON das credenciais:`,
            when: (a: Record<string, string>) => a.authType === "json",
        },
        {
            type: "input",
            name: "prefix",
            message: `[${label}] Prefixo/pasta (opcional):`,
            default: "",
        },
    ]);

    return { type: "gcs", label, ...answers } as AnyProviderConfig;
}

async function promptAzure(label: string): Promise<AnyProviderConfig> {
    const answers = await inquirer.prompt([
        {
            type: "input",
            name: "bucket",
            message: `[${label}] Nome do container:`,
            validate: (v: string) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "accountName",
            message: `[${label}] Storage Account Name:`,
            validate: (v: string) => (v ? true : "Obrigatório"),
        },
        {
            type: "list",
            name: "authType",
            message: `[${label}] Método de autenticação:`,
            choices: [
                { name: "Account Key", value: "key" },
                { name: "SAS Token", value: "sas" },
                { name: "Connection String", value: "conn" },
            ],
        },
        {
            type: "password",
            name: "accountKey",
            message: `[${label}] Account Key:`,
            mask: "*",
            when: (a: Record<string, string>) => a.authType === "key",
        },
        {
            type: "input",
            name: "sasToken",
            message: `[${label}] SAS Token:`,
            when: (a: Record<string, string>) => a.authType === "sas",
        },
        {
            type: "input",
            name: "connectionString",
            message: `[${label}] Connection String:`,
            when: (a: Record<string, string>) => a.authType === "conn",
        },
        {
            type: "input",
            name: "prefix",
            message: `[${label}] Prefixo/pasta (opcional):`,
            default: "",
        },
    ]);

    return { type: "azure", label, ...answers } as AnyProviderConfig;
}

async function promptOracle(label: string): Promise<AnyProviderConfig> {
    const answers = await inquirer.prompt([
        {
            type: "input",
            name: "bucket",
            message: `[${label}] Nome do bucket OCI:`,
            validate: (v: string) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "namespace",
            message: `[${label}] Namespace (Object Storage):`,
            validate: (v: string) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "region",
            message: `[${label}] Região (ex: sa-saopaulo-1):`,
            validate: (v: string) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "tenancyId",
            message: `[${label}] Tenancy OCID:`,
            validate: (v: string) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "userId",
            message: `[${label}] User OCID:`,
            validate: (v: string) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "fingerprint",
            message: `[${label}] Fingerprint da chave API:`,
            validate: (v: string) => (v ? true : "Obrigatório"),
        },
        {
            type: "editor",
            name: "privateKey",
            message: `[${label}] Cole sua chave privada PEM:`,
            validate: (v: string) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "prefix",
            message: `[${label}] Prefixo/pasta (opcional):`,
            default: "",
        },
    ]);

    return { type: "oracle", label, ...answers } as AnyProviderConfig;
}

export async function promptProvider(
    role: "Origem" | "Destino"
): Promise<AnyProviderConfig> {
    const { providerType } = await inquirer.prompt([
        {
            type: "list",
            name: "providerType",
            message: `Selecione o provedor de ${role}:`,
            choices: PROVIDERS,
            pageSize: 12,
        },
    ]);

    const label = `${role} - ${PROVIDERS.find((p) => p.value === providerType)?.name}`;

    switch (providerType as ProviderType) {
        case "gcs":
            return promptGCS(label);
        case "azure":
            return promptAzure(label);
        case "oracle":
            return promptOracle(label);
        default:
            return promptS3Compatible(providerType, label);
    }
}

export async function promptMigrationOptions() {
    return inquirer.prompt([
        {
            type: "confirm",
            name: "skipExisting",
            message: "Ignorar arquivos que já existem no destino (mesmo tamanho)?",
            default: true,
        },
        {
            type: "confirm",
            name: "dryRun",
            message: "Modo DRY RUN? (apenas lista, não transfere nada)",
            default: false,
        },
        {
            type: "list",
            name: "concurrency",
            message: "Quantos uploads paralelos?",
            choices: [
                { name: "1 (seguro/lento)", value: 1 },
                { name: "4 (recomendado)", value: 4 },
                { name: "8 (rápido)", value: 8 },
                { name: "16 (agressivo)", value: 16 },
            ],
            default: 1,
        },
        {
            type: "confirm",
            name: "confirm",
            message: "Confirmar e iniciar migração?",
            default: false,
        },
    ]);
}