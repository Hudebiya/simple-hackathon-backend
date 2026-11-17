import jwt from "jsonwebtoken";

export function authenticateToken(req,res,next){
    const authorization = req.get("Authorization");
    const bearerToken = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
    const token = bearerToken || req.cookies?.token;

    if(!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try{
        req.user = jwt.verify(token, process.env.JWT_SECRET_KEY)
        next()
    }catch(err){
        res.status(401).json({
            message:"Invalid Token",
            err: err.message
        })
    }

}
export function requireAdmin(req,res,next){
    if( req.user.role !== "admin"){
        return res.status(403).json({
            message:"Forbidden"
        })
    }
    next()
}