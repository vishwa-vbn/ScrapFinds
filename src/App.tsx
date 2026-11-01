import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { LanguageProvider } from './context/LanguageContext';

export function App() {
  return (
    <LanguageProvider>
      <RouterProvider router={router} />
    </LanguageProvider>
  );
}

export default App;
