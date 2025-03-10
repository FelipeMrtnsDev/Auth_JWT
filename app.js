require('dotenv').config()
const express = require("express")
const mongoose = require("mongoose")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

const app = express()

app.use(express.json())

//models
const User = require("./models/User")

app.get("/", (req, res) => {
    res.status(200).json({msg: 'rodando'})
})

// Private Route
app.get("/user/:id", checkToken, async (req, res) => {
    const id = req.params.id

    // check if user exist

    const user = await User.findById(id, '-password')

    if(!user) {
        return res.status(440).json({ msg: 'Usuário não encontrado' })
    }

    res.status(200).json({ user })

    
})

function checkToken(req, res, next) { //declarando um middleware
    const authHeader = req.headers['authorization'] // pega o token do header
    const token = authHeader && authHeader.split(" ")[1] // se vier o token faz um split baseado no spaço

    if(!token) {
        return res.status(401).json({ msg: 'Acesso negado!' })
    }// se o token não bater da acesso negado

    try {
        const secret = process.env.SECRET

        jwt.verify(token, secret)

        next()
    } catch(error) {
        res.status(400).json({ msg: "Token inválido!" })
        console.log(error)
    }
} 

// Register
app.post("/auth/register", async (req, res) => {
    const { name, email, password, confirmpassword} = req.body

    if(!name) {
        return res.status(422).json({ msg: "O nome é obrigatório!"})
    }

    if(!email) {
        return res.status(422).json({ msg: "O email é obrigatório!"})
    }

    if(!password) {
        return res.status(422).json({ msg: "A senha é obrigatória!"})
    }

    if(password !== confirmpassword) {
        return res.status(422).json({ msg: 'As senhas não conferem!'})
    }

    // check if user exist

    const userExist = await User.findOne({ email: email })

    if(userExist) {
        return res.status(422).json({msg: 'Por favor, utilize outro e-mail!'})
    }

    //create password

    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    // create user
    const user = new User({
        name,
        email,
        password: passwordHash,
    })

    try {
        await user.save()
        res.status(201).json({msg: 'usuario criado com sucesso'})
    } catch(error) {
        console.log(error)
        res.status(500).json({msg: 'Aconteceu um erro no servidor, tente novamente mais tarde!'})
    }
})

app.post("/auth/login", async (req, res) => {
    const {email, password} = req.body

    if (!email) {
        return res.status(422).json({ msg: 'O email é obrigatório!'})
    }

    if (!password) {
        return res.status(422).json({ msg: 'A senha é obrigatória!'})
    }

    const user = await User.findOne({ email: email })

    if(!user) {
        return res.status(404).json({ msg: 'Usuario não encontrado'})
    }

    const checkPassword = await bcrypt.compare(password, user.password)

    if(!checkPassword) {
        return res.status(422).json({ msg: 'Senha inválida!' })
    }

    try {
        const secret = process.env.SECRET

        const token = jwt.sign({
            id: user._id
        }, secret)


        res.status(200).json({ msg: "Autentificação realizada com sucesso!", token })
    } catch(err) {
        console.log(err)

        res.status(500).json({
            msg: 'Aconteceu um erro no servidor, tente novamente mais tarde!'
        })
    }

})

//Cedencials
const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS



mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.foo92.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`).then(() => {
    console.log("Banco conectado com Sucesso!")
    app.listen(PORT, () => {
        console.log(`rodando no http://localhost:${PORT}`)
    })
}).catch((err) => console.log(err))

const PORT = 3000
