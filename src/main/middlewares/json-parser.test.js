const request = require('supertest')
const app = require('../config/app')

describe('JSON Parser Middleware', () => {
  test('Deve analisar o corpo como JSON', async () => {
    app.post('/test_json_parser', (req, res) => {
      res.send(req.body)
    })

    await request(app)
      .post('/test_json_parser')
      .send({ name: 'Mango' })
      .expect({ name: 'Mango' })
  })
})
