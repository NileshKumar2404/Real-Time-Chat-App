import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(cookieParser())
app.use(express.urlencoded({extended: true}))
app.use(express.json())
app.use(express.static('public'))
app.use((req, res, next) => {
    console.log("Received ${req.method} request with body:", req.body);
    console.log("Received ${req.method} request with params:", req.params);
    next();
})

export {app}