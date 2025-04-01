import { Express, Request, Response, NextFunction } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import { mongoStorage } from "./mongo-storage";
import { User } from "@shared/schema";

// Type definitions for request user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const scryptAsync = promisify(scrypt);
const JWT_SECRET = process.env.JWT_SECRET || "votesafe-secure-jwt-secret";
const JWT_EXPIRY = '7d'; // Token expires in 7 days

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateToken(user: User) {
  const { password, ...userWithoutPassword } = user;
  return jwt.sign(userWithoutPassword, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// Middleware to authenticate JWT from request
function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Bearer <token>
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403); // Invalid token
      }
      
      req.user = user as User;
      next();
    });
  } else {
    // Check for token in cookies as fallback
    const token = req.cookies?.token;
    
    if (token) {
      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
          return res.sendStatus(403); // Invalid token
        }
        
        req.user = user as User;
        next();
      });
    } else {
      res.sendStatus(401); // Unauthorized
    }
  }
}

// Optional authentication - doesn't fail if no token is present
function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Bearer <token>
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user as User;
      }
    });
  } else {
    // Check for token in cookies as fallback
    const token = req.cookies?.token;
    
    if (token) {
      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (!err) {
          req.user = user as User;
        }
      });
    }
  }
  
  next();
}

export function setupAuth(app: Express) {
  // Add cookie parser middleware
  app.use(cookieParser());
  
  // Register endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await mongoStorage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await mongoStorage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      // Generate JWT token
      const token = generateToken(user);
      
      // Set token in cookie for browser clients
      res.cookie('token', token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      // Return user data and token
      res.status(201).json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", async (req, res, next) => {
    try {
      const { username, password } = req.body;
      
      const user = await mongoStorage.getUserByUsername(username);
      
      if (!user || !(await comparePasswords(password, user.password))) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Generate JWT token
      const token = generateToken(user);
      
      // Set token in cookie for browser clients
      res.cookie('token', token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      // Return user data and token
      res.status(200).json({
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      next(error);
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    // Clear the cookie
    res.clearCookie('token');
    res.status(200).json({ message: "Logged out successfully" });
  });

  // Get current user endpoint
  app.get("/api/user", authenticateJWT, (req, res) => {
    // User is already attached to req by middleware
    const { password, ...userWithoutPassword } = req.user!;
    res.json(userWithoutPassword);
  });
  
  // Export middleware for use in routes
  return { authenticateJWT, optionalAuth };
}
