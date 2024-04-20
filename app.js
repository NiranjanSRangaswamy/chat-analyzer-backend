const dotenv = require('dotenv')
const express  = require('express')
const cors = require('cors')
const router = require('./routers/router')
dotenv.config({
    path:'./.env'
})

const app = express()
const proxy = process.env.http_proxy || "localhost:4000"; 

app.use(cors({
    origin: '*',
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  }));
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use('/app/v1',router)
app.get('/',(req,res)=>{
  res.send('app is working')
})
module.exports = app