import userModel from "../models/userModel.js";


export const getUserData = async (req, res) => {
    try{
        const userId = req.userId;
        const user = await userModel.findById(userId);

        if(!user) {
            return res.status(400).json({
                succcess: false,
                message: "User not found"
            })
        }

        return res.json({
            success: true,
            userData: {
                name: user.name,
                email: user.email,
                isAccountVerified: user.isAccountVerified
            }
        })

    } catch(error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
}