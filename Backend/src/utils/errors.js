import mongoose from "mongoose";

export function createHttpError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

export function sendControllerError(res, error, fallbackMessage) {
    if (Number.isInteger(error.status) && error.status >= 400 && error.status < 500) {
        return res.status(error.status).json({ message: error.message });
    }
    if (error.code === 11000) {
        return res.status(409).json({ message: "A record with these details already exists." });
    }
    if (error instanceof mongoose.Error.ValidationError || error instanceof mongoose.Error.CastError) {
        return res.status(400).json({ message: "Request contains invalid data." });
    }

    console.error(error);
    return res.status(500).json({ message: fallbackMessage });
}
