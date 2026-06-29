import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";



// REGISTER USER

export const register = async (req, res) => {
    try{
        const {name, email, password} = req.body;

        if(!name || !email || !password) {
            return res.json({
                success: false,
                message: "Missing details"
            })
        }

        const existingUser = await userModel.findOne({email});

        if(existingUser) {
            return res.json({
                success: false,
                message: "User Already Exist"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new userModel({
            name,
            email,
            password: hashedPassword
        })

        await user.save();

        const token = jwt.sign({id: user_id}, process.env.JWT_SECRET, {expiresIn: '7d'});

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7*24*60*60*1000
        });

        return res.json({
            success: true,
            message: "Registeration Successfully"
        })

    } catch(error) {
        res.json({
            success: false,
            message: error.message

        })
    }
}

// LOGIN USER


export const login = async (req, res) => {
    try{
        const {email, password} = req.body;

        if(!email || !password) {
            return res.json({
                success: false,
                message: "Email and Password are required!"
            })
        }

        const user = await userModel.findOne({email});

        if(!user) {
            return res.json({
                success: false,
                message: "Invalid email"
            })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return res.json({
                success: false,
                message: "Invalid Password"
            })
        }

        const token = jwt.sign({id: user_id}, process.env.JWT_SECRET, {expiresIn: '7d'});

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7*24*60*60*1000
        });

        return res.json({
            success: true,
            message: "Login Successfully"
        })


    } catch(error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong"
        })
    }
}


// LOGOUT USER

export const logout = async (req, res) => {
    try{
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })

        return res.json({
            success: true,
            message: "Logged Out"
        })

    } catch(error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong, Server error"
        })
    }
}