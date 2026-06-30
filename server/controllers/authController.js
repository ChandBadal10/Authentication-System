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
        const userId = req.userId;

        const user = await userModel.findById(userId);

        if(user.isAccountVerified) {
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
            to : user.email,
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
        const { otp} = req.body;
        const userId = req.userId;

        if(!userId || !otp) {
            return res.status(400).json({
                success: false,
                message: "Missing Details"
            })
        }

        const user = await userModel.findById(userId);

        if(!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            })
        }

        if(user.verifyOtp === '' || user.verifyOtp != otp) {
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

        user.isAccountVerified = true;
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



// Check if the user is authenticated


export const isAuthenticated = async (req, res) => {
    try{
        return res.json({
            success: true
        })
    } catch(error) {
        return res.status(500).json({
            success: false,
            message: "Something Went Wrong. Server Error"
        })
    }
}




// SEND PASSWORD RESET OTP

export const sendResetOtp = async(req, res) => {
    try{
        const {email} = req.body;

        if(!email) {
            return res.status(400).json({
                success: false,
                message: "Email is required"
            })
        }

        const user = await userModel.findOne({email});
        if(!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            })
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));

        user.resetOtp = otp;
        user.resetOtpExpiredAt = Date.now() + 15 * 60  * 1000;
        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Password Reset OTP",
            text: `Yout OTP for reseting your password is ${otp}. Use this OTP to proceed with reseting your password.`
        }

        await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: "OTP sent to you email"
        })
    } catch(error) {

    console.log(error);

    return res.status(500).json({
        success: false,
        message: error.message
    })
}
}


// Reset User Password


export const resetPassword = async (req, res) => {
    try{
        const {email, otp, newPassword} = req.body;

        if(!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                 message: "Email, OTP, and new password are required"
            });
        }

        const user = await userModel.findOne({email});

        if(!user) {
            return res.status(400).json({
                success: false,
                message: "User not found"
            })
        }

        if(user.resetOtp === "" || user.resetOtp !== otp) {
            return res.status(401).json({
                success: false,
                message: "Invalid otp"
            })
        }

        if(user.resetOtpExpiredAt < Date.now()) {
            return res.status(400).json({
                success: false,
                message: "OTP Expired"
            })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.resetOtp = "";
        user.resetOtpExpiredAt = 0;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password has been reset Successfully"
        });

    } catch(error) {
        return res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
}