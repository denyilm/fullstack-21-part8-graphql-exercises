const { ApolloServer, UserInputError, AuthenticationError, gql } = require('apollo-server')
const { ApolloServerPluginLandingPageGraphQLPlayground } = require("apollo-server-core")
const { PersistedQueryNotSupportedError } = require('apollo-server-errors')
const { v1: uuid } = require('uuid') 
const config = require('./utils/config')
const mongoose = require('mongoose')
const Author = require('./models/author')
const Book = require('./models/book')
const author = require('./models/author')

/*
 * Suomi:
 * Saattaisi olla järkevämpää assosioida kirja ja sen tekijä tallettamalla kirjan yhteyteen tekijän nimen sijaan tekijän id
 * Yksinkertaisuuden vuoksi tallennamme kuitenkin kirjan yhteyteen tekijän nimen
 *
 * English:
 * It might make more sense to associate a book with its author by storing the author's id in the context of the book instead of the author's name
 * However, for simplicity, we will store the author's name in connection with the book
*/

const MONGODB_URI = config.MONGODB_URI
console.log('connecting to', MONGODB_URI)
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
})

const typeDefs = gql`
  type Book {
      title: String!
      published: Int
      author: String!
      genres: [String!]
      id: ID!
  }

  type Author {
      name: String
      born: Int
      bookCount: Int
      id: ID!
  }

  type Query {
      bookCount: Int!
      authorCount: Int!
      allBooks(genre: String): [Book!]!
      allAuthors: [Author!]!
  }

  type Mutation {
    addBook(
        title: String!
        author: String!
        published: Int
        genres: [String!]
    ): Book
    editAuthor(
        name: String!
        setBornTo: Int!
    ): Author
    addAuthor(
      name: String!
      born: Int
    ): Author
}
`

const resolvers = {
  Query: {
      bookCount: () => Book.collection.countDocuments(),
      authorCount: () => Author.collection.countDocuments(),
      allBooks: async (root, args) => {
        let authors =  await Author.find({}) 
    
        if(!args.genre){
          let booksWithAuthorId = await Book.find({})
          let books = booksWithAuthorId.map(b => ({...b._doc, author: authors.find(a => String(a._id) === String(b.author)).name}))
          console.log(books)
          return books
        }
        let booksWithAuthorId = await Book.find({genres:{$in:[args.genre]}})
        let books = booksWithAuthorId.map(b => ({...b._doc, author: authors.find(a => String(a._id) === String(b.author)).name}))
        return books
      },
      allAuthors: async () => await Author.find({})
  },
  Author: {
      bookCount: (root) => {
          let c = books.filter(b => b.author === root.name)
          return c.length
      }
  },
  Mutation: {
      addBook: async (root, args) => {
          const book = new Book({...args})
          let author =  await Author.find({name: args.author})
          book.author = author[0]._id

          try {
            await book.save()
          } catch (error) {
            throw new UserInputError(error.message, {
              invalidArgs: args,
            })
          }

          return book
      },
      editAuthor: (root, args) => {
          const author = authors.find(a => a.name === args.name)
          if(!author){
              return null
          }

          const updatedAuthor = {...author, born: args.setBornTo}
          authors = authors.map(a => a.name === args.name ? updatedAuthor : a)
          return updatedAuthor
      },
      addAuthor: async (root, args) => {
          const author = new Author({...args})

          try {
            await author.save()
          } catch (error) {
            throw new UserInputError(error.message, {
              invalidArgs: args,
            })
          }

          return author
      }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    ApolloServerPluginLandingPageGraphQLPlayground({
      // options
    })
  ]
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})