const jwt = require("jsonwebtoken");
const catchAsync = require("./../utils/catchAsync");
const AppError = require("./../utils/appError");

module.exports = catchAsync(async (req, res, next)=> {
    const token = req.header("Authorization");
    if(!token){
        return next(new AppError("Please Login or Signup with Gmail Account", 400))
    }
    try {
        const decoded = jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return next(new AppError("Invalid Token", 400));
    }

});
