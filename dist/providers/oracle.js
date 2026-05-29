"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OracleProvider = void 0;
const stream_1 = require("stream");
const https_1 = __importDefault(require("https"));
const crypto_1 = __importDefault(require("crypto"));
// Oracle Cloud usa assinatura HTTP própria (OCI Signing)
// Implementação usando fetch com assinatura manual
function signRequest(method, url, headers, config) {
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
    const privateKey = crypto_1.default.createPrivateKey(config.privateKey);
    const sign = crypto_1.default.createSign("SHA256");
    sign.update(signingString);
    const signature = sign.sign(privateKey, "base64");
    const keyId = `${config.tenancyId}/${config.userId}/${config.fingerprint}`;
    headers["Authorization"] =
        `Signature version="1",keyId="${keyId}",algorithm="rsa-sha256",` +
            `headers="${headersToSign.join(" ")}",signature="${signature}"`;
    return headers;
}
class OracleProvider {
    constructor(config) {
        this.config = config;
        this.baseUrl = `https://objectstorage.${config.region}.oraclecloud.com/n/${config.namespace}/b/${config.bucket}/o`;
    }
    async ociRequest(method, url, body) {
        const urlObj = new URL(url);
        const headers = {};
        if (body) {
            headers["content-length"] = String(body.length);
            headers["content-type"] = "application/octet-stream";
        }
        const signedHeaders = signRequest(method, url, headers, this.config);
        return new Promise((resolve, reject) => {
            const req = https_1.default.request({
                hostname: urlObj.hostname,
                path: `${urlObj.pathname}${urlObj.search}`,
                method,
                headers: signedHeaders,
            }, (res) => {
                const chunks = [];
                res.on("data", (c) => chunks.push(c));
                res.on("end", () => {
                    resolve({
                        status: res.statusCode || 0,
                        body: Buffer.concat(chunks),
                        headers: res.headers,
                    });
                });
            });
            req.on("error", reject);
            if (body)
                req.write(body);
            req.end();
        });
    }
    async listObjects(prefix) {
        const objects = [];
        let nextStart;
        do {
            let url = `${this.baseUrl}?limit=1000`;
            if (prefix ?? this.config.prefix)
                url += `&prefix=${encodeURIComponent(prefix ?? this.config.prefix ?? "")}`;
            if (nextStart)
                url += `&start=${encodeURIComponent(nextStart)}`;
            const res = await this.ociRequest("GET", url);
            const data = JSON.parse(res.body.toString());
            for (const item of data.objects || []) {
                objects.push({ key: item.name, size: item.size || 0 });
            }
            nextStart = data.nextStartWith;
        } while (nextStart);
        return objects;
    }
    async getObject(key) {
        const url = `${this.baseUrl}/${encodeURIComponent(key)}`;
        const res = await this.ociRequest("GET", url);
        return stream_1.Readable.from(res.body);
    }
    async putObject(key, stream, _size, contentType) {
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const body = Buffer.concat(chunks);
        const url = `${this.baseUrl}/${encodeURIComponent(key)}`;
        await this.ociRequest("PUT", url, body);
    }
    async headObject(key) {
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
        }
        catch {
            return null;
        }
    }
}
exports.OracleProvider = OracleProvider;
//# sourceMappingURL=oracle.js.map