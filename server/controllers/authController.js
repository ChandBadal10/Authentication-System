import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../config/nodemailer.js";



// REGISTER USER

export const register = async (req, res) => {
    try{
        const {name, email, password} = req.body;

        if(!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Missing details"
            })
        }

        const existingUser = await userModel.findOne({email});

        if(existingUser) {
            return res.status(404).json({
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

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7*24*60*60*1000
        });

        // sending welcom email

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: email,
            subject: "Welcome to MERN AUTH",
            text: `Welcome to MERN_AUTH website. Your account has been creatd with the email id: ${email}`
        }

        await transporter.sendMail(mailOptions);

        return res.status(201).json({
            success: true,
            message: "Registeration Successfully"
        })

    } catch(error) {
        return res.status(500).json({
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
            return res.status(404).json({
                success: false,
                message: "Email and Password are required!"
            })
        }

        const user = await userModel.findOne({email});

        if(!user) {
            return res.status(404).json({
                success: false,
                message: "Invalid email"
            })
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return res.status(404).json({
                success: false,
                message: "Invalid Password"
            })
        }

        const token = jwt.sign({id: user._id}, process.env.JWT_SECRET, {expiresIn: '7d'});

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge: 7*24*60*60*1000
        });

        return res.status(201).json({
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

        return res.status(200).json({
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



// Send verification opt to the users email


export const sendVerifyOtp = async(req, res) => {
    try {
        const {userId} = req.body;

        const user = await userModel.findById(userId);

        if(user.isAccountVerfied) {
            return res.json({
                success: false,
                message: "Account already verified"
            })
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000))

        user.verifyOtp = otp;
        user.verifyOtpExpiredAt = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();

        const mailOptions = {
            from : process.env.SENDER_EMAIL,
            to : email,
            subject: "Account Verification OTP",
            text: `Your OTP is ${otp}. Verify your account using this OTP.`
        }

        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: "Verification OTP Sent on Email."
        })
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
}


// Verify email by otp

export const verifyEmail = async (req, res) => {
    try{
        const {userId, otp} = req.body;

        if(!userId || !otp) {
            return res.status(400).json({
                success: false,
                message: "Missing Details"
            })
        }

        const user = await userModel.findById(userId);

        if(!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            })
        }

        if(user.verifyOtp = '' || user.verifyOtp != otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            })
        }

        if(user.verifyOtpExpiredAt < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "OTP Expired"
            })
        }

        user.isAccountVerfied = true;
        user.verifyOtp = '';
        user.verifyOtpExpiredAt = 0;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Email Verified successfully"
        })



    } catch(error) {
        return res.status(500).json({
            success: false,
            message: "Something went wrong, Server Error.."
        })
    }
}



