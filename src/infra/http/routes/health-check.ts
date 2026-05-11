import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'

// TODO: fazer a validação das dependencias do projeto (banco, redis, etc...)

export const healthCheckRoute: FastifyPluginAsyncZod = async server => {
  server.get('/health', async (request, reply) => {
      return reply.status(200).send({ message: 'OK!' })
    }
  )
}
