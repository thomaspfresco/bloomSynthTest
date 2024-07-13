import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Upload from './Pages/upload'
import Compose from './Pages/compose'
import About from './Pages/about'
import Help from './Pages/help'
import NoPage from './Pages/noPage'

import './App.css';

window.serverLink = "http://127.0.0.1:5000"
window.uploaded = false
window.trained = false

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <Route index element={<Compose/>}/>
      <Route path="/upload" element={<Upload/>}/>
      <Route path="/about" element={<About/>}/>
      <Route path="/help" element={<Help/>}/>
      <Route path="*" element={<NoPage/>}/>
    </Routes>
  </BrowserRouter>
  );
}

export default App;
