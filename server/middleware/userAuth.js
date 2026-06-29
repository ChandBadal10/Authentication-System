import jwt from "jsonwebtoken";



export const userAuth = async (req, res, next) => {
    try{
        const {token} = req.cookies;

        if(!token) {
            return res.status(401).json({
                success: false,
                message: "Not Authorized. Login Again"
            })
        }

        const tokenDecode = jwt.verify(token, process.env.JWT_SECRET);

        if(tokenDecode.id) {
            req.userId = tokenDecode.id;
        } else {
            return res.status(401).json({
                success: false,
                message: "Not Authorized. Login Again"
            })
        }
        next();

    } catch(error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}