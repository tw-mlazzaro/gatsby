require(`isomorphic-fetch`)

fetch(`http://localhost:8000/__refresh/${process.argv[2]}`, {
  method: `POST`,
  headers: {
    "Content-Type": `application/json`,
  },
})