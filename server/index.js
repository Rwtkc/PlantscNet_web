import { createApp } from './app.js'

const port = Number(process.env.PORT ?? 1116)
const host = process.env.HOST ?? '0.0.0.0'
const app = createApp()

app.listen(port, host, () => {
  console.log(`PlantScNet server listening on http://${host}:${port}`)
})
