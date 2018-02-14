const PouchDB = require('pouchdb-core')
const httpAdapter = require('pouchdb-adapter-http')
const replication = require('pouchdb-replication')
const memoryAdapter = require('pouchdb-adapter-memory')
const ProgressBar = require('progress')

PouchDB
  .plugin(httpAdapter)
  .plugin(replication)
  .plugin(memoryAdapter)

const opts = {
  skip_setup: true
}

const localDb = new PouchDB('local', opts)

const total = 100

const initRemote = async () => {
  let remoteDb = new PouchDB('http://admin:admin@localhost:5984/sync-test')
  await remoteDb.destroy()
  remoteDb = new PouchDB('http://admin:admin@localhost:5984/sync-test')
  const docs = Array.from(new Array(total), (_, i) => ({ _id: `${i + 1}`} ))
  await remoteDb.bulkDocs(docs)
  return remoteDb
}

;(async () => {
  const remoteDb = await initRemote()

  const opts = {
    batch_size: 5
  }

  const progressBar = new ProgressBar(':bar pending: :pending', { total })

  await localDb.replicate.from(remoteDb, opts)
    .on('change', info => progressBar.tick({pending: info.pending}))

  const info = await localDb.info()
  console.log(info)
})()
