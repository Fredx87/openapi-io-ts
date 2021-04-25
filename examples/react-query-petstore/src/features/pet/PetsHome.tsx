import { Flex, Heading, IconButton, Spacer, VStack } from "@chakra-ui/react";
import { AddIcon } from "@chakra-ui/icons";
import { useHistory, useRouteMatch } from "react-router-dom";
import { PetsTable } from "./PetsTable";

export function PetsHome(): JSX.Element {
  const { url } = useRouteMatch();
  const history = useHistory();

  function onAddPet() {
    history.push(`${url}/addPet`);
  }

  return (
    <VStack spacing="8" align="stretch">
      <Flex>
        <Heading>Pets</Heading>
        <Spacer />
        <IconButton
          icon={<AddIcon />}
          colorScheme="teal"
          aria-label="Add Pet"
          onClick={onAddPet}
        />
      </Flex>
      <PetsTable status="available" />
    </VStack>
  );
}
