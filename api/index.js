const express = require('express') ;
const https = require('https')
const mongoose = require('mongoose') ;
const jwt = require('jsonwebtoken') ;
const User = require('./models/user') ;
const cookieParser = require('cookie-parser') ;
require('dotenv').config() ;
const cors = require('cors') ;
const bcrypt = require('bcryptjs') ;

//const credentials = {key: privateKey, cert: certificate} ;
const app = express() ;
app.use(cookieParser()) ;
app.use(cors({
    credentials:true,
    origin:process.env.CLIENT_URL,
    optionSuccessStatus: 200,
  Headers: true,
  exposedHeaders: 'Set-Cookie',
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Access-Control-Allow-Origin',
    'Content-Type',
    'Authorization'
  ]
}));
const jwtSecret = process.env.JWTSECRET ;
const ws = require('ws') ;
const Message = require('./models/message') ;
//const fs = require('fs') ;
const {S3Client, PutObjectCommand} = require('@aws-sdk/client-s3') ;
const { error } = require('console');
// const multer = require('multer') ;
// const multerS3 = require('multer-s3') ;
//const path = require('path') ;
const bSalt = bcrypt.genSaltSync(10) ;

mongoose.connect(process.env.MONGO_URI).then(
    console.log('DB Connectd Succesfully!') 
) ;

app.use(express.json()) ;

app.use('/uploads', express.static(__dirname + '/uploads')) ;

async function getUserDataFromRequest(req){
    return new Promise((resolve,reject) => {
        const token = req.cookies?.token ;
        if(token){
            console.log(token);
            jwt.verify(token,jwtSecret,{},(err,userData) => {
                if(err){
                    console.error("JWT verification Error: ", err);
                    reject("Token Verification Failed");
                }else{
                    resolve(userData) ;
                }
            }) ;
        }else {
            console.warn("No token provided in req")
            reject('no token') ;
        }
    }) ;
}

const port = process.env.PORT ;

app.get('/api/test', (req,res) => {
    mongoose.connect(process.env.MONGO_URI) ;
    res.json('Backend Server Is Running OK') ;
}) ;

app.get('/api/messages/:userId', async (req,res) => {
    mongoose.connect(process.env.MONGO_URI) ;
    const {userId} = req.params ;
    try {
        const userData = await getUserDataFromRequest(req) ;
        const ourUserId = userData.userId ;

        const messages = await Message.find({
            sender: {$in:[userId, ourUserId]},
            recipient: {$in:[userId, ourUserId]},
        }).sort({createdAt:1}) ;
        res.json(messages);
    }catch(err){
        console.log("Error fetching messages: ", error);
        res.status(401).json({error: error.toString()});
    }
}) ;

app.get('/api/people', async (req,res) => {
    mongoose.connect(process.env.MONGO_URI) ;
    const users = await User.find({}, {'_id':1, username:1}) ;
    res.json(users) ;
}) ;

app.get('/api/profile', (req,res) => {
    mongoose.connect(process.env.MONGO_URI) ;
    const token = req.cookies?.token ;
        if(token){
            jwt.verify(token,jwtSecret,{},(err,userData) => {
                if(err) throw err ;
                if(userData){
                    const {userId,username} = userData ;
                    //console.log(userData) ;
                    res.json({userId,username}) ;
                }else {console.log("NO data send")}
            }) ;
        }else {     
            res.status(401).json('no token') ;
        }   
}) ;

app.post('/api/register', async (req,res) => {
    mongoose.connect(process.env.MONGO_URI) ;
    const {username,password} = req.body ;
    try {
        const hashedPassword = bcrypt.hashSync(password,bSalt) ;
        const exists = await User.findOne({username}) ;
        if(!exists){
            const createdUser = await User.create({
                username:username,
                password:hashedPassword
            }) ;
            jwt.sign({userId:createdUser._id, username}, jwtSecret, {}, (err,token) => {
                if(err) return err ;
                res.cookie('token',token, {sameSite:'none',secure:true, httpOnly:true}).status(201).json({
                    id : createdUser._id ,
                    username
                }) ;
            });
        }else{
            res.json('exists') ;
        } 
    } catch (error) {
        if(error) console.log(error) ;
    }
}) ;

app.post('/api/login', async (req,res) => {
    mongoose.connect(process.env.MONGO_URI) ;
    const {username,password} = req.body ;
    if(req.body){res.json({username, password})};
    try {
        const foundUser = await User.findOne({username}) ;
        if(foundUser){
            const pass = bcrypt.compareSync(password,foundUser.password) ;
            if(pass){
                jwt.sign({userId:foundUser._id, username}, jwtSecret, {},(err,token) => {
                    if(err) return err ;
                    res.cookie('token',token, {sameSite:'none',secure:true, httpOnly:true}).status(201).json({
                        id : foundUser._id ,
                    }) ;
                    res.json({token});
                });
            }else {
                res.json("Invalid-Cred") ;
            }
        }else{
            res.json("Invalid-Cred") ;
        }
    } catch (error) {
        if(error) console.log(error) ;
    }
}) ;

app.post('/api/logout', (req,res) => {
    mongoose.connect(process.env.MONGO_URI) ;
    res.cookie('token', '', {sameSite:'none', secure:true, httpOnly:true}).status(201).json('logged out succesfully') ;
}) ;

//s3 client ,,,out of func so obj created only once ,,not everytime
const client = new S3Client({
    region : process.env.REGION,
    credentials : {
        accessKeyId : process.env.S3_ACCESS_KEY,
        secretAccessKey : process.env.S3_SECRET_ACCESS_KEY,
    }
}) ;

async function uploadToS3(bufferData, filename, mimetype) {

    await client.send(new PutObjectCommand({
        Bucket : process.env.BUCKET,
        Body : bufferData,
        Key : filename,
        ContentType : mimetype,
        ACL : 'public-read'
    })) ;

    //console.log({data}) ;
    return `https://${process.env.BUCKET}.s3.${process.env.REGION}.amazonaws.com/${filename}`
} 

//const httpServer = https.createServer(credentials,app)
const server = app.listen(port) ;

const wss = new ws.WebSocketServer({server}) ;

app.get('/api/serverinfo', async (req,res) => {
    res.json({
        server,
        wss
    })
})

// server.on('listening', () => {
//     console.log(`Express server listening at http://localhost:${port}`);
// });

wss.on('connection', (connection, req) => { 
    //console.log('WebSocket client connected');

    function notifyAboutOnlinePeople() {
        //const onlineUsers = [...connectedClients].map(client => ({userId: client.userId,username: client.username})) ;
        [...wss.clients].forEach(client => {
            client.send(JSON.stringify({
                online: [...wss.clients].map(c => ({userId:c.userId,username:c.username})),
            }));
        }) ;
        //console.log(onlineUsers) ;
    }

    connection.on('close', () => {
        notifyAboutOnlinePeople();
        clearInterval(connection.timer) ;
    }) ;

    connection.isAlive = true ;

    connection.timer = setInterval(()=> {
        connection.ping() ;
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false ;
            clearInterval(connection.timer) ;
            connection.terminate() ;
            notifyAboutOnlinePeople() ;
            //console.log('dead') ;
        }, 5000) ;
    }, 15000) ;

    connection.on('pong', () => {
        // console.log(pong) ;
        clearTimeout(connection.deathTimer) ;
    }) ;

    //console.log('ws cli connected') ;
    //connection.send("Hello socket") ;
    //console.log(req.headers) ;
    const cookies = req.headers.cookie ;
    if(cookies) {
        const tokenCookieString = cookies.split(';')
                                         .find(str => str.startsWith('token=')) ;
        if(tokenCookieString){
            const token = tokenCookieString.split('=')[1] ;
            if(token){
                jwt.verify(token, jwtSecret, {},(err,userData) => {
                    if(err) throw err ;
                    const {userId,username} = userData ;

                    //connectedClients.add(connection) ;
                    connection.userId = userId ;
                    connection.username = username ;

                });
            }
        }
    }

    connection.on('message', async (message) => {
        message = JSON.parse(message.toString()) ;
        //console.log(message) ;
        const {recipient, text, file} = message ;
        let filename = null ;
        let url = null ;

        if(file){
            //console.log(file) ;
            const parts = file.name.split('.') ;
            const ext = parts[parts.length - 1] ;
            filename = Date.now() + '.'+ext ;
            //const path = __dirname + '/uploads/' + filename ;
            //const filePath = path.join(__dirname, 'uploads', filename) ;
            const bufferData = await new Buffer.from(file.data.split(',')[1], 'base64') ; 

            // fs.writeFile(filePath, bufferData, (err) => {
            //     if(err){
            //         console.log(err) ;
            //     }else {
            //         console.log('File saved : '+ filePath) ;
            //     }
            // } ) ;

            ///s3 utility from here
            url = await uploadToS3(bufferData, filename, file.mimetype) ;
            console.log(url) ;
        }

        if(recipient && (text || file)) {

            const messageDoc = await Message.create({
                sender : connection.userId,
                recipient,
                text,
                file:file ? url : null,
            });

            [...wss.clients].filter( c=> recipient === c.userId)
                            .forEach(c => c.send(
                                JSON.stringify({
                                    text, 
                                    sender:connection.userId,
                                    recipient, 
                                    file: file? url : null ,
                                    _id:messageDoc._id
                                })
                            )) ;
        }
    }) ;

    // const users = [...wss.clients];
    // console.log(users) ;

    //send list of online users
    notifyAboutOnlinePeople() ;
}) ;

