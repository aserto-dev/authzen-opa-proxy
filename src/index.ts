import express, { Response } from 'express'
import { Request as JWTRequest } from 'express-jwt'
import cors from 'cors'
import * as dotenv from 'dotenv'
import * as dotenvExpand from 'dotenv-expand'
import axios from 'axios'
import { AuthZenRequest } from './interface'
import { Directory } from './directory'
import log from './log'

dotenvExpand.expand(dotenv.config())

const app: express.Application = express()
app.use(express.json())
app.use(cors())

const directory = new Directory()

const AUTHORIZER_SERVICE_URL = process.env.AUTHORIZER_SERVICE_URL ?? 'http://localhost:8181'
const PORT = process.env.PORT ?? 8080

const pathMappings: Record<string, string> = {
  can_read_user: 'todoApp.GET.users.__userID',
  can_read_todos: 'todoApp.GET.todos',
  can_create_todo: 'todoApp.POST.todos',
  can_update_todo: 'todoApp.PUT.todos.__id',
  can_delete_todo: 'todoApp.DELETE.todos.__id',
}

async function handler(req: JWTRequest, res: Response) {
  const request: AuthZenRequest = req.body
  const identity = request.subject?.identity
  const properties = await directory.getUserByIdentity(identity)
  const policyPath = pathMappings[request?.action?.name]
  const resource = request.resource
  let decision = false
  if (identity && policyPath) {
    try {
      const authorizerUrl = `${AUTHORIZER_SERVICE_URL}/v1/query`
      log(`Authorizer: ${authorizerUrl}`)
      const headers: Record<string, string> = {
        'content-type': 'application/json',
      }
      const data = {
        query: `x = data.${policyPath}.allowed`,
        input: {
          user: {
            id: properties.id,
            key: properties.id,
            properties,
          },
          resource,
          context: {},
        },
      }
      log(data)
      const response = await axios.post(authorizerUrl, data, { headers })
      log(response?.data)
      const result =
        response?.data?.result && response?.data?.result.length && response?.data?.result[0]
      decision = result['x']
    } catch (e) {
      console.error(e)
      res.status(403).send()
    }
  }

  const response = JSON.stringify({
    decision,
  })

  res.status(200).send(response)
}

app.post('/access/v1/evaluation', handler)
app.post('/access/v1/evaluations', handler)

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`)
})
