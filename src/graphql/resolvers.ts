import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger';

interface Context {
  prisma: PrismaClient;
  user: { id: string; role: string } | null;
}

export const resolvers = {
  Query: {
    me: async (_: any, __: any, { prisma, user }: Context) => {
      if (!user) throw new Error('Not authenticated');
      return prisma.user.findUnique({ where: { id: user.id } });
    },
    users: async (_: any, __: any, { prisma }: Context) => {
      return prisma.user.findMany();
    },
    user: async (_: any, { id }: { id: string }, { prisma }: Context) => {
      return prisma.user.findUnique({ where: { id } });
    },
    posts: async (_: any, __: any, { prisma }: Context) => {
      return prisma.post.findMany({ include: { user: true, comments: true, likes: true, ratings: true } });
    },
    post: async (_: any, { id }: { id: string }, { prisma }: Context) => {
      return prisma.post.findUnique({
        where: { id },
        include: { user: true, comments: { include: { replies: true } }, likes: true, ratings: true },
      });
    },
    comments: async (_: any, { postId }: { postId: string }, { prisma }: Context) => {
      return prisma.comment.findMany({ where: { postId }, include: { user: true, replies: true } });
    },
  },
  Mutation: {
    signup: async (_: any, { username, email, password }: any, { prisma }: Context) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: { username, email, password: hashedPassword, role: 'USER' },
      });
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!);
      logger.info(`User signed up: ${username}`);
      return { token, user };
    },
    login: async (_: any, { email, password }: any, { prisma }: Context) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        throw new Error('Invalid credentials');
      }
      const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET!);
      logger.info(`User logged in: ${user.username}`);
      return { token, user };
    },
    createPost: async (_: any, { mediaFile, caption }: any, { prisma, user }: Context) => {
      if (!user) throw new Error('Not authenticated');
      const post = await prisma.post.create({
        data: { mediaFile, caption, userId: user.id, timestamp: new Date().toISOString() },
        include: { user: true },
      });
      logger.info(`Post created by ${user.id}`);
      return post;
    },
    updatePost: async (_: any, { id, caption }: any, { prisma, user }: Context) => {
      if (!user) throw new Error('Not authenticated');
      const post = await prisma.post.findUnique({ where: { id } });
      if (!post || post.userId !== user.id) throw new Error('Not authorized');
      return prisma.post.update({ where: { id }, data: { caption }, include: { user: true } });
    },
    deletePost: async (_: any, { id }: any, { prisma, user }: Context) => {
      if (!user) throw new Error('Not authenticated');
      const post = await prisma.post.findUnique({ where: { id } });
      if (!post || post.userId !== user.id) throw new Error('Not authorized');
      await prisma.post.delete({ where: { id } });
      logger.info(`Post deleted: ${id}`);
      return true;
    },
    createComment: async (_: any, { postId, content, parentId }: any, { prisma, user }: Context) => {
      if (!user) throw new Error('Not authenticated');
      return prisma.comment.create({
        data: {
          content,
          postId,
          userId: user.id,
          parentId,
          timestamp: new Date().toISOString(),
        },
        include: { user: true, post: true, parent: true },
      });
    },
    deleteComment: async (_: any, { id }: any, { prisma, user }: Context) => {
      if (!user) throw new Error('Not authenticated');
      const comment = await prisma.comment.findUnique({ where: { id } });
      if (!comment || comment.userId !== user.id) throw new Error('Not authorized');
      await prisma.comment.delete({ where: { id } });
      logger.info(`Comment deleted: ${id}`);
      return true;
    },
    likePost: async (_: any, { postId }: any, { prisma, user }: Context) => {
      if (!user) throw new Error('Not authenticated');
      return prisma.like.create({
        data: { postId, userId: user.id, timestamp: new Date().toISOString() },
        include: { user: true, post: true },
      });
    },
    unlikePost: async (_: any, { postId }: any, { prisma, user }: Context) => {
      if (!user) throw new Error('Not authenticated');
      await prisma.like.deleteMany({ where: { postId, userId: user.id } });
      logger.info(`Post unliked: ${postId} by ${user.id}`);
      return true;
    },
    ratePost: async (_: any, { postId, value }: any, { prisma, user }: Context) => {
      if (!user) throw new Error('Not authenticated');
      if (value < 1 || value > 5) throw new Error('Rating must be between 1 and 5');
      return prisma.rating.create({
        data: { postId, userId: user.id, value, timestamp: new Date().toISOString() },
        include: { user: true, post: true },
      });
    },
    removePost: async (_: any, { id }: any, { prisma, user }: Context) => {
      if (!user || user.role !== 'ADMIN') throw new Error('Not authorized');
      // Delete dependent records first
      await prisma.comment.deleteMany({ where: { postId: id } });
      await prisma.like.deleteMany({ where: { postId: id } });
      await prisma.rating.deleteMany({ where: { postId: id } });
      // Delete the post
      await prisma.post.delete({ where: { id } });
      logger.info(`Post removed by admin: ${id}`);
      return true;
    },
    removeComment: async (_: any, { id }: any, { prisma, user }: Context) => {
      if (!user || user.role !== 'ADMIN') throw new Error('Not authorized');
      await prisma.comment.delete({ where: { id } });
      logger.info(`Comment removed by admin: ${id}`);
      return true;
    },
  },
};