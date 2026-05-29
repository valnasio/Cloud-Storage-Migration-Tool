"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptProvider = promptProvider;
exports.promptMigrationOptions = promptMigrationOptions;
const inquirer_1 = __importDefault(require("inquirer"));
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
async function promptS3Compatible(type, label) {
    const endpointRequired = ["r2", "minio", "backblaze", "wasabi", "digitalocean", "linode"].includes(type);
    const answers = await inquirer_1.default.prompt([
        {
            type: "input",
            name: "bucket",
            message: `[${label}] Nome do bucket:`,
            validate: (v) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "region",
            message: `[${label}] Região (ex: us-east-1, auto):`,
            default: type === "r2" ? "auto" : "us-east-1",
        },
        ...(endpointRequired
            ? [
                {
                    type: "input",
                    name: "endpoint",
                    message: `[${label}] Endpoint S3 completo (ex: https://xxxx.r2.cloudflarestorage.com):`,
                    validate: (v) => (v ? true : "Obrigatório"),
                },
            ]
            : []),
        {
            type: "input",
            name: "accessKeyId",
            message: `[${label}] Access Key ID:`,
            validate: (v) => (v ? true : "Obrigatório"),
        },
        {
            type: "password",
            name: "secretAccessKey",
            message: `[${label}] Secret Access Key:`,
            mask: "*",
            validate: (v) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "prefix",
            message: `[${label}] Prefixo/pasta (opcional, Enter para raiz):`,
            default: "",
        },
    ]);
    return { type, label, ...answers };
}
async function promptGCS(label) {
    const answers = await inquirer_1.default.prompt([
        {
            type: "input",
            name: "bucket",
            message: `[${label}] Nome do bucket GCS:`,
            validate: (v) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "projectId",
            message: `[${label}] Project ID:`,
            validate: (v) => (v ? true : "Obrigatório"),
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
            when: (a) => a.authType === "file",
        },
        {
            type: "editor",
            name: "keyFileJson",
            message: `[${label}] Cole o JSON das credenciais:`,
            when: (a) => a.authType === "json",
        },
        {
            type: "input",
            name: "prefix",
            message: `[${label}] Prefixo/pasta (opcional):`,
            default: "",
        },
    ]);
    return { type: "gcs", label, ...answers };
}
async function promptAzure(label) {
    const answers = await inquirer_1.default.prompt([
        {
            type: "input",
            name: "bucket",
            message: `[${label}] Nome do container:`,
            validate: (v) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "accountName",
            message: `[${label}] Storage Account Name:`,
            validate: (v) => (v ? true : "Obrigatório"),
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
            when: (a) => a.authType === "key",
        },
        {
            type: "input",
            name: "sasToken",
            message: `[${label}] SAS Token:`,
            when: (a) => a.authType === "sas",
        },
        {
            type: "input",
            name: "connectionString",
            message: `[${label}] Connection String:`,
            when: (a) => a.authType === "conn",
        },
        {
            type: "input",
            name: "prefix",
            message: `[${label}] Prefixo/pasta (opcional):`,
            default: "",
        },
    ]);
    return { type: "azure", label, ...answers };
}
async function promptOracle(label) {
    const answers = await inquirer_1.default.prompt([
        {
            type: "input",
            name: "bucket",
            message: `[${label}] Nome do bucket OCI:`,
            validate: (v) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "namespace",
            message: `[${label}] Namespace (Object Storage):`,
            validate: (v) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "region",
            message: `[${label}] Região (ex: sa-saopaulo-1):`,
            validate: (v) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "tenancyId",
            message: `[${label}] Tenancy OCID:`,
            validate: (v) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "userId",
            message: `[${label}] User OCID:`,
            validate: (v) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "fingerprint",
            message: `[${label}] Fingerprint da chave API:`,
            validate: (v) => (v ? true : "Obrigatório"),
        },
        {
            type: "editor",
            name: "privateKey",
            message: `[${label}] Cole sua chave privada PEM:`,
            validate: (v) => (v ? true : "Obrigatório"),
        },
        {
            type: "input",
            name: "prefix",
            message: `[${label}] Prefixo/pasta (opcional):`,
            default: "",
        },
    ]);
    return { type: "oracle", label, ...answers };
}
async function promptProvider(role) {
    const { providerType } = await inquirer_1.default.prompt([
        {
            type: "list",
            name: "providerType",
            message: `Selecione o provedor de ${role}:`,
            choices: PROVIDERS,
            pageSize: 12,
        },
    ]);
    const label = `${role} - ${PROVIDERS.find((p) => p.value === providerType)?.name}`;
    switch (providerType) {
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
async function promptMigrationOptions() {
    return inquirer_1.default.prompt([
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
//# sourceMappingURL=prompts.js.map