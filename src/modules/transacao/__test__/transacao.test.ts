import { Server } from '@hapi/hapi'

import { init } from '@/server'
import sequelize from '@/database'
import insertHelper from '@/__tests__/insert.helper'
import utils from './transacao.utils'
import { Transacao } from '@/models/transacao.model'

describe('Módulo - Transação', () => {
  const url = '/api/transacoes'
  let server: Server

  beforeEach(async () => {
    server = await init()
    await sequelize.truncate({ force: true })
    await insertHelper.tipos()
  })

  afterEach(async () => {
    await server.stop()
  })

  afterAll(async () => {
    await sequelize.truncate({ force: true })
  })

  describe('POST /', () => {
    it('should insert a transaction on the database', async () => {
      const transacao = utils.generateTransacao()

      const response = await server.inject({
        method: 'POST',
        url,
        payload: transacao
      })

      expect(response.statusCode).toBe(201)

      const result = response.result as Transacao

      expect(result).not.toBeNull()
      expect(result.categoria).not.toBeNull()
      expect(result.tipo).not.toBeNull()
    })

    it('should not insert a transaction when the request body is not valid', async () => {
      const transacao = utils.generateTransacao()

      transacao.valor = "-123.12"

      const response = await server.inject({
        method: 'POST',
        url,
        payload: transacao
      })

      expect(response.statusCode).toBe(400)
    })

    it('should not insert a transaction when the request body is not valid', async () => {
      const transacao = utils.generateTransacao()

      delete transacao.categoria

      const response = await server.inject({
        method: 'POST',
        url,
        payload: transacao
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET /', () => {
    it('should return a list of all transactions', async () => {
      const transacoes = await Transacao.bulkCreate(utils.generateTransacoes())

      expect(transacoes).not.toBeNull()
      expect(transacoes.length).toBe(5)

      const response = await server.inject({
        method: 'GET',
        url
      })

      expect(response.statusCode).toBe(200)

      const result = response.result as Transacao[]

      expect(result).not.toBeNull()
      expect(result.length).toBe(5)
    })

    it('should not return a list when there are not transactions registered on the database', async () => {
      const response = await server.inject({
        method: 'GET',
        url
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('GET ?tipo_transacao_id', () => {
    it('should return a list of all transaction by type', async () => {
      const transacoes = await Transacao.bulkCreate(
        utils.generateTransacoes(3, { tipo: 1 })
      )

      expect(transacoes).not.toBeNull()
      expect(transacoes.length).toBe(3)
      expect(transacoes.some(t => t.tipo_transacao_id === 1))

      let response = await server.inject({
        method: 'GET',
        url: `${url}?tipo_transacao_id=1`
      })

      expect(response.statusCode).toBe(200)

      const result = response.result as Transacao[]

      expect(result).not.toBeNull()
      expect(result.length).toBe(3)
      expect(result.some(t => t.tipo_transacao_id === 1))
    })

    it('should return an error 404 when there is no transaction registered with type informed', async () => {
      const transacoes = await Transacao.bulkCreate(
        utils.generateTransacoes(3, { tipo: 1 })
      )

      expect(transacoes).not.toBeNull()
      expect(transacoes.length).toBe(3)
      expect(transacoes.some(t => t.tipo_transacao_id === 1))

      const response = await server.inject({
        method: 'GET',
        url: `${url}?tipo_transacao_id=2`
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return an error 400 when type informed is invalid', async () => {
      
      let response = await server.inject({
        method: 'GET',
        url: `${url}?tipo_transacao_id=a`
      })

      expect(response.statusCode).toBe(400)

      response = await server.inject({
        method: 'GET',
        url: `${url}?tipo_transacao_id=-23`
      })

      expect(response.statusCode).toBe(400)
    })
  })

  describe('GET ?ano&mes', () => {
    it ('should return a list of transactions by a determined month and year', async () => {
      const transacoes = await Transacao.bulkCreate([
        ...utils.generateTransacoes(5, {
          mes: 7,
          ano: 2020
        }),
        ...utils.generateTransacoes(5)
      ])

      expect(transacoes).not.toBeNull()
      expect(transacoes.length).toBe(10)

      const response = await server.inject({
        method: 'GET',
        url: `${url}?ano=2020&mes=7`
      })

      expect(response.statusCode).toBe(200)
      
      const result = response.result as Transacao[]

      expect(result).not.toBeNull()
      expect(result.length).toBeGreaterThanOrEqual(5)
    })

    it('should return an error 400 when the year or month is invalid', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `${url}?ano=1950&mes=13`
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return an error 404 when there are no transactions on the database in the period informed', async () => {
      const transacoes = await Transacao.bulkCreate([
        ...utils.generateTransacoes(5, {
          mes: 7,
          ano: 2020
        }),
      ])

      expect(transacoes).not.toBeNull()
      expect(transacoes.length).toBe(5)

      const response = await server.inject({
        method: 'GET',
        url: `${url}?ano=2020&mes=6`
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('GET ?categoria_id', () => {
    it ('should return a transactions list by category', async () => {
      const categorias = await insertHelper.categoria()

      expect(categorias).not.toBeNull()
      expect(categorias.length).toBe(10)

      const transacoes = await Transacao.bulkCreate([
        ...utils.generateTransacoes(5, { categoria_id: categorias[0].id}),
        ...utils.generateTransacoes(5, { categoria_id: categorias[1].id}),
      ])

      expect(transacoes).not.toBeNull()
      expect(transacoes.length).toBe(10)

      const response = await server.inject({
        method: 'GET',
        url: `${url}?categoria_id=${categorias[0].id}`
      })

      expect(response.statusCode).toBe(200)
      
      const result = response.result as Transacao[]

      expect(result).not.toBeNull()
      expect(result.length).toBeGreaterThanOrEqual(5)
    })

    it ('should return an error 400 when the category id is invalid', async () => {

      const response = await server.inject({
        method: 'GET',
        url: `${url}?categoria_id=abc`
      })

      expect(response.statusCode).toBe(400)
    })

    it ('should return an error 404 when there are no transactions on the database with the category id informed', async () => {
      const categorias = await insertHelper.categoria()

      expect(categorias).not.toBeNull()
      expect(categorias.length).toBe(10)

      const transacoes = await Transacao.bulkCreate([
        ...utils.generateTransacoes(5, { categoria_id: categorias[1].id}),
      ])

      expect(transacoes).not.toBeNull()
      expect(transacoes.length).toBe(5)

      const response = await server.inject({
        method: 'GET',
        url: `${url}?categoria_id=${categorias[0].id}`
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe ('GET /{id}', () => {
    it ('should return a transaction when the request id param is valid', async () => {
      const transacoes = await Transacao.bulkCreate(
        utils.generateTransacoes(3)
      )

      expect(transacoes).not.toBeNull()
      expect(transacoes.length).toBe(3)

      const response = await server.inject({
        method: 'GET',
        url: `${url}/${transacoes[0].id}`
      })

      expect(response.statusCode).toBe(200)

      const result =  response.result as Transacao

      expect(result.id).toBe(transacoes[0].id)
    })

    it ('should return an error 400 when id param is invalid', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `${url}/abc`
      })

      expect(response.statusCode).toBe(400)
    })

    it ('should return an error 404 when there are not transaction registered with the id param on the database', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `${url}/1`
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe ('PUT /{id}', () => {
    it ('should update a transaction when the request payload is valid', async () => {
      const transacao = await Transacao.create(
        utils.generateTransacao()
      )

      expect(transacao).not.toBeNull()
      
      const response = await server.inject({
        method: 'PUT',
        url: `${url}/${transacao?.id}`,
        payload: {
          situacao: 1,
          observacoes: 'Pago via nubank',
          valor: 23.23
        }
      })

      expect(response.statusCode).toBe(200)

      const result = response.result as Transacao

      expect(result).not.toBeNull()
      expect(result.situacao).toBe(1)
      expect(result.id).toBe(transacao.id)
      expect(result.observacoes).toBe('Pago via nubank')
    })

    it('should return an error 400 when the request id is invalid', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: `${url}/abc`,
        payload: {
          situacao: 1,
          observacoes: 'Pago via nubank'
        }
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return an error 400 when the request payload is invalid', async () => {
      const transacao = await Transacao.create(
        utils.generateTransacao()
      )

      expect(transacao).not.toBeNull()

      const response = await server.inject({
        method: 'PUT',
        url: `${url}/${transacao?.id}`,
        payload: {
          situacao: 'abc',
          observacoes: 'Pago via nubank'
        }
      })

      expect(response.statusCode).toBe(400)
    })

    it('should return an error 400 when the request payload is invalid', async () => {
      const response = await server.inject({
        method: 'PUT',
        url: `${url}/3`,
        payload: {
          situacao: 1,
          observacoes: 'Pago via nubank'
        }
      })

      expect(response.statusCode).toBe(404)
    })
  })

  describe('DELETE /{id}', () => {
    it('should remove a transaction when the request param is valid', async () => {
      const transacao = await Transacao.create(
        utils.generateTransacao()
      )

      expect(transacao).not.toBeNull()

      const response = await server.inject({
        method: 'DELETE',
        url: `${url}/${transacao.id}`
      })

      expect(response.statusCode).toBe(200)
    })

    it('should return an error 404 when there is not transaction with the id on the database', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: `${url}/1`
      })

      expect(response.statusCode).toBe(404)
    })

    it('should return an error 400 when the request param is invalid', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: `${url}/abc`
      })

      expect(response.statusCode).toBe(400)
    })

  })
})