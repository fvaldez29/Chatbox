import express from 'express'

const port = process.env.PORT ?? 3000

const app = express()

app.get('/', (req, res) => {
    res.send('<h1>Esto es un chat</h1>')
})

app.listen(port, () => {
    console.log(`server listening on port http:localhost:${port}`)
})