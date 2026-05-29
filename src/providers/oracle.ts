import { StorageProvider, StorageObject, OracleConfig } from "./types";
import { Readable } from "stream";
import https from "https";
import crypto from "crypto";

// Oracle Cloud usa assinatura HTTP própria (OCI Signing)
// Implementação usando fetch com assinatura manual

function signRequest(
    method: string,
    url: string,
    headers: Record<string, string>,
    config: OracleConfig
): Record<string, string> {
    const urlObj = new URL(url);
    const date = new Date().toUTCString();
    headers["date"] = date;
    headers["host"] = urlObj.hostname;

    const headersToSign = ["date", "host", "(request-target)"];
    const requestTarget = `${method.toLowerCase()} ${urlObj.pathname}${urlObj.search}`;

    const signingString = [
        `(request-target): ${requestTarget}`,
        `host: ${urlObj.hostname}`,
        `date: ${date}`,
    ].join("\n");

    const privateKey = crypto.createPrivateKey(config.privateKey);
    const sign = crypto.createSign("SHA256");
    sign.update(signingString);
    const signature = sign.sign(privateKey, "base64");

    const keyId = `${config.tenancyId}/${config.userId}/${config.fingerprint}`;
    headers["Authorization"] =
        `Signature version="1",keyId="${keyId}",algorithm="rsa-sha256",` +
        `headers="${headersToSign.join(" ")}",signature="${signature}"`;

    return headers;
}

export class OracleProvider implements StorageProvider {
    private config: OracleConfig;
    private baseUrl: string;

    constructor(config: OracleConfig) {
        this.config = config;
        this.baseUrl = `https://objectstorage.${config.region}.oraclecloud.com/n/${config.namespace}/b/${config.bucket}/o`;
    }

    private async ociRequest(
        method: string,
        url: string,
        body?: Buffer
    ): Promise<{ status: number; body: string | Buffer; headers: Record<string, string> }> {
        const urlObj = new URL(url);
        const headers: Record<string, string> = {};
        if (body) {
            headers["content-length"] = String(body.length);
            headers["content-type"] = "application/octet-stream";
        }
        const signedHeaders = signRequest(method, url, headers, this.config);

        return new Promise((resolve, reject) => {
            const req = https.request(
                {
                    hostname: urlObj.hostname,
                    path: `${urlObj.pathname}${urlObj.search}`,
                    method,
                    headers: signedHeaders,
                },
                (res) => {
                    const chunks: Buffer[] = [];
                    res.on("data", (c) => chunks.push(c));
                    res.on("end", () => {
                        resolve({
                            status: res.statusCode || 0,
                            body: Buffer.concat(chunks),
                            headers: res.headers as Record<string, string>,
                        });
                    });
                }
            );
            req.on("error", reject);
            if (body) req.write(body);
            req.end();
        });
    }

    async listObjects(prefix?: string): Promise<StorageObject[]> {
        const objects: StorageObject[] = [];
        let nextStart: string | undefined;

        do {
            let url = `${this.baseUrl}?limit=1000`;
            if (prefix ?? this.config.prefix) url += `&prefix=${encodeURIComponent(prefix ?? this.config.prefix ?? "")}`;
            if (nextStart) url += `&start=${encodeURIComponent(nextStart)}`;

            const res = await this.ociRequest("GET", url);
            const data = JSON.parse(res.body.toString());

            for (const item of data.objects || []) {
                objects.push({ key: item.name, size: item.size || 0 });
            }

            nextStart = data.nextStartWith;
        } while (nextStart);

        return objects;
    }

    async getObject(key: string): Promise<NodeJS.ReadableStream> {
        const url = `${this.baseUrl}/${encodeURIComponent(key)}`;
        const res = await this.ociRequest("GET", url);
        return Readable.from(res.body as Buffer);
    }

    async putObject(
        key: string,
        stream: NodeJS.ReadableStream,
        _size?: number,
        contentType?: string
    ): Promise<void> {
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const body = Buffer.concat(chunks);
        const url = `${this.baseUrl}/${encodeURIComponent(key)}`;
        await this.ociRequest("PUT", url, body);
    }

    async headObject(
        key: string
    ): Promise<{ size: number; contentType?: string } | null> {
        try {
            const url = `${this.baseUrl}/${encodeURIComponent(key)}`;
            const res = await this.ociRequest("HEAD", url);
            if (res.status === 200) {
                return {
                    size: parseInt(res.headers["content-length"] || "0"),
                    contentType: res.headers["content-type"],
                };
            }
            return null;
        } catch {
            return null;
        }
    }
}