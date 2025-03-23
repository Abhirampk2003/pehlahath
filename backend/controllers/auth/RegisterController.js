import bcrypt from 'bcryptjs';
import UserSchema from '../../config/models/userModel.js'; // Adjust the path as needed

// User registration controller
export const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate required fields
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required' });
  }

  // Validate role
  const validRoles = ['user', 'admin', 'emergency_responder'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be one of: user, admin, emergency_responder' });
  }

  try {
    // Check if user already exists
    const existingUser = await UserSchema.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new UserSchema({
      name,
      email,
      password: hashedPassword,
      role
    });

    // Save user to database
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};