import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { registerUser, loginUser } from '../../../src/controllers/authController';

// Mock dependencies
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../../src/config/db', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    from: jest.fn(),
    where: jest.fn(),
    values: jest.fn(),
    limit: jest.fn(),
    returning: jest.fn(),
  }
}));
jest.mock('../../../src/utils/mailer', () => ({
  transporter: {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' })
  }
}));

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

const mockUser = {
  user_id: 1,
  firstname: 'John',
  lastname: 'Doe',
  email: 'john@example.com',
  password: 'hashedPassword',
  role: 'user',
  contact_phone: '1234567890',
  address: '123 Main St'
};

describe('Auth Controller', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    const validUserData = {
      firstname: 'John',
      lastname: 'Doe',
      email: 'john@example.com',
      password: 'password123',
      contact_phone: '1234567890',
      address: '123 Main St'
    };

    it('should register a new user successfully', async () => {
      const mockDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
        insert: jest.fn().mockReturnThis(),
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValue([{ user_id: 1, ...validUserData }])
      };

      require('../../../src/config/db').db = mockDb;
      mockBcrypt.hash.mockResolvedValue('hashedPassword' as never);

      const req = { body: validUserData } as express.Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as express.Response;

      await registerUser(req, res);

      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockDb.insert).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('User registered successfully'),
          user: expect.objectContaining({
            user_id: 1,
            firstname: 'John',
            lastname: 'Doe',
            email: 'john@example.com'
          })
        })
      );
    });

    it('should return error if user already exists', async () => {
      const mockDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser])
      };
      require('../../../src/config/db').db = mockDb;
      const { registerUser } = require('../../../src/controllers/authController');
      const req = { body: { email: 'test@example.com', password: 'pass' } } as any;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;
      await registerUser(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: 'User with this email already exists.' });
    });

    it('should return error if email or password is missing', async () => {
      const invalidData = { firstname: 'John', lastname: 'Doe' };

      const req = { body: invalidData } as express.Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as express.Response;

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email and password are required.'
      });
    });

    it('should handle database errors gracefully', async () => {
      const mockDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      require('../../../src/config/db').db = mockDb;

      const req = { body: validUserData } as express.Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as express.Response;

      await registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error'
      });
    });
  });

  describe('POST /login', () => {
    const validLoginData = {
      email: 'john@example.com',
      password: 'password123'
    };

    it('should login user with valid credentials', async () => {
      const mockDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser])
      };

      require('../../../src/config/db').db = mockDb;
      mockBcrypt.compare.mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('mockToken' as never);

      const req = { body: validLoginData } as express.Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as express.Response;
      const next = jest.fn();

      await loginUser(req, res, next);

      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(mockJwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ user_id: 1, email: 'john@example.com', role: 'user' }),
        expect.any(String),
        expect.objectContaining({ expiresIn: '24h' })
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Login successful',
          token: 'mockToken',
          user: expect.objectContaining({
            user_id: 1,
            firstname: 'John',
            lastname: 'Doe',
            email: 'john@example.com',
            role: 'user'
          })
        })
      );
    });

    it('should return error for invalid email', async () => {
      const mockDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([])
      };

      require('../../../src/config/db').db = mockDb;

      const req = { body: validLoginData } as express.Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as express.Response;
      const next = jest.fn();

      await loginUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid email or password.'
      });
    });

    it('should return error for invalid password', async () => {
      const mockDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValue([mockUser])
      };

      require('../../../src/config/db').db = mockDb;
      mockBcrypt.compare.mockResolvedValue(false);

      const req = { body: validLoginData } as express.Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as express.Response;
      const next = jest.fn();

      await loginUser(req, res, next);

      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Invalid email or password.'
      });
    });

    it('should return error if email or password is missing', async () => {
      const invalidData = { email: 'john@example.com' };

      const req = { body: invalidData } as express.Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as express.Response;
      const next = jest.fn();

      await loginUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Email and password are required.'
      });
    });

    it('should handle database errors gracefully', async () => {
      const mockDb = {
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      require('../../../src/config/db').db = mockDb;

      const req = { body: validLoginData } as express.Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      } as unknown as express.Response;
      const next = jest.fn();

      await loginUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Internal server error'
      });
    });
  });
});

afterEach(() => {
  jest.resetModules();
});
