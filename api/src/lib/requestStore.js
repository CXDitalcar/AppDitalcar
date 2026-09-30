import { TableClient } from "@azure/data-tables"
import crypto from "node:crypto"

const connectionString = process.env.AUTH_STORAGE_CONNECTION_STRING || process.env.AzureWebJobsStorage
if (!connectionString) throw new Error("Falta AUTH_STORAGE_CONNECTION_STRING o AzureWebJobsStorage")

const requests = TableClient.fromConnectionString(connectionString, "DitalcarRequests")
const timeline = TableClient.fromConnectionString(connectionString, "DitalcarRequestTimeline")
let ready = false
async function ensure() {
  if (ready) return
  await Promise.all([requests, timeline].map((client) => client.createTable().catch((error) => {
    if (error?.statusCode !== 409) throw error
  })))
  ready = true
}

function key(value) { return Buffer.from(String(value || "")).toString("base64url") }
function parse(entity) {
  if (!entity?.payload) return null
  try { return JSON.parse(entity.payload) } catch { return null }
}
function makeId() {
  const d = new Date()
  const stamp = d.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)
  return `SOL-${stamp}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`
}

export async function listRequestsStored() {
  await ensure()
  const rows = []
  for await (const entity of requests.listEntities({ queryOptions: { filter: "PartitionKey eq 'REQUEST'" } })) {
    const item = parse(entity)
    if (item) rows.push(item)
  }
  return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getRequestStored(id) {
  await ensure()
  try { return parse(await requests.getEntity("REQUEST", key(id))) }
  catch (error) { if (error?.statusCode === 404) return null; throw error }
}

export async function saveRequestStored(request) {
  await ensure()
  const id = request.id || makeId()
  const item = { ...request, id }
  await requests.upsertEntity({
    partitionKey: "REQUEST",
    rowKey: key(id),
    requestId: id,
    local: item.local || "",
    requesterEmail: item.requesterEmail || "",
    currentResponsibleEmail: item.currentResponsibleEmail || "",
    status: item.status || "RECIBIDA",
    updatedAt: new Date().toISOString(),
    payload: JSON.stringify(item),
  }, "Replace")
  return item
}

export async function appendRequestTimeline(item) {
  await ensure()
  await timeline.upsertEntity({
    partitionKey: key(item.requestId),
    rowKey: key(item.id || crypto.randomUUID()),
    createdAt: item.createdAt,
    type: item.type,
    payload: JSON.stringify(item),
  }, "Replace")
}

export async function getRequestTimelineStored(requestId) {
  await ensure()
  const filter = `PartitionKey eq '${key(requestId)}'`
  const rows = []
  for await (const entity of timeline.listEntities({ queryOptions: { filter } })) {
    const item = parse(entity)
    if (item) rows.push(item)
  }
  return rows.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
