import ImageKit from "@imagekit/nodejs";
import { createHttpError } from "./errors.js";

let client;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageSize = 2 * 1024 * 1024;

export function getImageKitClient() {
    if (!client) {
        const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
        if (!privateKey) {
            throw new Error("IMAGEKIT_PRIVATE_KEY must be configured.");
        }
        client = new ImageKit({ privateKey });
    }
    return client;
}

export async function deleteImage(fileId) {
    if (typeof fileId !== "string" || !fileId.trim()) {
        return;
    }

    try {
        await getImageKitClient().files.delete(fileId);
    } catch {
        return;
    }
}

export async function verifyImage(fileId, url) {
    const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
    if (!urlEndpoint) {
        throw new Error("IMAGEKIT_URL_ENDPOINT must be configured.");
    }
    const endpoint = urlEndpoint.replace(/\/+$/, "");
    const validUrl = typeof url === "string" && (url === endpoint || url.startsWith(`${endpoint}/`));
    if (typeof fileId !== "string" || !fileId.trim() || !validUrl) {
        throw createHttpError(400, "A valid ImageKit file ID and URL are required.");
    }

    const imageKit = getImageKitClient();
    let file;
    try {
        file = await imageKit.files.get(fileId);
    } catch {
        throw createHttpError(400, "The ImageKit image could not be verified.");
    }
    if (!allowedMimeTypes.has(file.mime) || !Number.isFinite(file.size) || file.size > maxImageSize) {
        throw createHttpError(400, "Image must be a JPEG, PNG, or WebP no larger than 2 MB.");
    }
}
