import express, { Response } from 'express'
import { Request as JWTRequest } from 'express-jwt'
import cors from 'cors'
import * as dotenv from 'dotenv'
import * as dotenvExpand from 'dotenv-expand'
import axios from 'axios'
import { EvaluationRequest, EvaluationsRequest } from './interface'
import { Directory } from './directory'
import log from './log'

dotenvExpand.expand(dotenv.config())

const app: express.Application = express()
app.use(express.json())
app.use(cors())

const directory = new Directory()

const AUTHORIZER_SERVICE_URL = process.env.AUTHORIZER_SERVICE_URL ?? 'http://localhost:8181'
const PORT = process.env.PORT ?? 8080

async function evaluationHandler(req: JWTRequest, res: Response) {
  const request: EvaluationRequest = req.body
  const response = await evaluate(request)
  res.status(200).json(response)
}

async function evaluationsHandler(req: JWTRequest, res: Response) {
  const request: EvaluationsRequest = req.body
  const evaluations = request.evaluations?.map((e) => ({
    subject: e.subject ?? request.subject,
    action: e.action ?? request.action,
    resource: e.resource ?? request.resource,
    context: e.context ?? request.context,
  })) ?? [request]
  try {
    const evalResponse = await Promise.all(
      evaluations.map(async (e) => await evaluate(e as EvaluationRequest))
    )
    res.status(200).json({ evaluations: evalResponse })
  } catch (error) {
    console.error(error)
    res.status(422).send({ error: (error as Error).message })
  }
}

async function evaluate(request: EvaluationRequest) {
  const identity = request.subject?.id
  const properties = await directory.getUserByIdentity(identity)
  const actionName = request.action?.name
  const resource = request.resource
  const context = request.context
  let decision = false
  if (identity && actionName) {
    try {
      const authorizerUrl = `${AUTHORIZER_SERVICE_URL}/v1/query`
      log(`Authorizer: ${authorizerUrl}`)
      const headers: Record<string, string> = {
        'content-type': 'application/json',
      }
      const data = {
        query: `x = data.todoApp.${actionName}.allowed`,
        input: {
          user: {
            id: properties?.id,
            type: request.subject?.type,
            properties,
          },
          resource,
          context,
        },
      }
      log(JSON.stringify(data, null, 2))
      const response = await axios.post(authorizerUrl, data, { headers })
      log(JSON.stringify(response?.data, null, 2))
      const result =
        response?.data?.result && response?.data?.result.length && response?.data?.result[0]
      decision = (result && result['x']) ?? false
    } catch (e) {
      console.error(e)
    }
  }

  return { decision }
}

app.post('/access/v1/evaluation', evaluationHandler)
app.post('/access/v1/evaluations', evaluationsHandler)

app.listen(PORT, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${PORT}`)
})
