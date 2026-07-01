import userModel from "../models/userModel.js";


export const getUserData = async (req, res) => {
    try{
        const userId = req.body;
        const user = await userModel.findById({userId});

        if(!user) {
            return res.status(400).json({
                succcess: false,
                message: "User not found"
            })
        }

        res.json({
            succcess: true,
            userData: {
                name: user.name,
                isAccountVerified: user.isAccountVerified
            }
        })

    } catch(error) {
        return res.status(500).json({
            succcess: false,
            message: "Server Error"
        })
    }
}