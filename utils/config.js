require('dotenv').config()

const PORT = process.env.PORT
let MONGODB_URI = process.env.MONGODB_URI
let DB_NAME = process.env.DB_NAME

// if(process.env.NODE_ENV === 'test') {
//   MONGODB_URI = process.env.TEST_MONGODB_URI
//   DB_NAME = process.env.TEST_DB_NAME
// }

module.exports = {
  MONGODB_URI,
  PORT,
  DB_NAME
}