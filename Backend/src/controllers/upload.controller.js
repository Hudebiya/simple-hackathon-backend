import { getImageKitClient } from "../utils/imagekit.js";

export async function getUploadAuthentication(req, res) {
    try {
        const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
        const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
        if (!publicKey || !urlEndpoint) {
            return res.status(500).json({ message: "ImageKit upload settings are not configured." });
        }

        const auth = getImageKitClient().helper.getAuthenticationParameters();
        return res.status(200).json({
            ...auth,
            publicKey,
            urlEndpoint
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Unable to generate upload authentication parameters." });
    }
}
