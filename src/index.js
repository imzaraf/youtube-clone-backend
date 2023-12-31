import dotenv from 'dotenv'
import express from 'express'
import connectDB from './db/index.js'

const app = express()

dotenv.config({ path: './env' })
connectDB()
app.listen(process.env.PORT, () => {
    console.log(`Server is running on port ${process.env.PORT}`)
})