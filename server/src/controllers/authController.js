import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import AppError from '../utils/AppError.js';
import { sendEmail } from '../config/email.js';

const otpCache = new Map(); // In-memory OTP store (email -> { otp, expires })

const generateAccessToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
};

const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

const setTokenCookies = (res, accessToken, refreshToken, rememberMe = false) => {
  const refreshExpires = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000; // 30 days or 7 days
  
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 min
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: refreshExpires,
  });
};

export const login = async (req, res, next) => {
  const { email, password, rememberMe } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return next(new AppError('Invalid credentials', 401));
    }

    // Check account lockout
    if (user.isLocked()) {
      const remainingMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return next(new AppError(`Account locked. Try again in ${remainingMinutes} minutes`, 403));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 30 * 60 * 1000; // 30 mins lockout
      }
      await user.save();
      return next(new AppError('Invalid credentials', 401));
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    user.refreshToken = refreshToken;
    await user.save();

    setTokenCookies(res, accessToken, refreshToken, rememberMe);

    // Populating employee details
    const populatedUser = await User.findById(user._id).populate('employee');

    res.status(200).json({
      status: 'success',
      token: accessToken,
      user: populatedUser,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
    }

    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req, res, next) => {
  const token = req.cookies.refreshToken || req.body.refreshToken;

  if (!token) {
    return next(new AppError('No refresh token provided', 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return next(new AppError('Invalid refresh token', 401));
    }

    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    setTokenCookies(res, newAccessToken, newRefreshToken);

    res.status(200).json({
      status: 'success',
      token: newAccessToken,
    });
  } catch (error) {
    next(new AppError('Invalid or expired refresh token', 401));
  }
};

export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new AppError('Please provide your email address', 400));
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('User with this email does not exist', 404));
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    otpCache.set(email, { otp, expires });

    await sendEmail({
      to: email,
      subject: 'HRMS Pro - Password Reset OTP',
      text: `Your password reset verification code is: ${otp}. It is valid for 10 minutes.`,
      html: `<h3>Password Reset Requested</h3><p>Your verification code is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`,
    });

    res.status(200).json({
      status: 'success',
      message: 'OTP sent to email',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new AppError('Please provide email and OTP', 400));
  }

  const record = otpCache.get(email);
  if (!record) {
    return next(new AppError('OTP not requested or expired', 400));
  }

  if (record.otp !== otp || record.expires < Date.now()) {
    return next(new AppError('Invalid or expired OTP', 400));
  }

  res.status(200).json({
    status: 'success',
    message: 'OTP verified successfully',
  });
};

export const resetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return next(new AppError('Please provide all details', 400));
  }

  const record = otpCache.get(email);
  if (!record || record.otp !== otp || record.expires < Date.now()) {
    return next(new AppError('Invalid or expired OTP token', 400));
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    user.password = newPassword;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.refreshToken = undefined; // invalidate existing sessions
    await user.save();

    otpCache.delete(email);

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    user: req.user,
  });
};
