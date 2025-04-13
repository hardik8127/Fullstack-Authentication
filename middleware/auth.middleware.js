import jwt from "jsonwebtoken";

export const isLoggedIn = (req, res, next) => {
  try {
    console.log("cookies", req.cookies);
    let token = req.cookies?.token;
    console.log("token found:", token ? "yes" : "No");

    if (!token) {
      console.log("No Token");
      return res.status(401).json({
        success: false,
        message: "Authentication failed",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("decoded token:", decoded);
    req.user = decoded;
    next();
  } catch (error) {
    console.log("Auth middleware failure");
    return res.status(500).json({
      success: false,
      message: "Authentication failed due to internal server error",
    });
  }

  
};
