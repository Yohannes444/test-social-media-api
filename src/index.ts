import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { PrismaClient } from '@prisma/client';
import { typeDefs } from './graphql/schema';
import { resolvers } from './graphql/resolvers';
import { authMiddleware } from './middleware/auth';
import { logger } from './utils/logger';

const prisma = new PrismaClient();

interface Context {
  prisma: PrismaClient;
  user: { id: string; role: string } | null;
}

const server = new ApolloServer<Context>({
  typeDefs,
  resolvers,
  formatError: (error) => {
    logger.error(`GraphQL Error: ${error.message}`);
    return {
      message: error.message,
      code: error.extensions?.code || 'INTERNAL_SERVER_ERROR',
    };
  },
});

const startServer = async () => {
  try {
    console.log('Starting server...');
    console.log("users: ", await prisma.user.findFirst({
        where: {
            username: "alice"
        }
    }));
    // console.log("prisma: ", prisma);
    const { url } = await startStandaloneServer(server, {
      context: async ({ req }) => {
        const user = await authMiddleware(req.headers.authorization);
        return { prisma, user };
      },
      listen: { port: 4000 },
    });
    logger.info(`🚀 Server ready at ${url}`);
  } catch (error) {
    logger.error(`Server startup error: ${error}`);
  }
};

startServer();