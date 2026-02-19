#!/usr/bin/env node
import('../dist/index.js').then(({ program }) => {
  program.parse(process.argv)
}).catch(err => {
  console.error(err)
  process.exit(1)
})
