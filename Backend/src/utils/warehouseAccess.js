export function canAccessWarehouse(user, warehouseId) {
    if (user?.role === "admin") {
        return true;
    }
    if (user?.role !== "warehouseManager" || !warehouseId) {
        return false;
    }

    const requestedId = warehouseId.toString();
    return user.assignedWarehouses?.some(id => id.toString() === requestedId) ?? false;
}
