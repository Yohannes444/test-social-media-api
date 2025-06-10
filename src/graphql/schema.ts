import { gql } from 'apollo-server';

export const typeDefs = gql`
  type User {
    id: ID!
    username: String!
    email: String!
    bio: String
    profilePicture: String
    createdAt: String!
    posts: [Post!]
    comments: [Comment!]
    likes: [Like!]
    ratings: [Rating!]
  }

  type Post {
    id: ID!
    user: User!
    mediaFile: String!
    caption: String
    timestamp: String!
    comments: [Comment!]
    likes: [Like!]
    ratings: [Rating!]
  }

  type Comment {
    id: ID!
    user: User!
    post: Post!
    content: String!
    timestamp: String!
    parent: Comment
    replies: [Comment!]
  }

  type Like {
    id: ID!
    user: User!
    post: Post!
    timestamp: String!
  }

  type Rating {
    id: ID!
    user: User!
    post: Post!
    value: Int!
    timestamp: String!
  }

  type Query {
    me: User
    users: [User!]
    user(id: ID!): User
    posts: [Post!]
    post(id: ID!): Post
    comments(postId: ID!): [Comment!]
  }

  type Mutation {
    signup(username: String!, email: String!, password: String!): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createPost(mediaFile: String!, caption: String): Post!
    updatePost(id: ID!, caption: String): Post!
    deletePost(id: ID!): Boolean!
    createComment(postId: ID!, content: String!, parentId: ID): Comment!
    deleteComment(id: ID!): Boolean!
    likePost(postId: ID!): Like!
    unlikePost(postId: ID!): Boolean!
    ratePost(postId: ID!, value: Int!): Rating!
    removePost(id: ID!): Boolean! # Admin only
    removeComment(id: ID!): Boolean! # Admin only
  }

  type AuthPayload {
    token: String!
    user: User!
  }
`;