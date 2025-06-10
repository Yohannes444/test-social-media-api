import jwt from 'jsonwebtoken';

export const authMiddleware = async (authHeader: string | undefined) => {
  if (!authHeader) return null;

  const token = authHeader.replace('Bearer ', '');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string };
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
};