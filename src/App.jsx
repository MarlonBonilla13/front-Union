import {  useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import api from "./api";

function App() {
  const [count, setCount, data, setData] = useState(0)
  
  useEffect(() => {
    api.get("/users") // Endpoint en NestJS
      .then(res => setData(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

      <div>
      <h1>Usuarios:</h1>
      {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : <p>Cargando...</p>}
    </div>
    </>
  )



}

export default App
