import User from "../model/User.model.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const registerUser = async (req, res) => {
  //  get data
  // validate
  // check if user already exists
  // create a user in db
  // oke generate for verification
  // save token in db
  // send token in email
  // send success token

  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User Already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    console.log(user);

    if (!user) {
      return res.status(400).json({
        message: "user not registered",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    console.log("verification token", token);
    user.verificationToken = token;
    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: 587,
      secure: false, // true for port 465, false for other ports
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.MAILTRAP_SENDEREMAIL,
      to: user.email, // list of receivers
      subject: "Verify your email", // Subject line
      text: `Please click on the link: ${process.env.BASE_URL}/api/v1/users/verify/${token}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({
      message: "user registered succesfully",
      success: true,
    });
  } catch (error) {
    res.status(400).json({
      message: "user registration failed",
      success: false,
      error,
    });
  }
};

const verifyUser = async (req, res) => {
  // get token from url
  // Validate token
  // find user based on token
  // if not
  // set is verified to true
  // remove verification token
  // save
  // return status

  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      message: "User Not Found",
    });
  }
  const user = await User.findOne({ verificationToken: token });

  if (!user) {
    return res.status(400).json({
      message: "Invalid Token",
    });
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log(isMatch);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }
    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "24h",
      }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 1000,
    };
    res.cookie("token", jwtToken, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "login succesfull",
      jwtToken,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({
      message: "login failed",
      success: false,
      error,
    });
  }
};

const profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "User Not Found",
      error,
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    res.cookie("token", "", {});
    res.status(200).json({
      success: true,
      message: " Logged Out Successfully",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "User Not Found",
      error,
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "User Not Found",
      });
    }
    const resetPassToken = crypto.randomBytes(32).toString("hex");
    const resetPassExpiry = Date.now() + 10 * 60 * 1000;
    console.log("Reset Token ->>", resetPassToken);
    console.log("Password Expiry ->>", resetPassExpiry);
    user.resetPasswordToken = resetPassToken;
    user.resetPasswordExpires = resetPassExpiry;
    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: 587,
      secure: false, // true for port 465, false for other ports
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.MAILTRAP_SENDEREMAIL,
      to: user.email, // list of receivers
      subject: "Reset your Password", // Subject line
      text: `Please click on the link: ${process.env.BASE_URL}/api/v1/users/reset/${resetPassToken}`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "Password reset email sent succesfully",
      success: true,
    });

    // get email
    // find user based on email
    // set resetPasswordTOken and resetExpiry
    // user save
    // send email with token
  } catch (error) {
    console.log("Error in initiating password reset", error);
    return res.status(500).json({
      message: "Failed to initiate password reset.",
      success: false,
      error,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { resetPassToken } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: resetPassToken,
      resetPasswordExpires: { $gt: Date.now() },
    });
    console.log("user based on token", user);

    if (!user) {
      return res.status(400).json({
        message: "User Not Found",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      message: "Password reset  succesfully",
      success: true,
    });

    // collect token from param
    // password from req.body
    // set password in user
    // reset restexpiry and resettoken
    // save
  } catch (error) {
    console.log("Error in Reseting password", error);
    return res.status(500).json({
      message: "Failed to reset password.",
      success: false,
      error,
    });
  }
};

export {
  registerUser,
  verifyUser,
  loginUser,
  profile,
  logoutUser,
  forgotPassword,
  resetPassword,
};
