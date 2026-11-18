import express from "express";
import {
    createProduct,
    deleteProduct,
    getProduct,
    getProducts,
    updateProduct
} from "../controllers/product.controller.js";
import { authenticateToken, authorizeRoles } from "../middlewares/auth.middleware.js";

const router = express.Router();
const canReadProducts = authorizeRoles("admin", "warehouseManager", "supplier", "salesRepresentative");

router.use(authenticateToken);
router.get("/", canReadProducts, getProducts);
router.get("/:id", canReadProducts, getProduct);
router.post("/", authorizeRoles("admin", "warehouseManager"), createProduct);
router.put("/:id", authorizeRoles("admin", "warehouseManager"), updateProduct);
router.delete("/:id", authorizeRoles("admin"), deleteProduct);

export default router;
