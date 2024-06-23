import { ChakraProvider, useColorMode } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { SocketContextProvider } from 'src/context/socket';

import './styles/index.css';

import { App } from './App';
import { AppContextProvider } from './context/app';
import store from './store/store';
import { theme } from './styles/theme';

const queryClient = new QueryClient();

// Fixes: Even if setting initialColorMode as dark, localStorage chakra-ui-color-mode key sets to 'light'
function ForceDarkMode() {
    const { colorMode, toggleColorMode } = useColorMode();

    useEffect(() => {
        if (colorMode === 'dark') return;
        toggleColorMode();
    }, [colorMode]);

    return null;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <ChakraProvider theme={theme}>
        <ForceDarkMode />
        <SocketContextProvider>
            <QueryClientProvider client={queryClient}>
                <Provider store={store}>
                    <AppContextProvider>
                        <App />
                    </AppContextProvider>
                </Provider>
            </QueryClientProvider>
        </SocketContextProvider>
    </ChakraProvider>,
);
