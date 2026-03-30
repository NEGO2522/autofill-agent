import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login   from './pages/Login';
import Home    from './pages/Home';
import Form    from './pages/Form';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/"      element={<Landing />} />
          <Route path="/login" element={<Login />}   />
          <Route path="/home"  element={<Home />}    />
          <Route path="/form"  element={<Form />}    />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
