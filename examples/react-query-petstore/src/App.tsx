import { QueryClient, QueryClientProvider } from "react-query";
import { ChakraProvider, Container } from "@chakra-ui/react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
} from "react-router-dom";
import { PetsIndex } from "./features/pet/PetsIndex";
import React from "react";

const queryClient = new QueryClient();

function App() {
  return (
    <ChakraProvider>
      <QueryClientProvider client={queryClient}>
        <Container maxW="container.xl" px="12" py="8">
          <Router>
            <Switch>
              <Route path="/pets" component={PetsIndex}></Route>
              <Route path="/" exact>
                <Redirect to="/pets" />
              </Route>
            </Switch>
          </Router>
        </Container>
      </QueryClientProvider>
    </ChakraProvider>
  );
}

export default App;
