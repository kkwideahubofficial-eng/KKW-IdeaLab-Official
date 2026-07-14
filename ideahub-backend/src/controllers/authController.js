import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_EXPIRY = '7d';

function signJwt(payload) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return jwt.sign(payload, secret, { expiresIn: JWT_EXPIRY });
}

export async function signup(req, res) {
  try {
    const {
      name, email, password, role, teamName, prn, division,
      externalMobile, externalCollegeOrg, externalDept, externalCity,
      externalState, externalIdentityProof
    } = req.body;

    // eslint-disable-next-line no-console
    console.log('Signup payload:', { name, email, role, teamName });

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || 'team',
      teamName: teamName || '',
      imageUrl: req.file ? req.file.path : '',
      prn: prn || '',
      division: division || '',
      externalMobile: externalMobile || '',
      externalCollegeOrg: externalCollegeOrg || '',
      externalDept: externalDept || '',
      externalCity: externalCity || '',
      externalState: externalState || '',
      externalIdentityProof: externalIdentityProof || '',
    });

    // eslint-disable-next-line no-console
    console.log('User created with id:', user._id.toString());

    return res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userType: user.userType,
        teamName: user.teamName,
        imageUrl: user.imageUrl,
        prn: user.prn,
        division: user.division,
        externalMobile: user.externalMobile,
        externalCollegeOrg: user.externalCollegeOrg,
        externalDept: user.externalDept,
        externalCity: user.externalCity,
        externalState: user.externalState,
        externalIdentityProof: user.externalIdentityProof,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Signup failed', error: err.message });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    // eslint-disable-next-line no-console
    console.log('Login attempt for:', email);
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signJwt({ userId: user._id, role: user.role });

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userType: user.userType,
        teamName: user.teamName,
        mobile: user.mobile,
        year: user.year,
        branch: user.branch,
        prn: user.prn,
        division: user.division,
        externalMobile: user.externalMobile,
        externalCollegeOrg: user.externalCollegeOrg,
        externalDept: user.externalDept,
        externalCity: user.externalCity,
        externalState: user.externalState,
        externalIdentityProof: user.externalIdentityProof,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed', error: err.message });
  }
}

export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ user });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch profile', error: err.message });
  }
}

export async function updateProfile(req, res) {
  try {
    const {
      name, email, mobile, year, branch, prn, division,
      externalMobile, externalCollegeOrg, externalDept, externalCity,
      externalState, externalIdentityProof
    } = req.body;
    
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (email !== undefined) user.email = email.toLowerCase();
    if (mobile !== undefined) user.mobile = mobile;
    if (year !== undefined) user.year = year;
    if (branch !== undefined) user.branch = branch;
    if (prn !== undefined) user.prn = prn;
    if (division !== undefined) user.division = division;
    if (externalMobile !== undefined) user.externalMobile = externalMobile;
    if (externalCollegeOrg !== undefined) user.externalCollegeOrg = externalCollegeOrg;
    if (externalDept !== undefined) user.externalDept = externalDept;
    if (externalCity !== undefined) user.externalCity = externalCity;
    if (externalState !== undefined) user.externalState = externalState;
    if (externalIdentityProof !== undefined) user.externalIdentityProof = externalIdentityProof;

    await user.save();

    const userObj = user.toObject();
    delete userObj.passwordHash;

    return res.status(200).json({ message: 'Profile updated successfully', user: userObj });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update profile', error: err.message });
  }
}

export async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // req.user has the user document attached by requireAuth middleware but typically we findById to get passwordHash because some auth middlewares might exclude it
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    user.passwordHash = passwordHash;
    await user.save();

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to change password', error: err.message });
  }
}

export default { signup, login, getProfile, updateProfile, changePassword };

